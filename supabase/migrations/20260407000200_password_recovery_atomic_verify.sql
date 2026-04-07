-- 20260407000200_password_recovery_atomic_verify.sql
-- Atomically verify and consume password recovery codes to prevent replay races.

CREATE OR REPLACE FUNCTION public.consume_password_recovery_code(
  p_email text,
  p_code_hash text,
  p_max_attempts int DEFAULT 5
)
RETURNS TABLE(status text, user_id uuid, code_id bigint)
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
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::bigint;
    RETURN;
  END IF;

  IF v_row.expires_at <= now() THEN
    UPDATE public.password_recovery_codes
       SET consumed_at = now()
     WHERE id = v_row.id;

    RETURN QUERY SELECT 'expired'::text, NULL::uuid, v_row.id;
    RETURN;
  END IF;

  IF v_row.code_hash <> p_code_hash THEN
    v_next_attempts := v_row.attempt_count + 1;

    UPDATE public.password_recovery_codes
       SET attempt_count = v_next_attempts,
           consumed_at = CASE WHEN v_next_attempts >= p_max_attempts THEN now() ELSE consumed_at END
     WHERE id = v_row.id;

    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, v_row.id;
    RETURN;
  END IF;

  UPDATE public.password_recovery_codes
     SET consumed_at = now()
   WHERE id = v_row.id;

  RETURN QUERY SELECT 'verified'::text, v_row.user_id, v_row.id;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_password_recovery_code(text, text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_password_recovery_code(text, text, int) TO service_role;