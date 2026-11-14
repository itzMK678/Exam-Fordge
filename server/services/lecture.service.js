import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { GoogleGenAI, createPartFromUri } from "@google/genai";
import { supabase, ensureStorageBuckets } from "./supabase.service.js";
import { env } from "../config/env.js";
import { saveDocumentChunks, deleteDocumentChunks } from "./vector.service.js";

const ai = new GoogleGenAI({
  apiKey: env.geminiApiKey,
});

/**
 * Helper to parse JSON from model output safely
 */
function cleanAndParseJSON(rawText) {
  if (!rawText) return null;
  let text = rawText.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    console.warn("[Lecture Service] Direct JSON parse failed, attempting regex extraction...");
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerErr) {
        console.error("[Lecture Service] Regex JSON parse error:", innerErr.message);
      }
    }
    throw new Error(`Failed to parse AI response into structured JSON: ${err.message}`);
  }
}

/**
 * Generate signed upload URL for direct-to-Supabase upload into lecture-recordings bucket
 */
export async function getLectureUploadUrl({ userId, filename, fileSize, mimeType }) {
  if (!userId) throw new Error("Unauthorized");
  if (!filename) throw new Error("Filename is required");

  const ext = filename.split(".").pop()?.toLowerCase();
  const allowed = ["mp3", "wav", "m4a", "mp4", "webm", "ogg", "aac", "mov"];
  if (!allowed.includes(ext)) {
    throw new Error(`Unsupported audio/video format .${ext}. Supported: MP3, WAV, M4A, MP4, WEBM, MOV.`);
  }

  // 500 MB max for lectures
  if (fileSize && fileSize > 500 * 1024 * 1024) {
    throw new Error("File exceeds maximum allowed size of 500 MB.");
  }

  await ensureStorageBuckets();

  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${userId}/${Date.now()}_${sanitized}`;

  const { data, error } = await supabase.storage
    .from("lecture-recordings")
    .createSignedUploadUrl(storagePath);

  if (error) {
    throw new Error(`Failed to create signed upload URL: ${error.message}`);
  }

  return {
    bucket: "lecture-recordings",
    path: storagePath,
    token: data.token,
    uploadUrl: data.signedUrl,
  };
}

/**
 * Create initial lecture record in database with status 'processing'
 */
export async function createLectureRecord({
  userId,
  title,
  filename,
  storagePath,
  fileType,
  mimeType,
  fileSize,
}) {
  const lectureId = randomUUID();

  const { data, error } = await supabase
    .from("lectures")
    .insert({
      id: lectureId,
      user_id: String(userId),
      title: title || filename.replace(/\.[^/.]+$/, ""),
      filename,
      storage_path: storagePath,
      file_type: fileType || filename.split(".").pop()?.toLowerCase() || "audio",
      mime_type: mimeType,
      file_size: fileSize || 0,
      status: "processing",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST205") {
      throw new Error(
        "Database setup required: The 'public.lectures' table has not been created yet in your Supabase project. Please run the migration script in your Supabase SQL Editor."
      );
    }
    throw new Error(`Failed to create lecture record: ${error.message}`);
  }

  return data;
}

/**
 * Background processor for a lecture recording
 */
export async function processLectureInBackground(lectureId, userId) {
  let localTempFile = null;
  let uploadedGeminiFile = null;

  try {
    console.log(`[Lecture ${lectureId}] Starting background processing...`);

    // 1. Fetch lecture record
    const { data: lecture, error: fetchErr } = await supabase
      .from("lectures")
      .select("*")
      .eq("id", lectureId)
      .eq("user_id", String(userId))
      .single();

    if (fetchErr || !lecture) {
      throw new Error(`Lecture record not found: ${fetchErr?.message}`);
    }

    // 2. Download recording from Supabase Storage
    console.log(`[Lecture ${lectureId}] Downloading ${lecture.storage_path} from storage...`);
    const { data: blob, error: downloadErr } = await supabase.storage
      .from("lecture-recordings")
      .download(lecture.storage_path);

    if (downloadErr || !blob) {
      throw new Error(`Failed to download recording from storage: ${downloadErr?.message}`);
    }

    // Save to temporary file on disk
    const ext = path.extname(lecture.filename) || ".mp3";
    localTempFile = path.join(os.tmpdir(), `examforge_lecture_${Date.now()}_${lectureId}${ext}`);
    const buffer = Buffer.from(await blob.arrayBuffer());
    await fs.promises.writeFile(localTempFile, buffer);
    console.log(`[Lecture ${lectureId}] Saved ${buffer.length} bytes to temp file.`);

    // 3. Upload to Gemini File API
    console.log(`[Lecture ${lectureId}] Uploading file to Gemini File API...`);
    let detectedMime = lecture.mime_type;
    if (!detectedMime || detectedMime === "application/octet-stream") {
      const e = ext.toLowerCase().replace(".", "");
      if (e === "mp3") detectedMime = "audio/mp3";
      else if (e === "wav") detectedMime = "audio/wav";
      else if (e === "m4a") detectedMime = "audio/m4a";
      else if (e === "mp4") detectedMime = "video/mp4";
      else detectedMime = "audio/mp3";
    }

    uploadedGeminiFile = await ai.files.upload({
      file: localTempFile,
      mimeType: detectedMime,
      config: {
        displayName: lecture.filename,
      },
    });

    console.log(`[Lecture ${lectureId}] Gemini file uploaded: ${uploadedGeminiFile.name}. Awaiting processing...`);

    // Poll Gemini file processing state if video or large audio
    let fileInfo = await ai.files.get({ name: uploadedGeminiFile.name });
    let attempts = 0;
    while (fileInfo.state === "PROCESSING" && attempts < 60) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      fileInfo = await ai.files.get({ name: uploadedGeminiFile.name });
      attempts++;
    }

    if (fileInfo.state === "FAILED") {
      throw new Error("Gemini file processing failed on audio/video ingestion.");
    }

    console.log(`[Lecture ${lectureId}] Gemini file active. Prompting lecture analysis...`);

    // 4. Prompt Gemini for complete lecture transcription and structured intelligence
    const systemPrompt = `You are an expert academic lecture analyst and tutor.
You are given an audio/video recording of an educational classroom lecture.
Analyze the entire recording with extreme accuracy and academic rigor.

DO NOT invent or extrapolate information that was not taught in this lecture.
Grounded truth: If the teacher did not mention a concept, do not add it as lecture content.
Ensure exact timestamp preservation in [MM:SS] format.

Return ONLY a valid, parseable JSON object with the following structure:
{
  "title": "Clear, informative topic title for this lecture",
  "summary": "Concise 3-5 sentence summary of what was covered",
  "transcript": [
    {
      "start": "00:00",
      "timestamp": "00:00",
      "speaker": "Teacher",
      "text": "Exact or near-verbatim transcription of what was spoken."
    }
  ],
  "raw_transcript": "Continuous full text transcript with timestamps",
  "topics": [
    {
      "topic": "Main Topic Name",
      "subtopics": ["Subtopic 1", "Subtopic 2"],
      "summary": "Brief summary of this topic"
    }
  ],
  "definitions": [
    {
      "term": "Term or concept name",
      "definition": "Exact definition explained by instructor",
      "timestamp": "MM:SS",
      "context": "Why or how it was introduced"
    }
  ],
  "examples": [
    {
      "concept": "Concept illustrated",
      "example": "The specific real-world example, scenario or case given by the teacher",
      "timestamp": "MM:SS"
    }
  ],
  "formulas_and_concepts": [
    {
      "concept": "Name of concept, theorem, rule or law",
      "formula": "Mathematical or formal notation if applicable, or N/A",
      "explanation": "Instructor's explanation of how it works",
      "key_points": ["Key point 1", "Key point 2"]
    }
  ],
  "questions_discussed": [
    {
      "question": "Question asked by teacher or student in class",
      "answer_or_discussion": "How it was answered or resolved in class",
      "timestamp": "MM:SS"
    }
  ],
  "non_academic": [
    {
      "category": "announcement | deadline | casual_talk | assignment",
      "text": "Casual talk, joke, class deadline, homework instruction, or administrative notice",
      "timestamp": "MM:SS"
    }
  ],
  "organized_notes": "A comprehensive, beautifully formatted Markdown study guide of the lecture, structured by topics, with definitions, formulas, and key takeaways highlighted."
}`;

    const part = createPartFromUri(uploadedGeminiFile.uri, uploadedGeminiFile.mimeType || detectedMime);

    const modelName = env.geminiGenerationModel || "gemini-3.8-flash";
    const result = await ai.models.generateContent({
      model: modelName,
      contents: [
        part,
        { text: systemPrompt },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = cleanAndParseJSON(result.text);
    if (!parsed) {
      throw new Error("Empty or invalid structured intelligence returned by model.");
    }

    console.log(`[Lecture ${lectureId}] Intelligence generated successfully.`);

    // 5. Connect to ExamForge Document & RAG system (Chunk saving)
    // Create linked document record so the user can use this lecture in Exam Generation!
    let linkedDocumentId = null;
    try {
      linkedDocumentId = randomUUID();
      const rawText = parsed.raw_transcript || parsed.organized_notes || "";
      const wordCount = rawText.split(/\s+/).filter(Boolean).length;

      const { error: docInsertErr } = await supabase.from("documents").insert({
        id: linkedDocumentId,
        user_id: String(userId),
        filename: `${parsed.title || lecture.title} (Lecture Recording)`,
        file_type: "lecture",
        mime_type: detectedMime,
        storage_path: lecture.storage_path,
        file_size: lecture.file_size,
        page_count: 1,
        word_count: wordCount,
        character_count: rawText.length,
        status: "ready",
        created_at: new Date().toISOString(),
      });

      if (!docInsertErr) {
        // Chunk transcript and notes into document_chunks for RAG & Exam Generator
        const chunks = [];
        const combinedContent = `# Lecture: ${parsed.title}\n\n## Summary\n${parsed.summary}\n\n## Key Concepts & Notes\n${parsed.organized_notes}\n\n## Transcript\n${parsed.raw_transcript || ""}`;
        
        // Chunk by paragraphs/sections ~400 words each
        const paragraphs = combinedContent.split("\n\n");
        let currentChunk = "";
        let chunkIndex = 0;

        for (const p of paragraphs) {
          if ((currentChunk + "\n\n" + p).split(/\s+/).length > 400 && currentChunk.trim().length > 0) {
            chunks.push({
              page_number: 1,
              chunk_index: chunkIndex++,
              content: currentChunk.trim(),
              word_count: currentChunk.split(/\s+/).filter(Boolean).length,
            });
            currentChunk = p;
          } else {
            currentChunk += (currentChunk ? "\n\n" : "") + p;
          }
        }
        if (currentChunk.trim().length > 0) {
          chunks.push({
            page_number: 1,
            chunk_index: chunkIndex++,
            content: currentChunk.trim(),
            word_count: currentChunk.split(/\s+/).filter(Boolean).length,
          });
        }

        if (chunks.length > 0) {
          await saveDocumentChunks(linkedDocumentId, chunks);
          console.log(`[Lecture ${lectureId}] Created ${chunks.length} chunks in document_chunks for Exam Generator integration.`);
        }
      } else {
        console.warn(`[Lecture ${lectureId}] Note on linked document insert:`, docInsertErr.message);
      }
    } catch (chunkErr) {
      console.warn(`[Lecture ${lectureId}] Chunk creation non-fatal warning:`, chunkErr.message);
    }

    // 6. Update lecture in database with completed data
    const updatePayload = {
      title: parsed.title || lecture.title,
      status: "completed",
      summary: parsed.summary || "",
      transcript: parsed.transcript || [],
      raw_transcript: parsed.raw_transcript || "",
      topics: parsed.topics || [],
      definitions: parsed.definitions || [],
      examples: parsed.examples || [],
      formulas_and_concepts: parsed.formulas_and_concepts || [],
      questions_discussed: parsed.questions_discussed || [],
      non_academic: parsed.non_academic || [],
      organized_notes: parsed.organized_notes || "",
      document_id: linkedDocumentId,
      error_message: null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateErr } = await supabase
      .from("lectures")
      .update(updatePayload)
      .eq("id", lectureId);

    if (updateErr) {
      throw new Error(`Failed to update lecture status to completed: ${updateErr.message}`);
    }

    console.log(`[Lecture ${lectureId}] Processing completed and saved!`);
  } catch (err) {
    console.error(`[Lecture ${lectureId}] Background processing failed:`, err);
    try {
      await supabase
        .from("lectures")
        .update({
          status: "failed",
          error_message: err.message || "Failed to process lecture recording.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", lectureId);
    } catch (saveErr) {
      console.error(`[Lecture ${lectureId}] Failed to record error state:`, saveErr);
    }
  } finally {
    // Clean up local temp file
    if (localTempFile) {
      fs.promises.unlink(localTempFile).catch(() => {});
    }
    // Clean up Gemini uploaded file
    if (uploadedGeminiFile?.name) {
      ai.files.delete({ name: uploadedGeminiFile.name }).catch(() => {});
    }
  }
}

/**
 * List all lectures for an authenticated user
 */
export async function getLectures(userId) {
  const { data, error } = await supabase
    .from("lectures")
    .select("id, title, filename, file_type, file_size, status, summary, duration_seconds, error_message, created_at, updated_at, document_id")
    .eq("user_id", String(userId))
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205") {
      return [];
    }
    throw new Error(`Failed to load lectures: ${error.message}`);
  }
  return data || [];
}

/**
 * Get single lecture details
 */
export async function getLectureById(lectureId, userId) {
  const { data, error } = await supabase
    .from("lectures")
    .select("*")
    .eq("id", lectureId)
    .eq("user_id", String(userId))
    .single();

  if (error) {
    throw new Error(`Failed to load lecture details: ${error.message}`);
  }
  return data;
}

/**
 * Delete a lecture, its storage file, and linked document chunks
 */
export async function deleteLecture(lectureId, userId) {
  const { data: lecture, error: fetchErr } = await supabase
    .from("lectures")
    .select("id, storage_path, document_id")
    .eq("id", lectureId)
    .eq("user_id", String(userId))
    .single();

  if (fetchErr || !lecture) {
    throw new Error("Lecture not found or unauthorized.");
  }

  // 1. Delete linked document chunks
  if (lecture.document_id) {
    await deleteDocumentChunks(lecture.document_id).catch(() => {});
    await supabase.from("documents").delete().eq("id", lecture.document_id).catch(() => {});
  }

  // 2. Delete file from Supabase Storage
  if (lecture.storage_path) {
    await supabase.storage
      .from("lecture-recordings")
      .remove([lecture.storage_path])
      .catch(() => {});
  }

  // 3. Delete from lectures table
  const { error: deleteErr } = await supabase
    .from("lectures")
    .delete()
    .eq("id", lectureId);

  if (deleteErr) {
    throw new Error(`Failed to delete lecture: ${deleteErr.message}`);
  }

  return true;
}

/**
 * Interactive AI Chat grounded in lecture content with timestamp citations
 */
export async function chatWithLecture({ lectureId, userId, question, history = [] }) {
  if (!question || !question.trim()) {
    throw new Error("Question cannot be empty.");
  }

  const lecture = await getLectureById(lectureId, userId);
  if (!lecture) {
    throw new Error("Lecture not found.");
  }

  if (lecture.status !== "completed") {
    throw new Error("Lecture is still processing. Please wait until analysis is complete.");
  }

  const prompt = `You are the AI Lecture Tutor for the following classroom lecture:
Title: "${lecture.title}"

--- LECTURE CONTEXT ---
SUMMARY:
${lecture.summary || "N/A"}

ORGANIZED NOTES:
${lecture.organized_notes || "N/A"}

TRANSCRIPT SEGMENTS (with timestamps):
${(lecture.transcript || [])
  .slice(0, 150)
  .map((t) => `[${t.timestamp || t.start || "00:00"}] ${t.speaker || "Instructor"}: ${t.text}`)
  .join("\n")}
-----------------------

STUDENT QUESTION: "${question}"

INSTRUCTIONS:
1. Answer the student's question accurately using ONLY the material presented in this lecture.
2. If the topic was mentioned in the lecture, cite the relevant timestamp (e.g. "[14:20]") so the student can jump to that exact spot in the recording.
3. If the instructor gave a specific real-world example or definition, mention it explicitly.
4. If the question asks about something that was NOT covered or mentioned in this lecture, politely clarify that the instructor did not discuss it in this session. Do NOT invent or hallucinate answers.
5. Keep explanations clear, engaging, and pedagogically helpful.`;

  const modelName = env.geminiGenerationModel || "gemini-3.8-flash";
  const result = await ai.models.generateContent({
    model: modelName,
    contents: [{ text: prompt }],
  });

  const reply = result.text;

  // Extract timestamps mentioned in reply (e.g. [12:34])
  const timestampMatches = reply.match(/\[\d{1,2}:\d{2}\]/g) || [];
  const uniqueTimestamps = [...new Set(timestampMatches)];

  // Save to chat history table if available
  try {
    await supabase.from("lecture_chats").insert([
      {
        lecture_id: lectureId,
        user_id: String(userId),
        role: "user",
        content: question,
        created_at: new Date().toISOString(),
      },
      {
        lecture_id: lectureId,
        user_id: String(userId),
        role: "assistant",
        content: reply,
        timestamps: uniqueTimestamps,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (e) {
    console.warn("[Lecture Chat] Failed to persist chat message:", e.message);
  }

  return {
    reply,
    timestamps: uniqueTimestamps,
  };
}

/**
 * Generate Study Material (MCQs, Short/Long questions, Flashcards) from Lecture
 */
export async function generateLectureStudyMaterial({
  lectureId,
  userId,
  materialType = "all", // "all", "mcq", "flashcards", "questions"
  count = 5,
}) {
  const lecture = await getLectureById(lectureId, userId);
  if (!lecture) {
    throw new Error("Lecture not found.");
  }

  const prompt = `Based strictly on the following classroom lecture, generate comprehensive study materials.

Title: "${lecture.title}"
Summary: ${lecture.summary}
Organized Notes: ${lecture.organized_notes}
Definitions: ${JSON.stringify(lecture.definitions || [])}
Formulas and Concepts: ${JSON.stringify(lecture.formulas_and_concepts || [])}

Generate:
1. Multiple Choice Questions (MCQs) with 4 options, the single correct answer, and an explanation citing the concept/timestamp.
2. Short answer conceptual questions with model answers.
3. Flashcards (front concept/term, back detailed definition/explanation, and timestamp).
4. Quick revision key bullet points.

Return ONLY a valid JSON object matching this schema:
{
  "mcqs": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact matching option string",
      "explanation": "Why this is correct",
      "timestamp": "MM:SS"
    }
  ],
  "shortQuestions": [
    {
      "question": "Question text",
      "modelAnswer": "Comprehensive model answer",
      "keyConcepts": ["Concept 1", "Concept 2"]
    }
  ],
  "flashcards": [
    {
      "front": "Term / Question",
      "back": "Definition / Core explanation",
      "timestamp": "MM:SS"
    }
  ],
  "quickRevision": [
    "Core takeaway 1",
    "Core takeaway 2"
  ]
}`;

  const modelName = env.geminiGenerationModel || "gemini-3.8-flash";
  const result = await ai.models.generateContent({
    model: modelName,
    contents: [{ text: prompt }],
    config: {
      responseMimeType: "application/json",
    },
  });

  const parsed = cleanAndParseJSON(result.text);
  return parsed;
}

/**
 * Convert generated study material into an ExamForge Exam Session so students can take/review it
 */
export async function createExamSessionFromLecture({
  lectureId,
  userId,
  studyMaterial,
}) {
  const lecture = await getLectureById(lectureId, userId);
  if (!lecture) throw new Error("Lecture not found");

  const mcqs = (studyMaterial.mcqs || []).map((q, idx) => ({
    id: `mcq_${idx + 1}`,
    type: "mcq",
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    answer: q.correctAnswer,
    explanation: q.explanation,
    sourcePages: [1],
    timestamp: q.timestamp,
  }));

  const shortQ = (studyMaterial.shortQuestions || []).map((q, idx) => ({
    id: `short_${idx + 1}`,
    type: "short",
    question: q.question,
    correctAnswer: q.modelAnswer,
    answer: q.modelAnswer,
    explanation: q.modelAnswer,
    sourcePages: [1],
  }));

  const allQuestions = [...mcqs, ...shortQ];

  const examData = {
    title: `${lecture.title} (Lecture Exam)`,
    difficulty: "Medium",
    totalQuestions: allQuestions.length,
    documentNames: [lecture.filename],
    includeAnswers: true,
    questions: allQuestions,
  };

  const { data: session, error } = await supabase
    .from("exam_sessions")
    .insert({
      id: randomUUID(),
      user_id: String(userId),
      title: `${lecture.title} (Lecture Exam)`,
      difficulty: "Medium",
      focus_topics: "Lecture Intelligence",
      total_questions: allQuestions.length,
      document_names: [lecture.filename],
      exam_data: JSON.stringify(examData),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save exam session: ${error.message}`);
  }

  return session;
}
