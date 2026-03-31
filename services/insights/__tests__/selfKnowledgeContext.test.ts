// ── Inline maps for all storage layers ──────────────────────────────────────
const plainStore = new Map<string, string>();
const encryptedStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => plainStore.get(key) ?? null),
  setItem: jest.fn(async (key: string, v: string) => { plainStore.set(key, v); }),
  removeItem: jest.fn(async (key: string) => { plainStore.delete(key); }),
}));

jest.mock('../../storage/encryptedAsyncStorage', () => ({
  EncryptedAsyncStorage: {
    getItem: jest.fn(async (key: string) => encryptedStore.get(key) ?? null),
    setItem: jest.fn(async (key: string, v: string) => { encryptedStore.set(key, v); }),
    removeItem: jest.fn(async (key: string) => { encryptedStore.delete(key); }),
  },
}));

const mockGetReflectionSummary = jest.fn();
jest.mock('../dailyReflectionService', () => ({
  getReflectionSummary: mockGetReflectionSummary,
}));

jest.mock('../../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { loadSelfKnowledgeContext } from '../selfKnowledgeContext';

const KEYS = {
  coreValues:           '@mysky:core_values',
  archetypeProfile:     '@mysky:archetype_profile',
  cognitiveStyle:       '@mysky:cognitive_style',
  somaticEntries:       '@mysky:somatic_entries',
  triggerEvents:        '@mysky:trigger_events',
  relationshipPatterns: '@mysky:relationship_patterns',
};

describe('selfKnowledgeContext – loadSelfKnowledgeContext()', () => {
  beforeEach(() => {
    plainStore.clear();
    encryptedStore.clear();
    jest.clearAllMocks();
    mockGetReflectionSummary.mockResolvedValue(null);
  });

  it('returns all-null/empty context when nothing is stored', async () => {
    const ctx = await loadSelfKnowledgeContext();
    expect(ctx.coreValues).toBeNull();
    expect(ctx.archetypeProfile).toBeNull();
    expect(ctx.cognitiveStyle).toBeNull();
    expect(ctx.somaticEntries).toEqual([]);
    expect(ctx.triggers).toBeNull();
    expect(ctx.relationshipPatterns).toEqual([]);
    expect(ctx.dailyReflections).toBeNull();
  });

  it('loads coreValues from plain AsyncStorage', async () => {
    const cv = { selected: ['courage', 'love'], topFive: ['courage'] };
    plainStore.set(KEYS.coreValues, JSON.stringify(cv));
    const ctx = await loadSelfKnowledgeContext();
    expect(ctx.coreValues).toEqual(cv);
  });

  it('loads archetypeProfile from encrypted AsyncStorage', async () => {
    const profile = {
      dominant: 'sage' as const,
      scores: { hero: 1, caregiver: 0, seeker: 2, sage: 3, rebel: 0 },
      completedAt: '2026-01-01T10:00:00.000Z',
    };
    encryptedStore.set(KEYS.archetypeProfile, JSON.stringify(profile));
    const ctx = await loadSelfKnowledgeContext();
    expect(ctx.archetypeProfile).toEqual(profile);
  });

  it('loads cognitiveStyle from encrypted AsyncStorage', async () => {
    const style = { scope: 3, processing: 2, decisions: 4 };
    encryptedStore.set(KEYS.cognitiveStyle, JSON.stringify(style));
    const ctx = await loadSelfKnowledgeContext();
    expect(ctx.cognitiveStyle).toEqual(style);
  });

  it('loads somaticEntries from encrypted AsyncStorage', async () => {
    const entries = [
      { id: '1', date: '2026-01-01T00:00:00Z', region: 'chest', emotion: 'anxiety', intensity: 3 },
    ];
    encryptedStore.set(KEYS.somaticEntries, JSON.stringify(entries));
    const ctx = await loadSelfKnowledgeContext();
    expect(ctx.somaticEntries).toEqual(entries);
  });

  it('returns empty array for somaticEntries when stored value is null', async () => {
    encryptedStore.set(KEYS.somaticEntries, 'null');
    const ctx = await loadSelfKnowledgeContext();
    expect(ctx.somaticEntries).toEqual([]);
  });

  describe('trigger loading', () => {
    it('converts TriggerEvent[] into drains/restores data', async () => {
      const events = [
        { id: '1', timestamp: 1000, mode: 'drain', event: 'Loud noise', nsState: 'activated', sensations: [] },
        { id: '2', timestamp: 2000, mode: 'nourish', event: 'Nature walk', nsState: 'calm', sensations: [] },
        { id: '3', timestamp: 3000, mode: 'drain', event: 'Loud noise', nsState: 'activated', sensations: [] },
      ];
      encryptedStore.set(KEYS.triggerEvents, JSON.stringify(events));
      const ctx = await loadSelfKnowledgeContext();
      // Deduplicates 'Loud noise'
      expect(ctx.triggers?.drains).toEqual(['Loud noise']);
      expect(ctx.triggers?.restores).toEqual(['Nature walk']);
    });

    it('returns null triggers when no events are stored', async () => {
      const ctx = await loadSelfKnowledgeContext();
      expect(ctx.triggers).toBeNull();
    });

    it('returns null triggers when all events have empty event strings', async () => {
      const events = [{ id: '1', timestamp: 1000, mode: 'drain', event: '  ', nsState: 'activated', sensations: [] }];
      encryptedStore.set(KEYS.triggerEvents, JSON.stringify(events));
      const ctx = await loadSelfKnowledgeContext();
      expect(ctx.triggers).toBeNull();
    });

    it('returns null triggers when array is empty', async () => {
      encryptedStore.set(KEYS.triggerEvents, JSON.stringify([]));
      const ctx = await loadSelfKnowledgeContext();
      expect(ctx.triggers).toBeNull();
    });
  });

  it('loads relationshipPatterns from encrypted AsyncStorage', async () => {
    const patterns = [{ id: '1', date: '2026-01-01', note: 'avoidant', tags: ['avoidance'] }];
    encryptedStore.set(KEYS.relationshipPatterns, JSON.stringify(patterns));
    const ctx = await loadSelfKnowledgeContext();
    expect(ctx.relationshipPatterns).toEqual(patterns);
  });

  it('returns empty array for relationshipPatterns when none stored', async () => {
    const ctx = await loadSelfKnowledgeContext();
    expect(ctx.relationshipPatterns).toEqual([]);
  });

  it('includes reflectionSummary when getReflectionSummary resolves', async () => {
    const summary = { totalAnswers: 10, totalDays: 5, streak: 3, byCategory: {}, recentAnswers: [], reflectionDates: [] };
    mockGetReflectionSummary.mockResolvedValue(summary);
    const ctx = await loadSelfKnowledgeContext();
    expect(ctx.dailyReflections).toEqual(summary);
  });

  it('returns null dailyReflections when getReflectionSummary throws', async () => {
    mockGetReflectionSummary.mockRejectedValue(new Error('db locked'));
    const ctx = await loadSelfKnowledgeContext();
    expect(ctx.dailyReflections).toBeNull();
  });

  it('does not throw when plain AsyncStorage value is malformed JSON', async () => {
    plainStore.set(KEYS.coreValues, '{bad json');
    await expect(loadSelfKnowledgeContext()).resolves.not.toThrow();
    const ctx = await loadSelfKnowledgeContext();
    expect(ctx.coreValues).toBeNull();
  });

  it('does not throw when encrypted AsyncStorage value is malformed JSON', async () => {
    encryptedStore.set(KEYS.archetypeProfile, '<<<not json>>>');
    await expect(loadSelfKnowledgeContext()).resolves.not.toThrow();
    const ctx = await loadSelfKnowledgeContext();
    expect(ctx.archetypeProfile).toBeNull();
  });
});
