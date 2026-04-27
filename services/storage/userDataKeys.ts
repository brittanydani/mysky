/**
 * Legacy local key registries.
 *
 * All user-scoped keys are stored as plain JSON in account-scoped
 * Legacy local storage. Security is provided by Supabase Auth + RLS + TLS.
 */

export const PLAIN_ASYNC_USER_DATA_KEYS = [
  '@mysky:archetype_profile',
  '@mysky:cognitive_style',
  '@mysky:core_values',
  '@mysky:intelligence_profile',
  'msky_user_name',
  'mysky_custom_journal_tags',
  '@mysky:cache:daily_reflections',
  '@mysky:cache:daily_reflection_drafts',
  '@mysky:cache:pending_reflection_questions',
  '@mysky:cache:somatic_entries',
  '@mysky:cache:trigger_events',
  '@mysky:cache:relationship_patterns',
  '@mysky:relationship_pattern_custom_tags',
  '@mysky:trigger_custom_areas',
  '@mysky:trigger_custom_sensations',
] as const;
