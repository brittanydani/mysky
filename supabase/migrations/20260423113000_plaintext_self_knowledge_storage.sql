-- 20260423113000_plaintext_self_knowledge_storage.sql
--
-- Move self-knowledge features to normal Supabase storage:
-- server-side plaintext columns protected by auth + RLS, with no additional
-- client-side content encryption required for writes.

ALTER TABLE public.daily_reflections
  ADD COLUMN IF NOT EXISTS question_text TEXT,
  ADD COLUMN IF NOT EXISTS answer TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.somatic_entries
  ADD COLUMN IF NOT EXISTS emotion TEXT,
  ADD COLUMN IF NOT EXISTS sensation TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE public.trigger_events
  ADD COLUMN IF NOT EXISTS event TEXT,
  ADD COLUMN IF NOT EXISTS sensations JSONB,
  ADD COLUMN IF NOT EXISTS resolution TEXT;

ALTER TABLE public.relationship_patterns
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS tags JSONB;
