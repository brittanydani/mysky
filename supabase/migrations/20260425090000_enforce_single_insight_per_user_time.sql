-- 20260425090000_enforce_single_insight_per_user_time.sql
--
-- Keep one insight per user/date/chart. The client write path upserts against
-- this key; this migration also cleans up any historical duplicate rows first.

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, date, chart_id
      ORDER BY is_deleted ASC, updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.insight_history
)
DELETE FROM public.insight_history h
USING ranked r
WHERE h.id = r.id
  AND r.rn > 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'insight_history_user_date_chart_key'
      AND conrelid = 'public.insight_history'::regclass
  ) THEN
    ALTER TABLE public.insight_history
      ADD CONSTRAINT insight_history_user_date_chart_key
      UNIQUE (user_id, date, chart_id);
  END IF;
END $$;
