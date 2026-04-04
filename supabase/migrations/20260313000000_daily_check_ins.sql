-- 20260313_daily_check_ins.sql
-- Dedicated personal mood check-in table.
-- Replaces the temporary write to relationship_daily_logs in checkInStore.ts.
-- One row per user per day, upsert-safe via the unique constraint.

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_check_ins (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date    DATE        NOT NULL DEFAULT current_date,
    mood_value  SMALLINT    NOT NULL CHECK (mood_value BETWEEN 0 AND 10),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT daily_check_ins_user_date_key UNIQUE (user_id, log_date)
);

-- ─── Index ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_log_date
    ON public.daily_check_ins (user_id, log_date DESC);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own check-ins"
    ON public.daily_check_ins;
CREATE POLICY "Users can view their own check-ins"
    ON public.daily_check_ins
    FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own check-ins"
    ON public.daily_check_ins;
CREATE POLICY "Users can insert their own check-ins"
    ON public.daily_check_ins
    FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own check-ins"
    ON public.daily_check_ins;
CREATE POLICY "Users can update their own check-ins"
    ON public.daily_check_ins
    FOR UPDATE
    USING     ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own check-ins"
    ON public.daily_check_ins;
CREATE POLICY "Users can delete their own check-ins"
    ON public.daily_check_ins
    FOR DELETE
    USING ((SELECT auth.uid()) = user_id);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
-- public.set_updated_at() is already defined in 20260313_relationship_daily_logs.sql
-- so we only create the trigger here, not the function.

DROP TRIGGER IF EXISTS trg_daily_check_ins_updated_at
    ON public.daily_check_ins;
CREATE TRIGGER trg_daily_check_ins_updated_at
    BEFORE UPDATE ON public.daily_check_ins
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ─── RPC: get_today_check_in ──────────────────────────────────────────────────
-- Returns today's saved mood value, or exists=false when no row exists yet.
-- Useful for pre-seeding the slider position when the check-in screen opens.

CREATE OR REPLACE FUNCTION public.get_today_check_in()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_user_id UUID := auth.uid();
    result_row      public.daily_check_ins;
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT *
    INTO result_row
    FROM public.daily_check_ins
    WHERE user_id  = current_user_id
      AND log_date = current_date
    LIMIT 1;

    IF result_row IS NULL THEN
        RETURN jsonb_build_object(
            'exists',    false,
            'moodValue', NULL,
            'logDate',   current_date
        );
    END IF;

    RETURN jsonb_build_object(
        'exists',    true,
        'moodValue', result_row.mood_value,
        'logDate',   result_row.log_date,
        'updatedAt', result_row.updated_at
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_today_check_in() TO authenticated;

-- ─── RPC: get_recent_check_in_series ─────────────────────────────────────────
-- Returns an ordered mood series for the last N days + summary stats.
-- Used by the Today-screen wave graph to reflect recent mood history.
-- Returns: { series, stats: { averageMood, minMood, maxMood, latestMood }, lastSynced }

CREATE OR REPLACE FUNCTION public.get_recent_check_in_series(days_back INT DEFAULT 14)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_user_id UUID := auth.uid();
    series_json     JSONB;
    avg_mood        NUMERIC;
    min_mood        INT;
    max_mood        INT;
    latest_mood     INT;
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Ordered series for the chart
    WITH filtered AS (
        SELECT log_date, mood_value
        FROM public.daily_check_ins
        WHERE user_id  = current_user_id
          AND log_date >= current_date - GREATEST(days_back - 1, 0)
        ORDER BY log_date ASC
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'logDate',   log_date,
                'moodValue', mood_value
            )
            ORDER BY log_date ASC
        ),
        '[]'::JSONB
    )
    INTO series_json
    FROM filtered;

    -- Summary stats from the same window
    WITH filtered AS (
        SELECT log_date, mood_value
        FROM public.daily_check_ins
        WHERE user_id  = current_user_id
          AND log_date >= current_date - GREATEST(days_back - 1, 0)
    )
    SELECT
        ROUND(AVG(mood_value)::NUMERIC, 2),
        MIN(mood_value),
        MAX(mood_value),
        (
            SELECT f2.mood_value
            FROM filtered f2
            ORDER BY f2.log_date DESC
            LIMIT 1
        )
    INTO avg_mood, min_mood, max_mood, latest_mood
    FROM filtered;

    RETURN jsonb_build_object(
        'series', COALESCE(series_json, '[]'::JSONB),
        'stats', jsonb_build_object(
            'averageMood', avg_mood,
            'minMood',     min_mood,
            'maxMood',     max_mood,
            'latestMood',  latest_mood
        ),
        'lastSynced', now()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_recent_check_in_series(INT) TO authenticated;

-- ─── Seed data (run in SQL editor while logged in as a test user) ─────────────
-- Inserts 14 days of sample mood values. Safe to re-run — upserts on conflict.

/*
INSERT INTO public.daily_check_ins (user_id, log_date, mood_value)
VALUES
  (auth.uid(), current_date - 13, 4),
  (auth.uid(), current_date - 12, 5),
  (auth.uid(), current_date - 11, 6),
  (auth.uid(), current_date - 10, 7),
  (auth.uid(), current_date - 9,  5),
  (auth.uid(), current_date - 8,  4),
  (auth.uid(), current_date - 7,  6),
  (auth.uid(), current_date - 6,  8),
  (auth.uid(), current_date - 5,  7),
  (auth.uid(), current_date - 4,  5),
  (auth.uid(), current_date - 3,  6),
  (auth.uid(), current_date - 2,  7),
  (auth.uid(), current_date - 1,  8),
  (auth.uid(), current_date,      6)
ON CONFLICT (user_id, log_date) DO UPDATE
SET mood_value = excluded.mood_value, updated_at = now();
*/
