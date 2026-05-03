import type { PatternType } from '../../insightsV2/types';

export type { PatternType };

export const PATTERN_TYPES = [
  'highTracking',
  'lowAccess',
  'pushPull',
  'delayedActivation',
] as const satisfies readonly PatternType[];
