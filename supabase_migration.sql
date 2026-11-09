-- Run this in Supabase SQL editor

-- TABLE: exam_sessions
-- Stores one row per generated exam per user
CREATE TABLE IF NOT EXISTS exam_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  title        TEXT NOT NULL,          -- e.g. "Biology.pdf + Chemistry.pdf"
  difficulty   TEXT,
  focus_topics TEXT,
  total_questions INT NOT NULL DEFAULT 0,
  document_names  TEXT[] NOT NULL DEFAULT '{}',
  exam_data    TEXT NOT NULL,          -- AES-GCM encrypted JSON (full questions array)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: question_discussions
-- Stores chat history per question per user, keyed by question_uid
CREATE TABLE IF NOT EXISTS question_discussions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  exam_id      UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_uid TEXT NOT NULL,          -- e.g. "doc123_q1"
  question_text TEXT NOT NULL,
  messages     TEXT NOT NULL,          -- AES-GCM encrypted JSON (messages array)
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_user   ON question_discussions(user_id, exam_id, question_uid);

-- Unique constraint: one discussion row per (user, exam, question)
ALTER TABLE question_discussions
  DROP CONSTRAINT IF EXISTS uq_discussion_per_question;
ALTER TABLE question_discussions
  ADD CONSTRAINT uq_discussion_per_question UNIQUE (user_id, exam_id, question_uid);
