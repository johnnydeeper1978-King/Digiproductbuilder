-- 0007_discovery_answer_unique.sql
-- One current raw answer per (session, question). Enables idempotent upsert so
-- that when a user goes back and changes an answer, the raw value is updated in
-- place. AI-generated interpretations are NEVER written here — they live in the
-- opportunities/blueprints tables — so raw answers are never overwritten by AI.
alter table public.discovery_answers
  add constraint discovery_answers_session_question_key
  unique (session_id, question_key);
