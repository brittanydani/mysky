-- 20260313_relationship_daily_logs.sql
-- Relationship resonance table + get_resonance_payload() RPC.
-- Identity is derived exclusively from auth.uid() — no user_id parameter is
-- accepted by the RPC to prevent any cross-user access pattern.
-- SET search_path = '' prevents search-path-based injection.

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.relationship_daily_logs (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date     DATE         NOT NULL DEFAULT current_date,

    -- 0–10 daily resonance inputs, one perspective per partner
    user_state    SMALLINT    NOT NULL CHECK (user_state    BETWEEN 0 AND 10),
    partner_state SMALLINT    NOT NULL CHECK (partner_state BETWEEN 0 AND 10),

    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT relationship_daily_logs_user_date_key UNIQUE (user_id, log_date)
);

-- ─── Index ────────────────────────────────────────────────────────────────────
-- Covering index for the time-window scan inside get_resonance_payload()

CREATE INDEX IF NOT EXISTS idx_relationship_daily_logs_user_log_date
    ON public.relationship_daily_logs (user_id, log_date DESC);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.relationship_daily_logs ENABLE ROW LEVEL SECURITY;

-- Wrapping auth.uid() in (SELECT ...) lets Postgres treat it as a stable
-- sub-select and evaluate it once per query rather than per row.

DROP POLICY IF EXISTS "Users can view their own relationship logs"
    ON public.relationship_daily_logs;
CREATE POLICY "Users can view their own relationship logs"
    ON public.relationship_daily_logs
    FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own relationship logs"
    ON public.relationship_daily_logs;
CREATE POLICY "Users can insert their own relationship logs"
    ON public.relationship_daily_logs
    FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own relationship logs"
    ON public.relationship_daily_logs;
CREATE POLICY "Users can update their own relationship logs"
    ON public.relationship_daily_logs
    FOR UPDATE
    USING     ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own relationship logs"
    ON public.relationship_daily_logs;
CREATE POLICY "Users can delete their own relationship logs"
    ON public.relationship_daily_logs
    FOR DELETE
    USING ((SELECT auth.uid()) = user_id);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_relationship_daily_logs_updated_at
    ON public.relationship_daily_logs;
CREATE TRIGGER trg_relationship_daily_logs_updated_at
    BEFORE UPDATE ON public.relationship_daily_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ─── RPC: get_resonance_payload ───────────────────────────────────────────────
-- Returns the exact payload shape ResonanceStore expects:
--   userData    number[]  – ordered daily user_state values (asc by log_date)
--   partnerData number[]  – ordered daily partner_state values (asc by log_date)
--   insightText string    – one computed summary sentence
--   lastSynced  string    – server timestamp of this call
--
-- No user_id argument: identity comes from auth.uid() only.

CREATE OR REPLACE FUNCTION public.get_resonance_payload(days_back INT DEFAULT 14)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_user_id     UUID    := auth.uid();
    user_series         INT[];
    partner_series      INT[];
    avg_gap             NUMERIC;
    avg_user            NUMERIC;
    avg_partner         NUMERIC;
    strongest_alignment NUMERIC;
    computed_insight    TEXT;
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    WITH filtered_logs AS (
        SELECT
            log_date,
            user_state,
            partner_state,
            ABS(user_state - partner_state) AS gap
        FROM public.relationship_daily_logs
        WHERE user_id  = current_user_id
          AND log_date >= current_date - GREATEST(days_back - 1, 0)
        ORDER BY log_date ASC
    ),
    aggregates AS (
        SELECT
            COALESCE(array_agg(user_state    ORDER BY log_date), '{}'::INT[]) AS user_arr,
            COALESCE(array_agg(partner_state ORDER BY log_date), '{}'::INT[]) AS partner_arr,
            ROUND(AVG(gap)::NUMERIC,                              2)           AS avg_gap_val,
            ROUND(AVG(user_state)::NUMERIC,                       2)           AS avg_user_val,
            ROUND(AVG(partner_state)::NUMERIC,                    2)           AS avg_partner_val,
            ROUND((100 - (AVG(gap) * 10))::NUMERIC,               0)           AS strongest_alignment_val
        FROM filtered_logs
    )
    SELECT
        user_arr,
        partner_arr,
        avg_gap_val,
        avg_user_val,
        avg_partner_val,
        GREATEST(0, LEAST(100, strongest_alignment_val))
    INTO
        user_series,
        partner_series,
        avg_gap,
        avg_user,
        avg_partner,
        strongest_alignment
    FROM aggregates;

    -- Return empty-data payload when the user has no logs yet
    IF COALESCE(array_length(user_series,    1), 0) = 0
    OR COALESCE(array_length(partner_series, 1), 0) = 0
    THEN
        RETURN jsonb_build_object(
            'userData',    '[]'::JSONB,
            'partnerData', '[]'::JSONB,
            'insightText', 'Not enough relationship data yet. Add a few daily check-ins to generate your resonance helix.',
            'lastSynced',  now()
        );
    END IF;

    computed_insight :=
        'You and your partner have shown a '
        || strongest_alignment::TEXT
        || '% resonance trend over the last '
        || days_back::TEXT
        || ' days. Average gap: '
        || COALESCE(avg_gap::TEXT, '0')
        || ' points. Notice the brighter overlap intervals where the two strands move closest together.';

    RETURN jsonb_build_object(
        'userData',    to_jsonb(user_series),
        'partnerData', to_jsonb(partner_series),
        'insightText', computed_insight,
        'lastSynced',  now()
    );
END;
$$;

-- ─── Grant ────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.get_resonance_payload(INT) TO authenticated;
