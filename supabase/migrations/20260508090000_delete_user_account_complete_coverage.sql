-- Keep account deletion aligned with the current Supabase data model.
--
-- The app calls this RPC from Settings > Delete Account. It must not fail when
-- older legacy tables are absent, and it must cover every current user-scoped
-- table before deleting the auth user.

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _table_name text;
  _table_reg regclass;
  _tables text[] := ARRAY[
    -- Insight engine history and memory
    'public.insight_feedback',
    'public.shown_insights',
    'public.insight_candidates',
    'public.insight_signals',
    'public.user_insight_memory',
    'public.insight_history',

    -- Dream engine tables
    'public.user_dream_model_updates',
    'public.dream_card_feedback',
    'public.dream_rendered_cards',
    'public.dream_engine_results',
    'public.dream_text_signals',
    'public.dream_selected_feelings',
    'public.dream_entries',
    'public.user_dream_model',

    -- Core app data
    'public.birth_profiles',
    'public.journal_entries',
    'public.sleep_entries',
    'public.daily_check_ins',
    'public.daily_logs',
    'public.relationship_charts',
    'public.relationship_daily_logs',
    'public.app_settings',

    -- Self-knowledge and preferences
    'public.daily_reflections',
    'public.somatic_entries',
    'public.trigger_events',
    'public.relationship_patterns',
    'public.self_knowledge_profiles',
    'public.user_preferences',
    'public.user_profiles',

    -- Privacy/account records
    'public.privacy_audit_events',
    'public.lawful_basis_records',
    'public.privacy_consent_records',
    'public.privacy_policy_versions',
    'public.password_recovery_codes',

    -- Service-side rate limits
    'public.reflection_rate_limit',
    'public.gemini_rate_limit',

    -- Legacy table names from earlier account-deletion migrations. Keep these
    -- optional so projects without those tables do not fail deletion.
    'public.dream_clusters',
    'public.emotional_correlations',
    'public.circadian_rhythm',
    'public.weekly_rhythm'
  ];
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT lower(email)
    INTO _email
    FROM auth.users
   WHERE id = _uid;

  FOREACH _table_name IN ARRAY _tables LOOP
    _table_reg := to_regclass(_table_name);
    IF _table_reg IS NOT NULL THEN
      EXECUTE format('DELETE FROM %s WHERE user_id = $1', _table_reg) USING _uid;
    END IF;
  END LOOP;

  -- This table is keyed by normalized email instead of user_id.
  _table_reg := to_regclass('public.password_recovery_request_limit');
  IF _table_reg IS NOT NULL AND _email IS NOT NULL THEN
    EXECUTE format('DELETE FROM %s WHERE identifier = $1', _table_reg) USING _email;
  END IF;

  DELETE FROM auth.users WHERE id = _uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

NOTIFY pgrst, 'reload schema';
