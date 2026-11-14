-- ============================================================
-- ExamForge Supabase Database Migration
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- 1. TABLE: public.users
-- Stores user credentials and profile details
CREATE TABLE IF NOT EXISTS public.users (
  id           TEXT PRIMARY KEY,                  -- Unique user ID (e.g. UUID)
  name         TEXT NOT NULL,                     -- User full name
  email        TEXT UNIQUE NOT NULL,              -- User email (case-insensitive queries)
  password     TEXT NOT NULL,                     -- Bcrypt hashed password
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() -- Registration timestamp
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (LOWER(email));

-- 2. TABLE: public.documents
-- Stores uploaded document metadata scoped by user
CREATE TABLE IF NOT EXISTS public.documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT,                             -- Owning user ID
  filename        TEXT NOT NULL,
  file_type       TEXT,
  mime_type       TEXT,
  storage_path    TEXT DEFAULT 'text_only',
  file_size       BIGINT DEFAULT 0,
  page_count      INT DEFAULT 0,
  word_count      INT DEFAULT 0,
  character_count INT DEFAULT 0,
  status          TEXT DEFAULT 'processing',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id, created_at DESC);

-- 3. TABLE: public.document_pages
-- Extracted pages from documents
CREATE TABLE IF NOT EXISTS public.document_pages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page_number  INT NOT NULL,
  content      TEXT NOT NULL,
  word_count   INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_document_pages_doc ON public.document_pages(document_id, page_number);

-- 4. TABLE: public.document_chunks
-- Text chunks indexed for RAG context retrieval
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page_number  INT NOT NULL DEFAULT 1,
  chunk_index  INT NOT NULL DEFAULT 0,
  content      TEXT NOT NULL,
  word_count   INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON public.document_chunks(document_id, chunk_index);

-- 5. TABLE: public.exam_sessions
-- Stores generated exam papers per user
CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  title           TEXT NOT NULL,
  difficulty      TEXT,
  focus_topics    TEXT,
  total_questions INT NOT NULL DEFAULT 0,
  document_names  TEXT[] NOT NULL DEFAULT '{}',
  exam_data       TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON public.exam_sessions(user_id, created_at DESC);

-- 6. TABLE: public.question_discussions
-- Stores AI study tutor chat history per question per user
CREATE TABLE IF NOT EXISTS public.question_discussions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  exam_id       UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  question_uid  TEXT NOT NULL,
  question_text TEXT NOT NULL,
  messages      TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussions_user ON public.question_discussions(user_id, exam_id, question_uid);

ALTER TABLE public.question_discussions
  DROP CONSTRAINT IF EXISTS uq_discussion_per_question;
ALTER TABLE public.question_discussions
  ADD CONSTRAINT uq_discussion_per_question UNIQUE (user_id, exam_id, question_uid);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures data isolation across all tables
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_discussions ENABLE ROW LEVEL SECURITY;

-- Note: The Express backend uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS for trusted operations.
-- The policies below protect against direct public client access (e.g. anon key).
DROP POLICY IF EXISTS "Users can only read their own profile" ON public.users;
CREATE POLICY "Users can only read their own profile"
  ON public.users FOR SELECT
  USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can only manage their own documents" ON public.documents;
CREATE POLICY "Users can only manage their own documents"
  ON public.documents FOR ALL
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can only manage their own exams" ON public.exam_sessions;
CREATE POLICY "Users can only manage their own exams"
  ON public.exam_sessions FOR ALL
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can only manage their own discussions" ON public.question_discussions;
CREATE POLICY "Users can only manage their own discussions"
  ON public.question_discussions FOR ALL
  USING (auth.uid()::text = user_id);

-- ============================================================
-- 7. TABLE: public.lectures (Lecture Intelligence)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lectures (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL,
  title                 TEXT NOT NULL,
  filename              TEXT NOT NULL,
  storage_path          TEXT NOT NULL,
  file_type             TEXT NOT NULL,
  mime_type             TEXT,
  file_size             BIGINT DEFAULT 0,
  duration_seconds      INT DEFAULT 0,
  status                TEXT DEFAULT 'processing', -- 'uploading', 'processing', 'completed', 'failed'
  error_message         TEXT,
  transcript            JSONB DEFAULT '[]'::jsonb, -- [{ start, end, timestamp, speaker, text }]
  raw_transcript        TEXT,
  topics                JSONB DEFAULT '[]'::jsonb, -- [{ topic, subtopics, summary }]
  definitions           JSONB DEFAULT '[]'::jsonb, -- [{ term, definition, timestamp, context }]
  examples              JSONB DEFAULT '[]'::jsonb, -- [{ concept, example, timestamp }]
  formulas_and_concepts JSONB DEFAULT '[]'::jsonb, -- [{ concept, formula, explanation, key_points }]
  questions_discussed   JSONB DEFAULT '[]'::jsonb, -- [{ question, answer_or_discussion, timestamp }]
  non_academic          JSONB DEFAULT '[]'::jsonb, -- [{ category, text, timestamp }]
  organized_notes       TEXT,                      -- Comprehensive markdown lecture notes
  summary               TEXT,                      -- Lecture summary
  document_id           UUID REFERENCES public.documents(id) ON DELETE SET NULL, -- Linked to RAG/exam chunks
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lectures_user ON public.lectures(user_id, created_at DESC);

ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only manage their own lectures" ON public.lectures;
CREATE POLICY "Users can only manage their own lectures"
  ON public.lectures FOR ALL
  USING (auth.uid()::text = user_id);

-- ============================================================
-- 8. TABLE: public.lecture_chats
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lecture_chats (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id   UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,
  role         TEXT NOT NULL, -- 'user' | 'assistant'
  content      TEXT NOT NULL,
  timestamps   TEXT[] DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lecture_chats ON public.lecture_chats(lecture_id, created_at ASC);

ALTER TABLE public.lecture_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only manage their own lecture chats" ON public.lecture_chats;
CREATE POLICY "Users can only manage their own lecture chats"
  ON public.lecture_chats FOR ALL
  USING (auth.uid()::text = user_id);

-- ============================================================
-- 9. SUPABASE STORAGE BUCKETS (Direct Upload Architecture)
-- ============================================================
-- Insert private buckets if they don't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('study-documents', 'study-documents', false, 104857600, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']),
  ('lecture-recordings', 'lecture-recordings', false, 524288000, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'video/mp4', 'video/quicktime', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for study-documents:
DROP POLICY IF EXISTS "Allow user upload to study-documents" ON storage.objects;
CREATE POLICY "Allow user upload to study-documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'study-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Allow user select in study-documents" ON storage.objects;
CREATE POLICY "Allow user select in study-documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'study-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Allow user delete in study-documents" ON storage.objects;
CREATE POLICY "Allow user delete in study-documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'study-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS policies for lecture-recordings:
DROP POLICY IF EXISTS "Allow user upload to lecture-recordings" ON storage.objects;
CREATE POLICY "Allow user upload to lecture-recordings" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'lecture-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Allow user select in lecture-recordings" ON storage.objects;
CREATE POLICY "Allow user select in lecture-recordings" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'lecture-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Allow user delete in lecture-recordings" ON storage.objects;
CREATE POLICY "Allow user delete in lecture-recordings" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'lecture-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 10. ADMIN DASHBOARD TABLES & USER EXTENSIONS (/boss)
-- ============================================================

-- Extend users table with status & activity tracking
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- 10.1 TABLE: public.admins
CREATE TABLE IF NOT EXISTS public.admins (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username       TEXT UNIQUE NOT NULL,
  email          TEXT UNIQUE,
  password       TEXT NOT NULL,
  role           TEXT DEFAULT 'admin',
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON public.admins(LOWER(username));

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can only be managed by service role" ON public.admins;
CREATE POLICY "Admins can only be managed by service role" ON public.admins
  FOR ALL USING (false);

-- 10.2 TABLE: public.admin_activity_logs
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id       UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  admin_username TEXT NOT NULL,
  action         TEXT NOT NULL,
  target_type    TEXT,
  target_id      TEXT,
  details        JSONB DEFAULT '{}'::jsonb,
  ip_address     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_activity_logs(action);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin logs service role only" ON public.admin_activity_logs;
CREATE POLICY "Admin logs service role only" ON public.admin_activity_logs
  FOR ALL USING (false);

-- 10.3 TABLE: public.ai_activity_logs
CREATE TABLE IF NOT EXISTS public.ai_activity_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT,
  request_type     TEXT NOT NULL,
  model_used       TEXT,
  status           TEXT NOT NULL,
  response_time_ms INT DEFAULT 0,
  token_count      INT DEFAULT 0,
  error_details    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON public.ai_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_type ON public.ai_activity_logs(request_type);

ALTER TABLE public.ai_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AI logs service role only" ON public.ai_activity_logs;
CREATE POLICY "AI logs service role only" ON public.ai_activity_logs
  FOR ALL USING (false);

-- 10.4 TABLE: public.system_feedback
CREATE TABLE IF NOT EXISTS public.system_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT,
  user_name   TEXT,
  user_email  TEXT,
  category    TEXT NOT NULL DEFAULT 'feedback',
  rating      INT DEFAULT 5,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.system_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.system_feedback(status);

ALTER TABLE public.system_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can create feedback" ON public.system_feedback;
CREATE POLICY "Users can create feedback" ON public.system_feedback
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Feedback readable by service role only" ON public.system_feedback;
CREATE POLICY "Feedback readable by service role only" ON public.system_feedback
  FOR SELECT USING (false);

-- 10.5 TABLE: public.platform_settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id         TEXT PRIMARY KEY DEFAULT 'default',
  settings   JSONB NOT NULL DEFAULT '{
    "max_upload_size_mb": 100,
    "max_lecture_size_mb": 500,
    "allowed_document_formats": ["pdf", "docx"],
    "allowed_lecture_formats": ["mp3", "wav", "m4a", "mp4"],
    "ai_model": "gemini-3.8-flash",
    "fallback_model": "gemini-3.8-flash-lite",
    "platform_announcement": "",
    "announcement_active": false,
    "registration_enabled": true
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.platform_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings service role only" ON public.platform_settings;
CREATE POLICY "Settings service role only" ON public.platform_settings
  FOR ALL USING (false);

