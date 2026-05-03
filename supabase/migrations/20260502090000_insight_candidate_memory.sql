-- Canonical insight state for the shared insight engine.
--
-- Generated taxonomy and paragraph bodies stay in app code. Supabase stores
-- what happened for this user: extracted signals, candidates, shown paragraph
-- ids/body keys, feedback, and long-term memory.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- insight_signals
-- Raw app records use mixed text/uuid IDs, so source_id is text instead of a
-- foreign key. The source_type/source_id pair points back to the originating
-- journal/check-in/trigger/body/glimmer/relationship/etc. record.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.insight_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  source_type TEXT NOT NULL,
  source_id TEXT,

  anchors TEXT[] NOT NULL DEFAULT '{}',
  signal_types TEXT[] NOT NULL DEFAULT '{}',
  emotional_tags TEXT[] NOT NULL DEFAULT '{}',
  life_areas TEXT[] NOT NULL DEFAULT '{}',

  intensity NUMERIC,
  confidence NUMERIC,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT insight_signals_intensity_range
    CHECK (intensity IS NULL OR (intensity >= 0 AND intensity <= 1)),
  CONSTRAINT insight_signals_confidence_range
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

CREATE INDEX IF NOT EXISTS idx_insight_signals_user_created
  ON public.insight_signals (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insight_signals_user_source
  ON public.insight_signals (user_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_insight_signals_anchors
  ON public.insight_signals USING GIN (anchors);
CREATE INDEX IF NOT EXISTS idx_insight_signals_signal_types
  ON public.insight_signals USING GIN (signal_types);

ALTER TABLE public.insight_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their insight_signals" ON public.insight_signals;
CREATE POLICY "Users own their insight_signals"
  ON public.insight_signals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- insight_candidates
-- Canonical bridge from detected signals to paragraph selection.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.insight_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  major_domain TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  category TEXT NOT NULL,

  theory_lens TEXT[] NOT NULL DEFAULT '{}',

  pattern_type_scores JSONB NOT NULL,
  selected_pattern_type TEXT NOT NULL,

  anchors TEXT[] NOT NULL DEFAULT '{}',
  signal_types TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',

  strength NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,

  allowed_surfaces TEXT[] NOT NULL DEFAULT '{}',
  source_signal_ids UUID[] NOT NULL DEFAULT '{}',

  active_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  active_until TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT insight_candidates_strength_range
    CHECK (strength >= 0 AND strength <= 1),
  CONSTRAINT insight_candidates_confidence_range
    CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT insight_candidates_pattern_scores_object
    CHECK (jsonb_typeof(pattern_type_scores) = 'object'),
  CONSTRAINT insight_candidates_pattern_scores_keys
    CHECK (
      pattern_type_scores ? 'highTracking' AND
      pattern_type_scores ? 'lowAccess' AND
      pattern_type_scores ? 'pushPull' AND
      pattern_type_scores ? 'delayedActivation'
    ),
  CONSTRAINT insight_candidates_selected_pattern_type_valid
    CHECK (selected_pattern_type IN ('highTracking', 'lowAccess', 'pushPull', 'delayedActivation')),
  CONSTRAINT insight_candidates_allowed_surfaces_valid
    CHECK (allowed_surfaces <@ ARRAY['today', 'patterns', 'weeklyDeepDive', 'thisWeek', 'dreamInterpretation']::text[]),
  CONSTRAINT insight_candidates_active_window_valid
    CHECK (active_until IS NULL OR active_until > active_from)
);

CREATE INDEX IF NOT EXISTS idx_insight_candidates_user_active
  ON public.insight_candidates (user_id, active_from DESC)
  WHERE active_until IS NULL;
CREATE INDEX IF NOT EXISTS idx_insight_candidates_user_domain
  ON public.insight_candidates (user_id, major_domain, subcategory, selected_pattern_type);
CREATE INDEX IF NOT EXISTS idx_insight_candidates_surfaces
  ON public.insight_candidates USING GIN (allowed_surfaces);
CREATE INDEX IF NOT EXISTS idx_insight_candidates_anchors
  ON public.insight_candidates USING GIN (anchors);
CREATE INDEX IF NOT EXISTS idx_insight_candidates_signal_ids
  ON public.insight_candidates USING GIN (source_signal_ids);

ALTER TABLE public.insight_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their insight_candidates" ON public.insight_candidates;
CREATE POLICY "Users own their insight_candidates"
  ON public.insight_candidates
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_insight_candidates_updated_at ON public.insight_candidates;
CREATE TRIGGER trg_insight_candidates_updated_at
  BEFORE UPDATE ON public.insight_candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- shown_insights
-- Stores selected app-code paragraph ids/body keys across all visible surfaces.
-- This is the cross-surface de-dupe and variety history.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.shown_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  candidate_id UUID REFERENCES public.insight_candidates(id) ON DELETE SET NULL,

  paragraph_id TEXT NOT NULL,
  paragraph_body_key TEXT NOT NULL,

  major_domain TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  pattern_type TEXT NOT NULL,

  surface TEXT NOT NULL,
  shown_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT shown_insights_pattern_type_valid
    CHECK (pattern_type IN ('highTracking', 'lowAccess', 'pushPull', 'delayedActivation')),
  CONSTRAINT shown_insights_surface_valid
    CHECK (surface IN ('today', 'patterns', 'weeklyDeepDive', 'thisWeek'))
);

CREATE INDEX IF NOT EXISTS idx_shown_insights_user_shown
  ON public.shown_insights (user_id, shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_shown_insights_user_paragraph
  ON public.shown_insights (user_id, paragraph_id, shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_shown_insights_user_body
  ON public.shown_insights (user_id, paragraph_body_key, shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_shown_insights_user_domain
  ON public.shown_insights (user_id, major_domain, subcategory, pattern_type, shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_shown_insights_user_surface
  ON public.shown_insights (user_id, surface, shown_at DESC);

ALTER TABLE public.shown_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their shown_insights" ON public.shown_insights;
CREATE POLICY "Users own their shown_insights"
  ON public.shown_insights
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      candidate_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.insight_candidates candidate
        WHERE candidate.id = candidate_id
          AND candidate.user_id = auth.uid()
      )
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- insight_feedback
-- Product intelligence only: what the user did after an insight appeared.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.insight_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  shown_insight_id UUID REFERENCES public.shown_insights(id) ON DELETE CASCADE,

  action TEXT NOT NULL,
  value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT insight_feedback_action_valid
    CHECK (action IN (
      'saved',
      'dismissed',
      'expanded',
      'journaled',
      'journaledFrom',
      'shared',
      'exported',
      'ignored',
      'helpful',
      'not_helpful',
      'ratedHelpful',
      'ratedNotHelpful'
    )),
  CONSTRAINT insight_feedback_value_range
    CHECK (value IS NULL OR (value >= -1 AND value <= 1))
);

CREATE INDEX IF NOT EXISTS idx_insight_feedback_user_created
  ON public.insight_feedback (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_shown
  ON public.insight_feedback (shown_insight_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_user_action
  ON public.insight_feedback (user_id, action, created_at DESC);

ALTER TABLE public.insight_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their insight_feedback" ON public.insight_feedback;
CREATE POLICY "Users own their insight_feedback"
  ON public.insight_feedback
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      shown_insight_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.shown_insights shown
        WHERE shown.id = shown_insight_id
          AND shown.user_id = auth.uid()
      )
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- user_insight_memory
-- Longitudinal pattern memory for trend detection and narrative continuity.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_insight_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  major_domain TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  pattern_type TEXT NOT NULL,

  current_strength NUMERIC,
  previous_strength NUMERIC,
  trend TEXT,

  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  times_seen INTEGER NOT NULL DEFAULT 0,

  common_anchors TEXT[] NOT NULL DEFAULT '{}',
  common_signal_types TEXT[] NOT NULL DEFAULT '{}',

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_insight_memory_pattern_type_valid
    CHECK (pattern_type IN ('highTracking', 'lowAccess', 'pushPull', 'delayedActivation')),
  CONSTRAINT user_insight_memory_current_strength_range
    CHECK (current_strength IS NULL OR (current_strength >= 0 AND current_strength <= 1)),
  CONSTRAINT user_insight_memory_previous_strength_range
    CHECK (previous_strength IS NULL OR (previous_strength >= 0 AND previous_strength <= 1)),
  CONSTRAINT user_insight_memory_trend_valid
    CHECK (trend IS NULL OR trend IN ('rising', 'softening', 'stable', 'dormant', 'shifting', 'new')),
  CONSTRAINT user_insight_memory_times_seen_nonnegative
    CHECK (times_seen >= 0),
  CONSTRAINT user_insight_memory_seen_window_valid
    CHECK (first_seen_at IS NULL OR last_seen_at IS NULL OR last_seen_at >= first_seen_at),
  CONSTRAINT user_insight_memory_unique_pattern
    UNIQUE (user_id, major_domain, subcategory, pattern_type)
);

CREATE INDEX IF NOT EXISTS idx_user_insight_memory_user_updated
  ON public.user_insight_memory (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_insight_memory_user_trend
  ON public.user_insight_memory (user_id, trend, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_insight_memory_common_anchors
  ON public.user_insight_memory USING GIN (common_anchors);

ALTER TABLE public.user_insight_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their user_insight_memory" ON public.user_insight_memory;
CREATE POLICY "Users own their user_insight_memory"
  ON public.user_insight_memory
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_user_insight_memory_updated_at ON public.user_insight_memory;
CREATE TRIGGER trg_user_insight_memory_updated_at
  BEFORE UPDATE ON public.user_insight_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Keep the account-erasure RPC explicit for these tables. The auth.users
-- delete would cascade, but this mirrors app-side hardDeleteAllData().
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.insight_feedback       WHERE user_id = _uid;
  DELETE FROM public.shown_insights         WHERE user_id = _uid;
  DELETE FROM public.insight_candidates     WHERE user_id = _uid;
  DELETE FROM public.insight_signals        WHERE user_id = _uid;
  DELETE FROM public.user_insight_memory    WHERE user_id = _uid;

  DELETE FROM public.daily_check_ins         WHERE user_id = _uid;
  DELETE FROM public.daily_logs              WHERE user_id = _uid;
  DELETE FROM public.dream_clusters          WHERE user_id = _uid;
  DELETE FROM public.emotional_correlations  WHERE user_id = _uid;
  DELETE FROM public.circadian_rhythm        WHERE user_id = _uid;
  DELETE FROM public.relationship_daily_logs WHERE user_id = _uid;
  DELETE FROM public.weekly_rhythm           WHERE user_id = _uid;
  DELETE FROM public.reflection_rate_limit   WHERE user_id = _uid;
  DELETE FROM public.gemini_rate_limit       WHERE user_id = _uid;
  DELETE FROM public.journal_entries         WHERE user_id = _uid;
  DELETE FROM public.sleep_entries           WHERE user_id = _uid;

  DELETE FROM auth.users WHERE id = _uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

NOTIFY pgrst, 'reload schema';
