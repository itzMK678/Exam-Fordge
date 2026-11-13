import express from "express";
import { aiInteractionLimiter } from "../middleware/rateLimiter.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";

import {
  summarizeDocumentController,
  summarizeDocumentStreamController,
} from "../controller/summary.controller.js";

const router = express.Router();

router.post(
  "/summarize",
  requireAuth,
  aiInteractionLimiter,
  summarizeDocumentController
);

/*
// ============================================================
// [COMMENTED OUT FOR VERCEL] SSE SUMMARY STREAMING
// ============================================================
router.post(
  "/summarize/stream",
  aiInteractionLimiter,
  summarizeDocumentStreamController
);
*/

export default router;