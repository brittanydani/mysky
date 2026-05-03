-- Clean up Supabase RLS policy shape and add query-specific indexes for
-- Today/insight reads. This migration is backward-compatible:
-- - no table drops
-- - no column renames
-- - no data rewrites
-- - duplicate policies are removed only where an equivalent owner policy remains

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Query-specific indexes for Today and self-knowledge reads.
CREATE INDEX IF NOT EXISTS idx_journal_entries_active_user_date_created
  ON public.journal_entries (user_id, date DESC, created_at DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_chart_log_created
  ON public.daily_check_ins (user_id, chart_id, log_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sleep_entries_active_user_chart_date
  ON public.sleep_entries (user_id, chart_id, date DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_daily_reflections_active_user_sealed
  ON public.daily_reflections (user_id, sealed_at)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_somatic_entries_active_user_date
  ON public.somatic_entries (user_id, date DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_trigger_events_active_user_timestamp
  ON public.trigger_events (user_id, timestamp DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_relationship_patterns_active_user_date
  ON public.relationship_patterns (user_id, date DESC)
  WHERE is_deleted = false;

-- Remove duplicate policies introduced by the audit migration. The remaining
-- ALL policies preserve the same user-owned access.
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can edit own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view own birth profile" ON public.birth_profiles;
DROP POLICY IF EXISTS "Users can modify own birth profile" ON public.birth_profiles;
DROP POLICY IF EXISTS "Users can insert own birth profile" ON public.birth_profiles;

DROP POLICY IF EXISTS "Users can view own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can modify own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON public.journal_entries;

-- Recreate policies with SELECT-wrapped auth.uid() so Postgres can cache the
-- value once per statement instead of evaluating it per row.
DROP POLICY IF EXISTS "Users own their app_settings" ON public.app_settings;
CREATE POLICY "Users own their app_settings"
  ON public.app_settings
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their birth_profiles" ON public.birth_profiles;
CREATE POLICY "Users own their birth_profiles"
  ON public.birth_profiles
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users control their own logs" ON public.daily_logs;
CREATE POLICY "Users control their own logs"
  ON public.daily_logs
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their daily_reflections" ON public.daily_reflections;
CREATE POLICY "Users own their daily_reflections"
  ON public.daily_reflections
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "dream_entries_own" ON public.dream_entries;
CREATE POLICY "dream_entries_own"
  ON public.dream_entries
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "dream_selected_feelings_own" ON public.dream_selected_feelings;
CREATE POLICY "dream_selected_feelings_own"
  ON public.dream_selected_feelings
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "dream_text_signals_own" ON public.dream_text_signals;
CREATE POLICY "dream_text_signals_own"
  ON public.dream_text_signals
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "dream_engine_results_own" ON public.dream_engine_results;
CREATE POLICY "dream_engine_results_own"
  ON public.dream_engine_results
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "dream_rendered_cards_own" ON public.dream_rendered_cards;
CREATE POLICY "dream_rendered_cards_own"
  ON public.dream_rendered_cards
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "dream_card_feedback_own" ON public.dream_card_feedback;
CREATE POLICY "dream_card_feedback_own"
  ON public.dream_card_feedback
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_dream_model_own" ON public.user_dream_model;
CREATE POLICY "user_dream_model_own"
  ON public.user_dream_model
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_dream_model_updates_own" ON public.user_dream_model_updates;
CREATE POLICY "user_dream_model_updates_own"
  ON public.user_dream_model_updates
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "insight_history_select" ON public.insight_history;
DROP POLICY IF EXISTS "insight_history_insert" ON public.insight_history;
DROP POLICY IF EXISTS "insight_history_update" ON public.insight_history;
DROP POLICY IF EXISTS "insight_history_delete" ON public.insight_history;
CREATE POLICY "insight_history_select"
  ON public.insight_history
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "insight_history_insert"
  ON public.insight_history
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "insight_history_update"
  ON public.insight_history
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "insight_history_delete"
  ON public.insight_history
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "journal_select" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_insert" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_update" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_delete" ON public.journal_entries;
CREATE POLICY "journal_select"
  ON public.journal_entries
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "journal_insert"
  ON public.journal_entries
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "journal_update"
  ON public.journal_entries
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "journal_delete"
  ON public.journal_entries
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "sleep_select" ON public.sleep_entries;
DROP POLICY IF EXISTS "sleep_insert" ON public.sleep_entries;
DROP POLICY IF EXISTS "sleep_update" ON public.sleep_entries;
DROP POLICY IF EXISTS "sleep_delete" ON public.sleep_entries;
CREATE POLICY "sleep_select"
  ON public.sleep_entries
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "sleep_insert"
  ON public.sleep_entries
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "sleep_update"
  ON public.sleep_entries
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "sleep_delete"
  ON public.sleep_entries
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their lawful_basis_records" ON public.lawful_basis_records;
CREATE POLICY "Users own their lawful_basis_records"
  ON public.lawful_basis_records
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their privacy_audit_events" ON public.privacy_audit_events;
CREATE POLICY "Users own their privacy_audit_events"
  ON public.privacy_audit_events
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their privacy_consent_records" ON public.privacy_consent_records;
CREATE POLICY "Users own their privacy_consent_records"
  ON public.privacy_consent_records
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their privacy_policy_versions" ON public.privacy_policy_versions;
CREATE POLICY "Users own their privacy_policy_versions"
  ON public.privacy_policy_versions
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "rel_charts_select" ON public.relationship_charts;
DROP POLICY IF EXISTS "rel_charts_insert" ON public.relationship_charts;
DROP POLICY IF EXISTS "rel_charts_update" ON public.relationship_charts;
DROP POLICY IF EXISTS "rel_charts_delete" ON public.relationship_charts;
CREATE POLICY "rel_charts_select"
  ON public.relationship_charts
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "rel_charts_insert"
  ON public.relationship_charts
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "rel_charts_update"
  ON public.relationship_charts
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "rel_charts_delete"
  ON public.relationship_charts
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their relationship_patterns" ON public.relationship_patterns;
CREATE POLICY "Users own their relationship_patterns"
  ON public.relationship_patterns
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their self_knowledge_profiles" ON public.self_knowledge_profiles;
CREATE POLICY "Users own their self_knowledge_profiles"
  ON public.self_knowledge_profiles
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their somatic_entries" ON public.somatic_entries;
CREATE POLICY "Users own their somatic_entries"
  ON public.somatic_entries
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their trigger_events" ON public.trigger_events;
CREATE POLICY "Users own their trigger_events"
  ON public.trigger_events
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their user_preferences" ON public.user_preferences;
CREATE POLICY "Users own their user_preferences"
  ON public.user_preferences
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their user_profiles" ON public.user_profiles;
CREATE POLICY "Users own their user_profiles"
  ON public.user_profiles
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their insight_signals" ON public.insight_signals;
CREATE POLICY "Users own their insight_signals"
  ON public.insight_signals
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their insight_candidates" ON public.insight_candidates;
CREATE POLICY "Users own their insight_candidates"
  ON public.insight_candidates
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users own their shown_insights" ON public.shown_insights;
CREATE POLICY "Users own their shown_insights"
  ON public.shown_insights
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      candidate_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.insight_candidates candidate
        WHERE candidate.id = candidate_id
          AND candidate.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users own their insight_feedback" ON public.insight_feedback;
CREATE POLICY "Users own their insight_feedback"
  ON public.insight_feedback
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      shown_insight_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.shown_insights shown
        WHERE shown.id = shown_insight_id
          AND shown.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users own their user_insight_memory" ON public.user_insight_memory;
CREATE POLICY "Users own their user_insight_memory"
  ON public.user_insight_memory
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

NOTIFY pgrst, 'reload schema';
