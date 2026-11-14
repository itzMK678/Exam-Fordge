import fs from "fs";
import os from "os";
import pathUtil from "path";
import { processDocument } from "../services/document.service.js";
import { supabase, ensureStorageBuckets } from "../services/supabase.service.js";

export async function uploadDocuments(
  req,
  res,
  next
) {
  try {
    const files = req.files;
    console.log(
      "Uploaded files:",
      files?.map((file) => ({
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
      }))
    );

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload at least one PDF or DOCX file.",
      });
    }

    const userId = req.user?.id;
    const CONCURRENCY_LIMIT = 3;
    const results = new Array(files.length);

    for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
      const slice = files.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.all(
        slice.map(async (file, offset) => {
          const idx = i + offset;
          try {
            const document = await processDocument(file, userId);
            results[idx] = {
              success: true,
              document,
            };
          } catch (error) {
            console.error(
              `Failed to process ${file.originalname}:`,
              error.message || error
            );
            results[idx] = {
              success: false,
              filename: file.originalname,
              error: error.message,
            };
          }
        })
      );
    }
    const successful =
      results.filter(
        (result) => result.success
      );

    const failed =
      results.filter(
        (result) => !result.success
      );

    return res.status(200).json({
      success: failed.length === 0,

      message:
        failed.length === 0
          ? "All documents processed successfully."
          : "Some documents could not be processed.",

      total: files.length,

      successful: successful.length,

      failed: failed.length,

      documents: successful.map(
        (result) => result.document
      ),

      errors: failed,
    });

  } catch (error) {
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.path) {
          fs.promises.unlink(file.path).catch(() => {});
        }
      }
    }
    next(error);
  }
}

/**
 * Generate a signed upload URL for direct-to-Supabase upload (bypassing Vercel 4.5MB limit)
 */
export async function getDocumentUploadUrl(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const { filename, mimeType, fileSize } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: "Filename is required." });
    }

    const ext = filename.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "doc"].includes(ext)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type. Only PDF and DOCX files are supported.",
      });
    }

    if (fileSize && fileSize > 100 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "File exceeds maximum allowed size of 100 MB.",
      });
    }

    await ensureStorageBuckets();

    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${userId}/${Date.now()}_${sanitized}`;

    const { data, error } = await supabase.storage
      .from("study-documents")
      .createSignedUploadUrl(storagePath);

    if (error) {
      throw new Error(`Failed to generate signed upload URL: ${error.message}`);
    }

    return res.status(200).json({
      success: true,
      bucket: "study-documents",
      path: storagePath,
      token: data.token,
      uploadUrl: data.signedUrl,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Process a file after direct upload to Supabase Storage
 */
export async function processStoredDocuments(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const incoming = Array.isArray(req.body.files)
      ? req.body.files
      : req.body.path
      ? [req.body]
      : [];

    if (!incoming.length) {
      return res.status(400).json({
        success: false,
        message: "No document storage paths provided.",
      });
    }

    const results = [];

    for (const item of incoming) {
      const { path, filename, fileSize, mimeType } = item;
      let tempPath = null;
      try {
        if (!path.startsWith(`${userId}/`)) {
          throw new Error("Access denied: Storage path does not belong to authenticated user.");
        }

        console.log(`[Storage Process] Downloading ${path} from study-documents bucket...`);
        const { data: fileBlob, error: downloadError } = await supabase.storage
          .from("study-documents")
          .download(path);

        if (downloadError || !fileBlob) {
          throw new Error(`Failed to download file from storage: ${downloadError?.message || "File not found"}`);
        }

        tempPath = pathUtil.join(os.tmpdir(), `examforge_${Date.now()}_${pathUtil.basename(path)}`);
        const arrayBuffer = await fileBlob.arrayBuffer();
        await fs.promises.writeFile(tempPath, Buffer.from(arrayBuffer));

        const mockFile = {
          originalname: filename || pathUtil.basename(path),
          mimetype:
            mimeType ||
            (filename?.endsWith(".pdf")
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
          size: fileSize || arrayBuffer.byteLength,
          path: tempPath,
        };

        const docResult = await processDocument(mockFile, userId);
        results.push({
          success: true,
          document: docResult,
        });
      } catch (err) {
        console.error(`[Storage Process Error] Failed processing ${item.filename || item.path}:`, err.message);
        results.push({
          success: false,
          filename: item.filename || item.path,
          error: err.message,
        });
      } finally {
        if (tempPath) {
          fs.promises.unlink(tempPath).catch(() => {});
        }
      }
    }

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return res.status(200).json({
      success: failed.length === 0,
      message:
        failed.length === 0
          ? "All documents processed successfully."
          : "Some documents could not be processed.",
      total: incoming.length,
      successful: successful.length,
      failed: failed.length,
      documents: successful.map((r) => r.document),
      errors: failed,
    });
  } catch (error) {
    next(error);
  }
}
