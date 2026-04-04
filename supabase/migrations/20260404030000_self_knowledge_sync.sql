-- ─────────────────────────────────────────────────────────────────────────────
-- Self-knowledge cloud sync tables:
--   daily_reflections, somatic_entries, trigger_events, relationship_patterns
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Daily Reflections (Inner World) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_reflections (
  id            TEXT        PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id   INTEGER     NOT NULL,
  category      TEXT        NOT NULL,          -- 'values' | 'archetypes' | 'cognitive'
  question_text_enc TEXT,                       -- encrypted
  answer_enc    TEXT,                           -- encrypted
  scale_value   SMALLINT,                      -- 0–3 (plain metadata)
  date          DATE        NOT NULL,          -- YYYY-MM-DD
  sealed_at     TIMESTAMPTZ NOT NULL,
  notes_enc     TEXT,                           -- encrypted free-text note
  is_deleted    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_reflections_user_updated
  ON daily_reflections (user_id, updated_at);

ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their daily_reflections"
  ON daily_reflections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Somatic Entries (Body & Nervous System) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS somatic_entries (
  id            TEXT        PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          TIMESTAMPTZ NOT NULL,
  region        TEXT        NOT NULL,
  side          TEXT,                          -- 'front' | 'back'
  emotion_enc   TEXT,                          -- encrypted
  intensity     SMALLINT    NOT NULL,
  is_deleted    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_somatic_entries_user_updated
  ON somatic_entries (user_id, updated_at);

ALTER TABLE somatic_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their somatic_entries"
  ON somatic_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Trigger Events ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trigger_events (
  id            TEXT        PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp     BIGINT      NOT NULL,          -- Unix ms
  mode          TEXT        NOT NULL,          -- 'drain' | 'nourish'
  event_enc     TEXT,                          -- encrypted free-text
  ns_state      TEXT        NOT NULL,          -- 'sympathetic' | 'dorsal' | 'ventral' | 'still'
  sensations_enc TEXT,                         -- encrypted JSON array
  intensity     SMALLINT,
  resolution_enc TEXT,                         -- encrypted
  context_area  TEXT,
  before_state  TEXT,
  is_deleted    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trigger_events_user_updated
  ON trigger_events (user_id, updated_at);

ALTER TABLE trigger_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their trigger_events"
  ON trigger_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Relationship Patterns (Relational Mirror) ───────────────────────────────

CREATE TABLE IF NOT EXISTS relationship_patterns (
  id            TEXT        PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          TIMESTAMPTZ NOT NULL,
  note_enc      TEXT,                          -- encrypted free-text
  tags_enc      TEXT,                          -- encrypted JSON array
  is_deleted    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_relationship_patterns_user_updated
  ON relationship_patterns (user_id, updated_at);

ALTER TABLE relationship_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their relationship_patterns"
  ON relationship_patterns FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
