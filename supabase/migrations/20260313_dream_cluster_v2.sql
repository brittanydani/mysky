-- 20260313_dream_cluster_v2.sql
-- Replaces the get_dream_cluster_data() function from 20260312_daily_logs.sql.
--
-- Changes from v1:
--   • Adds `lastSynced` to the returned payload (aligns with ResonanceStore pattern).
--   • Normalises symbols (lower + trim) before aggregation to prevent duplicates.
--   • Uses DISTINCT per log before pairing so repeated symbols in the same entry
--     do not artificially inflate co-occurrence counts.
--   • Bounds node size to 0.55–1.8 and link strength to 0.45–3.0 for
--     stable physics rendering.
--   • Returns `coOccurrenceCount` on links (clients can ignore extra fields).
--   • Richer detail text (recurrence count + avg stress + avg anxiety).
--   • Filters by log_date (the stored generated column) instead of created_at
--     for cleaner date arithmetic against the existing schema.
--
-- This is a CREATE OR REPLACE — it is safe to re-run on any environment.

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

    -- ── Nodes: one row per normalised symbol ─────────────────────────────────
    --
    -- We unnest each day's dream_symbols array, normalise (lower + trim),
    -- then aggregate stress/anxiety across all appearances to derive colour
    -- and build a detail sentence.

    WITH filtered_logs AS (
        SELECT
            id,
            log_date,
            COALESCE(stress,  0) AS stress,
            COALESCE(anxiety, 0) AS anxiety,
            dream_symbols
        FROM public.daily_logs
        WHERE user_id  = current_user_id
          AND log_date >= current_date - GREATEST(days_back - 1, 0)
          AND COALESCE(array_length(dream_symbols, 1), 0) > 0
    ),
    unnested AS (
        SELECT
            fl.id,
            fl.log_date,
            fl.stress,
            fl.anxiety,
            LOWER(TRIM(sym)) AS symbol
        FROM filtered_logs fl,
        LATERAL UNNEST(fl.dream_symbols) AS sym
        WHERE TRIM(sym) <> ''
    ),
    node_stats AS (
        SELECT
            symbol                                                        AS id,
            INITCAP(REPLACE(symbol, '_', ' '))                           AS label,
            COUNT(*)::INT                                                 AS recurrence_count,
            ROUND(AVG(stress)::NUMERIC,  1)                              AS avg_stress,
            ROUND(AVG(anxiety)::NUMERIC, 1)                              AS avg_anxiety,
            -- Size bounded to keep spheres within camera frustum
            GREATEST(0.55, LEAST(1.8, 0.55 + COUNT(*) * 0.12))::NUMERIC AS size,
            CASE
                WHEN AVG(stress) >= 7 OR AVG(anxiety) >= 7 THEN '#FF5C7A'
                WHEN AVG(stress) >= 5 OR AVG(anxiety) >= 5 THEN '#FFD166'
                WHEN AVG(stress) <= 3 AND AVG(anxiety) <= 3 THEN '#5EF2FF'
                ELSE                                              '#B77CFF'
            END AS color,
            -- Detail: count branch + stress + anxiety summary
            CASE
                WHEN COUNT(*) = 1 THEN
                    INITCAP(REPLACE(symbol, '_', ' ')) || ' appeared once recently.'
                ELSE
                    INITCAP(REPLACE(symbol, '_', ' ')) || ' has recurred ' || COUNT(*) || ' times recently.'
            END
            || ' Average stress: '  || ROUND(AVG(stress)::NUMERIC,  1) || '/10.'
            || ' Average anxiety: ' || ROUND(AVG(anxiety)::NUMERIC, 1) || '/10.' AS detail
        FROM unnested
        GROUP BY symbol
        HAVING COUNT(*) >= 1
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id',              id,
                'label',           label,
                'color',           color,
                'size',            size,
                'recurrenceCount', recurrence_count,
                'detail',          detail
            )
            ORDER BY recurrence_count DESC, id ASC
        ),
        '[]'::JSONB
    )
    INTO nodes_json
    FROM node_stats;

    -- ── Links: symbol co-occurrence within the same daily log ─────────────────
    --
    -- We use DISTINCT per log before self-joining so each (log, symbol) pair
    -- is counted once even if a symbol appears multiple times in one entry's
    -- dream_symbols array (defensive normalisation).

    WITH filtered_logs AS (
        SELECT id, dream_symbols
        FROM public.daily_logs
        WHERE user_id  = current_user_id
          AND log_date >= current_date - GREATEST(days_back - 1, 0)
          AND COALESCE(array_length(dream_symbols, 1), 0) > 0
    ),
    normalised AS (
        SELECT
            fl.id,
            LOWER(TRIM(sym)) AS symbol
        FROM filtered_logs fl,
        LATERAL UNNEST(fl.dream_symbols) AS sym
        WHERE TRIM(sym) <> ''
    ),
    distinct_per_log AS (
        SELECT DISTINCT id, symbol
        FROM normalised
    ),
    pair_counts AS (
        SELECT
            a.symbol               AS source,
            b.symbol               AS target,
            COUNT(*)::INT          AS co_occurrence_count
        FROM distinct_per_log a
        JOIN distinct_per_log b
          ON a.id     = b.id
         AND a.symbol < b.symbol
        GROUP BY a.symbol, b.symbol
        HAVING COUNT(*) >= 2
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'source',            source,
                'target',            target,
                -- Strength bounded to keep physics simulation stable
                'strength',          GREATEST(0.45, LEAST(3.0, 0.45 + co_occurrence_count * 0.35))::NUMERIC,
                'coOccurrenceCount', co_occurrence_count
            )
            ORDER BY co_occurrence_count DESC, source ASC, target ASC
        ),
        '[]'::JSONB
    )
    INTO links_json
    FROM pair_counts;

    RETURN jsonb_build_object(
        'nodes',      COALESCE(nodes_json, '[]'::JSONB),
        'links',      COALESCE(links_json, '[]'::JSONB),
        'lastSynced', now()
    );
END;
$$;

-- ─── Grant ────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.get_dream_cluster_data(INT) TO authenticated;
