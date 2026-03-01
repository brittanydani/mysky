-- 20260228_dream_engine_schema.sql
-- Supabase schema for:
-- - Dream entries + parsed signals + engine output + rendered cards
-- - User feedback loop (thumbs up/down per card + optional per-theme)
-- - Adaptive weighting + personalization over time
--
-- Assumes you already have auth.users and (optionally) a public.profiles table.
-- This migration is idempotent-ish: uses IF NOT EXISTS where possible.

-- Enable extensions you might already have
create extension if not exists pgcrypto;

-- -------------------------------
-- 1) Core tables
-- -------------------------------

create table if not exists public.dream_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  occurred_at timestamptz not null default now(),
  title text,
  dream_text text not null,

  -- optional quick user inputs
  lucidity_level smallint, -- 0..5
  nightmare boolean default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dream_entries_user_id_idx on public.dream_entries(user_id);
create index if not exists dream_entries_occurred_at_idx on public.dream_entries(occurred_at);

-- Feelings selected for a dream (from your dropdown)
create table if not exists public.dream_selected_feelings (
  id uuid primary key default gen_random_uuid(),
  dream_id uuid not null references public.dream_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  feeling text not null,
  intensity smallint not null check (intensity between 0 and 5),

  created_at timestamptz not null default now()
);

create index if not exists dream_selected_feelings_dream_id_idx on public.dream_selected_feelings(dream_id);

-- Deterministic text extraction output (store raw for audit/UX)
create table if not exists public.dream_text_signals (
  dream_id uuid primary key references public.dream_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  coverage real not null check (coverage between 0 and 1),
  triggers jsonb not null default '{}'::jsonb,   -- { trigger: score 0..1 }
  evidence jsonb not null default '{}'::jsonb,   -- { trigger: EvidenceHit[] }
  meta jsonb not null default '{}'::jsonb,       -- { charCount, sentenceCount, ... }

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Engine output (top themes, dominant profiles, confidence, flags)
create table if not exists public.dream_engine_results (
  dream_id uuid primary key references public.dream_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Store full engine payload for debuggability + re-rendering
  engine jsonb not null,              -- EngineOutput
  top_themes jsonb not null,           -- Array<{trigger, score, evidence...}>
  dominant jsonb not null,             -- dominant profiles
  confidence jsonb not null,           -- {score, level, reasons}
  flags jsonb not null,                -- {ambivalence, recurring, caution...}

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rendered cards that the UI showed the user
create table if not exists public.dream_rendered_cards (
  id uuid primary key default gen_random_uuid(),
  dream_id uuid not null references public.dream_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- ThemeCard + renderer output pieces (store both for flexibility)
  card_id text not null,             -- ThemeDefinition id (stable)
  title text not null,
  score real not null check (score between 0 and 1),

  what_it_may_reflect text not null,
  reflection_question text not null,
  integration_prompt text,

  -- Evidence snippets shown to user
  evidence_snippets text[] not null default '{}',

  -- Matched triggers used for this card
  matched_triggers jsonb not null default '[]'::jsonb, -- Array<{trigger, score}>
  nervous_boost jsonb,
  attachment_boost jsonb,

  created_at timestamptz not null default now()
);

create index if not exists dream_rendered_cards_dream_id_idx on public.dream_rendered_cards(dream_id);
create index if not exists dream_rendered_cards_user_id_idx on public.dream_rendered_cards(user_id);

-- -------------------------------
-- 2) Feedback loop
-- -------------------------------

-- User feedback on each card (thumbs)
create table if not exists public.dream_card_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dream_id uuid not null references public.dream_entries(id) on delete cascade,
  rendered_card_id uuid not null references public.dream_rendered_cards(id) on delete cascade,

  -- -1 = thumbs down, 0 = neutral/cleared, +1 = thumbs up
  rating smallint not null check (rating in (-1, 0, 1)),

  -- optional: reason tags to sharpen learning (user-selectable chips)
  reason_tags text[] not null default '{}', -- e.g. ["not_me","too_vague","felt_true","helpful_prompt"]

  -- optional: free text
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, rendered_card_id)
);

create index if not exists dream_card_feedback_user_id_idx on public.dream_card_feedback(user_id);
create index if not exists dream_card_feedback_dream_id_idx on public.dream_card_feedback(dream_id);

-- -------------------------------
-- 3) Adaptive user model
-- -------------------------------

-- Stores personalized weights and per-trigger adjustments learned over time.
create table if not exists public.user_dream_model (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- engine blend weights (feelings/text/checkIn/history/personality)
  engine_weights jsonb not null default jsonb_build_object(
    'feelings', 0.60,
    'text', 0.20,
    'checkIn', 0.10,
    'history', 0.07,
    'personality', 0.03
  ),

  -- per-trigger bias multiplier (1.0 = neutral). Range stored as float.
  -- Example: { "shame": 1.15, "belonging": 0.92 }
  trigger_multipliers jsonb not null default '{}'::jsonb,

  -- per-theme/card preference multiplier (1.0 = neutral)
  theme_multipliers jsonb not null default '{}'::jsonb,

  -- learning stats
  feedback_count integer not null default 0,
  last_feedback_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Immutable log of learning updates (for audit + debugging)
create table if not exists public.user_dream_model_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dream_id uuid references public.dream_entries(id) on delete set null,
  feedback_id uuid references public.dream_card_feedback(id) on delete set null,

  -- snapshot of deltas applied
  delta_engine_weights jsonb not null default '{}'::jsonb,
  delta_trigger_multipliers jsonb not null default '{}'::jsonb,
  delta_theme_multipliers jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists user_dream_model_updates_user_id_idx on public.user_dream_model_updates(user_id);

-- -------------------------------
-- 4) Timestamps
-- -------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_dream_entries_updated on public.dream_entries;
create trigger trg_dream_entries_updated
before update on public.dream_entries
for each row execute function public.set_updated_at();

drop trigger if exists trg_dream_text_signals_updated on public.dream_text_signals;
create trigger trg_dream_text_signals_updated
before update on public.dream_text_signals
for each row execute function public.set_updated_at();

drop trigger if exists trg_dream_engine_results_updated on public.dream_engine_results;
create trigger trg_dream_engine_results_updated
before update on public.dream_engine_results
for each row execute function public.set_updated_at();

drop trigger if exists trg_dream_card_feedback_updated on public.dream_card_feedback;
create trigger trg_dream_card_feedback_updated
before update on public.dream_card_feedback
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_dream_model_updated on public.user_dream_model;
create trigger trg_user_dream_model_updated
before update on public.user_dream_model
for each row execute function public.set_updated_at();

-- -------------------------------
-- 5) Row Level Security (RLS)
-- -------------------------------
alter table public.dream_entries enable row level security;
alter table public.dream_selected_feelings enable row level security;
alter table public.dream_text_signals enable row level security;
alter table public.dream_engine_results enable row level security;
alter table public.dream_rendered_cards enable row level security;
alter table public.dream_card_feedback enable row level security;
alter table public.user_dream_model enable row level security;
alter table public.user_dream_model_updates enable row level security;

-- Ownership policies: user can CRUD their own rows
create policy "dream_entries_own" on public.dream_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "dream_selected_feelings_own" on public.dream_selected_feelings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "dream_text_signals_own" on public.dream_text_signals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "dream_engine_results_own" on public.dream_engine_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "dream_rendered_cards_own" on public.dream_rendered_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "dream_card_feedback_own" on public.dream_card_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_dream_model_own" on public.user_dream_model
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_dream_model_updates_own" on public.user_dream_model_updates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------
-- 6) Helper RPC: ensure user model exists
-- -------------------------------
create or replace function public.ensure_user_dream_model()
returns public.user_dream_model
language plpgsql
security definer
set search_path = public
as $$
declare m public.user_dream_model;
begin
  insert into public.user_dream_model (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select * into m from public.user_dream_model where user_id = auth.uid();
  return m;
end;
$$;

revoke all on function public.ensure_user_dream_model() from public;
grant execute on function public.ensure_user_dream_model() to authenticated;
