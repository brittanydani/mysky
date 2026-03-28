-- Migration: delete_user_account RPC
-- Allows a signed-in user to permanently delete their own account and all
-- associated data. Called from the app via supabase.rpc('delete_user_account').
--
-- Security: SECURITY DEFINER runs as the migration owner (service role), but
-- auth.uid() is evaluated at call time so only the authenticated caller's data
-- is deleted. The function is not callable anonymously.

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  -- Reject unauthenticated calls
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete all user data rows across known tables (add any new tables here)
  DELETE FROM public.daily_check_ins       WHERE user_id = _uid;
  DELETE FROM public.daily_logs            WHERE user_id = _uid;
  DELETE FROM public.dream_clusters        WHERE user_id = _uid;
  DELETE FROM public.emotional_correlations WHERE user_id = _uid;
  DELETE FROM public.circadian_rhythm      WHERE user_id = _uid;
  DELETE FROM public.relationship_daily_logs WHERE user_id = _uid;
  DELETE FROM public.weekly_rhythm         WHERE user_id = _uid;
  DELETE FROM public.reflection_rate_limit WHERE user_id = _uid;

  -- Delete the auth user last (cascades to auth.identities, auth.sessions, etc.)
  DELETE FROM auth.users WHERE id = _uid;
END;
$$;

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
