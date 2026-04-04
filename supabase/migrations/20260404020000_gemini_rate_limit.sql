-- 20260404_gemini_rate_limit.sql
-- Per-user rate-limit table for the gemini-proxy Edge Function.
-- Keeps a separate counter from reflection_rate_limit so dream analysis
-- and AI insights each get their own budget.
--
-- Run: supabase db push
-- Or:  supabase migration up

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gemini_rate_limit (
  user_id      uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  req_count    int         NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- RLS: only the service role (used by the Edge Function) should touch this table.
ALTER TABLE public.gemini_rate_limit ENABLE ROW LEVEL SECURITY;

-- No RLS policies = no access via anon/authenticated roles.
-- The Edge Function uses the service role key which bypasses RLS.

CREATE INDEX IF NOT EXISTS idx_gemini_rate_limit_window
  ON public.gemini_rate_limit (window_start);

-- ─── Atomic check + increment function ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_gemini_rate_limit(
  p_user_id        uuid,
  p_max_requests   int  DEFAULT 20,
  p_window_interval text DEFAULT '1 hour'
)
RETURNS boolean  -- true = allowed, false = blocked
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count   int;
  v_start   timestamptz;
BEGIN
  INSERT INTO public.gemini_rate_limit (user_id, req_count, window_start)
  VALUES (p_user_id, 0, now())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT req_count, window_start
    INTO v_count, v_start
    FROM public.gemini_rate_limit
   WHERE user_id = p_user_id
     FOR UPDATE;

  IF v_start + p_window_interval::interval <= now() THEN
    UPDATE public.gemini_rate_limit
       SET req_count = 1, window_start = now()
     WHERE user_id = p_user_id;
    RETURN true;
  END IF;

  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;

  UPDATE public.gemini_rate_limit
     SET req_count = req_count + 1
   WHERE user_id = p_user_id;

  RETURN true;
END;
$$;
