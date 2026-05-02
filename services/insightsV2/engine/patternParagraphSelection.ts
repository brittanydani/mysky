import type {
  ArchivePattern,
  ArchivePatternScore,
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
    tags: pattern.tags,
    confidence: score.confidence,
    patternType: candidate.selectedPatternType,
    recentParagraphIds,
    excludeParagraphIds,
    excludeBodyKeys,
    avoidWriterShapes,
    avoidPatternTypes,
    feedbackProfile,
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
    tags: pattern.tags,
    confidence: score.confidence,
    patternType: candidate.selectedPatternType,
    recentParagraphIds,
    excludeParagraphIds,
    excludeBodyKeys,
    avoidWriterShapes,
    avoidPatternTypes,
    feedbackProfile,
  });
}

export { buildPatternSearchText, paragraphSelectionSignals };
