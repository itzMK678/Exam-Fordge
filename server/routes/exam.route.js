import express from "express";
import { generateLimiter } from "../middleware/rateLimiter.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  generateExamController,
  getExamJobStatusController,
} from "../controller/exam.controller.js";

const router = express.Router();

router.use(requireAuth);

router.post(
  "/generate",
  generateLimiter,
  generateExamController
);

router.get(
  "/job/:jobId",
  getExamJobStatusController
);

export default router;