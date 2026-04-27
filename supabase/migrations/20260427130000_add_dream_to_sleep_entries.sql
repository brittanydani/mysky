-- ============================================================================
-- Schema fixes for storage layer compatibility
-- ============================================================================

-- ─── sleep_entries: add missing columns ─────────────────────────────────────
alter table public.sleep_entries
add column if not exists hours_slept REAL;

alter table public.sleep_entries
add column if not exists dream text;

alter table public.sleep_entries
add column if not exists dream_text text;

alter table public.sleep_entries
add column if not exists dream_feelings text;

alter table public.sleep_entries
add column if not exists dream_metadata text;

alter table public.sleep_entries
add column if not exists notes text;

-- ─── journal_entries: fix type for decimal reading minutes ──────────────────
alter table public.journal_entries
alter column content_reading_minutes type REAL;

-- ─── daily_check_ins: fix mood_score to accept decimals ─────────────────────
alter table public.daily_check_ins
alter column mood_score type REAL;

-- ─── relationship_charts: add missing plaintext columns ─────────────────────
-- The 20260423093000 migration added some but missed has_unknown_time, timezone
alter table public.relationship_charts
add column if not exists partner_name text;

notify pgrst, 'reload schema';