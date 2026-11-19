import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  handleGetUploadUrl,
  handleProcessStoredLecture,
  handleListLectures,
  handleGetLecture,
  handleDeleteLecture,
  handleRetryLecture,
  handleLectureChat,
  handleGenerateStudyMaterial,
  handleCreateExamSession,
} from "../controller/lecture.controller.js";

const router = express.Router();

// Direct-to-storage upload & background processing
router.post("/upload-url", requireAuth, handleGetUploadUrl);
router.post("/process-storage", requireAuth, handleProcessStoredLecture);

// Lecture listing & management
router.get("/", requireAuth, handleListLectures);
router.get("/:id", requireAuth, handleGetLecture);
router.delete("/:id", requireAuth, handleDeleteLecture);
router.post("/:id/retry", requireAuth, handleRetryLecture);

// AI Chatbot with lecture grounding and timestamps
router.post("/:id/chat", requireAuth, handleLectureChat);

// Study Material & Exam generation
router.post("/:id/study-material", requireAuth, handleGenerateStudyMaterial);
router.post("/:id/create-exam-session", requireAuth, handleCreateExamSession);

export default router;
