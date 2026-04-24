export const ENCRYPTED_ASYNC_USER_DATA_KEYS = [
  '@mysky:archetype_profile',
  '@mysky:cognitive_style',
  '@mysky:core_values',
  '@mysky:intelligence_profile',
  'msky_user_name',
] as const;

export const PLAIN_ASYNC_USER_DATA_KEYS = [
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
