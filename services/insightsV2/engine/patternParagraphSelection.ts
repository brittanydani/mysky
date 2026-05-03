import type {
  ArchivePattern,
  ArchivePatternScore,
  EvidenceAnchor,
  InsightCandidate,
  InsightCandidateSurface,
} from '../types';
import {
  archivePatternScoreToInsightCandidate,
  isCandidateAllowedOnSurface,
} from '../candidates/insightCandidates';
import {
  selectPatternParagraph,
  selectWeeklyPatternParagraph,
  type PremiumPatternType,
  type PremiumPatternWriterShape,
  type SelectedPatternParagraph,
} from '../adapters/premiumPatternParagraphLibrary';
import type { InsightFeedbackProfile } from '../feedback/insightOutcomeFeedback';
import type { CurrentInsightStateProfile } from '../state/insightState';

function unique<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildPatternSearchText(
  pattern: ArchivePattern,
  score: ArchivePatternScore,
): string {
  return [
    pattern.key,
    pattern.title,
    pattern.category,
    pattern.description,
    pattern.clarityReframe,
    pattern.shameLabel,
    ...(pattern.tags ?? []),
    ...pattern.requiredSignals,
    ...pattern.supportingSignals,
    ...score.sources,
    ...score.evidence.map(evidence => evidence.signal ?? ''),
    ...score.evidence.map(evidence => evidence.label ?? ''),
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/[_-]+/g, ' ')
    .toLowerCase();
}

function paragraphSelectionSignals(
  pattern: ArchivePattern,
  score: ArchivePatternScore,
): string[] {
  return unique([
    ...pattern.requiredSignals,
    ...pattern.supportingSignals,
    ...score.sources,
    ...score.evidence.map(evidence => evidence.signal ?? ''),
    ...score.evidence.map(evidence => evidence.label ?? ''),
  ]);
}

function evidenceDateKey(evidence: EvidenceAnchor): string | null {
  return /^\d{4}-\d{2}-\d{2}/.test(evidence.date)
    ? evidence.date.slice(0, 10)
    : null;
}

function evidenceStrengths(score: ArchivePatternScore): number[] {
  return score.evidence
    .map(evidence => evidence.strength)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

function distinctEvidenceDays(score: ArchivePatternScore): number {
  return new Set(score.evidence.map(evidenceDateKey).filter(Boolean)).size;
}

function signalIntensityFromScore(
  score: ArchivePatternScore,
  surface: InsightCandidateSurface | undefined,
): {
  stress?: number;
  triggerIntensity?: number;
  emotionTags: string[];
  somaticCues: string[];
} | undefined {
  const textValues = score.evidence.flatMap(evidence => [
    evidence.label,
    evidence.phrase,
    evidence.signal,
    evidence.value != null ? String(evidence.value) : undefined,
  ]).filter((value): value is string => !!value);
  const normalizedText = textValues.join(' ').toLowerCase().replace(/[_-]+/g, ' ');
  const maxStrength = Math.max(0, ...evidenceStrengths(score));
  const scaledStrength = Math.round(maxStrength * 5 * 100) / 100;
  const hasStress = /\b(stress|overwhelm|capacity|pressure|burnout|unsafe|fear|panic)\b/.test(normalizedText);
  const hasTrigger = surface === 'today' && score.sources.includes('triggerLog');
  const hasHighEmotion = /\b(ashamed|shame|panicked|afraid|rejected|abandoned|trapped|grieving|hopeless|guilty|unsafe|despair|powerlessness)\b/.test(normalizedText);
  const hasSomaticCue = /\b(tight chest|stomach drop|racing heart|shaking|frozen|numb|holding breath|jaw clenched|chest pressure|throat tightness)\b/.test(normalizedText);

  if (!hasStress && !hasTrigger && !hasHighEmotion && !hasSomaticCue) {
    return undefined;
  }

  return {
    stress: hasStress ? scaledStrength : undefined,
    triggerIntensity: hasTrigger ? scaledStrength : undefined,
    emotionTags: textValues,
    somaticCues: textValues,
  };
}

export interface ArchivePatternParagraphSelectionOptions {
  pattern: ArchivePattern;
  score: ArchivePatternScore;
  candidate?: InsightCandidate;
  surface?: InsightCandidateSurface;
  recentParagraphIds?: string[];
  excludeParagraphIds?: string[];
  excludeBodyKeys?: string[];
  avoidWriterShapes?: PremiumPatternWriterShape[];
  avoidPatternTypes?: PremiumPatternType[];
  feedbackProfile?: InsightFeedbackProfile | null;
  stateProfile?: CurrentInsightStateProfile | null;
}

export function selectArchivePatternParagraph({
  pattern,
  score,
  candidate: providedCandidate,
  surface,
  recentParagraphIds,
  excludeParagraphIds,
  excludeBodyKeys,
  avoidWriterShapes,
  avoidPatternTypes,
  feedbackProfile,
  stateProfile,
}: ArchivePatternParagraphSelectionOptions): SelectedPatternParagraph {
  const candidate = providedCandidate ?? archivePatternScoreToInsightCandidate(pattern, score);
  if (surface && !isCandidateAllowedOnSurface(candidate, surface)) {
    throw new Error(`Insight candidate is not available for ${surface}`);
  }
  const searchText = buildPatternSearchText(pattern, score);
  const signals = unique([
    ...paragraphSelectionSignals(pattern, score),
    ...candidate.signalTypes,
    ...candidate.anchors,
  ]);

  return selectPatternParagraph({
    category: score.category,
    majorDomain: candidate.majorDomain,
    insightSubcategory: candidate.subcategory,
    surface,
    patternKey: score.patternKey,
    title: score.title,
    searchText: [
      searchText,
      candidate.majorDomain,
      candidate.subcategory,
      candidate.selectedPatternType,
      ...candidate.anchors,
    ].join(' '),
    signals,
    sourceTypes: candidate.sources,
    tags: unique([
      ...(pattern.tags ?? []),
      ...candidate.tags,
    ]),
    confidence: score.confidence,
    patternType: candidate.selectedPatternType,
    recentParagraphIds,
    excludeParagraphIds,
    excludeBodyKeys,
    avoidWriterShapes,
    avoidPatternTypes,
    feedbackProfile,
    stateProfile,
    categoryScore: score.score,
    entryCount: score.evidence.length,
    distinctDays: distinctEvidenceDays(score),
    evidenceStrengths: evidenceStrengths(score),
    signalIntensity: signalIntensityFromScore(score, surface),
  });
}

export function selectArchiveWeeklyPatternParagraph({
  pattern,
  score,
  candidate: providedCandidate,
  surface,
  recentParagraphIds,
  excludeParagraphIds,
  excludeBodyKeys,
  avoidWriterShapes,
  avoidPatternTypes,
  feedbackProfile,
  stateProfile,
}: ArchivePatternParagraphSelectionOptions): SelectedPatternParagraph {
  const candidate = providedCandidate ?? archivePatternScoreToInsightCandidate(pattern, score);
  if (surface && !isCandidateAllowedOnSurface(candidate, surface)) {
    throw new Error(`Insight candidate is not available for ${surface}`);
  }
  const searchText = buildPatternSearchText(pattern, score);
  const signals = unique([
    ...paragraphSelectionSignals(pattern, score),
    ...candidate.signalTypes,
    ...candidate.anchors,
  ]);

  return selectWeeklyPatternParagraph({
    category: score.category,
    majorDomain: candidate.majorDomain,
    insightSubcategory: candidate.subcategory,
    surface,
    patternKey: score.patternKey,
    title: score.title,
    searchText: [
      searchText,
      candidate.majorDomain,
      candidate.subcategory,
      candidate.selectedPatternType,
      ...candidate.anchors,
    ].join(' '),
    signals,
    sourceTypes: candidate.sources,
    tags: unique([
      ...(pattern.tags ?? []),
      ...candidate.tags,
    ]),
    confidence: score.confidence,
    patternType: candidate.selectedPatternType,
    recentParagraphIds,
    excludeParagraphIds,
    excludeBodyKeys,
    avoidWriterShapes,
    avoidPatternTypes,
    feedbackProfile,
    stateProfile,
    categoryScore: score.score,
    entryCount: score.evidence.length,
    distinctDays: distinctEvidenceDays(score),
    evidenceStrengths: evidenceStrengths(score),
    signalIntensity: signalIntensityFromScore(score, surface),
  });
}

export { buildPatternSearchText, paragraphSelectionSignals };
