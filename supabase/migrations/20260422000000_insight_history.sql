-- 20260422000000_insight_history.sql
--
-- Historical base migration for insight history.
-- Later migrations convert this table to plaintext server storage for the
-- Supabase-canonical architecture.

CREATE TABLE IF NOT EXISTS public.insight_history (
    id                  TEXT        PRIMARY KEY,
    user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date                DATE        NOT NULL,
    chart_id            TEXT        NOT NULL,

    -- Guidance content (encrypted client-side)
    greeting_enc        TEXT        NOT NULL,
    love_headline_enc   TEXT        NOT NULL,
    love_message_enc    TEXT        NOT NULL,
    energy_headline_enc TEXT        NOT NULL,
    energy_message_enc  TEXT        NOT NULL,
    growth_headline_enc TEXT        NOT NULL,
    growth_message_enc  TEXT        NOT NULL,
    gentle_reminder_enc TEXT        NOT NULL,
    journal_prompt_enc  TEXT        NOT NULL,

    -- Cosmic context (plaintext, no PII)
    moon_sign           TEXT,
    moon_phase          TEXT,

    -- Transparency signals (JSON, encrypted)
    signals_enc         TEXT,

    -- User interaction
    is_favorite         BOOLEAN     NOT NULL DEFAULT FALSE,
    viewed_at           TIMESTAMPTZ,

    is_deleted          BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL,

    CONSTRAINT insight_history_user_date_chart_key UNIQUE (user_id, date, chart_id)
);

CREATE INDEX IF NOT EXISTS idx_insight_history_user_date
    ON public.insight_history (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_insight_history_user_chart
    ON public.insight_history (user_id, chart_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_insight_history_user_updated
    ON public.insight_history (user_id, updated_at DESC);

ALTER TABLE public.insight_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insight_history_select" ON public.insight_history;
DROP POLICY IF EXISTS "insight_history_insert" ON public.insight_history;
DROP POLICY IF EXISTS "insight_history_update" ON public.insight_history;
DROP POLICY IF EXISTS "insight_history_delete" ON public.insight_history;

CREATE POLICY "insight_history_select" ON public.insight_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insight_history_insert" ON public.insight_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insight_history_update" ON public.insight_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insight_history_delete" ON public.insight_history FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_insight_history_updated_at ON public.insight_history;
CREATE TRIGGER trg_insight_history_updated_at
    BEFORE UPDATE ON public.insight_history
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
