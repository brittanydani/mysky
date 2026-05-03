import {
  GENERATED_INSIGHT_PARAGRAPHS,
  GENERATED_WEEKLY_INSIGHT_PARAGRAPHS,
  type GeneratedInsightFlowName,
  type GeneratedInsightIntensity,
  type GeneratedInsightPatternType,
  type GeneratedInsightParagraph,
  type GeneratedInsightSurface,
  type GeneratedInsightTone,
  type GeneratedInsightWriterShape,
} from '../generated/generatedInsightParagraphs';
import type {
  InsightCategory,
  InsightDataSource,
  InsightCandidateSurface,
  PatternConfidence,
} from '../types';
import {
  insightFeedbackScoreForParagraph,
  type InsightFeedbackProfile,
} from '../feedback/insightOutcomeFeedback';
import {
  buildPersonalizedInsightStyleRoute,
  personalizedStyleRouteScore,
  type PersonalizedInsightStyleRoute,
} from '../selection/personalizedStyleRouting';
import {
  stateAwareParagraphScore,
  type CurrentInsightStateProfile,
} from '../state/insightState';

export type PremiumPatternWriterShape = GeneratedInsightWriterShape;
export type PatternParagraphTone = GeneratedInsightTone;
export type PatternParagraphIntensity = GeneratedInsightIntensity;
export type PremiumPatternType = GeneratedInsightPatternType;
export type GeneratedParagraphSelectorSurface = GeneratedInsightSurface;

export type SelectorProfile = {
  surface: GeneratedInsightSurface;
  allowedFlowNames?: readonly GeneratedInsightFlowName[];
  preferredWriterShapes: readonly PremiumPatternWriterShape[];
  avoidedWriterShapes: readonly PremiumPatternWriterShape[];
  maxIntensity?: PatternParagraphIntensity;
  minConfidence?: number;
};

export interface UserSignalIntensityInput {
  stress?: number | null;
  mood?: number | null;
  energy?: number | null;
  triggerIntensity?: number | null;
  nervousSystemState?: string | null;
  emotionTags?: string[];
  somaticCues?: string[];
}

export const SELECTOR_PROFILES: Record<GeneratedInsightSurface, SelectorProfile> = {
  today: {
    surface: 'today',
    preferredWriterShapes: ['body', 'tender', 'punch', 'threshold', 'questionLed'],
    avoidedWriterShapes: ['poetic'],
    maxIntensity: 'high',
    minConfidence: 0.25,
  },
  patterns: {
    surface: 'patterns',
    preferredWriterShapes: ['patternAnalysis', 'contrast', 'threshold', 'practicalCapacity'],
    avoidedWriterShapes: ['poetic', 'questionLed'],
    maxIntensity: 'high',
    minConfidence: 0.45,
  },
  weeklyDeepDive: {
    surface: 'weeklyDeepDive',
    allowedFlowNames: ['weeklyDeepDive'],
    preferredWriterShapes: ['patternAnalysis', 'tender', 'contrast', 'practicalCapacity'],
    avoidedWriterShapes: ['questionLed'],
    maxIntensity: 'high',
    minConfidence: 0.4,
  },
  thisWeek: {
    surface: 'thisWeek',
    allowedFlowNames: ['weeklyDeepDive'],
    preferredWriterShapes: ['patternAnalysis', 'tender', 'practicalCapacity'],
    avoidedWriterShapes: ['poetic'],
    maxIntensity: 'medium',
    minConfidence: 0.35,
  },
};

export type PatternParagraphVariant = GeneratedInsightParagraph;

export interface PatternParagraphSelectionInput {
  category: InsightCategory;
  majorDomain?: string;
  insightSubcategory?: string;
  surface?: InsightCandidateSurface;
  patternKey: string;
  title?: string;
  searchText?: string;
  signals?: string[];
  sourceTypes?: InsightDataSource[];
  tags?: string[];
  confidence?: PatternConfidence;
  patternType?: PremiumPatternType;
  recentParagraphIds?: string[];
  excludeParagraphIds?: string[];
  excludeBodyKeys?: string[];
  avoidWriterShapes?: PremiumPatternWriterShape[];
  avoidPatternTypes?: PremiumPatternType[];
  feedbackProfile?: InsightFeedbackProfile | null;
  styleRoute?: PersonalizedInsightStyleRoute | null;
  stateProfile?: CurrentInsightStateProfile | null;
  targetIntensity?: PatternParagraphIntensity;
  categoryScore?: number;
  entryCount?: number;
  distinctDays?: number;
  evidenceStrengths?: number[];
  signalIntensity?: UserSignalIntensityInput;
}

export interface SelectedPatternParagraph extends PatternParagraphVariant {
  matchedAnchors: string[];
  matchedSignals: string[];
  score: number;
}

export const PATTERN_PARAGRAPH_LIBRARY: readonly PatternParagraphVariant[] =
  GENERATED_INSIGHT_PARAGRAPHS;

export const WEEKLY_PATTERN_PARAGRAPH_LIBRARY: readonly PatternParagraphVariant[] =
  GENERATED_WEEKLY_INSIGHT_PARAGRAPHS;

const ANCHOR_MATCHERS: Array<{ anchor: string; matcher: RegExp }> = [
  { anchor: 'low-sleep', matcher: /\b(low sleep|poor sleep|sleep quality|fatigue|tired|morning)\b/ },
  { anchor: 'after-conflict', matcher: /\b(conflict|rupture|argument|hard conversation|tension)\b/ },
  { anchor: 'tone-shift', matcher: /\b(tone|misread|misunderstood|sharp|distant)\b/ },
  { anchor: 'unresolved', matcher: /\b(unresolved|unfinished|lingering|still processing|closure)\b/ },
  { anchor: 'rushed-transitions', matcher: /\b(rush|rushed|transition|late|time pressure|urgency)\b/ },
  { anchor: 'care-turns-responsibility', matcher: /\b(care|caretaking|responsibility|emotional labor|mental load|invisible load)\b/ },
  { anchor: 'body-before-words', matcher: /\b(body|chest|breath|jaw|gut|throat|shoulder|somatic|sensation)\b/ },
  { anchor: 'demand-density', matcher: /\b(demand|overextension|too much|capacity|burnout|one more thing)\b/ },
  { anchor: 'receiving-care', matcher: /\b(receiv|support|care offered|help|belonging)\b/ },
  { anchor: 'meaning-gap', matcher: /\b(meaning|purpose|faith|sacred|larger question|symbol)\b/ },
  { anchor: 'explaining-accurately', matcher: /\b(precision|clarity|language|explain|overexplain|analysis|context)\b/ },
  { anchor: 'safety-scan', matcher: /\b(safety|unsafe|bracing|guard|alert|prepared|uncertain)\b/ },
  { anchor: 'scarcity-scan', matcher: /\b(scarcity|enough|money|resource|ration|loss)\b/ },
  { anchor: 'joy-unfamiliar', matcher: /\b(joy|pleasure|play|desire|aliveness|glimmer)\b/ },
  { anchor: 'dream-residue', matcher: /\b(dream|night|symbol|image|subconscious)\b/ },
  { anchor: 'future-pressure', matcher: /\b(future|direction|next step|choice|stuck|becoming)\b/ },
];

const INTENSITY_RANK: Record<PatternParagraphIntensity, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

const HIGH_EMOTION_TAGS = new Set([
  'overwhelmed',
  'ashamed',
  'panicked',
  'afraid',
  'rejected',
  'abandoned',
  'trapped',
  'grieving',
  'hopeless',
  'guilty',
  'unsafe',
  'shame',
  'fear',
  'grief',
  'despair',
  'powerlessness',
]);

const HIGH_SOMATIC_CUES = new Set([
  'tight chest',
  'stomach drop',
  'racing heart',
  'shaking',
  'frozen',
  'numb',
  'holding breath',
  'jaw clenched',
  'chest pressure',
  'throat tightness',
]);

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function stableHash(text: string): number {
  return text.split('').reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 0);
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function safeNumber(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function confidenceScore(confidence: PatternConfidence | undefined): number | undefined {
  if (!confidence) return undefined;
  if (confidence === 'veryStrong') return 0.9;
  if (confidence === 'strong') return 0.72;
  if (confidence === 'moderate') return 0.56;
  return 0.36;
}

function intensityIsAboveMax(
  intensity: PatternParagraphIntensity,
  maxIntensity: PatternParagraphIntensity | undefined,
): boolean {
  return !!maxIntensity && INTENSITY_RANK[intensity] > INTENSITY_RANK[maxIntensity];
}

function surfaceFromInput(
  surface: InsightCandidateSurface | undefined,
  fallback: GeneratedInsightSurface,
): GeneratedInsightSurface | null {
  if (!surface) return fallback;
  if (surface === 'dreamInterpretation') return null;
  return surface;
}

export function getGeneratedPoolForSurface(
  surface: GeneratedInsightSurface,
): readonly GeneratedInsightParagraph[] {
  if (surface === 'weeklyDeepDive' || surface === 'thisWeek') {
    return WEEKLY_PATTERN_PARAGRAPH_LIBRARY;
  }

  return PATTERN_PARAGRAPH_LIBRARY;
}

export function inferTargetIntensity(
  input: UserSignalIntensityInput,
): PatternParagraphIntensity {
  const emotionTags = (input.emotionTags ?? []).map(normalizeToken);
  const somaticCues = (input.somaticCues ?? []).map(normalizeToken);
  const nervousSystemState = normalizeToken(input.nervousSystemState ?? '');
  const hasHighEmotion = emotionTags.some(tag => HIGH_EMOTION_TAGS.has(tag));
  const hasHighSomatic = somaticCues.some(cue => HIGH_SOMATIC_CUES.has(cue));

  if (
    safeNumber(input.triggerIntensity) >= 4 ||
    safeNumber(input.stress) >= 4 ||
    ['fight', 'flight', 'freeze', 'activated', 'overwhelmed', 'shutdown'].includes(nervousSystemState) ||
    hasHighEmotion ||
    hasHighSomatic
  ) {
    return 'high';
  }

  if (
    safeNumber(input.stress) >= 3 ||
    safeNumber(input.triggerIntensity) >= 3 ||
    (typeof input.mood === 'number' && input.mood <= 2) ||
    (typeof input.energy === 'number' && input.energy <= 2)
  ) {
    return 'medium';
  }

  return 'low';
}

function average(values: readonly number[]): number {
  const safeValues = values.filter(value => Number.isFinite(value));
  if (!safeValues.length) return 0;
  return safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length;
}

function inferTargetIntensityForSelection(
  input: PatternParagraphSelectionInput,
): PatternParagraphIntensity {
  if (input.targetIntensity) return input.targetIntensity;
  if (input.signalIntensity) return inferTargetIntensity(input.signalIntensity);

  if (input.surface === 'today' && input.stateProfile) {
    const stateIntensity = safeNumber(input.stateProfile.intensity);
    if (
      ['activated', 'overwhelmed'].includes(input.stateProfile.primaryState) &&
      stateIntensity >= 0.45
    ) {
      return 'high';
    }
    if (input.stateProfile.primaryState === 'shutdown' && stateIntensity >= 0.62) return 'high';
    if (['activated', 'overwhelmed', 'shutdown', 'tired'].includes(input.stateProfile.primaryState)) {
      return 'medium';
    }
    if (input.stateProfile.primaryState === 'openReceptive') return 'medium';
    return 'low';
  }

  const score = input.categoryScore ?? confidenceScore(input.confidence) ?? 0;
  const evidenceStrengths = input.evidenceStrengths ?? [];
  const averageStrength = average(evidenceStrengths);
  const maxStrength = Math.max(0, ...evidenceStrengths);
  const repeatedEvidence = (input.entryCount ?? evidenceStrengths.length) >= 3 &&
    (input.distinctDays ?? 0) >= 2;

  if (
    repeatedEvidence &&
    (score >= 0.72 || averageStrength >= 0.72 || maxStrength >= 0.88 || input.confidence === 'veryStrong')
  ) {
    return 'high';
  }

  if (score >= 0.45 || averageStrength >= 0.45 || input.confidence === 'moderate' || input.confidence === 'strong') {
    return 'medium';
  }

  return 'low';
}

function intensityFitScore(
  paragraphIntensity: PatternParagraphIntensity,
  targetIntensity: PatternParagraphIntensity,
): number {
  if (paragraphIntensity === targetIntensity) return 25;
  if (targetIntensity === 'high' && paragraphIntensity === 'medium') return 10;
  if (targetIntensity === 'low' && paragraphIntensity === 'medium') return -5;
  if (targetIntensity === 'medium') return -4;
  return -15;
}

export function patternParagraphBodyKey(body: string): string {
  return normalizeToken(body)
    .replace(/[^a-z0-9 ]+/g, '')
    .trim();
}

function inferredAnchors(input: PatternParagraphSelectionInput): string[] {
  const haystack = normalizeToken([
    input.patternKey,
    input.title,
    input.searchText,
    ...(input.signals ?? []),
    ...(input.tags ?? []),
    ...(input.sourceTypes ?? []),
  ].filter((value): value is string => !!value).join(' '));

  return ANCHOR_MATCHERS
    .filter(({ matcher }) => matcher.test(haystack))
    .map(({ anchor }) => anchor);
}

function matchingValues(candidateValues: readonly string[], inputValues: string[]): string[] {
  const normalizedInput = new Set(inputValues.map(normalizeToken));
  return candidateValues.filter(value => normalizedInput.has(normalizeToken(value)));
}

function phraseMatches(candidateValues: readonly string[], searchText: string): string[] {
  const normalizedSearch = normalizeToken(searchText);
  if (!normalizedSearch) return [];
  return candidateValues.filter(value => normalizedSearch.includes(normalizeToken(value)));
}

export function hasEnoughPatternEvidence(input: {
  surface: GeneratedInsightSurface;
  categoryScore: number;
  entryCount: number;
  distinctDays: number;
}): boolean {
  if (input.surface !== 'patterns') return true;

  return (
    input.categoryScore >= (SELECTOR_PROFILES.patterns.minConfidence ?? 0.45) &&
    input.entryCount >= 3 &&
    input.distinctDays >= 2
  );
}

export function hasEnoughTodayEvidence(input: {
  categoryScore: number;
  hasCurrentEntry: boolean;
  hasCheckInSignal: boolean;
}): boolean {
  return (
    input.categoryScore >= (SELECTOR_PROFILES.today.minConfidence ?? 0.25) ||
    input.hasCurrentEntry ||
    input.hasCheckInSignal
  );
}

export function scoreGeneratedParagraph({
  paragraph,
  surface,
  targetCategory,
  targetMajorDomain,
  targetSubcategory,
  targetPatternType,
  targetIntensity,
  signalTypes,
  recentlyUsedIds,
  categoryScore,
}: {
  paragraph: GeneratedInsightParagraph;
  surface: GeneratedInsightSurface;
  targetCategory?: InsightCategory;
  targetMajorDomain?: string;
  targetSubcategory?: string;
  targetPatternType?: GeneratedInsightPatternType;
  targetIntensity: GeneratedInsightIntensity;
  signalTypes: string[];
  recentlyUsedIds: string[];
  categoryScore?: number;
}): number {
  if (!paragraph.allowedSurfaces.includes(surface)) return Number.NEGATIVE_INFINITY;
  if (recentlyUsedIds.includes(paragraph.id)) return Number.NEGATIVE_INFINITY;

  const profile = SELECTOR_PROFILES[surface];
  let score = 0;

  if (targetCategory) score += paragraph.category === targetCategory ? 50 : -40;
  if (targetMajorDomain) score += paragraph.majorDomain === targetMajorDomain ? 18 : -8;
  if (targetSubcategory) score += paragraph.insightSubcategory === targetSubcategory ? 35 : -10;
  if (targetPatternType) score += paragraph.patternType === targetPatternType ? 25 : -8;

  score += intensityFitScore(paragraph.intensity, targetIntensity);

  const matchingSignals = paragraph.signalTypes.filter(signal =>
    signalTypes.some(inputSignal => normalizeToken(inputSignal) === normalizeToken(signal)),
  );
  score += matchingSignals.length * 8;

  if (profile.allowedFlowNames?.length) {
    score += profile.allowedFlowNames.includes(paragraph.flowName) ? 8 : -35;
  }
  if (profile.preferredWriterShapes.includes(paragraph.writerShape)) score += 12;
  if (profile.avoidedWriterShapes.includes(paragraph.writerShape)) score -= 20;
  if (surface === 'patterns' && ['body', 'tender'].includes(paragraph.writerShape)) score -= 10;
  if (surface === 'today' && paragraph.writerShape === 'patternAnalysis') score -= 8;
  if (intensityIsAboveMax(paragraph.intensity, profile.maxIntensity)) score -= 30;
  if (typeof categoryScore === 'number' && Number.isFinite(categoryScore)) {
    score += Math.max(0, Math.min(1, categoryScore)) * 12;
    if (profile.minConfidence && categoryScore < profile.minConfidence) score -= 20;
  }

  return score;
}

export function selectGeneratedInsightForSurface({
  surface,
  targetCategory,
  targetSubcategory,
  targetPatternType,
  targetIntensity,
  signalTypes,
  recentlyUsedIds,
}: {
  surface: GeneratedInsightSurface;
  targetCategory?: InsightCategory;
  targetSubcategory?: string;
  targetPatternType?: GeneratedInsightPatternType;
  targetIntensity: GeneratedInsightIntensity;
  signalTypes: string[];
  recentlyUsedIds: string[];
}): GeneratedInsightParagraph | null {
  const pool = getGeneratedPoolForSurface(surface);
  const hasTargetCategory = !targetCategory || pool.some(paragraph =>
    paragraph.category === targetCategory && paragraph.allowedSurfaces.includes(surface),
  );
  if (!hasTargetCategory) return null;

  const scored = pool
    .map(paragraph => ({
      paragraph,
      score: scoreGeneratedParagraph({
        paragraph,
        surface,
        targetCategory,
        targetSubcategory,
        targetPatternType,
        targetIntensity,
        signalTypes,
        recentlyUsedIds,
      }),
    }))
    .filter(item => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.paragraph ?? null;
}

function scoreVariant(
  variant: PatternParagraphVariant,
  input: PatternParagraphSelectionInput,
  anchors: string[],
  surface: GeneratedInsightSurface,
  targetIntensity: PatternParagraphIntensity,
  styleRoute?: PersonalizedInsightStyleRoute | null,
): SelectedPatternParagraph {
  const recentIds = new Set(input.recentParagraphIds ?? []);
  const avoidShapes = new Set(input.avoidWriterShapes ?? []);
  const avoidPatternTypes = new Set(input.avoidPatternTypes ?? []);
  const inputSignals = input.signals ?? [];
  const inputTags = input.tags ?? [];
  const searchText = input.searchText ?? '';
  const matchedAnchors = unique([
    ...matchingValues(variant.anchors, anchors),
    ...phraseMatches(variant.anchors, searchText),
  ]);
  const matchedSignals = unique([
    ...matchingValues(variant.signalTypes, inputSignals),
    ...phraseMatches(variant.signalTypes, searchText),
  ]);
  const matchedTags = unique([
    ...matchingValues(variant.tags, inputTags),
    ...phraseMatches(variant.tags, searchText),
  ]);
  const baseScore = scoreGeneratedParagraph({
    paragraph: variant,
    surface,
    targetCategory: input.category,
    targetMajorDomain: input.majorDomain,
    targetSubcategory: input.insightSubcategory,
    targetPatternType: input.patternType,
    targetIntensity,
    signalTypes: inputSignals,
    recentlyUsedIds: Array.from(recentIds),
    categoryScore: input.categoryScore,
  });
  const shapePenalty = avoidShapes.has(variant.writerShape) ? 18 : 0;
  const patternTypePenalty = !input.patternType && avoidPatternTypes.has(variant.patternType) ? 16 : 0;
  const feedbackBonus = insightFeedbackScoreForParagraph(variant, input.feedbackProfile);
  const styleRouteBonus = personalizedStyleRouteScore(variant, styleRoute, surface);
  const stateBonus = stateAwareParagraphScore(variant, input.stateProfile);
  const curatedBonus = variant.isCurated
    ? (matchedAnchors.length > 0 || matchedSignals.length > 0 || matchedTags.length > 0 ? 32 : 6)
    : 0;
  const normalizedPatternKey = normalizeToken(input.patternKey);
  const patternKeyBonus = normalizedPatternKey && normalizeToken(variant.id).includes(normalizedPatternKey)
    ? 24
    : 0;
  const tieBreak = (stableHash(`${input.patternKey}:${variant.id}`) % 1000) / 10000;

  return {
    ...variant,
    matchedAnchors,
    matchedSignals,
    score:
      baseScore +
      matchedAnchors.length * 9 +
      matchedSignals.length * 6 +
      matchedTags.length * 4 +
      feedbackBonus +
      styleRouteBonus +
      stateBonus +
      curatedBonus +
      patternKeyBonus +
      tieBreak -
      shapePenalty -
      patternTypePenalty,
  };
}

function selectFromLibrary(
  input: PatternParagraphSelectionInput,
  fallbackSurface: GeneratedInsightSurface,
): SelectedPatternParagraph {
  const surface = surfaceFromInput(input.surface, fallbackSurface);
  if (!surface) {
    throw new Error(`No generated insight paragraph is available for ${input.category} on ${input.surface}`);
  }
  const library = getGeneratedPoolForSurface(surface);
  const anchors = inferredAnchors(input);
  const categoryCandidates = library.filter(variant =>
    variant.category === input.category &&
    variant.allowedSurfaces.includes(surface),
  );
  if (!categoryCandidates.length) {
    throw new Error(`No generated insight paragraph is available for ${input.category}`);
  }
  const domainCandidates = input.majorDomain
    ? categoryCandidates.filter(variant => variant.majorDomain === input.majorDomain)
    : categoryCandidates;
  const subcategoryCandidates = input.insightSubcategory
    ? domainCandidates.filter(variant => variant.insightSubcategory === input.insightSubcategory)
    : domainCandidates;
  const selectionPool = subcategoryCandidates.length
    ? subcategoryCandidates
    : domainCandidates.length
      ? domainCandidates
      : categoryCandidates;
  const excludedIds = new Set([
    ...(input.excludeParagraphIds ?? []),
    ...(input.recentParagraphIds ?? []),
  ]);
  const excludedBodyKeys = new Set(input.excludeBodyKeys ?? []);
  let candidates = selectionPool.filter(variant =>
    !excludedIds.has(variant.id) &&
    !excludedBodyKeys.has(patternParagraphBodyKey(variant.body)),
  );
  if (!candidates.length && selectionPool !== categoryCandidates) {
    candidates = categoryCandidates.filter(variant =>
      !excludedIds.has(variant.id) &&
      !excludedBodyKeys.has(patternParagraphBodyKey(variant.body)),
    );
  }
  if (!candidates.length) {
    candidates = selectionPool.filter(variant => !excludedIds.has(variant.id));
  }
  if (!candidates.length) {
    throw new Error(`No unused generated insight paragraph is available for ${input.category}`);
  }

  const styleRoute = input.styleRoute ?? buildPersonalizedInsightStyleRoute(input.feedbackProfile);
  const targetIntensity = inferTargetIntensityForSelection(input);
  const selected = candidates
    .map(variant => scoreVariant(variant, input, anchors, surface, targetIntensity, styleRoute))
    .filter(variant => Number.isFinite(variant.score))
    .sort((a, b) => b.score - a.score)[0];

  if (!selected) {
    throw new Error(`No generated insight paragraph is available for ${input.category}`);
  }

  return selected;
}

export function selectPatternParagraph(
  input: PatternParagraphSelectionInput,
): SelectedPatternParagraph {
  return selectFromLibrary(input, 'patterns');
}

export function selectWeeklyPatternParagraph(
  input: PatternParagraphSelectionInput,
): SelectedPatternParagraph {
  return selectFromLibrary(input, input.surface === 'thisWeek' ? 'thisWeek' : 'weeklyDeepDive');
}
