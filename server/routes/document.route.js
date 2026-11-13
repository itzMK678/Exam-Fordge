import express from "express";
import { uploadLimiter } from "../middleware/rateLimiter.middleware.js";
import { uploadDocuments } from "../middleware/upload.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";

import {
  uploadDocuments as uploadDocumentsController,
} from "../controller/document.controller.js";

const router = express.Router();

router.post(
  "/upload",
  requireAuth,
  uploadLimiter,
  uploadDocuments.array("files"),
  uploadDocumentsController
);

export default router;