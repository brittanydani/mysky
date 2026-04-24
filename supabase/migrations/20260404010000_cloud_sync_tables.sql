-- 20260404_cloud_sync_tables.sql
--
-- Historical migration from the earlier encrypted/offline-first architecture.
-- Core app content now uses plaintext server columns with Supabase as the
-- canonical store. Legacy encrypted columns created here were retained only
-- temporarily for transition and are superseded by later migrations.

-- ─── set_updated_at helper (idempotent) ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- journal_entries
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id                      TEXT        PRIMARY KEY,
    user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date                    DATE        NOT NULL,
    mood                    TEXT        NOT NULL,   -- plaintext label (calm/soft/okay/heavy/stormy)
    moon_phase              TEXT        NOT NULL,   -- plaintext (new/waxing/full/waning)
    -- All text fields below are AES-256-GCM encrypted blobs (ENC2:iv:ct)
    title_enc               TEXT,
    content_enc             TEXT        NOT NULL,
    content_keywords_enc    TEXT,
    content_emotions_enc    TEXT,
    content_sentiment_enc   TEXT,
    tags                    TEXT,                   -- JSON array of strings (plaintext, not PII)
    content_word_count      INTEGER,
    content_reading_minutes INTEGER,
    chart_id                TEXT,                   -- local chart UUID reference
    transit_snapshot        TEXT,                   -- non-PII astrological JSON
    is_deleted              BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL,
    updated_at              TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date
    ON public.journal_entries (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_updated
    ON public.journal_entries (user_id, updated_at DESC);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_select"  ON public.journal_entries;
DROP POLICY IF EXISTS "journal_insert"  ON public.journal_entries;
DROP POLICY IF EXISTS "journal_update"  ON public.journal_entries;
DROP POLICY IF EXISTS "journal_delete"  ON public.journal_entries;

CREATE POLICY "journal_select" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "journal_insert" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_update" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_delete" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_journal_entries_updated_at ON public.journal_entries;
CREATE TRIGGER trg_journal_entries_updated_at
    BEFORE UPDATE ON public.journal_entries
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- sleep_entries
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.sleep_entries (
    id                  TEXT        PRIMARY KEY,
    user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chart_id            TEXT        NOT NULL,
    date                DATE        NOT NULL,
    duration_hours      REAL,
    quality             SMALLINT,
    dream_text_enc      TEXT,       -- AES-256-GCM encrypted
    dream_mood          TEXT,
    dream_feelings_enc  TEXT,       -- AES-256-GCM encrypted JSON
    dream_metadata_enc  TEXT,       -- AES-256-GCM encrypted JSON
    notes_enc           TEXT,       -- AES-256-GCM encrypted
    is_deleted          BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sleep_entries_user_date
    ON public.sleep_entries (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_entries_user_updated
    ON public.sleep_entries (user_id, updated_at DESC);

ALTER TABLE public.sleep_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sleep_select" ON public.sleep_entries;
DROP POLICY IF EXISTS "sleep_insert" ON public.sleep_entries;
DROP POLICY IF EXISTS "sleep_update" ON public.sleep_entries;
DROP POLICY IF EXISTS "sleep_delete" ON public.sleep_entries;

CREATE POLICY "sleep_select" ON public.sleep_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sleep_insert" ON public.sleep_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sleep_update" ON public.sleep_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sleep_delete" ON public.sleep_entries FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_sleep_entries_updated_at ON public.sleep_entries;
CREATE TRIGGER trg_sleep_entries_updated_at
    BEFORE UPDATE ON public.sleep_entries
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- daily_check_ins — extend existing table with full field set
-- ════════════════════════════════════════════════════════════════════════════
-- The 20260313 migration created a minimal check-ins table (mood_value only).
-- Add the full encrypted field set to support offline-first sync.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='chart_id') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN chart_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='time_of_day') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN time_of_day TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='energy_level_enc') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN energy_level_enc TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='stress_level_enc') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN stress_level_enc TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='mood_score_enc') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN mood_score_enc TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='tags_enc') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN tags_enc TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='note_enc') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN note_enc TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='wins_enc') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN wins_enc TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='challenges_enc') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN challenges_enc TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='moon_sign') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN moon_sign TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='moon_house') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN moon_house SMALLINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='sun_house') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN sun_house SMALLINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='transit_events') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN transit_events JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='lunar_phase') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN lunar_phase TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='retrogrades') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN retrogrades JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='is_deleted') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='deleted_at') THEN
        ALTER TABLE public.daily_check_ins ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Drop the old unique constraint that only covered (user_id, log_date)
-- and replace with one that also covers time_of_day so multiple check-ins
-- per day are supported.
ALTER TABLE public.daily_check_ins
    DROP CONSTRAINT IF EXISTS daily_check_ins_user_date_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'daily_check_ins_user_date_time_key'
    ) THEN
        ALTER TABLE public.daily_check_ins
            ADD CONSTRAINT daily_check_ins_user_date_time_key
            UNIQUE (user_id, log_date, time_of_day);
    END IF;
END $$;
