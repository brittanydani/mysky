import {
  isArchivePatternAllowedOnSurface,
  isDreamSignalKey,
} from '../insightSurfacePolicy';
import {
  insightTaxonomyForCategory,
  isInsightCategoryAllowedOnCandidateSurface,
  type InsightTaxonomyCategory,
} from '../taxonomy/insightTaxonomy';
import type {
  ArchivePattern,
  ArchivePatternScore,
  InsightCandidate,
  InsightCandidateSurface,
  PatternConfidence,
  PatternType,
} from '../types';

const PATTERN_TYPES: readonly PatternType[] = [
  'highTracking',
  'lowAccess',
  'pushPull',
  'delayedActivation',
];
const ALL_CANDIDATE_SURFACES: readonly InsightCandidateSurface[] = [
  'today',
  'patterns',
  'weeklyDeepDive',
  'thisWeek',
  'dreamInterpretation',
];

function unique<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function confidenceScore(confidence: PatternConfidence): number {
  if (confidence === 'veryStrong') return 0.9;
  if (confidence === 'strong') return 0.72;
  if (confidence === 'moderate') return 0.56;
  return 0.36;
}

function textForPatternTypeScoring(
  pattern: ArchivePattern,
  score: ArchivePatternScore,
): string {
  return normalize([
    pattern.key,
    pattern.title,
    pattern.description,
    pattern.shameLabel,
    pattern.clarityReframe,
    ...(pattern.tags ?? []),
    ...pattern.requiredSignals,
    ...pattern.supportingSignals,
    ...score.sources,
    ...score.evidence.map(evidence => evidence.signal ?? ''),
    ...score.evidence.map(evidence => evidence.label ?? ''),
    ...score.evidence.map(evidence => evidence.phrase ?? ''),
  ].filter(Boolean).join(' '));
}

function scoreByMatchers(haystack: string, matchers: RegExp[]): number {
  return matchers.reduce((score, matcher) => score + (matcher.test(haystack) ? 0.22 : 0), 0.12);
}

export function scorePatternTypesForArchivePattern(
  pattern: ArchivePattern,
  score: ArchivePatternScore,
): Record<PatternType, number> {
  const haystack = textForPatternTypeScoring(pattern, score);
  const raw: Record<PatternType, number> = {
    highTracking: scoreByMatchers(haystack, [
      /\b(track|tracking|scan|notice|early|tone|shift|anticipat|brace|explain|precision|responsib|pressure|body|safety)\b/,
      /\b(repair|clarity|mental load|prepared|catch|prevent)\b/,
    ]),
    lowAccess: scoreByMatchers(haystack, [
      /\b(avoid|surface|numb|muted|quiet|drift|minimiz|disconnect|procrastinat|low motivation|withdraw|detached)\b/,
      /\b(shutdown|distance|go quiet|not naming|delay starting)\b/,
    ]),
    pushPull: scoreByMatchers(haystack, [
      /\b(push pull|push-pull|both|closeness|space|guard|pull back|ambivalence|mixed)\b/,
      /\b(want\w* .{0,36}\bbut\b|support .{0,36}distrust|receive .{0,36}owe)\b/,
    ]),
    delayedActivation: scoreByMatchers(haystack, [
      /\b(later|afterward|delayed|replay|replayed|quiet|came back|caught up|hours after|after the moment)\b/,
      /\b(lands later|shows up later|after it is over|after the pressure)\b/,
    ]),
  };

  return Object.fromEntries(
    PATTERN_TYPES.map(patternType => [
      patternType,
      Number(Math.min(1, raw[patternType]).toFixed(2)),
    ]),
  ) as Record<PatternType, number>;
}

function selectedPatternType(scores: Record<PatternType, number>): PatternType {
  return [...PATTERN_TYPES].sort((a, b) => scores[b] - scores[a])[0];
}

function isPatternDreamRouted(pattern: ArchivePattern): boolean {
  if (pattern.category === 'dreamsSymbols') return true;
  const requiredSignals = pattern.requiredSignals ?? [];
  return requiredSignals.length > 0 && requiredSignals.every(signal => isDreamSignalKey(signal));
}

function isPatternAllowedForCandidateSurface(
  pattern: ArchivePattern,
  surface: InsightCandidateSurface,
): boolean {
  if (surface === 'dreamInterpretation') return isPatternDreamRouted(pattern);
  if (surface === 'today') return isArchivePatternAllowedOnSurface(pattern, 'today');
  if (surface === 'weeklyDeepDive' || surface === 'thisWeek') {
    return !isPatternDreamRouted(pattern) && isArchivePatternAllowedOnSurface(pattern, 'patternScreen');
  }
  return isArchivePatternAllowedOnSurface(pattern, 'patternScreen');
}

function candidateAllowedSurfacesForPattern(
  pattern: ArchivePattern,
  taxonomy: InsightTaxonomyCategory | undefined,
): InsightCandidateSurface[] {
  const taxonomyAllowedSurfaces = taxonomy?.allowedSurfaces ?? [];
  const candidateSurfaces = unique([
    ...taxonomyAllowedSurfaces,
    ...(!isPatternDreamRouted(pattern) ? ['weeklyDeepDive', 'thisWeek'] as InsightCandidateSurface[] : []),
  ] as InsightCandidateSurface[]);

  return candidateSurfaces.filter(surface =>
    isPatternAllowedForCandidateSurface(pattern, surface),
  );
}

function candidateBlockedSurfacesFor(
  allowedSurfaces: readonly InsightCandidateSurface[],
  taxonomy: InsightTaxonomyCategory | undefined,
): InsightCandidateSurface[] {
  const allowed = new Set(allowedSurfaces);
  return unique([
    ...(taxonomy?.blockedSurfaces ?? []),
    ...ALL_CANDIDATE_SURFACES.filter(surface => !allowed.has(surface)),
  ] as InsightCandidateSurface[]);
}

function candidateAnchors(
  pattern: ArchivePattern,
  score: ArchivePatternScore,
  metadataAnchors: string[],
): string[] {
  const haystack = textForPatternTypeScoring(pattern, score);
  const matchedMetadataAnchors = metadataAnchors.filter(anchor =>
    haystack.includes(normalize(anchor)),
  );
  return unique([
    ...matchedMetadataAnchors,
    ...(pattern.tags ?? []).map(slug),
    ...pattern.requiredSignals.map(slug),
    ...score.evidence.map(evidence => evidence.signal ?? '').map(slug),
  ]).slice(0, 12);
}

export function archivePatternScoreToInsightCandidate(
  pattern: ArchivePattern,
  score: ArchivePatternScore,
): InsightCandidate {
  const taxonomy = insightTaxonomyForCategory(score.category);
  const patternTypeScores = scorePatternTypesForArchivePattern(pattern, score);
  const anchors = candidateAnchors(pattern, score, taxonomy?.anchors ?? []);
  const allowedSurfaces = candidateAllowedSurfacesForPattern(pattern, taxonomy);
  const blockedSurfaces = candidateBlockedSurfacesFor(allowedSurfaces, taxonomy);

  return {
    id: score.patternKey,
    majorDomain: taxonomy?.majorDomain ?? score.category,
    theoryLens: taxonomy?.theoryLens ?? [],
    subcategory: taxonomy?.subcategory ?? score.category,
    category: score.category,
    patternTypeScores,
    selectedPatternType: selectedPatternType(patternTypeScores),
    anchors,
    signalTypes: unique([
      ...(taxonomy?.signalTypes ?? []),
      ...pattern.requiredSignals,
      ...pattern.supportingSignals,
      ...score.sources,
      ...score.evidence.map(evidence => evidence.signal ?? ''),
      ...score.evidence.map(evidence => evidence.label ?? ''),
    ]),
    tags: unique([
      ...(pattern.tags ?? []),
      ...anchors,
      taxonomy?.majorDomain ?? '',
      taxonomy?.subcategory ?? '',
    ]),
    strength: Number(score.score.toFixed(3)),
    confidence: confidenceScore(score.confidence),
    sources: score.sources,
    allowedSurfaces,
    blockedSurfaces,
    surfaces: allowedSurfaces,
  };
}

export function isCandidateAllowedOnSurface(
  candidate: InsightCandidate,
  surface: InsightCandidateSurface,
): boolean {
  if (candidate.blockedSurfaces.includes(surface)) return false;
  if (!candidate.allowedSurfaces.includes(surface)) return false;
  return isInsightCategoryAllowedOnCandidateSurface(candidate.category, surface);
}
