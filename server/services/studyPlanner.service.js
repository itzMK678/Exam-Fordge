import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "crypto";
import { supabase } from "./supabase.service.js";
import { env } from "../config/env.js";
import { processDocument } from "./document.service.js";

const ai = new GoogleGenAI({
  apiKey: env.geminiApiKey,
});

const GENERATION_MODEL = env.geminiGenerationModel || "gemini-3.8-flash";
const FALLBACK_MODEL = env.geminiFallbackModel || "gemini-3.8-flash-lite";

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
    const { data: plan, error } = await supabase
      .from("study_plans")
      .select("*")
      .eq("id", planId)
      .maybeSingle();

    if (error && error.code !== "PGRST205") throw error;

    if (!plan) {
      const memPlan = memoryStore.get(planId);
      if (memPlan && memPlan.user_id === userId) {
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

  const examsContext = exams.map((e, idx) => `
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

  const prompt = `You are ExamForge's Lead Academic AI Study Planner & Curriculum Strategist.

A student wants a personalized, realistic, intelligent study schedule and syllabus analysis.

Current Date: ${todayStr}
Available Daily Study Hours: ${dailyStudyHours} hours/day
Preferred Study Days: ${preferredDays.join(", ")}

UPCOMING EXAMS & TEST SERIES:
${examsContext}

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
 * 4. UPDATE STUDY TASK STATUS / NOTES
 */
export async function updateTaskStatus(taskId, userId, { status, actualMinutes, notes }) {
  try {
    const updatePayload = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updatePayload.status = status;
      if (status === "completed") {
        updatePayload.completed_at = new Date().toISOString();
      } else {
        updatePayload.completed_at = null;
      }
    }
    if (actualMinutes !== undefined) updatePayload.actual_minutes = Number(actualMinutes);
    if (notes !== undefined) updatePayload.notes = notes;

    const { data, error } = await supabase
      .from("study_plan_tasks")
      .update(updatePayload)
      .eq("id", taskId)
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
    }

    return data;
  } catch (err) {
    console.error("[StudyPlanner] updateTaskStatus error:", err);
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
    const response = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: [
        { text: contextPrompt },
        ...history.slice(-6).map((h) => ({
          text: `${h.role === "user" ? "Student" : "Assistant"}: ${h.content}`,
        })),
        { text: `Student: ${message}` },
      ],
    });

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
