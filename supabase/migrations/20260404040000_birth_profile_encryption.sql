-- ─────────────────────────────────────────────────────────────────────────────
-- Encrypt remote birth-profile payloads server-side and retire plaintext fields
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.birth_profiles
  ADD COLUMN IF NOT EXISTS profile_enc TEXT;

ALTER TABLE public.birth_profiles
  ALTER COLUMN birth_date DROP NOT NULL,
  ALTER COLUMN birth_place DROP NOT NULL,
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;

COMMENT ON COLUMN public.birth_profiles.profile_enc IS
'Server-encrypted JSON payload for sensitive birth-profile fields.';