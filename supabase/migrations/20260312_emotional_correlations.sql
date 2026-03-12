-- 20260312_emotional_correlations.sql
-- RPC: get_emotional_correlations
--
-- Returns Pearson-like correlations between emotional metrics computed from
-- daily_check_ins over the last 30 days.
--
-- Returns a JSON array of objects:
--   { metric_a: text, metric_b: text, correlation: float }
--
-- metric keys: 'mood', 'energy', 'stress', 'anxiety'
-- correlation range: -1.0 to 1.0
--
-- If the user has fewer than 5 data points, returns an empty array.
-- Uses population covariance / stddev (sufficient for small personal datasets).
--
-- Depends on: public.daily_check_ins

CREATE OR REPLACE FUNCTION public.get_emotional_correlations()
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
    WITH source AS (
      SELECT
        mood_value::float                                      AS mood,
        CASE energy_level
          WHEN 'low'    THEN 2.0
          WHEN 'medium' THEN 5.0
          WHEN 'high'   THEN 9.0
          ELSE                5.0
        END                                                    AS energy,
        CASE stress_level
          WHEN 'low'    THEN 2.0
          WHEN 'medium' THEN 5.0
          WHEN 'high'   THEN 9.0
          ELSE                5.0
        END                                                    AS stress,
        COALESCE(anxiety_score, 5.0)::float                    AS anxiety
      FROM public.daily_check_ins
      WHERE user_id  = current_user_id
        AND log_date >= current_date - interval '30 days'
    ),
    stats AS (
      SELECT count(*) AS n FROM source
    ),
    corr AS (
      SELECT
        'mood_energy'   AS pair,
        CORR(mood,     energy)  AS r
      FROM source
      UNION ALL
      SELECT 'mood_stress',    CORR(mood,   stress)  FROM source
      UNION ALL
      SELECT 'mood_anxiety',   CORR(mood,   anxiety) FROM source
      UNION ALL
      SELECT 'energy_stress',  CORR(energy, stress)  FROM source
      UNION ALL
      SELECT 'energy_anxiety', CORR(energy, anxiety) FROM source
      UNION ALL
      SELECT 'stress_anxiety', CORR(stress, anxiety) FROM source
    )
    SELECT
      CASE (SELECT n FROM stats) >= 5
        WHEN true THEN
          jsonb_agg(
            jsonb_build_object(
              'metric_a', split_part(pair, '_', 1),
              'metric_b', split_part(pair, '_', 2),
              'correlation', round(COALESCE(r, 0)::numeric, 4)
            )
          )
        ELSE '[]'::jsonb
      END
    FROM corr
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_emotional_correlations() TO authenticated;
