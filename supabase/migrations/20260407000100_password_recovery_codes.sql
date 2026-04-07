-- 20260407000100_password_recovery_codes.sql
-- One-time email recovery codes for native password reset.

CREATE TABLE IF NOT EXISTS public.password_recovery_codes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code_hash text NOT NULL,
  attempt_count int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.password_recovery_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_password_recovery_codes_user_id
  ON public.password_recovery_codes (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_password_recovery_codes_expires_at
  ON public.password_recovery_codes (expires_at);

CREATE TABLE IF NOT EXISTS public.password_recovery_request_limit (
  identifier text PRIMARY KEY,
  req_count int NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.password_recovery_request_limit ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_password_recovery_request_limit_window
  ON public.password_recovery_request_limit (window_start);

CREATE OR REPLACE FUNCTION public.find_auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.check_password_recovery_request_limit(
  p_identifier text,
  p_max_requests int DEFAULT 3,
  p_window_interval text DEFAULT '15 minutes'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count int;
  v_start timestamptz;
BEGIN
  INSERT INTO public.password_recovery_request_limit (identifier, req_count, window_start)
  VALUES (lower(trim(p_identifier)), 0, now())
  ON CONFLICT (identifier) DO NOTHING;

  SELECT req_count, window_start
    INTO v_count, v_start
    FROM public.password_recovery_request_limit
   WHERE identifier = lower(trim(p_identifier))
   FOR UPDATE;

  IF v_start + p_window_interval::interval <= now() THEN
    UPDATE public.password_recovery_request_limit
       SET req_count = 1,
           window_start = now()
     WHERE identifier = lower(trim(p_identifier));
    RETURN true;
  END IF;

  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;

  UPDATE public.password_recovery_request_limit
     SET req_count = req_count + 1
   WHERE identifier = lower(trim(p_identifier));

  RETURN true;
END;
$$;

REVOKE ALL ON TABLE public.password_recovery_codes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.password_recovery_request_limit FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.find_auth_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_password_recovery_request_limit(text, int, text) FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_recovery_codes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_recovery_request_limit TO service_role;
GRANT EXECUTE ON FUNCTION public.find_auth_user_id_by_email(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_password_recovery_request_limit(text, int, text) TO service_role;