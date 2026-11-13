import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from server directory and project root directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "ENCRYPTION_SECRET",
  "JWT_SECRET",
  // "REDIS_URL", // [COMMENTED OUT FOR VERCEL] Redis is optional in serverless mode
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  supabaseUrl: process.env.SUPABASE_URL,

  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  redisUrl: process.env.REDIS_URL,

  pythonWorkerUrl:
    process.env.PYTHON_WORKER_URL || "http://127.0.0.1:8000",

    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,

  geminiApiKey: process.env.GEMINI_API_KEY,

  geminiEmbeddingModel:
    process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2",

  geminiEmbeddingDimensions: Number(
    process.env.GEMINI_EMBEDDING_DIMENSIONS || 768
  ),

  geminiGenerationModel:
    process.env.GEMINI_GENERATION_MODEL || "gemini-3.5-flash",

  geminiFallbackModel:
    process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite",

  maxConcurrentGeminiRequests: Number(
    process.env.MAX_CONCURRENT_GEMINI_REQUESTS || 2
  ),

  maxChunkWordCount: Number(process.env.MAX_CHUNK_WORD_COUNT || 500),

  chunkOverlap: Number(process.env.CHUNK_OVERLAP || 75),

  maxRAGWords: Number(process.env.MAX_RAG_WORDS || 35000),

  encryptionSecret: process.env.ENCRYPTION_SECRET,

  jwtSecret: process.env.JWT_SECRET,

  internalWorkerSecret: process.env.INTERNAL_WORKER_SECRET || "",
};
