-- RLS Policies Audit & Verification
-- Run through Supabase migrations or the SQL editor before TestFlight.

ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.birth_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.insight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sleep_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
    CREATE POLICY "Users can view own profile"
      ON public.user_profiles FOR SELECT
      USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can edit own profile" ON public.user_profiles;
    CREATE POLICY "Users can edit own profile"
      ON public.user_profiles FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
    CREATE POLICY "Users can insert own profile"
      ON public.user_profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF to_regclass('public.birth_profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can view own birth profile" ON public.birth_profiles;
    CREATE POLICY "Users can view own birth profile"
      ON public.birth_profiles FOR SELECT
      USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can modify own birth profile" ON public.birth_profiles;
    CREATE POLICY "Users can modify own birth profile"
      ON public.birth_profiles FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert own birth profile" ON public.birth_profiles;
    CREATE POLICY "Users can insert own birth profile"
      ON public.birth_profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF to_regclass('public.journal_entries') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can view own journal entries" ON public.journal_entries;
    CREATE POLICY "Users can view own journal entries"
      ON public.journal_entries FOR SELECT
      USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can modify own journal entries" ON public.journal_entries;
    CREATE POLICY "Users can modify own journal entries"
      ON public.journal_entries FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert own journal entries" ON public.journal_entries;
    CREATE POLICY "Users can insert own journal entries"
      ON public.journal_entries FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete own journal entries" ON public.journal_entries;
    CREATE POLICY "Users can delete own journal entries"
      ON public.journal_entries FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Verification queries:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'birth_profiles',
    'journal_entries',
    'daily_check_ins',
    'insight_history',
    'sleep_entries',
    'app_settings'
  )
ORDER BY tablename;

SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'birth_profiles',
    'journal_entries',
    'daily_check_ins',
    'insight_history',
    'sleep_entries',
    'app_settings'
  )
ORDER BY tablename, policyname;
