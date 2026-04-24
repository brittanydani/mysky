-- 20260422000100_relationship_charts.sql
--
-- Historical base migration for relationship charts.
-- Later migrations convert core relationship data to plaintext server storage
-- under the Supabase-canonical architecture.

CREATE TABLE IF NOT EXISTS public.relationship_charts (
    id                  TEXT        PRIMARY KEY,
    user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name_enc            TEXT        NOT NULL,
    relationship        TEXT        NOT NULL,
    birth_date_enc      TEXT        NOT NULL,
    birth_time_enc      TEXT,
    has_unknown_time    BOOLEAN     NOT NULL DEFAULT FALSE,
    birth_place_enc     TEXT        NOT NULL,
    latitude_enc        TEXT        NOT NULL,
    longitude_enc       TEXT        NOT NULL,
    timezone            TEXT,
    user_chart_id       TEXT        NOT NULL,
    is_deleted          BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_relationship_charts_user
    ON public.relationship_charts (user_id, user_chart_id);
CREATE INDEX IF NOT EXISTS idx_relationship_charts_updated
    ON public.relationship_charts (user_id, updated_at DESC);

ALTER TABLE public.relationship_charts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rel_charts_select" ON public.relationship_charts;
DROP POLICY IF EXISTS "rel_charts_insert" ON public.relationship_charts;
DROP POLICY IF EXISTS "rel_charts_update" ON public.relationship_charts;
DROP POLICY IF EXISTS "rel_charts_delete" ON public.relationship_charts;

CREATE POLICY "rel_charts_select" ON public.relationship_charts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rel_charts_insert" ON public.relationship_charts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rel_charts_update" ON public.relationship_charts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rel_charts_delete" ON public.relationship_charts FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_relationship_charts_updated_at ON public.relationship_charts;
CREATE TRIGGER trg_relationship_charts_updated_at
    BEFORE UPDATE ON public.relationship_charts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
