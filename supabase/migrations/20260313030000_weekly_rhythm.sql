-- 20260313_weekly_rhythm.sql
-- Returns a 7×24 matrix of average mood values per (day-of-week × hour).
-- Powers the Circadian Terrain chart on the Patterns screen.
-- Depends on: public.daily_check_ins (20260313_daily_check_ins.sql)

-- ─── RPC ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_weekly_rhythm()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  RETURN (
    SELECT jsonb_agg(day_data)
    FROM (
      -- Generate a series for 7 days (0 = Sunday … 6 = Saturday)
      SELECT
        d.day_index,
        (
          SELECT jsonb_agg(COALESCE(avg_val, 0))
          FROM (
            -- Generate a series for 24 hours (0–23)
            -- Note: daily_check_ins stores one row per date; the hour axis is
            -- a placeholder until per-hour timestamps are tracked.
            SELECT h.hour_index,
              (
                SELECT AVG(mood_value)
                FROM public.daily_check_ins
                WHERE user_id = current_user_id
                  AND EXTRACT(DOW FROM log_date) = d.day_index
              ) AS avg_val
            FROM generate_series(0, 23) AS h(hour_index)
          ) hour_data
        ) AS hours
      FROM generate_series(0, 6) AS d(day_index)
    ) day_data
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_rhythm() TO authenticated;
