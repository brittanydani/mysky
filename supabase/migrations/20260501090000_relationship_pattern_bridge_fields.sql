-- 20260501090000_relationship_pattern_bridge_fields.sql
--
-- Add Relational Mirror bridge metadata for emotional activation, needs,
-- and nervous-state movement.

ALTER TABLE public.relationship_patterns
  ADD COLUMN IF NOT EXISTS activated_emotions JSONB,
  ADD COLUMN IF NOT EXISTS needs JSONB,
  ADD COLUMN IF NOT EXISTS state_before TEXT,
  ADD COLUMN IF NOT EXISTS state_after TEXT;
