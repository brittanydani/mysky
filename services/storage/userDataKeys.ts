/**
 * AsyncStorage key registries.
 *
 * All user-scoped keys are now stored as plain JSON in account-scoped
 * AsyncStorage. Security is provided by Supabase Auth + RLS + TLS.
 * The previous client-side AES encryption layer has been removed.
 *
 * ENCRYPTED_ASYNC_USER_DATA_KEYS is kept as an alias for backward
 * compatibility with backup/restore and GDPR export code that still
 * references it — those keys are now plain-text account-scoped values.
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

/**
 * @deprecated Use PLAIN_ASYNC_USER_DATA_KEYS.
 * Kept as an alias so backup/restore and GDPR export code compiles
 * without changes. These keys are no longer encrypted at rest.
 */
export const ENCRYPTED_ASYNC_USER_DATA_KEYS = [
  '@mysky:archetype_profile',
  '@mysky:cognitive_style',
  '@mysky:core_values',
  '@mysky:intelligence_profile',
  'msky_user_name',
] as const;
