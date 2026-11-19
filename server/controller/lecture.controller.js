import {
  getLectureUploadUrl,
  createLectureRecord,
  processLectureInBackground,
  getLectures,
  getLectureById,
  deleteLecture,
  retryLecture,
  chatWithLecture,
  generateLectureStudyMaterial,
  createExamSessionFromLecture,
} from "../services/lecture.service.js";

/**
 * Generate signed upload URL for direct-to-Supabase upload
 */
export async function handleGetUploadUrl(req, res, next) {
  try {
    const userId = req.user?.id;
    const { filename, fileSize, mimeType } = req.body;

    const result = await getLectureUploadUrl({
      userId,
      filename,
      fileSize,
      mimeType,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Start processing after direct upload to storage
 */
export async function handleProcessStoredLecture(req, res, next) {
  try {
    const userId = req.user?.id;
    const { path, filename, fileSize, fileType, mimeType, title } = req.body;

    if (!path) {
      return res.status(400).json({
        success: false,
        message: "Storage path is required.",
      });
    }

    if (!path.startsWith(`${userId}/`)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Recording path does not match authenticated user.",
      });
    }

    // 1. Create initial record
    const lecture = await createLectureRecord({
      userId,
      title,
      filename,
      storagePath: path,
      fileType,
      mimeType,
      fileSize,
    });

    // 2. Trigger asynchronous background processing (won't block Vercel or HTTP response!)
    processLectureInBackground(lecture.id, userId).catch((bgErr) => {
      console.error(`[Background Error] Failed lecture ${lecture.id}:`, bgErr);
    });

    return res.status(202).json({
      success: true,
      message: "Lecture upload received. Processing in background.",
      lecture,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List all lectures
 */
export async function handleListLectures(req, res, next) {
  try {
    const userId = req.user?.id;
    const lectures = await getLectures(userId);

    return res.status(200).json({
      success: true,
      data: lectures,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single lecture detail
 */
export async function handleGetLecture(req, res, next) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const lecture = await getLectureById(id, userId);
    return res.status(200).json({
      success: true,
      data: lecture,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete lecture
 */
export async function handleDeleteLecture(req, res, next) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    await deleteLecture(id, userId);
    return res.status(200).json({
      success: true,
      message: "Lecture and associated resources deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retry lecture processing for an already uploaded recording
 */
export async function handleRetryLecture(req, res, next) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const lecture = await retryLecture(id, userId);
    return res.status(202).json({
      success: true,
      message: "Lecture analysis restarted.",
      data: lecture,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Interactive lecture chat
 */
export async function handleLectureChat(req, res, next) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { question, history } = req.body;

    const result = await chatWithLecture({
      lectureId: id,
      userId,
      question,
      history,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Generate Study Material
 */
export async function handleGenerateStudyMaterial(req, res, next) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { materialType, count } = req.body;

    const studyMaterial = await generateLectureStudyMaterial({
      lectureId: id,
      userId,
      materialType,
      count,
    });

    return res.status(200).json({
      success: true,
      data: studyMaterial,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Convert study material into full ExamForge exam session
 */
export async function handleCreateExamSession(req, res, next) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { studyMaterial } = req.body;

    if (!studyMaterial) {
      return res.status(400).json({
        success: false,
        message: "Study material payload is required.",
      });
    }

    const session = await createExamSessionFromLecture({
      lectureId: id,
      userId,
      studyMaterial,
    });

    return res.status(201).json({
      success: true,
      message: "Exam session created successfully from lecture.",
      data: session,
    });
  } catch (err) {
    next(err);
  }
}
