-- 20260301_reflection_rate_limit.sql
-- Rate-limit table + atomic check function for reflection-insights Edge Function.
-- Persists across cold starts and is shared across all function instances.
--
-- Run: supabase db push
-- Or:  supabase migration up

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reflection_rate_limit (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  req_count  int         NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- RLS: only the service role (used by the Edge Function) should touch this table.
ALTER TABLE public.reflection_rate_limit ENABLE ROW LEVEL SECURITY;

-- No RLS policies = no access via the anon/authenticated roles.
-- The Edge Function uses the service role key which bypasses RLS.

-- Index for cleanup queries if you ever want to prune old rows
CREATE INDEX IF NOT EXISTS idx_reflection_rate_limit_window
  ON public.reflection_rate_limit (window_start);

-- ─── Atomic check + increment function ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_reflection_rate_limit(
  p_user_id        uuid,
  p_max_requests   int DEFAULT 5,
  p_window_interval text DEFAULT '1 hour'
)
RETURNS boolean  -- true = allowed, false = blocked
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as the function owner (postgres), not the caller
AS $$
DECLARE
  v_count   int;
  v_start   timestamptz;
BEGIN
  -- Upsert: create row if missing, or fetch existing
  INSERT INTO public.reflection_rate_limit (user_id, req_count, window_start)
  VALUES (p_user_id, 0, now())
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock the row for this transaction
  SELECT req_count, window_start
    INTO v_count, v_start
    FROM public.reflection_rate_limit
   WHERE user_id = p_user_id
     FOR UPDATE;

  -- If the window has expired, reset it
  IF v_start + p_window_interval::interval <= now() THEN
    UPDATE public.reflection_rate_limit
       SET req_count = 1, window_start = now()
     WHERE user_id = p_user_id;
    RETURN true;  -- allowed (fresh window)
  END IF;

  -- Window still active — check count
  IF v_count >= p_max_requests THEN
    RETURN false;  -- blocked
  END IF;

  -- Increment and allow
  UPDATE public.reflection_rate_limit
     SET req_count = req_count + 1
   WHERE user_id = p_user_id;

  RETURN true;  -- allowed
END;
$$;
