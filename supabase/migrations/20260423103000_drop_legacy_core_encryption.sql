-- 20260423103000_drop_legacy_core_encryption.sql
--
-- Finalize the plaintext Supabase-first architecture for core app content by
-- removing legacy encrypted columns that are no longer read or written.

ALTER TABLE public.journal_entries
  DROP COLUMN IF EXISTS title_enc,
  DROP COLUMN IF EXISTS content_enc,
  DROP COLUMN IF EXISTS content_keywords_enc,
  DROP COLUMN IF EXISTS content_emotions_enc,
  DROP COLUMN IF EXISTS content_sentiment_enc;

ALTER TABLE public.sleep_entries
  DROP COLUMN IF EXISTS dream_text_enc,
  DROP COLUMN IF EXISTS dream_feelings_enc,
  DROP COLUMN IF EXISTS dream_metadata_enc,
  DROP COLUMN IF EXISTS notes_enc;

ALTER TABLE public.daily_check_ins
  DROP COLUMN IF EXISTS energy_level_enc,
  DROP COLUMN IF EXISTS stress_level_enc,
  DROP COLUMN IF EXISTS mood_score_enc,
  DROP COLUMN IF EXISTS tags_enc,
  DROP COLUMN IF EXISTS note_enc,
  DROP COLUMN IF EXISTS wins_enc,
  DROP COLUMN IF EXISTS challenges_enc;

ALTER TABLE public.insight_history
  DROP COLUMN IF EXISTS greeting_enc,
  DROP COLUMN IF EXISTS love_headline_enc,
  DROP COLUMN IF EXISTS love_message_enc,
  DROP COLUMN IF EXISTS energy_headline_enc,
  DROP COLUMN IF EXISTS energy_message_enc,
  DROP COLUMN IF EXISTS growth_headline_enc,
  DROP COLUMN IF EXISTS growth_message_enc,
  DROP COLUMN IF EXISTS gentle_reminder_enc,
  DROP COLUMN IF EXISTS journal_prompt_enc,
  DROP COLUMN IF EXISTS signals_enc;

ALTER TABLE public.relationship_charts
  DROP COLUMN IF EXISTS name_enc,
  DROP COLUMN IF EXISTS birth_date_enc,
  DROP COLUMN IF EXISTS birth_time_enc,
  DROP COLUMN IF EXISTS birth_place_enc,
  DROP COLUMN IF EXISTS latitude_enc,
  DROP COLUMN IF EXISTS longitude_enc;

ALTER TABLE public.birth_profiles
  DROP COLUMN IF EXISTS profile_enc;
