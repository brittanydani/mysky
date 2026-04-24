import { EncryptedAsyncStorage } from '../../storage/encryptedAsyncStorage';
import { getAnswersByCategory, getDraftAnswersByCategory, loadReflections } from '../dailyReflectionService';
import { loadSomaticEntries } from '../../storage/selfKnowledgeStore';
import {
  getSomaticReflectionCorrelations,
  syncArchetypeProfileFromReflections,
  syncCognitiveStyleFromReflections,
  syncCoreValuesFromReflections,
} from '../reflectionProfileSync';

jest.mock('../../storage/encryptedAsyncStorage', () => ({
  EncryptedAsyncStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

jest.mock('../dailyReflectionService', () => ({
  getAnswersByCategory: jest.fn(),
  getDraftAnswersByCategory: jest.fn(),
  loadReflections: jest.fn(),
}));

jest.mock('../../storage/selfKnowledgeStore', () => ({
  loadSomaticEntries: jest.fn(),
}));

const mockedStorage = EncryptedAsyncStorage as jest.Mocked<typeof EncryptedAsyncStorage>;
const mockedGetAnswersByCategory = getAnswersByCategory as jest.MockedFunction<typeof getAnswersByCategory>;
const mockedGetDraftAnswersByCategory = getDraftAnswersByCategory as jest.MockedFunction<typeof getDraftAnswersByCategory>;
const mockedLoadReflections = loadReflections as jest.MockedFunction<typeof loadReflections>;
const mockedLoadSomaticEntries = loadSomaticEntries as jest.MockedFunction<typeof loadSomaticEntries>;

describe('syncArchetypeProfileFromReflections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetDraftAnswersByCategory.mockResolvedValue([]);
    mockedLoadReflections.mockResolvedValue({ answers: [], totalDaysCompleted: 0, startedAt: null });
    mockedLoadSomaticEntries.mockResolvedValue([]);
  });

  it('merges draft archetype answers into the visible score breakdown while preserving quiz scores', async () => {
    mockedGetAnswersByCategory.mockResolvedValue([
      {
        questionId: 0,
        category: 'archetypes',
        questionText: 'Hero question',
        answer: 'True',
        scaleValue: 2,
        date: '2026-04-04',
        sealedAt: '2026-04-04T08:00:00.000Z',
      },
    ]);
    mockedGetDraftAnswersByCategory.mockResolvedValue([
      {
        questionId: 30,
        category: 'archetypes',
        questionText: 'Caregiver question',
        answer: 'Very True',
        scaleValue: 3,
        date: '2026-04-04',
      },
    ]);
    mockedStorage.getItem.mockResolvedValue(JSON.stringify({
      dominant: 'hero',
      scores: { hero: 2, caregiver: 1, seeker: 1, sage: 1, rebel: 0 },
      completedAt: '2026-03-17T10:00:00.000Z',
    }));

    await syncArchetypeProfileFromReflections({ includeDrafts: true });

    expect(mockedStorage.setItem).toHaveBeenCalledTimes(1);
    const [, rawProfile] = mockedStorage.setItem.mock.calls[0];
    const savedProfile = JSON.parse(rawProfile);

    expect(savedProfile.quizScores).toEqual({ hero: 2, caregiver: 1, seeker: 1, sage: 1, rebel: 0 });
    expect(savedProfile.reflectionScores).toEqual({ hero: 1, caregiver: 1, seeker: 0, sage: 0, rebel: 0 });
    expect(savedProfile.reflectionWeightedScores).toEqual({ hero: 2, caregiver: 3, seeker: 0, sage: 0, rebel: 0 });
    expect(savedProfile.scores).toEqual({ hero: 3, caregiver: 2, seeker: 1, sage: 1, rebel: 0 });
    expect(savedProfile.dominant).toBe('hero');
  });

  it('prefers an in-progress draft over the sealed answer for the same daily question', async () => {
    mockedGetAnswersByCategory.mockResolvedValue([
      {
        questionId: 0,
        category: 'archetypes',
        questionText: 'Hero question',
        answer: 'Somewhat',
        scaleValue: 1,
        date: '2026-04-04',
        sealedAt: '2026-04-04T08:00:00.000Z',
      },
    ]);
    mockedGetDraftAnswersByCategory.mockResolvedValue([
      {
        questionId: 0,
        category: 'archetypes',
        questionText: 'Hero question',
        answer: 'Very True',
        scaleValue: 3,
        date: '2026-04-04',
      },
    ]);
    mockedStorage.getItem.mockResolvedValue(null);

    await syncArchetypeProfileFromReflections({ includeDrafts: true });

    const [, rawProfile] = mockedStorage.setItem.mock.calls[0];
    const savedProfile = JSON.parse(rawProfile);
    expect(savedProfile.reflectionScores.hero).toBe(1);
    expect(savedProfile.reflectionWeightedScores.hero).toBe(3);
    expect(savedProfile.scores.hero).toBe(1);
  });

  it('uses manual cognitive scores as the stable baseline when draft reflections update live', async () => {
    mockedGetAnswersByCategory.mockResolvedValue([
      {
        questionId: 33,
        category: 'cognitive',
        questionText: 'Scope question',
        answer: 'Very True',
        scaleValue: 3,
        date: '2026-04-04',
        sealedAt: '2026-04-04T08:00:00.000Z',
      },
    ] as Awaited<ReturnType<typeof getAnswersByCategory>>);
    mockedGetDraftAnswersByCategory.mockResolvedValue([
      {
        questionId: 44,
        category: 'cognitive',
        questionText: 'Processing question',
        answer: 'Very True',
        scaleValue: 3,
        date: '2026-04-04',
      },
    ] as Awaited<ReturnType<typeof getDraftAnswersByCategory>>);
    mockedStorage.getItem.mockResolvedValue(JSON.stringify({
      scope: 4,
      processing: 2,
      decisions: 5,
      manualScores: { scope: 4, processing: 2, decisions: 5 },
    }));

    await syncCognitiveStyleFromReflections({ includeDrafts: true });

    const [, rawProfile] = mockedStorage.setItem.mock.calls[0];
    const savedProfile = JSON.parse(rawProfile);
    expect(savedProfile.manualScores).toEqual({ scope: 4, processing: 2, decisions: 5 });
    expect(savedProfile.reflectionScores).toEqual({ scope: 1, processing: 5 });
    expect(savedProfile.scope).toBe(3);
    expect(savedProfile.processing).toBe(3);
    expect(savedProfile.decisions).toBe(5);
  });

  it('lets non-explicit cognitive prompts reinforce the relevant dimension instead of being ignored', async () => {
    mockedGetAnswersByCategory.mockResolvedValue([] as Awaited<ReturnType<typeof getAnswersByCategory>>);
    mockedGetDraftAnswersByCategory.mockResolvedValue([
      {
        questionId: 302,
        category: 'cognitive',
        questionText: 'Creativity question',
        answer: 'Very True',
        scaleValue: 3,
        date: '2026-04-04',
      },
    ] as Awaited<ReturnType<typeof getDraftAnswersByCategory>>);
    mockedStorage.getItem.mockResolvedValue(JSON.stringify({
      scope: 4,
      processing: 2,
      decisions: 3,
      manualScores: { scope: 4, processing: 2, decisions: 3 },
    }));

    await syncCognitiveStyleFromReflections({ includeDrafts: true });

    const [, rawProfile] = mockedStorage.setItem.mock.calls[0];
    const savedProfile = JSON.parse(rawProfile);
    expect(savedProfile.reflectionScores.scope).toBe(5);
    expect(savedProfile.scope).toBe(4);
  });

  it('includes draft value reflections when auto-selecting core values', async () => {
    mockedGetAnswersByCategory.mockResolvedValue([] as Awaited<ReturnType<typeof getAnswersByCategory>>);
    mockedGetDraftAnswersByCategory.mockResolvedValue([
      {
        questionId: 0,
        category: 'values',
        questionText: 'Purpose question',
        answer: 'Very True',
        scaleValue: 3,
        date: '2026-04-04',
      },
      {
        questionId: 1,
        category: 'values',
        questionText: 'Purpose question 2',
        answer: 'True',
        scaleValue: 3,
        date: '2026-04-04',
      },
    ] as Awaited<ReturnType<typeof getDraftAnswersByCategory>>);
    mockedStorage.getItem.mockResolvedValue(JSON.stringify({
      selected: ['Autonomy'],
      topFive: ['Autonomy'],
    }));

    await syncCoreValuesFromReflections({ includeDrafts: true });

    const [, rawProfile] = mockedStorage.setItem.mock.calls[0];
    const savedProfile = JSON.parse(rawProfile);
    expect(savedProfile.topFive).toEqual(['Autonomy']);
    expect(savedProfile.selected).toEqual(expect.arrayContaining(['Autonomy', 'Purpose', 'Presence', 'Faith']));
  });

  it('uses later-range values prompts when deriving reflection-driven value selections', async () => {
    mockedGetAnswersByCategory.mockResolvedValue([] as Awaited<ReturnType<typeof getAnswersByCategory>>);
    mockedGetDraftAnswersByCategory.mockResolvedValue([
      {
        questionId: 418,
        category: 'values',
        questionText: 'Leadership question',
        answer: 'Very True',
        scaleValue: 3,
        date: '2026-04-04',
      },
      {
        questionId: 420,
        category: 'values',
        questionText: 'Leadership question 2',
        answer: 'Very True',
        scaleValue: 3,
        date: '2026-04-04',
      },
    ] as Awaited<ReturnType<typeof getDraftAnswersByCategory>>);
    mockedStorage.getItem.mockResolvedValue(JSON.stringify({
      selected: [],
      topFive: [],
    }));

    await syncCoreValuesFromReflections({ includeDrafts: true });

    const [, rawProfile] = mockedStorage.setItem.mock.calls[0];
    const savedProfile = JSON.parse(rawProfile);
    expect(savedProfile.selected).toEqual(expect.arrayContaining(['Leadership', 'Service', 'Courage']));
  });

  it('falls back to an overall somatic pattern when the same reflection days drive every category', async () => {
    mockedLoadReflections.mockResolvedValue({
      answers: [
        { category: 'values', date: '2026-04-01' },
        { category: 'archetypes', date: '2026-04-01' },
        { category: 'cognitive', date: '2026-04-01' },
        { category: 'values', date: '2026-04-02' },
        { category: 'archetypes', date: '2026-04-02' },
        { category: 'cognitive', date: '2026-04-02' },
      ] as any,
      totalDaysCompleted: 2,
      startedAt: null,
    });
    mockedLoadSomaticEntries.mockResolvedValue([
      { date: '2026-04-01T08:00:00.000Z', emotion: 'Tension', intensity: 3 } as any,
      { date: '2026-04-02T08:00:00.000Z', emotion: 'Tension', intensity: 2 } as any,
    ]);

    await expect(getSomaticReflectionCorrelations()).resolves.toEqual([
      { category: 'overall', topEmotion: 'Tension', count: 2 },
    ]);
  });

  it('returns a category emotion when it is more specific than the overall reflection baseline', async () => {
    mockedLoadReflections.mockResolvedValue({
      answers: [
        { category: 'values', date: '2026-04-01' },
        { category: 'values', date: '2026-04-02' },
        { category: 'archetypes', date: '2026-04-03' },
        { category: 'archetypes', date: '2026-04-04' },
        { category: 'cognitive', date: '2026-04-05' },
        { category: 'cognitive', date: '2026-04-06' },
      ] as any,
      totalDaysCompleted: 6,
      startedAt: null,
    });
    mockedLoadSomaticEntries.mockResolvedValue([
      { date: '2026-04-01T08:00:00.000Z', emotion: 'Warmth', intensity: 3 } as any,
      { date: '2026-04-02T08:00:00.000Z', emotion: 'Warmth', intensity: 2 } as any,
      { date: '2026-04-03T08:00:00.000Z', emotion: 'Tension', intensity: 3 } as any,
      { date: '2026-04-04T08:00:00.000Z', emotion: 'Tension', intensity: 2 } as any,
      { date: '2026-04-05T08:00:00.000Z', emotion: 'Calm', intensity: 3 } as any,
      { date: '2026-04-06T08:00:00.000Z', emotion: 'Warmth', intensity: 2 } as any,
    ]);

    await expect(getSomaticReflectionCorrelations()).resolves.toEqual([
      { category: 'values', topEmotion: 'Warmth', count: 2 },
      { category: 'archetypes', topEmotion: 'Tension', count: 2 },
    ]);
  });

  it('uses the dominant somatic emotion for each day instead of counting every logged emotion equally', async () => {
    mockedLoadReflections.mockResolvedValue({
      answers: [
        { category: 'values', date: '2026-04-01' },
        { category: 'values', date: '2026-04-02' },
        { category: 'archetypes', date: '2026-04-03' },
        { category: 'archetypes', date: '2026-04-04' },
      ] as any,
      totalDaysCompleted: 4,
      startedAt: null,
    });
    mockedLoadSomaticEntries.mockResolvedValue([
      { date: '2026-04-01T08:00:00.000Z', emotion: 'Warmth', intensity: 4 } as any,
      { date: '2026-04-01T08:30:00.000Z', emotion: 'Tension', intensity: 1 } as any,
      { date: '2026-04-02T08:00:00.000Z', emotion: 'Warmth', intensity: 3 } as any,
      { date: '2026-04-03T08:00:00.000Z', emotion: 'Tension', intensity: 4 } as any,
      { date: '2026-04-03T08:30:00.000Z', emotion: 'Warmth', intensity: 1 } as any,
      { date: '2026-04-04T08:00:00.000Z', emotion: 'Tension', intensity: 3 } as any,
    ]);

    await expect(getSomaticReflectionCorrelations()).resolves.toEqual([
      { category: 'values', topEmotion: 'Warmth', count: 2 },
      { category: 'archetypes', topEmotion: 'Tension', count: 2 },
    ]);
  });
});
