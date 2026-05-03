import { existsSync } from 'fs';
import path from 'path';
import {
  INSIGHT_DOMAINS,
  INSIGHT_SUBCATEGORIES,
  INSIGHT_SURFACES,
  PATTERN_TYPES,
  VISIBLE_INSIGHT_SURFACES,
  isDreamInsightCategory,
} from '../taxonomy';
import {
  GENERATED_INSIGHT_PARAGRAPHS,
} from '../generated/generatedInsightParagraphs';

describe('canonical insight architecture', () => {
  it('exposes taxonomy as the source of truth for domains, subcategories, types, and surfaces', () => {
    expect(INSIGHT_DOMAINS).toHaveLength(50);
    expect(INSIGHT_SUBCATEGORIES).toHaveLength(400);
    expect(PATTERN_TYPES).toEqual([
      'highTracking',
      'lowAccess',
      'pushPull',
      'delayedActivation',
    ]);
    expect(INSIGHT_SURFACES).toContain('dreamInterpretation');
    expect(VISIBLE_INSIGHT_SURFACES).toEqual([
      'today',
      'patterns',
      'weeklyDeepDive',
      'thisWeek',
    ]);
  });

  it('keeps dreams out of normal generated paragraphs and reserves them for the dream engine', () => {
    expect(isDreamInsightCategory('dreamsSymbols')).toBe(true);
    expect(GENERATED_INSIGHT_PARAGRAPHS.some(paragraph => paragraph.category === 'dreamsSymbols')).toBe(false);
    expect(GENERATED_INSIGHT_PARAGRAPHS.every(paragraph =>
      !paragraph.allowedSurfaces.includes('weeklyDeepDive') &&
      !paragraph.allowedSurfaces.includes('thisWeek'),
    )).toBe(true);
  });

  it('does not keep legacy insight engines alongside the canonical router', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const forbiddenLegacyPaths = [
      'lib/insights/engine.ts',
      'utils/insightsEngine.ts',
      'utils/journalInsights.ts',
      'utils/microInsights.ts',
      'utils/narrativeInsights.ts',
      'services/insights/archivePatterns.ts',
      'services/insights/engine/selectInsights.ts',
      'services/insights/generator/generateInsightCopy.ts',
      'services/insights/normalizers/buildUserSignals.ts',
      'services/insights/premium/orchestrator.ts',
      'services/insights/pipeline.ts',
    ];

    expect(
      forbiddenLegacyPaths.filter(relativePath => existsSync(path.join(repoRoot, relativePath))),
    ).toEqual([]);
  });
});
