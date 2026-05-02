import type { SignalKey, SignalRole, SignalSentiment } from './types';

const FEELING_STATE_SIGNALS = new Set<SignalKey>([
  'anger',
  'contentment',
  'emotional_heaviness',
  'emotional_intensity',
  'emotional_softening',
  'energized',
  'grief',
  'grief_returns',
  'guilt',
  'hidden_emotional_variability',
  'hope',
  'hurt',
  'internal_feeling_external_function',
  'loneliness',
  'longing',
  'low_mood',
  'mixed_emotions',
  'mood_drop',
  'mood_improvement',
  'quiet_emotional_change',
  'relief',
  'sadness',
  'scattered_attention',
  'shame',
  'steady_not_unaffected',
  'steady_not_unaffected_inner',
  'unseen_deep_landing',
  'vulnerability',
]);

const NEGATIVE_FEELING_SIGNALS = new Set<SignalKey>([
  'anger',
  'emotional_heaviness',
  'grief',
  'grief_returns',
  'guilt',
  'hurt',
  'loneliness',
  'low_mood',
  'mood_drop',
  'sadness',
  'scattered_attention',
  'shame',
  'self_blame',
  'unseen_deep_landing',
]);

const POSITIVE_FEELING_SIGNALS = new Set<SignalKey>([
  'emotional_softening',
  'contentment',
  'energized',
  'confidence',
  'hope',
  'mood_improvement',
  'relief',
  'safe',
]);

const RECOVERY_LEVER_SIGNALS = new Set<SignalKey>([
  'baseline_recovery',
  'body_lightness',
  'body_mind_rest',
  'bounded_rest_return',
  'care_before_owed',
  'care_strengthens_not_takes_over',
  'collaborative_not_rescuing',
  'connection_glimmer',
  'easy_rest',
  'familiar_calm',
  'glimmer_softening',
  'ordinary_downtime',
  'quiet_safety',
  'receiving_openness',
  'rest_as_care',
  'rest_without_guilt',
  'restorative_moment',
  'restorative_pause',
  'small_relief_signals_change',
  'support_abundance_shift',
  'support_without_dependence',
  'unbraced_stillness',
]);

const BODY_SIGNAL_KEYWORDS = [
  'body',
  'chest',
  'gut',
  'jaw',
  'nausea',
  'physical',
  'shoulder',
  'somatic',
  'sensation',
  'sensory',
  'stomach',
  'throat',
  'tension',
];

const RELATIONAL_KEYWORDS = [
  'belonging',
  'care',
  'closeness',
  'communication',
  'connection',
  'conversation',
  'family',
  'home',
  'relational',
  'relationship',
  'repair',
  'reassurance',
  'support',
  'tone',
  'trust',
];

const PROTECTIVE_KEYWORDS = [
  'autonomy',
  'avoid',
  'boundary',
  'bracing',
  'defensive',
  'distance',
  'guard',
  'limit',
  'no',
  'protection',
  'safe',
  'silence',
  'vulnerability',
  'safety',
  'self_trust',
];

const COGNITIVE_KEYWORDS = [
  'analysis',
  'attention',
  'clarity',
  'closure',
  'cognitive',
  'decision',
  'explain',
  'insight',
  'meaning',
  'overthinking',
  'pattern',
  'processing',
  'resolution',
  'understand',
  'unfinished',
];

const VALUE_KEYWORDS = [
  'fairness',
  'integrity',
  'justice',
  'truth',
  'value',
];

const RESOURCE_KEYWORDS = [
  'abundance',
  'capacity',
  'energy',
  'load',
  'money',
  'resource',
  'responsibility',
  'rest',
  'scarcity',
  'sleep',
  'time',
];

function keyText(key: SignalKey): string {
  return key.toLowerCase();
}

function hasAnyKeyword(key: SignalKey, keywords: string[]): boolean {
  const text = keyText(key);
  return keywords.some(keyword => text.includes(keyword));
}

export function getSignalRoles(key: SignalKey): SignalRole[] {
  const roles = new Set<SignalRole>();

  if (FEELING_STATE_SIGNALS.has(key)) roles.add('feeling_state');
  if (RECOVERY_LEVER_SIGNALS.has(key)) roles.add('recovery_lever');
  if (keyText(key).includes('glimmer')) roles.add('glimmer');
  if (hasAnyKeyword(key, BODY_SIGNAL_KEYWORDS)) roles.add('body_signal');
  if (hasAnyKeyword(key, RELATIONAL_KEYWORDS)) roles.add('relational_context');
  if (hasAnyKeyword(key, PROTECTIVE_KEYWORDS)) roles.add('protective_strategy');
  if (hasAnyKeyword(key, COGNITIVE_KEYWORDS)) roles.add('cognitive_process');
  if (hasAnyKeyword(key, VALUE_KEYWORDS)) roles.add('value_theme');
  if (hasAnyKeyword(key, RESOURCE_KEYWORDS)) roles.add('resource_context');

  return Array.from(roles);
}

export function getSignalSentiment(key: SignalKey): SignalSentiment {
  if (NEGATIVE_FEELING_SIGNALS.has(key)) return 'negative';
  if (POSITIVE_FEELING_SIGNALS.has(key)) return 'positive';
  if (RECOVERY_LEVER_SIGNALS.has(key) || keyText(key).includes('glimmer')) return 'positive';
  if (keyText(key).includes('conflict') || keyText(key).includes('mixed')) return 'mixed';
  return 'neutral';
}

export function hasSignalRole(
  signal: { key?: SignalKey; roles?: SignalRole[] },
  role: SignalRole,
): boolean {
  return signal.roles?.includes(role) ?? (signal.key ? getSignalRoles(signal.key).includes(role) : false);
}
