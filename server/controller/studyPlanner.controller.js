import {
  listStudyPlans,
  getStudyPlan,
  createStudyPlan,
  updateTaskStatus,
  addTaskToPlan,
  extractDocumentTopics,
  smartReschedulePlan,
  chatWithStudyAssistant,
  deleteStudyPlan,
} from "../services/studyPlanner.service.js";

export async function handleListStudyPlans(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.sub;
    const plans = await listStudyPlans(userId);
    res.json({
      success: true,
      data: plans,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetStudyPlan(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.sub;
    const { id } = req.params;
    const plan = await getStudyPlan(id, userId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Study plan not found.",
      });
    }

    res.json({
      success: true,
      data: plan,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Analyze selected/uploaded documents and extract topics and subtopics
 */
export async function handleAnalyzeTopics(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.sub;
    let documentIds = req.body.documentIds;
    if (typeof documentIds === "string") {
      try {
        documentIds = JSON.parse(documentIds);
      } catch {
        documentIds = [];
      }
    }

    const result = await extractDocumentTopics({
      userId,
      documentIds: documentIds || [],
      uploadedFiles: req.files || [],
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateStudyPlan(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.sub;

    let payload = req.body;
    // In multipart/form-data, JSON fields might be stringified
    if (typeof req.body.exams === "string") {
      try {
        payload.exams = JSON.parse(req.body.exams);
      } catch {
        payload.exams = [];
      }
    }
    if (typeof req.body.topics === "string") {
      try {
        payload.topics = JSON.parse(req.body.topics);
      } catch {
        payload.topics = [];
      }
    }
    if (typeof req.body.preferredDays === "string") {
      try {
        payload.preferredDays = JSON.parse(req.body.preferredDays);
      } catch {
        payload.preferredDays = undefined;
      }
    }
    if (typeof req.body.existingDocumentIds === "string") {
      try {
        payload.existingDocumentIds = JSON.parse(req.body.existingDocumentIds);
      } catch {
        payload.existingDocumentIds = [];
      }
    }

    const {
      title,
      subject,
      description,
      dailyStudyHours,
      preferredDays,
      exams,
      topics,
      daysRemaining,
      examDate,
      existingDocumentIds,
    } = payload;

    const hasTopics = Array.isArray(topics) && topics.length > 0;
    const hasExams = Array.isArray(exams) && exams.length > 0;

    if (!hasTopics && !hasExams) {
      return res.status(400).json({
        success: false,
        message: "Please provide either exam details or study topics.",
      });
    }

    const createdPlan = await createStudyPlan({
      userId,
      title: title || `${subject || "Exam"} Study Plan`,
      subject: subject || title,
      description,
      dailyStudyHours: Number(dailyStudyHours) || 2.5,
      preferredDays: preferredDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      exams: exams || [],
      topics: topics || [],
      daysRemaining: daysRemaining ? Number(daysRemaining) : null,
      examDate,
      existingDocumentIds: existingDocumentIds || [],
      uploadedFiles: req.files || [],
    });

    res.status(201).json({
      success: true,
      message: "AI Study Schedule successfully generated.",
      data: createdPlan,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateTaskStatus(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.sub;
    const { taskId } = req.params;

    const updatedTask = await updateTaskStatus(taskId, userId, req.body);

    res.json({
      success: true,
      message: "Task updated.",
      data: updatedTask,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleAddTaskToPlan(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.sub;
    const { id } = req.params;

    const task = await addTaskToPlan(id, userId, req.body);

    res.status(201).json({
      success: true,
      message: "Topic added to schedule.",
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleSmartReschedule(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.sub;
    const { id } = req.params;
    const { newDailyHours, newPreferredDays } = req.body;

    const result = await smartReschedulePlan({
      planId: id,
      userId,
      newDailyHours,
      newPreferredDays,
    });

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleChatWithAssistant(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.sub;
    const { id } = req.params;
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const response = await chatWithStudyAssistant(id, userId, message.trim(), history || []);

    res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteStudyPlan(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.sub;
    const { id } = req.params;

    await deleteStudyPlan(id, userId);

    res.json({
      success: true,
      message: "Study plan deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
}
