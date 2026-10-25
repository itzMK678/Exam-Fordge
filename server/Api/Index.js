import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "../config/env.js";

import healthRoutes from "../routes/health.route.js";
import documentRoutes from "../routes/document.route.js";
import examRoutes from "../routes/exam.route.js";
import summaryRoutes from "../routes/summary.routes.js";
import discussionRoutes from "../routes/discussion.route.js";
import authRoutes from "../routes/auth.route.js";
import workRoutes from "../routes/work.route.js";

import { errorMiddleware } from "../middleware/error.middleware.js";

const app = express();

// --------------------------------------------------
// Middleware
// --------------------------------------------------
const allowedOrigins = env.corsOrigin
  ? env.corsOrigin.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error(`CORS error: Origin ${origin} is not allowed.`));
    },
    credentials: true, // MANDATORY: allows sending and receiving cookies cross-origin
  })
);

app.use(cookieParser()); // Parses req.cookies.auth_token
app.use(express.json({ limit: "5mb" }));

// --------------------------------------------------
// Public & Auth Routes
// --------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ExamForge API is running",
    version: "1.1.0",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/documents", summaryRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/exams", discussionRoutes);
app.use("/api/exams", examRoutes);

// --------------------------------------------------
// Protected /work Route
// --------------------------------------------------
app.use("/work", workRoutes);
app.use("/api/work", workRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
  });
});

// Global error handler
app.use(errorMiddleware);

// Server start
if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    console.log(`🚀 ExamForge API running on http://localhost:${env.port}`);
  });
}

export default app;