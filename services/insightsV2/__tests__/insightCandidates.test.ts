import {
  archivePatternScoreToInsightCandidate,
  isCandidateAllowedOnSurface,
} from '../candidates/insightCandidates';
import {
  selectArchivePatternParagraph,
  selectArchiveWeeklyPatternParagraph,
} from '../engine/patternParagraphSelection';
import { ARCHIVE_PATTERNS } from '../patternPacks';
import { detectCurrentInsightState } from '../state/insightState';
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
      id: 'responsibilityCare_invisibleLoad',
      majorDomain: 'moralResponsibilityFairness',
      subcategory: 'responsibilityQuestion',
      category: 'responsibilityCare',
      selectedPatternType: expect.any(String),
      strength: 0.78,
      confidence: 0.72,
    }));
    expect(candidate.theoryLens.length).toBeGreaterThan(0);
    expect(candidate.anchors.length).toBeGreaterThan(0);
    expect(candidate.tags).toEqual(expect.arrayContaining(['moralResponsibilityFairness', 'responsibilityQuestion']));
    expect(candidate.signalTypes).toEqual(expect.arrayContaining(['mental_load']));
    expect(candidate.sources).toEqual(['journal', 'bodyMap']);
    expect(candidate.allowedSurfaces).toEqual(taxonomy?.allowedSurfaces);
    expect(candidate.surfaces).toEqual(taxonomy?.allowedSurfaces);
    expect(candidate.blockedSurfaces).toContain('dreamInterpretation');
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

  it('lets Today use high-intensity paragraphs when current user signals are highly activated', () => {
    const pattern = ARCHIVE_PATTERNS.find(item => item.key === score.patternKey)!;
    const highChargeScore: ArchivePatternScore = {
      ...score,
      score: 0.9,
      confidence: 'veryStrong',
      evidence: [
        ...score.evidence,
        {
          source: 'triggerLog',
          date: '2026-04-24',
          label: 'conflict',
          signal: 'capacity_strain',
          strength: 0.95,
        },
      ],
    };
    const candidate = archivePatternScoreToInsightCandidate(pattern, highChargeScore);
    const stateProfile = detectCurrentInsightState([
      {
        key: 'high_stress',
        source: 'dailyCheckIn',
        date: '2026-04-24',
        strength: 0.95,
      },
      {
        key: 'overwhelm',
        source: 'journal',
        date: '2026-04-24',
        strength: 0.95,
      },
      {
        key: 'capacity_strain',
        source: 'bodyMap',
        date: '2026-04-24',
        strength: 0.9,
      },
    ], '2026-04-24T12:00:00Z');
    const paragraph = selectArchivePatternParagraph({
      pattern,
      score: highChargeScore,
      candidate,
      surface: 'today',
      stateProfile,
    });

    expect(stateProfile.primaryState).toBe('overwhelmed');
    expect(paragraph.intensity).toBe('high');
    expect(['poetic', 'questionLed']).not.toContain(paragraph.writerShape);
  });

  it('prefers durable pattern-surface phrasing for very strong cross-entry patterns', () => {
    const pattern = ARCHIVE_PATTERNS.find(item => item.key === score.patternKey)!;
    const veryStrongScore: ArchivePatternScore = {
      ...score,
      score: 0.94,
      confidence: 'veryStrong',
      timeframeDays: 90,
    };
    const candidate = archivePatternScoreToInsightCandidate(pattern, veryStrongScore);
    const paragraph = selectArchivePatternParagraph({
      pattern,
      score: veryStrongScore,
      candidate,
      surface: 'patterns',
    });

    expect(paragraph.intensity).toBe('high');
    expect(['patternAnalysis', 'practicalCapacity', 'contrast', 'threshold'])
      .toContain(paragraph.writerShape);
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

  it('routes dream archive scores only to the separate dream interpretation surface', () => {
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

    expect(candidate.allowedSurfaces).toEqual(['dreamInterpretation']);
    expect(candidate.surfaces).toEqual(['dreamInterpretation']);
    expect(candidate.blockedSurfaces).toEqual(expect.arrayContaining([
      'today',
      'patterns',
      'weeklyDeepDive',
      'thisWeek',
    ]));
    expect(isCandidateAllowedOnSurface(candidate, 'today')).toBe(false);
    expect(isCandidateAllowedOnSurface(candidate, 'patterns')).toBe(false);
    expect(isCandidateAllowedOnSurface(candidate, 'dreamInterpretation')).toBe(true);
  });
});
