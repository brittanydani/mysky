-- Fix schema drift found during the Pass 5 Supabase lint.
--
-- 1. Some environments have password_recovery_codes.id as uuid from an older
--    rollout while newer migrations created it as bigint. Return code_id as
--    text so the Edge Function can invalidate either shape.
-- 2. get_emotional_correlations referenced anxiety_score, which is not part of
--    the current daily_check_ins model. Keep the RPC deterministic by using
--    only the real mood/energy/stress fields the app writes.

ALTER TABLE public.password_recovery_codes
  ADD COLUMN IF NOT EXISTS attempt_count int NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'password_recovery_codes'
       AND column_name = 'attempts'
  ) THEN
    EXECUTE '
      UPDATE public.password_recovery_codes
         SET attempt_count = attempts
       WHERE attempt_count = 0
         AND attempts IS NOT NULL
    ';
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.consume_password_recovery_code(text, text, int);

CREATE FUNCTION public.consume_password_recovery_code(
  p_email text,
  p_code_hash text,
  p_max_attempts int DEFAULT 5
)
RETURNS TABLE(status text, user_id uuid, code_id text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.password_recovery_codes%ROWTYPE;
  v_normalized_email text := lower(trim(p_email));
  v_next_attempts int;
BEGIN
  SELECT *
    INTO v_row
    FROM public.password_recovery_codes
   WHERE email = v_normalized_email
     AND consumed_at IS NULL
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF v_row.expires_at <= now() THEN
    UPDATE public.password_recovery_codes
       SET consumed_at = now()
     WHERE id = v_row.id;

    RETURN QUERY SELECT 'expired'::text, NULL::uuid, v_row.id::text;
    RETURN;
  END IF;

  IF v_row.code_hash <> p_code_hash THEN
    v_next_attempts := v_row.attempt_count + 1;

    UPDATE public.password_recovery_codes
       SET attempt_count = v_next_attempts,
           consumed_at = CASE WHEN v_next_attempts >= p_max_attempts THEN now() ELSE consumed_at END
     WHERE id = v_row.id;

    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, v_row.id::text;
    RETURN;
  END IF;

  UPDATE public.password_recovery_codes
     SET consumed_at = now()
   WHERE id = v_row.id;

  RETURN QUERY SELECT 'verified'::text, v_row.user_id, v_row.id::text;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_password_recovery_code(text, text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_password_recovery_code(text, text, int) TO service_role;

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
        COALESCE(mood_score, mood_value)::float AS mood,
        CASE energy_level
          WHEN 'low'    THEN 2.0
          WHEN 'medium' THEN 5.0
          WHEN 'high'   THEN 9.0
          ELSE                NULL
        END AS energy,
        CASE stress_level
          WHEN 'low'    THEN 2.0
          WHEN 'medium' THEN 5.0
          WHEN 'high'   THEN 9.0
          ELSE                NULL
        END AS stress
      FROM public.daily_check_ins
      WHERE user_id = current_user_id
        AND log_date >= current_date - interval '30 days'
        AND COALESCE(mood_score, mood_value) IS NOT NULL
        AND energy_level IN ('low', 'medium', 'high')
        AND stress_level IN ('low', 'medium', 'high')
    ),
    stats AS (
      SELECT count(*) AS n FROM source
    ),
    corr AS (
      SELECT 'mood_energy' AS pair, CORR(mood, energy) AS r FROM source
      UNION ALL
      SELECT 'mood_stress', CORR(mood, stress) FROM source
      UNION ALL
      SELECT 'energy_stress', CORR(energy, stress) FROM source
    )
    SELECT
      CASE (SELECT n FROM stats) >= 5
        WHEN true THEN
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'metric_a', split_part(pair, '_', 1),
                'metric_b', split_part(pair, '_', 2),
                'correlation', round(COALESCE(r, 0)::numeric, 4)
              )
            ),
            '[]'::jsonb
          )
        ELSE '[]'::jsonb
      END
    FROM corr
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_emotional_correlations() TO authenticated;

NOTIFY pgrst, 'reload schema';
