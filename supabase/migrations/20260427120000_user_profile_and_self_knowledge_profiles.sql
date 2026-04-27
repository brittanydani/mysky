-- Supabase is the source of truth for MySky profile/self-knowledge data.
-- Local storage may only cache server results.

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their user_profiles" ON public.user_profiles;
CREATE POLICY "Users own their user_profiles"
  ON public.user_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE IF NOT EXISTS public.self_knowledge_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_type)
);

ALTER TABLE public.self_knowledge_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their self_knowledge_profiles" ON public.self_knowledge_profiles;
CREATE POLICY "Users own their self_knowledge_profiles"
  ON public.self_knowledge_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_self_knowledge_profiles_updated_at ON public.self_knowledge_profiles;
CREATE TRIGGER trg_self_knowledge_profiles_updated_at
  BEFORE UPDATE ON public.self_knowledge_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, preference_key)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their user_preferences" ON public.user_preferences;
CREATE POLICY "Users own their user_preferences"
  ON public.user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
