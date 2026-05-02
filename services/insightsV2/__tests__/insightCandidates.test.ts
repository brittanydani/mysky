import {
  archivePatternScoreToInsightCandidate,
} from '../candidates/insightCandidates';
import {
  selectArchivePatternParagraph,
  selectArchiveWeeklyPatternParagraph,
} from '../engine/patternParagraphSelection';
import { ARCHIVE_PATTERNS } from '../patternPacks';
import { insightTaxonomyForCategory } from '../taxonomy/insightTaxonomy';
import type { ArchivePatternScore, PatternType } from '../types';

const PATTERN_TYPES: PatternType[] = [
  'highTracking',
  'lowAccess',
  'pushPull',
  'delayedActivation',
];

const score: ArchivePatternScore = {
  patternKey: 'responsibilityCare_invisibleLoad',
  title: 'Invisible Load',
  category: 'responsibilityCare',
  score: 0.78,
  confidence: 'strong',
  movement: 'repeating',
  timeframeDays: 30,
  sources: ['journal', 'bodyMap'],
  evidence: [
    {
      source: 'journal',
      date: '2026-04-24',
      label: 'mental load',
      signal: 'mental_load',
      strength: 0.8,
    },
  ],
  lastSeenAt: '2026-04-24',
};

describe('canonical insight candidates', () => {
  it('maps archive pattern scores into shared candidate metadata', () => {
    const pattern = ARCHIVE_PATTERNS.find(item => item.key === score.patternKey);
    expect(pattern).toBeDefined();

    const candidate = archivePatternScoreToInsightCandidate(pattern!, score);
    const taxonomy = insightTaxonomyForCategory(score.category);

    expect(candidate).toEqual(expect.objectContaining({
      majorDomain: 'moralResponsibilityFairness',
      subcategory: 'responsibilityQuestion',
      category: 'responsibilityCare',
      selectedPatternType: expect.any(String),
      strength: 0.78,
      confidence: 0.72,
    }));
    expect(candidate.theoryLens.length).toBeGreaterThan(0);
    expect(candidate.anchors.length).toBeGreaterThan(0);
    expect(candidate.signalTypes).toEqual(expect.arrayContaining(['mental_load']));
    expect(candidate.sources).toEqual(['journal', 'bodyMap']);
    expect(candidate.surfaces).toEqual(taxonomy?.allowedSurfaces);
    expect(new Set(Object.keys(candidate.patternTypeScores))).toEqual(new Set(PATTERN_TYPES));
  });

  it('selects paragraphs from candidate metadata, not direct UI copy', () => {
    const pattern = ARCHIVE_PATTERNS.find(item => item.key === score.patternKey)!;
    const candidate = archivePatternScoreToInsightCandidate(pattern, score);
    const paragraph = selectArchivePatternParagraph({
      pattern,
      score,
      candidate,
      surface: 'patterns',
    });

    expect(paragraph.majorDomain).toBe(candidate.majorDomain);
    expect(paragraph.insightSubcategory).toBe(candidate.subcategory);
    expect(paragraph.patternType).toBe(candidate.selectedPatternType);
    expect(paragraph.body).not.toContain('Seen across');
    expect(paragraph.body).not.toContain('This does not read as');
  });

  it('routes every visible insight surface through candidate metadata', () => {
    const pattern = ARCHIVE_PATTERNS.find(item => item.key === score.patternKey)!;
    const candidate = archivePatternScoreToInsightCandidate(pattern, score);
    const selections = [
      selectArchivePatternParagraph({ pattern, score, candidate, surface: 'today' }),
      selectArchivePatternParagraph({ pattern, score, candidate, surface: 'patterns' }),
      selectArchiveWeeklyPatternParagraph({ pattern, score, candidate, surface: 'weeklyDeepDive' }),
      selectArchiveWeeklyPatternParagraph({ pattern, score, candidate, surface: 'thisWeek' }),
    ];

    for (const paragraph of selections) {
      expect(paragraph.majorDomain).toBe(candidate.majorDomain);
      expect(paragraph.insightSubcategory).toBe(candidate.subcategory);
      expect(paragraph.patternType).toBe(candidate.selectedPatternType);
      expect(paragraph.category).toBe(candidate.category);
    }
  });

  it('keeps dream archive scores out of visible candidate surfaces', () => {
    const dreamPattern = ARCHIVE_PATTERNS.find(item => item.category === 'dreamsSymbols')!;
    const dreamScore: ArchivePatternScore = {
      patternKey: dreamPattern.key,
      title: dreamPattern.title,
      category: 'dreamsSymbols',
      score: 0.9,
      confidence: 'veryStrong',
      movement: 'repeating',
      timeframeDays: 90,
      sources: ['dream'],
      evidence: [],
      lastSeenAt: '2026-04-24',
    };

    const candidate = archivePatternScoreToInsightCandidate(dreamPattern, dreamScore);

    expect(candidate.surfaces).toEqual([]);
  });
});
