import {
  saveExamSession,
  listExamSessions,
  getExamSession,
  deleteExamSession,
  saveDiscussion,
  getDiscussion,
  listDiscussionsForExam,
  deleteDiscussion,
} from "../services/history.service.js";

// ============================================================
// EXAM SESSIONS
// ============================================================

export async function saveExamController(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, difficulty, focusTopics, totalQuestions, documentNames, questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: "Questions array is required." });
    }

    if (!documentNames || !Array.isArray(documentNames) || documentNames.length === 0) {
      return res.status(400).json({ success: false, message: "documentNames array is required." });
    }

    const session = await saveExamSession({
      userId,
      title: title || documentNames.join(" + "),
      difficulty,
      focusTopics,
      totalQuestions: totalQuestions || questions.length,
      documentNames,
      questions,
    });

    return res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
}

export async function listExamsController(req, res, next) {
  try {
    const userId = req.user.id;
    const sessions = await listExamSessions(userId);
    return res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
}

export async function getExamController(req, res, next) {
  try {
    const userId = req.user.id;
    const { examId } = req.params;
    const session = await getExamSession(userId, examId);
    return res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
}

export async function deleteExamController(req, res, next) {
  try {
    const userId = req.user.id;
    const { examId } = req.params;
    await deleteExamSession(userId, examId);
    return res.status(200).json({ success: true, message: "Exam deleted successfully." });
  } catch (error) {
    next(error);
  }
}

// ============================================================
// DISCUSSIONS
// ============================================================

export async function saveDiscussionController(req, res, next) {
  try {
    const userId = req.user.id;
    const { examId } = req.params;
    const { questionUid, questionText, messages } = req.body;

    if (!questionUid || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: "questionUid and messages array are required." });
    }

    const result = await saveDiscussion({
      userId,
      examId,
      questionUid,
      questionText: questionText || "",
      messages,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getDiscussionController(req, res, next) {
  try {
    const userId = req.user.id;
    const { examId, questionUid } = req.params;
    const discussion = await getDiscussion(userId, examId, questionUid);
    return res.status(200).json({ success: true, data: discussion });
  } catch (error) {
    next(error);
  }
}

export async function listDiscussionsController(req, res, next) {
  try {
    const userId = req.user.id;
    const { examId } = req.params;
    const discussions = await listDiscussionsForExam(userId, examId);
    return res.status(200).json({ success: true, data: discussions });
  } catch (error) {
    next(error);
  }
}

export async function deleteDiscussionController(req, res, next) {
  try {
    const userId = req.user.id;
    const { examId, questionUid } = req.params;
    await deleteDiscussion(userId, examId, questionUid);
    return res.status(200).json({ success: true, message: "Discussion deleted." });
  } catch (error) {
    next(error);
  }
}
