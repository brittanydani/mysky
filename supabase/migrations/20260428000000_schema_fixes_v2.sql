-- ============================================================================
-- Schema fixes for storage layer compatibility (v2 - ensure applied)
-- ============================================================================

-- ─── sleep_entries: add missing columns ─────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='sleep_entries' AND column_name='hours_slept') THEN
    ALTER TABLE public.sleep_entries ADD COLUMN hours_slept REAL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='sleep_entries' AND column_name='dream') THEN
    ALTER TABLE public.sleep_entries ADD COLUMN dream TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='sleep_entries' AND column_name='dream_text') THEN
    ALTER TABLE public.sleep_entries ADD COLUMN dream_text TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='sleep_entries' AND column_name='dream_feelings') THEN
    ALTER TABLE public.sleep_entries ADD COLUMN dream_feelings TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='sleep_entries' AND column_name='dream_metadata') THEN
    ALTER TABLE public.sleep_entries ADD COLUMN dream_metadata TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='sleep_entries' AND column_name='notes') THEN
    ALTER TABLE public.sleep_entries ADD COLUMN notes TEXT;
  END IF;
END $$;

-- ─── journal_entries: fix type for decimal reading minutes ──────────────────
ALTER TABLE public.journal_entries 
  ALTER COLUMN content_reading_minutes TYPE REAL;

-- ─── daily_check_ins: fix mood_score to accept decimals ─────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema='public' AND table_name='daily_check_ins' AND column_name='mood_score') THEN
    ALTER TABLE public.daily_check_ins ALTER COLUMN mood_score TYPE REAL;
  END IF;
END $$;

-- ─── relationship_charts: add missing partner_name column ───────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' AND table_name='relationship_charts' AND column_name='partner_name') THEN
    ALTER TABLE public.relationship_charts ADD COLUMN partner_name TEXT;
  END IF;
END $$;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
