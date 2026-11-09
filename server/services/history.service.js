import { supabase } from "./supabase.service.js";
import { encrypt, decrypt } from "../utils/encryption.utils.js";

// ============================================================
// EXAM SESSIONS
// ============================================================

/**
 * Save a newly generated exam for a user.
 * The full questions array is AES-GCM encrypted before storage.
 */
export async function saveExamSession({
  userId,
  title,
  difficulty,
  focusTopics,
  totalQuestions,
  documentNames,
  questions,
}) {
  const encryptedExamData = encrypt(JSON.stringify(questions), userId);

  const { data, error } = await supabase
    .from("exam_sessions")
    .insert({
      user_id: userId,
      title,
      difficulty: difficulty || "medium",
      focus_topics: focusTopics || "",
      total_questions: totalQuestions,
      document_names: documentNames,
      exam_data: encryptedExamData,
    })
    .select("id, title, difficulty, focus_topics, total_questions, document_names, created_at")
    .single();

  if (error) {
    throw new Error(`Failed to save exam: ${error.message}`);
  }

  return data;
}

/**
 * List all exam sessions for a user (without decrypting questions).
 */
export async function listExamSessions(userId) {
  const { data, error } = await supabase
    .from("exam_sessions")
    .select("id, title, difficulty, focus_topics, total_questions, document_names, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list exams: ${error.message}`);
  }

  return data || [];
}

/**
 * Load a single exam session with decrypted questions.
 */
export async function getExamSession(userId, examId) {
  const { data, error } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("id", examId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Exam not found or access denied.");
  }

  const questions = JSON.parse(decrypt(data.exam_data, userId));

  return {
    id: data.id,
    title: data.title,
    difficulty: data.difficulty,
    focusTopics: data.focus_topics,
    totalQuestions: data.total_questions,
    documentNames: data.document_names,
    createdAt: data.created_at,
    questions,
  };
}

/**
 * Delete an exam session (cascades to discussions).
 */
export async function deleteExamSession(userId, examId) {
  const { error } = await supabase
    .from("exam_sessions")
    .delete()
    .eq("id", examId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete exam: ${error.message}`);
  }
}

// ============================================================
// QUESTION DISCUSSIONS
// ============================================================

/**
 * Save or update discussion messages for a question.
 * Uses upsert on (user_id, exam_id, question_uid).
 */
export async function saveDiscussion({
  userId,
  examId,
  questionUid,
  questionText,
  messages,
}) {
  const encryptedMessages = encrypt(JSON.stringify(messages), userId);

  const { data, error } = await supabase
    .from("question_discussions")
    .upsert(
      {
        user_id: userId,
        exam_id: examId,
        question_uid: questionUid,
        question_text: questionText,
        messages: encryptedMessages,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,exam_id,question_uid",
      }
    )
    .select("id, question_uid, question_text, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to save discussion: ${error.message}`);
  }

  return data;
}

/**
 * Load discussion messages for a specific question (decrypted).
 */
export async function getDiscussion(userId, examId, questionUid) {
  const { data, error } = await supabase
    .from("question_discussions")
    .select("*")
    .eq("user_id", userId)
    .eq("exam_id", examId)
    .eq("question_uid", questionUid)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load discussion: ${error.message}`);
  }

  if (!data) {
    return { messages: [] };
  }

  const messages = JSON.parse(decrypt(data.messages, userId));

  return {
    id: data.id,
    questionUid: data.question_uid,
    questionText: data.question_text,
    messages,
    updatedAt: data.updated_at,
  };
}

/**
 * List all discussions for an exam (metadata only, no decryption).
 */
export async function listDiscussionsForExam(userId, examId) {
  const { data, error } = await supabase
    .from("question_discussions")
    .select("id, question_uid, question_text, updated_at")
    .eq("user_id", userId)
    .eq("exam_id", examId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list discussions: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a single discussion.
 */
export async function deleteDiscussion(userId, examId, questionUid) {
  const { error } = await supabase
    .from("question_discussions")
    .delete()
    .eq("user_id", userId)
    .eq("exam_id", examId)
    .eq("question_uid", questionUid);

  if (error) {
    throw new Error(`Failed to delete discussion: ${error.message}`);
  }
}
