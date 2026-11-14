import express from "express";
import { uploadLimiter } from "../middleware/rateLimiter.middleware.js";
import { uploadDocuments } from "../middleware/upload.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";

import {
  uploadDocuments as uploadDocumentsController,
  getDocumentUploadUrl,
  processStoredDocuments,
} from "../controller/document.controller.js";

const router = express.Router();

// Direct-to-Supabase Storage routes (Fixes Vercel 4.5MB limit)
router.post("/upload-url", requireAuth, getDocumentUploadUrl);
router.post("/process-storage", requireAuth, processStoredDocuments);

// Legacy multipart route (kept for backward compatibility)
router.post(
  "/upload",
  requireAuth,
  uploadLimiter,
  uploadDocuments.array("files"),
  uploadDocumentsController
);

export default router;
