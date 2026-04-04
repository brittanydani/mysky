-- ─────────────────────────────────────────────────────────────────────────────
-- Birth profile cloud sync table:
--   syncs raw birth data only, not generated chart records or chart UI state
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE IF NOT EXISTS public.birth_profiles (
  id                TEXT        PRIMARY KEY,
  user_id           UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  chart_id          TEXT        NOT NULL,
  name              TEXT,
  birth_date        DATE        NOT NULL,
  birth_time        TIME,
  has_unknown_time  BOOLEAN     NOT NULL DEFAULT FALSE,
  birth_place       TEXT        NOT NULL,
  latitude          DOUBLE PRECISION NOT NULL,
  longitude         DOUBLE PRECISION NOT NULL,
  timezone          TEXT,
  house_system      TEXT,
  is_deleted        BOOLEAN     NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_birth_profiles_user_updated
  ON public.birth_profiles (user_id, updated_at);

ALTER TABLE public.birth_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their birth_profiles" ON public.birth_profiles;
CREATE POLICY "Users own their birth_profiles"
  ON public.birth_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_birth_profiles_updated_at ON public.birth_profiles;
CREATE TRIGGER trg_birth_profiles_updated_at
  BEFORE UPDATE ON public.birth_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();