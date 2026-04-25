-- App settings are user-scoped canonical data.
-- Device storage is only a cache for startup/offline fallback.

CREATE TABLE IF NOT EXISTS public.app_settings (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  id                  TEXT NOT NULL DEFAULT 'default',
  cloud_sync_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  last_sync_at        TIMESTAMPTZ,
  last_backup_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their app_settings" ON public.app_settings;
CREATE POLICY "Users own their app_settings"
  ON public.app_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
