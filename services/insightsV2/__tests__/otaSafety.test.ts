import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { buildTodayInsights } from '../knowledgeEngineV2';
import { detectCurrentInsightState, stateAwareParagraphScore } from '../state/insightState';
import { buildInsightTimingDecision } from '../timing/insightTiming';
import type { CurrentInsightStateProfile } from '../state/insightState';
import type { InsightHistoryItem, UserSignal } from '../types';

const profile = (
  overrides: Partial<CurrentInsightStateProfile> = {},
): CurrentInsightStateProfile => ({
  primaryState: 'overwhelmed',
  scores: {
    calm: 0,
    activated: 0,
    overwhelmed: 1,
    shutdown: 0,
    tired: 0,
    openReceptive: 0,
  },
  intensity: 0.82,
  confidence: 0.9,
  reasonSignals: ['overwhelm'],
  preferredWriterShapes: ['tender'],
  avoidedWriterShapes: ['poetic'],
  preferredTones: ['tender'],
  avoidedTones: ['poetic'],
  preferredIntensities: ['low'],
  avoidedIntensities: ['high'],
  preferredSentenceCounts: [4],
  maxDepthLevel: 1,
  reasonCodes: ['state:overwhelmed'],
  ...overrides,
});

const repoRoot = path.resolve(__dirname, '../../..');

const deletedInsightEnginePaths = [
  'generated/insights',
  'lib/insights',
  'services/astrology/dailyInsightEngine.ts',
  'services/astrology/humanGuidance.ts',
  'services/insights/archivePatterns.ts',
  'services/insights/engine',
  'services/insights/extraction',
  'services/insights/geminiInsightsService.ts',
  'services/insights/generated',
  'services/insights/generatedInsightParagraphs.ts',
  'services/insights/generator',
  'services/insights/legacy',
  'services/insights/normalizers',
  'services/insights/pipeline.ts',
  'services/insights/premium',
  'services/insights/premiumPipeline',
  'services/insights/scoring',
  'services/insights/selection',
  'services/insightsV2/selectPremiumInsightDraft.ts',
  'services/storage/insightHistory.ts',
  'scripts/insights',
  'utils/deepInsights.ts',
  'utils/insightsEngine.ts',
  'utils/journalInsights.ts',
  'utils/microInsights.ts',
  'utils/narrativeInsights.ts',
  'utils/patternFeed.ts',
  'utils/selfKnowledgeCrossRef.ts',
];

const runtimeSourceRoots = [
  'app',
  'components',
  'constants',
  'context',
  'hooks',
  'lib',
  'services',
  'store',
  'utils',
];

const toolingSourceRoots = [
  'scripts',
];

const ignoredSourceDirs = new Set([
  '__tests__',
  '__pycache__',
  'coverage',
  'node_modules',
]);

const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
const toolingExtensions = new Set([...sourceExtensions, '.json', '.py']);

const forbiddenLegacyImportFragments = [
  'astrology/dailyInsightEngine',
  'astrology/humanGuidance',
  'insights/archivePatterns',
  'insights/engine',
  'insights/extraction',
  'insights/geminiInsightsService',
  'insights/generated',
  'insights/generator',
  'insights/legacy',
  'insights/normalizers',
  'insights/pipeline',
  'insights/premium',
  'insights/premiumPipeline',
  'insights/scoring',
  'insights/selection',
  'insightsV2/selectPremiumInsightDraft',
  'lib/insights',
  'storage/insightHistory',
  'utils/deepInsights',
  'utils/insightsEngine',
  'utils/journalInsights',
  'utils/microInsights',
  'utils/narrativeInsights',
  'utils/patternFeed',
  'utils/selfKnowledgeCrossRef',
];

const forbiddenLegacyToolingFragments = [
  ...forbiddenLegacyImportFragments,
  'dailyInsightDrafts',
  'daily_insight_drafts',
  'daily_insight_drafts_premium_final',
  'generated/insights',
  'weighted_insight_drafts',
];

const forbiddenLegacyImportSymbols = [
  'DailyInsightEngine',
  'HumanDailyGuidance',
  'buildPatternFeedInsights',
  'computeEnhancedInsights',
  'runPremiumInsightPipeline',
  'selectPremiumInsightDraft',
];

function walkSourceFiles(dir: string, extensions = sourceExtensions): string[] {
  if (!existsSync(dir)) return [];

  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ignoredSourceDirs.has(entry.name)) continue;

    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkSourceFiles(absolutePath, extensions));
    } else if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

function sourceMentionsForbiddenLegacyToolingPath(source: string): boolean {
  const normalizedSource = normalizeImportPath(source);
  return forbiddenLegacyToolingFragments.some(fragment => normalizedSource.includes(fragment));
}

function normalizeImportPath(value: string): string {
  return value.replace(/\\/g, '/').replace(/\.(tsx?|jsx?)$/, '');
}

function importSpecifiers(source: string): string[] {
  const specs: string[] = [];
  const importFromPattern = /import\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
  const sideEffectImportPattern = /import\s+['"]([^'"]+)['"]/g;
  const requirePattern = /require\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const pattern of [importFromPattern, sideEffectImportPattern, requirePattern]) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      specs.push(normalizeImportPath(match[1]));
    }
  }

  return specs;
}

function sourceImportsForbiddenLegacyPath(source: string): boolean {
  return importSpecifiers(source).some((specifier) =>
    forbiddenLegacyImportFragments.some(fragment => specifier.includes(fragment)),
  );
}

function sourceImportsForbiddenLegacySymbol(source: string): boolean {
  const importStatementPattern = /import\s+(?:type\s+)?[\s\S]*?\s+from\s+['"][^'"]+['"]/g;
  const importStatements = source.match(importStatementPattern) ?? [];

  return importStatements.some(statement =>
    forbiddenLegacyImportSymbols.some(symbol => new RegExp(`\\b${symbol}\\b`).test(statement)),
  );
}

describe('insight OTA safety', () => {
  it('keeps deleted insight engine paths out of the OTA bundle', () => {
    expect(
      deletedInsightEnginePaths.filter(relativePath => existsSync(path.join(repoRoot, relativePath))),
    ).toEqual([]);
  });

  it('keeps runtime source from importing deleted insight systems', () => {
    const offendingFiles = runtimeSourceRoots
      .flatMap(relativeRoot => walkSourceFiles(path.join(repoRoot, relativeRoot)))
      .filter((absolutePath) => {
        if (!statSync(absolutePath).isFile()) return false;

        const source = readFileSync(absolutePath, 'utf8');
        return sourceImportsForbiddenLegacyPath(source) || sourceImportsForbiddenLegacySymbol(source);
      })
      .map(absolutePath => path.relative(repoRoot, absolutePath));

    expect(offendingFiles).toEqual([]);
  });

  it('keeps tooling from regenerating deleted insight systems', () => {
    const offendingFiles = toolingSourceRoots
      .flatMap(relativeRoot => walkSourceFiles(path.join(repoRoot, relativeRoot), toolingExtensions))
      .filter((absolutePath) => {
        if (!statSync(absolutePath).isFile()) return false;

        const source = readFileSync(absolutePath, 'utf8');
        return sourceMentionsForbiddenLegacyToolingPath(source);
      })
      .map(absolutePath => path.relative(repoRoot, absolutePath));

    expect(offendingFiles).toEqual([]);
  });

  it('ignores malformed persisted history entries in timing decisions', () => {
    const malformedHistory = [
      null,
      {},
      { shownAt: undefined, title: undefined },
      {
        id: 'old-history',
        patternKey: 'relationships_toneShift',
        slot: 'whatMySkyNoticed',
        surface: 'today',
        title: 'Deep relationship pattern',
        shownAt: '2026-04-24T09:00:00Z',
        copyHash: 'copy-1',
      },
    ] as unknown as InsightHistoryItem[];

    expect(() => buildInsightTimingDecision({
      stateProfile: profile(),
      history: malformedHistory,
      date: '2026-04-24T12:00:00Z',
    })).not.toThrow();

    const decision = buildInsightTimingDecision({
      stateProfile: profile(),
      history: malformedHistory,
      date: '2026-04-24T12:00:00Z',
    });

    expect(decision.deliveryMode).toBe('space');
  });

  it('falls back safely when timing receives partial state metadata', () => {
    const decision = buildInsightTimingDecision({
      stateProfile: null,
      history: null,
      date: null,
    });

    expect(decision.deliveryMode).toBe('novelty');
    expect(decision.reasonCodes).toContain('state:calm');
  });

  it('keeps state scoring additive when old or partial data is present', () => {
    const malformedSignals = [
      null,
      { key: 'overwhelm', date: undefined, strength: '0.8' },
      {
        key: 'low_sleep',
        source: 'dailyCheckIn',
        date: '2026-04-24',
        strength: 0.8,
      },
    ] as unknown as UserSignal[];

    expect(() => detectCurrentInsightState(malformedSignals, '2026-04-24T12:00:00Z')).not.toThrow();

    const score = stateAwareParagraphScore({
      writerShape: 'tender',
      tone: 'tender',
      intensity: 'low',
      body: 'One. Two. Three. Four.',
    }, {
      ...profile(),
      preferredWriterShapes: undefined,
      preferredTones: undefined,
      preferredIntensities: undefined,
      preferredSentenceCounts: undefined,
    } as unknown as CurrentInsightStateProfile);

    expect(Number.isFinite(score)).toBe(true);
  });

  it('builds Today insights when optional arrays arrive as null from an older bundle/cache', async () => {
    await expect(buildTodayInsights({
      date: '2026-04-24T12:00:00Z',
      rawInputs: {
        dailyCheckIns: [{
          date: '2026-04-24',
          mood: 2,
          energy: 1,
          stress: 4,
          tags: ['rest'],
        }],
        journals: [{
          date: '2026-04-24',
          text: 'I feel guilty for resting.',
        }],
      },
      history: null,
      previousPatternScores: null,
    } as unknown as Parameters<typeof buildTodayInsights>[0])).resolves.toEqual(expect.objectContaining({
      currentState: expect.any(String),
      deliveryMode: expect.any(String),
    }));
  });

  it('builds an empty result instead of crashing when required runtime inputs are absent', async () => {
    await expect(buildTodayInsights({
      date: null,
      rawInputs: null,
      history: null,
      previousPatternScores: null,
    } as unknown as Parameters<typeof buildTodayInsights>[0])).resolves.toEqual(expect.objectContaining({
      insights: expect.any(Array),
      patternScores: expect.any(Array),
    }));
  });
});
