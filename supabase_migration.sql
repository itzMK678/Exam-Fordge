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
  email        TEXT UNIQUE NOT NULL,              -- User email / Gmail (case-insensitive queries)
  password     TEXT NOT NULL,                     -- Bcrypt hashed password
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() -- Registration timestamp
);

-- Index for fast login lookups by email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (LOWER(email));

-- 2. TABLE: exam_sessions
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

-- Index for fast user exam history queries
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON public.exam_sessions(user_id, created_at DESC);

-- 3. TABLE: question_discussions
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

-- Index and unique constraint for question discussions
CREATE INDEX IF NOT EXISTS idx_discussions_user ON public.question_discussions(user_id, exam_id, question_uid);

ALTER TABLE public.question_discussions
  DROP CONSTRAINT IF EXISTS uq_discussion_per_question;
ALTER TABLE public.question_discussions
  ADD CONSTRAINT uq_discussion_per_question UNIQUE (user_id, exam_id, question_uid);
