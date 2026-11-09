import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  saveExamController,
  listExamsController,
  getExamController,
  deleteExamController,
  saveDiscussionController,
  getDiscussionController,
  listDiscussionsController,
  deleteDiscussionController,
} from "../controller/history.controller.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ---- Exam Sessions ----
router.post("/exams", saveExamController);           // Save a new exam
router.get("/exams", listExamsController);           // List all exams
router.get("/exams/:examId", getExamController);     // Get one exam (with questions)
router.delete("/exams/:examId", deleteExamController); // Delete exam

// ---- Discussions ----
router.get("/exams/:examId/discussions", listDiscussionsController);                        // List all discussions for exam
router.get("/exams/:examId/discussions/:questionUid", getDiscussionController);             // Get one discussion
router.post("/exams/:examId/discussions", saveDiscussionController);                        // Save/update a discussion
router.delete("/exams/:examId/discussions/:questionUid", deleteDiscussionController);       // Delete a discussion

export default router;
