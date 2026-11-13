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
