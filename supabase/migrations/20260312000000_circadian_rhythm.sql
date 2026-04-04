-- 20260312_circadian_rhythm.sql
-- RPC: get_weekly_rhythm
-- Returns a 7x24 JSON grid (7 days x 24 hours) of average mood values.
-- Uses a cross-join on generated series so every slot is populated,
-- preventing holes in the 3D terrain mesh even when the user has sparse data.
-- Days without any entries default to 5.0 (mid-range).
--
-- Depends on: public.daily_check_ins (20260313_daily_check_ins.sql)

CREATE OR REPLACE FUNCTION public.get_weekly_rhythm()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN (
    WITH grid AS (
      -- Generate every slot: day-of-week 0–6 x hour 0–23
      SELECT d.day, h.hour
      FROM generate_series(0, 6) AS d(day)
      CROSS JOIN generate_series(0, 23) AS h(hour)
    ),
    stats AS (
      SELECT
        extract(dow FROM log_date)::int AS d,
        avg(mood_value)                AS val
      FROM public.daily_check_ins
      WHERE user_id  = current_user_id
        AND log_date >= current_date - interval '21 days'
      GROUP BY 1
    )
    SELECT jsonb_agg(day_data ORDER BY day_index ASC)
    FROM (
      SELECT
        g.day                                                 AS day_index,
        jsonb_agg(COALESCE(s.val, 5.0) ORDER BY g.hour ASC) AS hours
      FROM grid g
      LEFT JOIN stats s ON s.d = g.day
      GROUP BY g.day
    ) day_data
  );
END;
$$;

-- ─── Grant ────────────────────────────────────────────────────────────────────
-- SECURITY DEFINER + fixed search_path means the caller only needs EXECUTE.

GRANT EXECUTE ON FUNCTION public.get_weekly_rhythm() TO authenticated;
