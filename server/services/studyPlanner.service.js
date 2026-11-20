import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "crypto";
import { supabase } from "./supabase.service.js";
import { env } from "../config/env.js";
import { processDocument } from "./document.service.js";

const ai = new GoogleGenAI({
  apiKey: env.geminiApiKey,
});

const GENERATION_MODEL = env.geminiGenerationModel || "gemini-3.5-flash-lite";
const FALLBACK_MODEL = env.geminiFallbackModel || "gemini-3.5-flash";

async function generateWithRetry({ prompt, responseMimeType }) {
  try {
    const config = responseMimeType ? { responseMimeType } : undefined;
    const result = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: [{ text: prompt }],
      config,
    });
    return result.text;
  } catch (err) {
    console.warn(`[StudyPlanner] Primary model ${GENERATION_MODEL} failed (${err.message}). Trying fallback ${FALLBACK_MODEL}...`);
    const config = responseMimeType ? { responseMimeType } : undefined;
    const fallbackRes = await ai.models.generateContent({
      model: FALLBACK_MODEL,
      contents: [{ text: prompt }],
      config,
    });
    return fallbackRes.text;
  }
}

// Fallback in-memory store if Supabase table is not yet migrated (PGRST205)
const memoryStore = new Map();

/**
 * 1. LIST STUDY PLANS FOR A USER
 */
export async function listStudyPlans(userId) {
  try {
    const { data, error } = await supabase
      .from("study_plans")
      .select("id, title, description, daily_study_hours, status, analysis_summary, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205") {
        console.warn("[StudyPlanner] study_plans table not in schema cache; using memory fallback.");
        const userPlans = Array.from(memoryStore.values()).filter((p) => p.user_id === userId);
        return userPlans.map(enrichPlanSummary);
      }
      throw error;
    }

    const plans = data || [];
    // Enrich with exam counts and task progress
    const enriched = await Promise.all(
      plans.map(async (plan) => {
        const [examsRes, tasksRes] = await Promise.all([
          supabase.from("study_plan_exams").select("id, exam_name, subject, exam_date, test_type").eq("plan_id", plan.id),
          supabase.from("study_plan_tasks").select("id, status, estimated_minutes").eq("plan_id", plan.id),
        ]);

        const exams = examsRes.data || [];
        const tasks = tasksRes.data || [];
        const completedTasks = tasks.filter((t) => t.status === "completed").length;
        const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);

        return {
          ...plan,
          exams,
          totalTasks: tasks.length,
          completedTasks,
          progressPercentage: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
          totalPlannedHours: Math.round((totalMinutes / 60) * 10) / 10,
        };
      })
    );

    return enriched;
  } catch (err) {
    console.error("[StudyPlanner] listStudyPlans error:", err);
    throw err;
  }
}

/**
 * 2. GET FULL STUDY PLAN DETAILS
 */
export async function getStudyPlan(planId, userId) {
  try {
    let query = supabase
      .from("study_plans")
      .select("*")
      .eq("id", planId);

    if (userId) {
      query = query.eq("user_id", String(userId));
    }

    const { data: plan, error } = await query.maybeSingle();

    if (error && error.code !== "PGRST205") throw error;

    if (!plan) {
      const memPlan = memoryStore.get(planId);
      if (memPlan && (!userId || memPlan.user_id === String(userId))) {
        return memPlan;
      }
      return null;
    }

    // Parallel fetch related tables
    const [examsRes, mappingsRes, tasksRes, docsRes] = await Promise.all([
      supabase.from("study_plan_exams").select("*").eq("plan_id", planId).order("exam_date", { ascending: true }),
      supabase.from("study_plan_material_mappings").select("*").eq("plan_id", planId),
      supabase.from("study_plan_tasks").select("*").eq("plan_id", planId).order("scheduled_date", { ascending: true }).order("order_index", { ascending: true }),
      supabase.from("study_plan_documents").select("document_id, documents(id, filename, file_type, file_size)").eq("plan_id", planId),
    ]);

    const tasks = tasksRes.data || [];
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
    const completedMinutes = tasks.filter((t) => t.status === "completed").reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);

    const documents = (docsRes.data || []).map((d) => d.documents).filter(Boolean);

    return {
      ...plan,
      exams: examsRes.data || [],
      mappings: mappingsRes.data || [],
      tasks,
      documents,
      stats: {
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks: tasks.length - completedTasks,
        progressPercentage: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
        totalPlannedHours: Math.round((totalMinutes / 60) * 10) / 10,
        completedHours: Math.round((completedMinutes / 60) * 10) / 10,
      },
    };
  } catch (err) {
    console.error("[StudyPlanner] getStudyPlan error:", err);
    throw err;
  }
}

/**
 * 2b. EXTRACT TOPICS & SUBTOPICS FROM STUDY MATERIALS
 */
export async function extractDocumentTopics({
  userId,
  documentIds = [],
  uploadedFiles = [],
}) {
  const processedDocRecords = [];
  const allDocIds = [...documentIds];

  // 1. Process any newly uploaded files
  if (uploadedFiles && uploadedFiles.length > 0) {
    for (const file of uploadedFiles) {
      try {
        const docResult = await processDocument(file, userId);
        allDocIds.push(docResult.documentId);
        processedDocRecords.push({
          id: docResult.documentId,
          filename: docResult.filename,
          pages: docResult.pageCount || 1,
        });
      } catch (err) {
        console.error(`[StudyPlanner] Failed to process document ${file.originalname}:`, err.message);
      }
    }
  }

  if (allDocIds.length === 0) {
    return { documents: [] };
  }

  // 2. Fetch document details and page samples
  const { data: docs } = await supabase
    .from("documents")
    .select("id, filename, file_type, page_count")
    .in("id", allDocIds);

  const documentMap = new Map((docs || []).map((d) => [d.id, d]));

  // Fetch page excerpts for topic identification
  const { data: pages } = await supabase
    .from("document_pages")
    .select("document_id, page_number, content")
    .in("document_id", allDocIds)
    .order("page_number", { ascending: true })
    .limit(100);

  const docContents = {};
  for (const page of pages || []) {
    if (!docContents[page.document_id]) docContents[page.document_id] = [];
    docContents[page.document_id].push(`Page ${page.page_number}: ${(page.content || "").slice(0, 400)}`);
  }

  const docSummaries = allDocIds.map((docId) => {
    const doc = documentMap.get(docId) || { filename: "Study Document.pdf" };
    const samples = (docContents[docId] || []).slice(0, 15).join("\n");
    return `--- DOCUMENT: "${doc.filename}" (ID: ${docId}) ---\nContent Excerpts:\n${samples || "General study document"}\n`;
  }).join("\n\n");

  const prompt = `You are ExamForge's Academic Curriculum Specialist.
Analyze the following uploaded study document(s) and extract the main academic topics and subtopics discussed in each.

For each document:
1. Identify the high-level chapters / major topics (e.g., "Introduction to DBMS", "Database Architecture", "ER Diagrams", "Relational Model", "Normalization", "SQL Queries", "Transactions", "Concurrency Control").
2. Under each topic, extract 2-4 key subtopics or concepts.
3. Keep topic names concise and student-friendly.

DOCUMENTS TO ANALYZE:
${docSummaries}

Respond ONLY with valid JSON strictly matching this schema:
{
  "documents": [
    {
      "documentId": "string",
      "filename": "string",
      "topics": [
        {
          "name": "Topic Name",
          "subtopics": ["Subtopic 1", "Subtopic 2"]
        }
      ]
    }
  ]
}`;

  console.log(`[StudyPlanner] Extracting topics from ${allDocIds.length} documents via Gemini...`);
  try {
    const text = await generateWithRetry({
      prompt,
      responseMimeType: "application/json",
    });
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error("[StudyPlanner] Topic extraction failed:", err.message);
    // Fallback safe topic extraction
    return {
      documents: allDocIds.map((id) => {
        const doc = documentMap.get(id);
        const name = doc?.filename || "Study Material";
        const baseName = name.replace(/\.[^/.]+$/, "");
        return {
          documentId: id,
          filename: name,
          topics: [
            { name: `Introduction to ${baseName}`, subtopics: ["Key Definitions", "Basic Architecture"] },
            { name: `Core Principles of ${baseName}`, subtopics: ["Fundamental Models", "Standard Rules"] },
            { name: `Advanced ${baseName}`, subtopics: ["Practical Applications", "Problem Solving"] },
            { name: `Practice Questions & Review`, subtopics: ["Exam Questions", "Important Formulas"] },
          ],
        };
      }),
    };
  }
}

/**
 * 3. CREATE STUDY PLAN & RUN AI SYLLABUS / MATERIAL ANALYSIS
 */
export async function createStudyPlan({
  userId,
  title,
  description,
  dailyStudyHours = 3.0,
  preferredDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  exams = [],
  existingDocumentIds = [],
  uploadedFiles = [],
  topics = [], // Confirmed topics list: [{ name, subtopics, documentName, documentId, priority, difficulty, isManual }]
  daysRemaining = null,
  examDate = null,
  subject = "",
}) {
  const planId = randomUUID();
  const processedDocIds = [...existingDocumentIds];
  const processedDocRecords = [];

  // Step 1: Process any newly uploaded files
  if (uploadedFiles && uploadedFiles.length > 0) {
    for (const file of uploadedFiles) {
      try {
        const docResult = await processDocument(file, userId);
        processedDocIds.push(docResult.documentId);
        processedDocRecords.push({
          id: docResult.documentId,
          filename: docResult.filename,
          pages: docResult.pageCount || 1,
        });
      } catch (err) {
        console.error(`[StudyPlanner] Failed to process document ${file.originalname}:`, err.message);
      }
    }
  }

  // Step 2: Fetch document snippets & page outlines from public.documents / document_pages
  let docContextString = "";
  if (processedDocIds.length > 0) {
    try {
      const { data: docPages } = await supabase
        .from("document_pages")
        .select("document_id, page_number, content, documents(filename)")
        .in("document_id", processedDocIds)
        .order("page_number", { ascending: true })
        .limit(100);

      if (docPages && docPages.length > 0) {
        docContextString = docPages
          .map((dp) => {
            const docName = dp.documents?.filename || dp.document_id;
            const snippet = (dp.content || "").slice(0, 350).replace(/\s+/g, " ");
            return `[Document: "${docName}", Page: ${dp.page_number}]: ${snippet}`;
          })
          .join("\n\n");
      }
    } catch (err) {
      console.warn("[StudyPlanner] Notice reading document pages:", err.message);
    }
  }

  if (!docContextString && processedDocRecords.length > 0) {
    docContextString = processedDocRecords.map((d) => `[Document: "${d.filename}", ~${d.pages} pages]`).join("\n");
  }

  // Step 3: Run AI Syllabus & Material Analysis via Gemini
  const todayStr = new Date().toISOString().split("T")[0];

  let calculatedExamDate = examDate;
  if (!calculatedExamDate) {
    const days = Number(daysRemaining) || 7;
    const target = new Date();
    target.setDate(target.getDate() + days);
    calculatedExamDate = target.toISOString().split("T")[0];
  }

  const effectiveSubject = subject || title || "Subject Exam";

  let effectiveExams = [...exams];
  if (!effectiveExams || effectiveExams.length === 0) {
    effectiveExams = [
      {
        exam_name: `${effectiveSubject} Exam`,
        subject: effectiveSubject,
        exam_date: calculatedExamDate,
        test_type: "Exam Preparation",
        syllabus: topics.map((t) => t.name).join(", ") || "Full course syllabus",
        included_chapters: "All confirmed topics",
        difficulty_level: "Medium",
        additional_instructions: "Distribute confirmed topics logically with exact document connections.",
      },
    ];
  }

  const examsContext = effectiveExams.map((e, idx) => `
Exam #${idx + 1}:
- Name: ${e.exam_name}
- Subject: ${e.subject}
- Date: ${e.exam_date}
- Type: ${e.test_type || "Midterm"}
- Difficulty: ${e.difficulty_level || "Medium"}
- Syllabus: ${e.syllabus}
- Included Chapters / Subtopics: ${e.included_chapters || "Full specified syllabus"}
- Special Instructions: ${e.additional_instructions || "None"}
`).join("\n");

  const userTopicsContext = topics && topics.length > 0
    ? `\nUSER CONFIRMED TOPICS (From AI extraction & manual entry):\n` +
      topics
        .map(
          (t, idx) =>
            `${idx + 1}. Topic: "${t.name}" | Subtopics: ${(t.subtopics || []).join(", ") || "Core concepts"} | Source Document: "${t.documentName || (t.isManual ? "Manually Added" : "Study Document")}" | Priority/Difficulty: ${t.priority || t.difficulty || "Medium"}`
        )
        .join("\n") +
      `\n\nSTRICT REQUIREMENT FOR TOPICS:
1. You MUST schedule every confirmed topic listed above into the day-by-day plan.
2. In the "tasks" output, connect each topic to its exact "document_name" as specified in the topic's Source Document. If a topic is marked as "Manually Added", set document_name to "Manually Added".
3. Order prerequisite/fundamental topics on earlier days and advanced/practice topics on later days.
4. Final days should focus on practice questions, weak topics, and full revision.\n`
    : "";

  const prompt = `You are ExamForge's Lead Academic AI Study Planner & Curriculum Strategist.

A student wants a personalized, realistic, intelligent study schedule and syllabus analysis.

Current Date: ${todayStr}
Target Exam Date: ${calculatedExamDate} (${daysRemaining || 7} days remaining)
Available Daily Study Hours: ${dailyStudyHours} hours/day
Preferred Study Days: ${preferredDays.join(", ")}

UPCOMING EXAMS & TEST SERIES:
${examsContext}
${userTopicsContext}
UPLOADED STUDY MATERIALS & EXTRACTED PAGE SAMPLES:
${docContextString || "No specific document samples extracted. Map topics to provided study material or mark missing if unspecified."}

INSTRUCTIONS & RULES:
1. MATERIAL MAPPING:
   - Break down the syllabus of each exam into distinct topics and subtopics.
   - Match syllabus topics with the relevant uploaded documents, chapters, and exact page numbers where possible based on the provided material samples.
   - STRICT RULE: Do NOT invent or hallucinate document page numbers. If a topic cannot be found in the uploaded material, clearly set "coverage_status" to "missing". If partially found, set "partial". If found, set "covered".
   - Identify overlapping topics between multiple exams (e.g. topics common to Midterms and Final Exam).
   - Assess topic complexity ("Low", "Medium", "High") and estimate preparation hours needed.

2. PREPARATION ORDER & RATIONALE:
   - Determine the pedagogically sound preparation order (e.g., fundamentals before advanced topics, topics for earlier exam dates prioritized first).
   - Provide a clear, detailed paragraph for "ai_rationale" explaining WHY this specific order was chosen.

3. WORKLOAD DISTRIBUTION & SCHEDULE GENERATION:
   - Distribute study tasks starting from tomorrow or today (${todayStr}) across available days until the exam dates.
   - DO NOT cram everything on the final days before the exam!
   - Reserve dedicated time for:
     * "learning": first-time concept study and reading
     * "practice": problem solving and exercises
     * "revision": spaced repetition of prior topics
     * "mock_test": full exam simulation before each exam date
     * "past_paper": past exam paper analysis
   - Respect daily study hours (${dailyStudyHours} hrs). Tasks should typically be 30, 45, 60, or 90 minutes.
   - If total required preparation hours exceed the available days before the exams, include a clear "feasibility_warning" in the summary explaining what high-yield topics are prioritized.

Respond ONLY with valid JSON strictly matching this schema:
{
  "analysis_summary": {
    "total_topics": 10,
    "covered_topics": 8,
    "missing_topics": 2,
    "overlapping_topics": 2,
    "total_estimated_hours": 32.5,
    "feasibility_warning": null or "Warning string if time is tight"
  },
  "ai_rationale": "Detailed explanation of why this preparation order and timing was scheduled...",
  "mappings": [
    {
      "subject": "Mathematics",
      "topic": "Differential Calculus",
      "subtopics": ["Limits", "Chain Rule", "Derivatives"],
      "coverage_status": "covered",
      "document_name": "filename.pdf",
      "page_reference": "Pages 12-25",
      "complexity": "High",
      "estimated_hours": 5.0,
      "is_overlapping": true,
      "notes": "Covers questions for both Midterm and Final"
    }
  ],
  "tasks": [
    {
      "scheduled_date": "YYYY-MM-DD",
      "day_of_week": "Monday",
      "subject": "Mathematics",
      "topic": "Differential Calculus",
      "subtopic": "Limits & Continuity",
      "task_type": "learning",
      "title": "Study Limits & Continuity Fundamentals",
      "description": "Read definitions, review standard limit theorems and worked examples.",
      "document_name": "filename.pdf",
      "page_reference": "Pages 12-16",
      "estimated_minutes": 60
    }
  ]
}`;

  console.log(`[StudyPlanner] Generating AI schedule with Gemini (${GENERATION_MODEL})...`);
  let aiOutput = null;

  try {
    const text = await generateWithRetry({
      prompt,
      responseMimeType: "application/json",
    });

    const parsed = JSON.parse(text);
    aiOutput = parsed;
  } catch (aiErr) {
    console.error("[StudyPlanner] Gemini generation failed:", aiErr.message);
    // Fallback safe plan generator
    aiOutput = generateFallbackSchedule(exams, todayStr, dailyStudyHours, preferredDays);
  }

  // Step 4: Persist into Supabase (or memory fallback)
  const planRecord = {
    id: planId,
    user_id: userId,
    title: title || `${exams[0]?.subject || "Comprehensive"} Study Plan`,
    description: description || `AI-generated study schedule for ${exams.length} upcoming exams.`,
    daily_study_hours: dailyStudyHours,
    preferred_days: preferredDays,
    status: "active",
    analysis_summary: aiOutput.analysis_summary || {},
    ai_rationale: aiOutput.ai_rationale || "Balanced schedule generated based on exam dates and topic dependencies.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    // 4.1 Insert plan
    const { error: planErr } = await supabase.from("study_plans").insert(planRecord);
    if (planErr && planErr.code !== "PGRST205") throw planErr;

    // 4.2 Insert exams
    if (exams.length > 0) {
      const examRows = exams.map((e) => ({
        id: randomUUID(),
        plan_id: planId,
        user_id: userId,
        exam_name: e.exam_name,
        subject: e.subject,
        exam_date: e.exam_date,
        test_type: e.test_type || "Midterm",
        syllabus: e.syllabus || "",
        included_chapters: e.included_chapters || "",
        difficulty_level: e.difficulty_level || "Medium",
        additional_instructions: e.additional_instructions || "",
        created_at: new Date().toISOString(),
      }));
      await supabase.from("study_plan_exams").insert(examRows);
    }

    // 4.3 Insert document associations
    if (processedDocIds.length > 0) {
      const docRows = processedDocIds.map((docId) => ({
        id: randomUUID(),
        plan_id: planId,
        document_id: docId,
        user_id: userId,
        created_at: new Date().toISOString(),
      }));
      await supabase.from("study_plan_documents").insert(docRows);
    }

    // 4.4 Insert material mappings
    if (aiOutput.mappings && aiOutput.mappings.length > 0) {
      const mappingRows = aiOutput.mappings.map((m) => ({
        id: randomUUID(),
        plan_id: planId,
        subject: m.subject || exams[0]?.subject || "General",
        topic: m.topic,
        subtopics: m.subtopics || [],
        coverage_status: m.coverage_status || "covered",
        document_name: m.document_name || null,
        page_reference: m.page_reference || null,
        complexity: m.complexity || "Medium",
        estimated_hours: m.estimated_hours || 1.5,
        is_overlapping: !!m.is_overlapping,
        notes: m.notes || null,
        created_at: new Date().toISOString(),
      }));
      await supabase.from("study_plan_material_mappings").insert(mappingRows);
    }

    // 4.5 Insert tasks
    if (aiOutput.tasks && aiOutput.tasks.length > 0) {
      const taskRows = aiOutput.tasks.map((t, idx) => ({
        id: randomUUID(),
        plan_id: planId,
        user_id: userId,
        scheduled_date: t.scheduled_date,
        day_of_week: t.day_of_week || getDayName(t.scheduled_date),
        subject: t.subject || exams[0]?.subject || "General",
        topic: t.topic,
        subtopic: t.subtopic || null,
        task_type: t.task_type || "learning",
        title: t.title,
        description: t.description || null,
        document_name: t.document_name || null,
        page_reference: t.page_reference || null,
        estimated_minutes: t.estimated_minutes || 60,
        actual_minutes: 0,
        status: "pending",
        notes: null,
        order_index: idx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Insert in chunks of 50 to avoid payload size limits
      for (let i = 0; i < taskRows.length; i += 50) {
        await supabase.from("study_plan_tasks").insert(taskRows.slice(i, i + 50));
      }
    }
  } catch (dbErr) {
    console.warn("[StudyPlanner] DB insert notice (fallback to memory):", dbErr.message);
  }

  // Also cache in memoryStore for instant access
  const fullPlan = {
    ...planRecord,
    exams,
    mappings: aiOutput.mappings || [],
    tasks: (aiOutput.tasks || []).map((t, idx) => ({
      id: randomUUID(),
      plan_id: planId,
      user_id: userId,
      ...t,
      status: "pending",
      order_index: idx,
    })),
    documents: processedDocRecords,
  };
  memoryStore.set(planId, fullPlan);

  return fullPlan;
}

/**
 * 4. UPDATE STUDY TASK (Status, Date/Move Day, Notes, Topic)
 */
export async function updateTaskStatus(taskId, userId, updateData = {}) {
  try {
    const updatePayload = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.status !== undefined) {
      updatePayload.status = updateData.status;
      if (updateData.status === "completed") {
        updatePayload.completed_at = new Date().toISOString();
      } else {
        updatePayload.completed_at = null;
      }
    }
    if (updateData.actualMinutes !== undefined) updatePayload.actual_minutes = Number(updateData.actualMinutes);
    if (updateData.notes !== undefined) updatePayload.notes = updateData.notes;
    if (updateData.scheduled_date !== undefined) {
      updatePayload.scheduled_date = updateData.scheduled_date;
      updatePayload.day_of_week = getDayName(updateData.scheduled_date);
    }
    if (updateData.topic !== undefined) updatePayload.topic = updateData.topic;
    if (updateData.title !== undefined) updatePayload.title = updateData.title;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.estimated_minutes !== undefined) updatePayload.estimated_minutes = Number(updateData.estimated_minutes);
    if (updateData.order_index !== undefined) updatePayload.order_index = Number(updateData.order_index);

    let query = supabase
      .from("study_plan_tasks")
      .update(updatePayload)
      .eq("id", taskId);

    if (userId) {
      query = query.eq("user_id", String(userId));
    }

    const { data, error } = await query
      .select("*")
      .maybeSingle();

    if (error && error.code !== "PGRST205") throw error;

    // Check memoryStore if DB not available or didn't return
    if (!data) {
      for (const plan of memoryStore.values()) {
        const t = (plan.tasks || []).find((tk) => tk.id === taskId);
        if (t) {
          Object.assign(t, updatePayload);
          return t;
        }
      }
      return { id: taskId, ...updatePayload };
    }

    return data;
  } catch (err) {
    console.error("[StudyPlanner] updateTaskStatus error:", err);
    throw err;
  }
}

/**
 * 4b. ADD A TASK/TOPIC TO A PLAN OR SPECIFIC DAY
 */
export async function addTaskToPlan(planId, userId, taskData = {}) {
  const taskId = randomUUID();
  const scheduledDate = taskData.scheduled_date || new Date().toISOString().split("T")[0];
  const taskRow = {
    id: taskId,
    plan_id: planId,
    user_id: userId,
    scheduled_date: scheduledDate,
    day_of_week: taskData.day_of_week || getDayName(scheduledDate),
    subject: taskData.subject || "Study Subject",
    topic: taskData.topic || "Custom Topic",
    subtopic: taskData.subtopic || null,
    task_type: taskData.task_type || "learning",
    title: taskData.title || taskData.topic || "Study Session",
    description: taskData.description || null,
    document_name: taskData.document_name || "Manually Added",
    page_reference: taskData.page_reference || null,
    estimated_minutes: Number(taskData.estimated_minutes) || 60,
    actual_minutes: 0,
    status: "pending",
    notes: null,
    order_index: taskData.order_index || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from("study_plan_tasks").insert(taskRow).select().single();
    if (error && error.code !== "PGRST205") throw error;
    return data || taskRow;
  } catch (err) {
    const plan = memoryStore.get(planId);
    if (plan) {
      if (!plan.tasks) plan.tasks = [];
      plan.tasks.push(taskRow);
      return taskRow;
    }
    throw err;
  }
}

/**
 * 5. SMART RESCHEDULING ("Regenerate My Schedule")
 * Intelligently redistributes unfinished/missed tasks across remaining days
 * WITHOUT overwriting or deleting completed tasks!
 */
export async function smartReschedulePlan({
  planId,
  userId,
  newDailyHours,
  newPreferredDays,
}) {
  const plan = await getStudyPlan(planId, userId);
  if (!plan) throw new Error("Study plan not found.");

  const completedTasks = plan.tasks.filter((t) => t.status === "completed");
  const pendingTasks = plan.tasks.filter((t) => t.status !== "completed");

  if (pendingTasks.length === 0) {
    return {
      message: "All tasks in this study plan are already marked as completed! No reschedule needed.",
      plan,
    };
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const examsContext = plan.exams.map((e) => `- ${e.exam_name} (${e.subject}): Date ${e.exam_date}`).join("\n");
  const pendingTasksContext = pendingTasks.map((t, idx) => `${idx + 1}. [${t.subject}] ${t.topic} (${t.task_type}, ~${t.estimated_minutes}m, was scheduled ${t.scheduled_date})`).join("\n");

  const prompt = `You are ExamForge's Smart Academic Rescheduler.
A student missed some study sessions or requested a schedule recalibration today (${todayStr}).

UPCOMING EXAMS:
${examsContext}

DAILY STUDY TIME AVAILABLE: ${newDailyHours || plan.daily_study_hours || 3} hours/day
PREFERRED STUDY DAYS: ${(newPreferredDays || plan.preferred_days || []).join(", ")}

PENDING / UNFINISHED TOPICS TO RESCHEDULE:
${pendingTasksContext}

INSTRUCTIONS:
1. Redistribute the pending tasks starting from today (${todayStr}) or tomorrow across the remaining days before the respective exams.
2. Maintain prerequisite order (core concepts before advanced practice).
3. Do NOT overload any single day. Balance "learning", "practice", "revision", and "mock_test".
4. If remaining days are tight, prioritize the closest exam.
5. Provide a summary explaining the adjustments made.

Return ONLY JSON:
{
  "reschedule_rationale": "Explanation of changes made to prevent overwhelm and ensure exam readiness...",
  "updated_tasks": [
    {
      "scheduled_date": "YYYY-MM-DD",
      "day_of_week": "DayName",
      "subject": "Subject",
      "topic": "Topic Name",
      "subtopic": "Subtopic",
      "task_type": "learning",
      "title": "Title",
      "description": "Description",
      "document_name": "filename or null",
      "page_reference": "Pages X-Y or null",
      "estimated_minutes": 60
    }
  ]
}`;

  console.log(`[StudyPlanner] Running smart rescheduling via Gemini...`);
  const text = await generateWithRetry({
    prompt,
    responseMimeType: "application/json",
  });

  const parsed = JSON.parse(text);
  const newTasksData = parsed.updated_tasks || [];

  // Remove existing pending tasks from DB
  try {
    await supabase
      .from("study_plan_tasks")
      .delete()
      .eq("plan_id", planId)
      .neq("status", "completed");

    // Insert new rescheduled tasks
    const taskRows = newTasksData.map((t, idx) => ({
      id: randomUUID(),
      plan_id: planId,
      user_id: userId,
      scheduled_date: t.scheduled_date,
      day_of_week: t.day_of_week || getDayName(t.scheduled_date),
      subject: t.subject,
      topic: t.topic,
      subtopic: t.subtopic || null,
      task_type: t.task_type || "learning",
      title: t.title,
      description: t.description || null,
      document_name: t.document_name || null,
      page_reference: t.page_reference || null,
      estimated_minutes: t.estimated_minutes || 60,
      actual_minutes: 0,
      status: "pending",
      notes: null,
      order_index: completedTasks.length + idx,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    for (let i = 0; i < taskRows.length; i += 50) {
      await supabase.from("study_plan_tasks").insert(taskRows.slice(i, i + 50));
    }

    // Update plan rationale
    await supabase
      .from("study_plans")
      .update({
        ai_rationale: parsed.reschedule_rationale || plan.ai_rationale,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId);
  } catch (err) {
    console.warn("[StudyPlanner] DB reschedule notice:", err.message);
  }

  return {
    success: true,
    message: "Schedule successfully recalculated.",
    rationale: parsed.reschedule_rationale,
    rescheduledTaskCount: newTasksData.length,
    preservedCompletedCount: completedTasks.length,
  };
}

/**
 * 6. AI STUDY ASSISTANT (Tutor Chatbot for current plan)
 */
export async function chatWithStudyAssistant(planId, userId, message, history = []) {
  const plan = await getStudyPlan(planId, userId);
  if (!plan) throw new Error("Study plan not found.");

  const todayStr = new Date().toISOString().split("T")[0];
  const todaysTasks = (plan.tasks || []).filter((t) => t.scheduled_date === todayStr);

  const contextPrompt = `You are ExamForge's AI Study Assistant & Personal Academic Tutor.
You are assisting a student working through their active study plan: "${plan.title}".

Student's Upcoming Exams:
${plan.exams.map((e) => `- ${e.exam_name} (${e.subject}) on ${e.exam_date}`).join("\n")}

Today's Scheduled Tasks (${todayStr}):
${todaysTasks.length > 0 ? todaysTasks.map((t) => `* [${t.subject}] ${t.title} (${t.status})`).join("\n") : "No specific tasks scheduled for today."}

Plan's Subject Topics:
${plan.mappings.slice(0, 15).map((m) => `* ${m.subject}: ${m.topic} (${m.coverage_status})`).join("\n")}

Role Guidelines:
- Directly answer academic questions, explain definitions, formulas, and concepts.
- When student asks "What should I study today?", point directly to today's tasks and give high-impact study advice.
- When student asks for a quick quiz, generate 2-3 targeted practice questions with answer explanations.
- Keep tone encouraging, rigorous, and highly structured.`;

  const chatMessages = [
    { role: "user", parts: [{ text: `${contextPrompt}\n\nStudent says: ${message}` }] },
  ];

  try {
    let response;
    const contentsPayload = [
      { text: contextPrompt },
      ...history.slice(-6).map((h) => ({
        text: `${h.role === "user" ? "Student" : "Assistant"}: ${h.content}`,
      })),
      { text: `Student: ${message}` },
    ];

    try {
      response = await ai.models.generateContent({
        model: GENERATION_MODEL,
        contents: contentsPayload,
      });
    } catch (primaryErr) {
      console.warn(`[StudyAssistant] Primary model failed (${primaryErr.message}), falling back to ${FALLBACK_MODEL}...`);
      response = await ai.models.generateContent({
        model: FALLBACK_MODEL,
        contents: contentsPayload,
      });
    }

    const reply = response.text;

    // Save to study_plan_chats
    try {
      await supabase.from("study_plan_chats").insert([
        { id: randomUUID(), plan_id: planId, user_id: userId, role: "user", content: message },
        { id: randomUUID(), plan_id: planId, user_id: userId, role: "assistant", content: reply },
      ]);
    } catch {
      // ignore
    }

    return { reply };
  } catch (err) {
    console.error("[StudyPlanner] Chat error:", err);
    throw new Error(`AI Tutor error: ${err.message}`);
  }
}

/**
 * 7. DELETE STUDY PLAN
 */
export async function deleteStudyPlan(planId, userId) {
  try {
    await supabase.from("study_plans").delete().eq("id", planId).eq("user_id", userId);
    memoryStore.delete(planId);
    return { success: true };
  } catch (err) {
    console.error("[StudyPlanner] deleteStudyPlan error:", err);
    throw err;
  }
}

// Helpers
function getDayName(dateString) {
  try {
    const d = new Date(dateString);
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()] || "Day";
  } catch {
    return "Study Day";
  }
}

function enrichPlanSummary(p) {
  const tasks = p.tasks || [];
  const completed = tasks.filter((t) => t.status === "completed").length;
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    daily_study_hours: p.daily_study_hours,
    status: p.status,
    exams: p.exams || [],
    totalTasks: tasks.length,
    completedTasks: completed,
    progressPercentage: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

function generateFallbackSchedule(exams, todayStr, dailyHours, preferredDays) {
  const tasks = [];
  const mappings = [];
  const startDate = new Date();

  exams.forEach((exam, examIdx) => {
    const examDate = new Date(exam.exam_date || Date.now() + 14 * 86400000);
    const diffDays = Math.max(1, Math.ceil((examDate - startDate) / (1000 * 60 * 60 * 24)));

    // Generate 3-5 core topics
    const rawSyllabus = exam.syllabus || "Core Topics";
    const topicList = rawSyllabus.split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean);
    if (topicList.length === 0) topicList.push("Core Concepts & Foundations", "Practice Problems", "Exam Review");

    topicList.forEach((topic, tIdx) => {
      mappings.push({
        subject: exam.subject,
        topic,
        subtopics: ["Theory", "Examples", "Exercises"],
        coverage_status: "covered",
        document_name: "Uploaded Material",
        page_reference: `Section ${tIdx + 1}`,
        complexity: tIdx % 2 === 0 ? "Medium" : "High",
        estimated_hours: 2.0,
        is_overlapping: false,
      });

      const dayOffset = Math.min(diffDays - 1, (examIdx * 3) + tIdx + 1);
      const targetDate = new Date(startDate);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const dateStr = targetDate.toISOString().split("T")[0];

      tasks.push({
        scheduled_date: dateStr,
        day_of_week: getDayName(dateStr),
        subject: exam.subject,
        topic,
        subtopic: "Foundations & Practice",
        task_type: tIdx === topicList.length - 1 ? "revision" : "learning",
        title: `Study ${topic}`,
        description: `Deep dive into ${topic} for ${exam.exam_name}. Review definitions and solve sample problems.`,
        document_name: "Uploaded Material",
        page_reference: `Chapter ${tIdx + 1}`,
        estimated_minutes: Math.round((dailyHours || 3) * 60 * 0.5),
      });
    });

    // Add mock test day before exam
    const mockDate = new Date(examDate);
    mockDate.setDate(mockDate.getDate() - 1);
    const mockDateStr = mockDate.toISOString().split("T")[0];
    tasks.push({
      scheduled_date: mockDateStr,
      day_of_week: getDayName(mockDateStr),
      subject: exam.subject,
      topic: `${exam.exam_name} Full Mock Simulation`,
      subtopic: "Timed Exam Simulation",
      task_type: "mock_test",
      title: `Full Mock Exam: ${exam.exam_name}`,
      description: `Attempt full simulated test under exam timing. Review mistakes.`,
      document_name: null,
      page_reference: null,
      estimated_minutes: 120,
    });
  });

  return {
    analysis_summary: {
      total_topics: mappings.length,
      covered_topics: mappings.length,
      missing_topics: 0,
      overlapping_topics: 0,
      total_estimated_hours: mappings.length * 2,
      feasibility_warning: null,
    },
    ai_rationale: "Curriculum sequenced from foundational topics to advanced problem solving, ending with timed mock examinations.",
    mappings,
    tasks,
  };
}
