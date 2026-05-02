import {
  GENERATED_INSIGHT_PARAGRAPHS,
  GENERATED_WEEKLY_INSIGHT_PARAGRAPHS,
  type GeneratedInsightIntensity,
  type GeneratedInsightPatternType,
  type GeneratedInsightParagraph,
  type GeneratedInsightTone,
  type GeneratedInsightWriterShape,
} from '../../insights/generatedInsightParagraphs';
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

export type PremiumPatternWriterShape = GeneratedInsightWriterShape;
export type PatternParagraphTone = GeneratedInsightTone;
export type PatternParagraphIntensity = GeneratedInsightIntensity;
export type PremiumPatternType = GeneratedInsightPatternType;

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

function confidenceIntensityBonus(
  confidence: PatternConfidence | undefined,
  intensity: PatternParagraphIntensity,
): number {
  if (!confidence) return 0;
  if (confidence === 'veryStrong' && intensity === 'high') return 3;
  if (confidence === 'strong' && intensity === 'medium') return 2;
  if (confidence === 'moderate' && intensity !== 'high') return 2;
  if (confidence === 'emerging' && intensity === 'low') return 3;
  return 0;
}

function scoreVariant(
  variant: PatternParagraphVariant,
  input: PatternParagraphSelectionInput,
  anchors: string[],
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
  const baseScore = variant.category === input.category ? 80 : 0;
  const domainBonus = input.majorDomain && variant.majorDomain === input.majorDomain ? 20 : 0;
  const subcategoryBonus = input.insightSubcategory && variant.insightSubcategory === input.insightSubcategory ? 20 : 0;
  const repeatPenalty = variant.avoidIfRecentlyUsed && recentIds.has(variant.id) ? 45 : 0;
  const shapePenalty = avoidShapes.has(variant.writerShape) ? 18 : 0;
  const patternTypeBonus = input.patternType && variant.patternType === input.patternType ? 18 : 0;
  const patternTypePenalty = !input.patternType && avoidPatternTypes.has(variant.patternType) ? 16 : 0;
  const feedbackBonus = insightFeedbackScoreForParagraph(variant, input.feedbackProfile);
  const styleRouteBonus = personalizedStyleRouteScore(variant, styleRoute, input.surface);
  const curatedBonus = variant.isCurated
    ? (matchedAnchors.length > 0 || matchedSignals.length > 0 || matchedTags.length > 0 ? 32 : 6)
    : 0;
  const tieBreak = (stableHash(`${input.patternKey}:${variant.id}`) % 1000) / 10000;

  return {
    ...variant,
    matchedAnchors,
    matchedSignals,
    score:
      baseScore +
      domainBonus +
      subcategoryBonus +
      matchedAnchors.length * 9 +
      matchedSignals.length * 6 +
      matchedTags.length * 4 +
      confidenceIntensityBonus(input.confidence, variant.intensity) -
      repeatPenalty -
      shapePenalty +
      patternTypeBonus -
      patternTypePenalty +
      feedbackBonus +
      styleRouteBonus +
      curatedBonus +
      tieBreak,
  };
}

function selectFromLibrary(
  library: readonly PatternParagraphVariant[],
  input: PatternParagraphSelectionInput,
): SelectedPatternParagraph {
  const anchors = inferredAnchors(input);
  const categoryCandidates = library.filter(variant => variant.category === input.category);
  if (!categoryCandidates.length) {
    throw new Error(`No generated insight paragraph is available for ${input.category}`);
  }
  const domainCandidates = input.majorDomain
    ? categoryCandidates.filter(variant => variant.majorDomain === input.majorDomain)
    : categoryCandidates;
  const subcategoryCandidates = input.insightSubcategory
    ? domainCandidates.filter(variant => variant.insightSubcategory === input.insightSubcategory)
    : domainCandidates;
  const excludedIds = new Set(input.excludeParagraphIds ?? []);
  const excludedBodyKeys = new Set(input.excludeBodyKeys ?? []);
  const candidates = subcategoryCandidates.filter(variant =>
    !excludedIds.has(variant.id) &&
    !excludedBodyKeys.has(patternParagraphBodyKey(variant.body)),
  );
  if (!candidates.length) {
    throw new Error(`No unused generated insight paragraph is available for ${input.category}`);
  }

  const styleRoute = input.styleRoute ?? buildPersonalizedInsightStyleRoute(input.feedbackProfile);
  const selected = candidates
    .map(variant => scoreVariant(variant, input, anchors, styleRoute))
    .sort((a, b) => b.score - a.score)[0];

  if (!selected) {
    throw new Error(`No generated insight paragraph is available for ${input.category}`);
  }

  return selected;
}

export function selectPatternParagraph(
  input: PatternParagraphSelectionInput,
): SelectedPatternParagraph {
  return selectFromLibrary(PATTERN_PARAGRAPH_LIBRARY, input);
}

export function selectWeeklyPatternParagraph(
  input: PatternParagraphSelectionInput,
): SelectedPatternParagraph {
  return selectFromLibrary(WEEKLY_PATTERN_PARAGRAPH_LIBRARY, input);
}
