import type { InsightCandidateSurface } from '../../insightsV2/types';

export type InsightSurface = InsightCandidateSurface;

export const VISIBLE_INSIGHT_SURFACES = [
  'today',
  'patterns',
  'weeklyDeepDive',
  'thisWeek',
] as const satisfies readonly InsightCandidateSurface[];

export const DREAM_INSIGHT_SURFACE = 'dreamInterpretation' as const satisfies InsightCandidateSurface;

export const INSIGHT_SURFACES = [
  ...VISIBLE_INSIGHT_SURFACES,
  DREAM_INSIGHT_SURFACE,
] as const satisfies readonly InsightCandidateSurface[];
