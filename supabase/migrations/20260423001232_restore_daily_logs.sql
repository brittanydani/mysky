-- Restore missing public.daily_logs table in remote environments.
-- Repair migration only. Do not reintroduce the old RPC here because a later
-- migration replaced it.

CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    log_date DATE GENERATED ALWAYS AS ((created_at AT TIME ZONE 'utc')::DATE) STORED,
    stress SMALLINT CHECK (stress >= 0 AND stress <= 10),
    anxiety SMALLINT CHECK (anxiety >= 0 AND anxiety <= 10),
    dream_symbols TEXT[] DEFAULT '{}',
    CONSTRAINT daily_logs_user_log_date_key UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_logs_user_date
    ON public.daily_logs (user_id, created_at DESC);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'daily_logs'
          AND policyname = 'Users control their own logs'
    ) THEN
        CREATE POLICY "Users control their own logs"
            ON public.daily_logs
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;