import express from "express";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import { requireAdmin } from "../middleware/adminAuth.middleware.js";
import {
  handleGetSetupStatus,
  handleSetupInitialAdmin,
  handleLogin,
  handleLogout,
  handleGetMe,
  handleUpdateCredentials,
  handleGetOverview,
  handleListUsers,
  handleGetUserDetails,
  handleToggleUserBlock,
  handleResetUserPassword,
  handleDeleteUser,
  handleListExams,
  handleGetExamDetails,
  handleDeleteExam,
  handleListDocuments,
  handleDeleteDocument,
  handleGetAIMonitoring,
  handleGetRAGMonitoring,
  handleGetLearningAnalytics,
  handleGetSystemHealth,
  handleListFeedback,
  handleUpdateFeedback,
  handleSubmitPublicFeedback,
  handleGetSettings,
  handleUpdateSettings,
  handleGetActivityLogs,
} from "../controller/admin.controller.js";

const router = express.Router();

// ============================================================
// PUBLIC & INITIAL SETUP ROUTES
// ============================================================
router.get("/setup-status", handleGetSetupStatus);
router.post("/setup", authLimiter, handleSetupInitialAdmin);
router.post("/login", authLimiter, handleLogin);
router.post("/logout", handleLogout);

// Public Feedback Submission (Students can submit feedback)
router.post("/feedback/submit", handleSubmitPublicFeedback);

// ============================================================
// PROTECTED ADMIN ROUTES (Requires requireAdmin)
// ============================================================
router.use(requireAdmin);

// Admin Profile & Credentials
router.get("/me", handleGetMe);
router.put("/credentials", handleUpdateCredentials);

// Overview Dashboard Stats
router.get("/overview", handleGetOverview);

// User Management
router.get("/users", handleListUsers);
router.get("/users/:id", handleGetUserDetails);
router.post("/users/:id/block", handleToggleUserBlock);
router.post("/users/:id/reset-password", handleResetUserPassword);
router.delete("/users/:id", handleDeleteUser);

// Exam Management
router.get("/exams", handleListExams);
router.get("/exams/:id", handleGetExamDetails);
router.delete("/exams/:id", handleDeleteExam);

// Document Management
router.get("/documents", handleListDocuments);
router.delete("/documents/:id", handleDeleteDocument);

// AI & RAG Monitoring
router.get("/ai/stats", handleGetAIMonitoring);
router.get("/rag/stats", handleGetRAGMonitoring);

// Learning Analytics
router.get("/analytics", handleGetLearningAnalytics);

// System Health
router.get("/health/check", handleGetSystemHealth);

// Feedback Management
router.get("/feedback", handleListFeedback);
router.patch("/feedback/:id", handleUpdateFeedback);

// Settings & Audit Logs
router.get("/settings", handleGetSettings);
router.put("/settings", handleUpdateSettings);
router.get("/logs", handleGetActivityLogs);

export default router;
