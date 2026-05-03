import type {
  InsightCandidate,
  InsightCandidateSurface,
  PatternConfidence,
} from '../../insightsV2/types';
import {
  selectPatternParagraph,
  selectWeeklyPatternParagraph,
  type PatternParagraphSelectionInput,
  type SelectedPatternParagraph,
} from '../generated/premiumPatternParagraphLibrary';

export interface SelectParagraphForCandidateInput {
  candidate: InsightCandidate;
  surface: InsightCandidateSurface;
  recentParagraphIds?: string[];
  excludeParagraphIds?: string[];
  excludeBodyKeys?: string[];
  feedbackProfile?: PatternParagraphSelectionInput['feedbackProfile'];
  stateProfile?: PatternParagraphSelectionInput['stateProfile'];
}

function confidenceFromCandidate(candidate: InsightCandidate): PatternConfidence {
  if (candidate.confidence >= 0.85) return 'veryStrong';
  if (candidate.confidence >= 0.7) return 'strong';
  if (candidate.confidence >= 0.5) return 'moderate';
  return 'emerging';
}

export function selectParagraphForCandidate({
  candidate,
  surface,
  recentParagraphIds,
  excludeParagraphIds,
  excludeBodyKeys,
  feedbackProfile,
  stateProfile,
}: SelectParagraphForCandidateInput): SelectedPatternParagraph {
  const selector = surface === 'weeklyDeepDive' || surface === 'thisWeek'
    ? selectWeeklyPatternParagraph
    : selectPatternParagraph;

  return selector({
    category: candidate.category,
    majorDomain: candidate.majorDomain,
    insightSubcategory: candidate.subcategory,
    surface,
    patternKey: candidate.id,
    searchText: [
      candidate.majorDomain,
      candidate.subcategory,
      candidate.selectedPatternType,
      ...candidate.anchors,
      ...candidate.tags,
    ].join(' '),
    signals: candidate.signalTypes,
    sourceTypes: candidate.sources,
    tags: candidate.tags,
    confidence: confidenceFromCandidate(candidate),
    patternType: candidate.selectedPatternType,
    recentParagraphIds,
    excludeParagraphIds,
    excludeBodyKeys,
    feedbackProfile,
    stateProfile,
  });
}
