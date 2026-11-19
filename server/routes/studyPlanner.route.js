import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { uploadDocuments } from "../middleware/upload.middleware.js";
import {
  handleListStudyPlans,
  handleGetStudyPlan,
  handleCreateStudyPlan,
  handleAnalyzeTopics,
  handleAddTaskToPlan,
  handleUpdateTaskStatus,
  handleSmartReschedule,
  handleChatWithAssistant,
  handleDeleteStudyPlan,
} from "../controller/studyPlanner.controller.js";

const router = express.Router();

// All study planner routes require user authentication
router.use(requireAuth);

router.get("/", handleListStudyPlans);
router.post("/", uploadDocuments.array("files"), handleCreateStudyPlan);
router.post("/analyze-topics", uploadDocuments.array("files"), handleAnalyzeTopics);
router.get("/:id", handleGetStudyPlan);
router.delete("/:id", handleDeleteStudyPlan);

// Task management & additions
router.post("/:id/tasks", handleAddTaskToPlan);
router.patch("/tasks/:taskId", handleUpdateTaskStatus);

// Smart rescheduling
router.post("/:id/reschedule", handleSmartReschedule);

// AI Study Assistant chatbot
router.post("/:id/chat", handleChatWithAssistant);

export default router;
