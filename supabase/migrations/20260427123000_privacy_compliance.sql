-- Supabase source of truth for privacy consent + lawful basis + privacy audit.
-- Replaces local SecureStore-backed privacy compliance storage.

CREATE TABLE IF NOT EXISTS public.privacy_consent_records (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT false,
  policy_version TEXT NOT NULL DEFAULT '1.0',
  reason TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.privacy_consent_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their privacy_consent_records" ON public.privacy_consent_records;
CREATE POLICY "Users own their privacy_consent_records"
  ON public.privacy_consent_records
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_privacy_consent_records_updated_at ON public.privacy_consent_records;
CREATE TRIGGER trg_privacy_consent_records_updated_at
  BEFORE UPDATE ON public.privacy_consent_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE IF NOT EXISTS public.privacy_policy_versions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  version TEXT NOT NULL DEFAULT '1.0',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.privacy_policy_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their privacy_policy_versions" ON public.privacy_policy_versions;
CREATE POLICY "Users own their privacy_policy_versions"
  ON public.privacy_policy_versions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_privacy_policy_versions_updated_at ON public.privacy_policy_versions;
CREATE TRIGGER trg_privacy_policy_versions_updated_at
  BEFORE UPDATE ON public.privacy_policy_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE IF NOT EXISTS public.lawful_basis_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  policy_version TEXT NOT NULL DEFAULT '1.0',
  lawful_basis TEXT NOT NULL,
  purpose TEXT NOT NULL,
  data_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  processing_activities JSONB NOT NULL DEFAULT '[]'::jsonb,
  retention_period TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lawful_basis_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their lawful_basis_records" ON public.lawful_basis_records;
CREATE POLICY "Users own their lawful_basis_records"
  ON public.lawful_basis_records
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lawful_basis_records_user_timestamp
  ON public.lawful_basis_records (user_id, timestamp DESC);


CREATE TABLE IF NOT EXISTS public.privacy_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.privacy_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their privacy_audit_events" ON public.privacy_audit_events;
CREATE POLICY "Users own their privacy_audit_events"
  ON public.privacy_audit_events
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_privacy_audit_events_user_created
  ON public.privacy_audit_events (user_id, created_at DESC);
