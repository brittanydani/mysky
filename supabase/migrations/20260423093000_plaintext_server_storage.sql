-- 20260423093000_plaintext_server_storage.sql
--
-- Move application data back to plaintext server storage.
-- Legacy encrypted columns are left in place temporarily for compatibility,
-- but new writes should target these plaintext columns.

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS content_keywords TEXT,
  ADD COLUMN IF NOT EXISTS content_emotions TEXT,
  ADD COLUMN IF NOT EXISTS content_sentiment TEXT;

ALTER TABLE public.sleep_entries
  ADD COLUMN IF NOT EXISTS dream_text TEXT,
  ADD COLUMN IF NOT EXISTS dream_feelings TEXT,
  ADD COLUMN IF NOT EXISTS dream_metadata TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.daily_check_ins
  ADD COLUMN IF NOT EXISTS mood_score INTEGER,
  ADD COLUMN IF NOT EXISTS energy_level TEXT,
  ADD COLUMN IF NOT EXISTS stress_level TEXT,
  ADD COLUMN IF NOT EXISTS tags JSONB,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS wins TEXT,
  ADD COLUMN IF NOT EXISTS challenges TEXT;

ALTER TABLE public.insight_history
  ADD COLUMN IF NOT EXISTS greeting TEXT,
  ADD COLUMN IF NOT EXISTS love_headline TEXT,
  ADD COLUMN IF NOT EXISTS love_message TEXT,
  ADD COLUMN IF NOT EXISTS energy_headline TEXT,
  ADD COLUMN IF NOT EXISTS energy_message TEXT,
  ADD COLUMN IF NOT EXISTS growth_headline TEXT,
  ADD COLUMN IF NOT EXISTS growth_message TEXT,
  ADD COLUMN IF NOT EXISTS gentle_reminder TEXT,
  ADD COLUMN IF NOT EXISTS journal_prompt TEXT,
  ADD COLUMN IF NOT EXISTS signals JSONB;

ALTER TABLE public.relationship_charts
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS birth_time TIME,
  ADD COLUMN IF NOT EXISTS birth_place TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
