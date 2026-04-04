-- 20260312_daily_logs.sql
-- Lightweight stress/anxiety/dream-symbol log table for the Dream Cluster Map.
-- One row per user per day (enforced via the generated log_date column).

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_logs (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Generated column: strips time component so the UNIQUE constraint below
    -- cleanly enforces one log per UTC calendar day without application logic.
    log_date   DATE GENERATED ALWAYS AS ((created_at AT TIME ZONE 'utc')::DATE) STORED,

    stress       SMALLINT CHECK (stress  >= 0 AND stress  <= 10),
    anxiety      SMALLINT CHECK (anxiety >= 0 AND anxiety <= 10),
    dream_symbols TEXT[] DEFAULT '{}',

    CONSTRAINT daily_logs_user_log_date_key UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_logs_user_date
    ON public.daily_logs (user_id, created_at DESC);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users control their own logs"
    ON public.daily_logs FOR ALL
    USING     (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ─── RPC: get_dream_cluster_data ──────────────────────────────────────────────
-- Returns pre-aggregated, pre-colored node and link data for the 3D cluster map.
-- Identity is derived exclusively from auth.uid() — no user_id parameter.
-- SET search_path = '' prevents search-path-based injection attacks.

CREATE OR REPLACE FUNCTION public.get_dream_cluster_data(days_back INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_user_id UUID := auth.uid();
    nodes_json      JSONB;
    links_json      JSONB;
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- ── Nodes: aggregate symbol stats and derive colour from emotional data ──
    WITH unnested AS (
        SELECT id, stress, anxiety, UNNEST(dream_symbols) AS symbol
        FROM public.daily_logs
        WHERE user_id    = current_user_id
          AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    node_stats AS (
        SELECT
            symbol                     AS id,
            INITCAP(symbol)            AS label,
            COUNT(*)                   AS recurrence_count,
            ROUND(AVG(stress),  1)     AS avg_stress,
            ROUND(AVG(anxiety), 1)     AS avg_anxiety
        FROM unnested
        GROUP BY symbol
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id',             id,
            'label',          label,
            -- Size capped at 2.0 to keep spheres within camera frustum
            'size',           LEAST(0.5 + (recurrence_count * 0.1), 2.0),
            'recurrenceCount', recurrence_count,
            -- Hex colour derived from emotional signal rather than stored
            'color', CASE
                WHEN avg_anxiety > 7  THEN '#ff003c'  -- High anxiety → red
                WHEN avg_stress  > 6  THEN '#ffcc00'  -- High stress  → gold
                WHEN avg_stress  < 4  THEN '#00ffff'  -- Calm         → cyan
                ELSE                       '#bc13fe'  -- Mixed        → violet
             END,
            'detail', 'Appeared ' || recurrence_count || ' time(s). Avg stress: ' || avg_stress || '/10.'
        )
    ) INTO nodes_json
    FROM node_stats;

    -- ── Links: co-occurrence within same log; strength capped 1–5 ────────────
    WITH unnested AS (
        SELECT id, UNNEST(dream_symbols) AS symbol
        FROM public.daily_logs
        WHERE user_id    = current_user_id
          AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'source',   t1.symbol,
            'target',   t2.symbol,
            -- Cap Hooke's spring strength to prevent physics instability
            'strength', LEAST(5, GREATEST(1, COUNT(*)))
        )
    ) INTO links_json
    FROM unnested t1
    JOIN unnested t2
      ON t1.id = t2.id AND t1.symbol < t2.symbol
    GROUP BY t1.symbol, t2.symbol
    HAVING COUNT(*) > 1;

    RETURN jsonb_build_object(
        'nodes', COALESCE(nodes_json, '[]'::JSONB),
        'links', COALESCE(links_json, '[]'::JSONB)
    );
END;
$$;
