import { supabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';
import {
  addRelationshipPattern,
  loadDailyReflectionData,
  loadRelationshipPatterns,
  persistDailyReflectionData,
  type RelationshipPatternRecord,
} from '../selfKnowledgeStore';
import type { DailyReflectionData, ReflectionAnswer } from '../../insights/dailyReflectionService';

const mockUserPreferences = new Map<string, unknown>();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('../userProfileService', () => ({
  getUserPreference: jest.fn((key: string, fallback: unknown) => (
    Promise.resolve(mockUserPreferences.has(key) ? mockUserPreferences.get(key) : fallback)
  )),
  saveUserPreference: jest.fn((key: string, payload: unknown) => {
    mockUserPreferences.set(key, payload);
    return Promise.resolve();
  }),
}));

const RELATIONSHIP_PATTERNS_CACHE_KEY = '@mysky:cache:relationship_patterns';

function makeSelectQuery(result: unknown) {
  const query = {} as {
    select: jest.Mock;
    eq: jest.Mock;
    in: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
  };

  query.select = jest.fn(() => query);
  query.eq = jest.fn(() => query);
  query.in = jest.fn(() => query);
  query.order = jest.fn(() => query);
  query.limit = jest.fn(async () => result);

  return query;
}

function makeDailyReflectionIdLookupQuery(result: unknown) {
  const query = {} as {
    select: jest.Mock;
    eq: jest.Mock;
    in: jest.Mock;
  };

  query.select = jest.fn(() => query);
  query.eq = jest.fn(() => query);
  query.in = jest.fn(() => query);
  query.in.mockReturnValueOnce(query).mockReturnValueOnce(query).mockResolvedValueOnce(result);

  return query;
}

function makeUpsertQuery(error: unknown) {
  return {
    upsert: jest.fn(async () => ({ error })),
  };
}

const DAILY_REFLECTIONS_CACHE_KEY = '@mysky:cache:daily_reflections';

function makeReflectionAnswer(overrides: Partial<ReflectionAnswer> = {}): ReflectionAnswer {
  return {
    questionId: 12,
    category: 'values',
    questionText: 'What mattered today?',
    answer: 'True',
    scaleValue: 2,
    date: '2026-05-03',
    sealedAt: '2026-05-03T12:00:00.000Z',
    ...overrides,
  };
}

describe('selfKnowledgeStore daily reflections', () => {
  const supabaseFrom = supabase.from as jest.Mock;
  const getSession = supabase.auth.getSession as jest.Mock;

  beforeEach(() => {
    mockUserPreferences.clear();
    jest.clearAllMocks();
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });
  });

  it('writes daily reflection rows with user-scoped ids', async () => {
    const answer = makeReflectionAnswer();
    const lookup = makeDailyReflectionIdLookupQuery({ data: [], error: null });
    const upsert = makeUpsertQuery(null);
    supabaseFrom
      .mockReturnValueOnce(lookup)
      .mockReturnValueOnce(upsert);

    await persistDailyReflectionData({
      answers: [answer],
      totalDaysCompleted: 1,
      startedAt: answer.sealedAt,
    }, [answer]);

    const rows = (upsert.upsert as jest.Mock).mock.calls[0][0] as Record<string, unknown>[];
    expect(rows[0]).toMatchObject({
      id: 'user-1:2026-05-03:12:values',
      user_id: 'user-1',
      question_id: 12,
      category: 'values',
    });
    expect(upsert.upsert).toHaveBeenCalledWith(rows, { onConflict: 'id' });
  });

  it('keeps existing legacy row ids when updating saved daily reflections', async () => {
    const answer = makeReflectionAnswer({ answer: 'Very True', sealedAt: '2026-05-03T13:00:00.000Z' });
    const lookup = makeDailyReflectionIdLookupQuery({
      data: [{
        id: '2026-05-03:12:values',
        date: '2026-05-03',
        category: 'values',
        question_id: 12,
      }],
      error: null,
    });
    const upsert = makeUpsertQuery(null);
    supabaseFrom
      .mockReturnValueOnce(lookup)
      .mockReturnValueOnce(upsert);

    await persistDailyReflectionData({
      answers: [answer],
      totalDaysCompleted: 1,
      startedAt: answer.sealedAt,
    }, [answer]);

    const rows = (upsert.upsert as jest.Mock).mock.calls[0][0] as Record<string, unknown>[];
    expect(rows[0].id).toBe('2026-05-03:12:values');
  });

  it('uses Supabase daily reflection rows instead of cached fallback data', async () => {
    const remoteAnswer = makeReflectionAnswer({
      questionId: 12,
      answer: 'Somewhat',
      sealedAt: '2026-05-03T12:00:00.000Z',
    });
    const newerCachedAnswer = makeReflectionAnswer({
      questionId: 12,
      answer: 'Very True',
      sealedAt: '2026-05-03T13:00:00.000Z',
    });
    const cachedOnlyAnswer = makeReflectionAnswer({
      questionId: 13,
      questionText: 'What did you protect?',
      answer: 'True',
      sealedAt: '2026-05-03T13:05:00.000Z',
    });
    const cachedData: DailyReflectionData = {
      answers: [newerCachedAnswer, cachedOnlyAnswer],
      totalDaysCompleted: 1,
      startedAt: newerCachedAnswer.sealedAt,
    };
    mockUserPreferences.set(DAILY_REFLECTIONS_CACHE_KEY, cachedData);
    const select = makeSelectQuery({
      data: [{
        id: 'user-1:2026-05-03:12:values',
        question_id: remoteAnswer.questionId,
        category: remoteAnswer.category,
        question_text: remoteAnswer.questionText,
        answer: remoteAnswer.answer,
        scale_value: remoteAnswer.scaleValue,
        date: remoteAnswer.date,
        sealed_at: remoteAnswer.sealedAt,
        notes: null,
        is_deleted: false,
      }],
      error: null,
    });
    supabaseFrom.mockReturnValueOnce(select);

    await expect(loadDailyReflectionData()).resolves.toMatchObject({
      totalDaysCompleted: 1,
      answers: [
        expect.objectContaining({ questionId: 12, answer: 'Somewhat' }),
      ],
    });
    expect(mockUserPreferences.get(DAILY_REFLECTIONS_CACHE_KEY)).toMatchObject({
      answers: [
        expect.objectContaining({ questionId: 12, answer: 'Somewhat' }),
      ],
    });
  });
});

describe('selfKnowledgeStore relationship patterns', () => {
  const supabaseFrom = supabase.from as jest.Mock;
  const getSession = supabase.auth.getSession as jest.Mock;
  const warn = logger.warn as jest.Mock;

  beforeEach(() => {
    mockUserPreferences.clear();
    jest.clearAllMocks();
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });
  });

  it('loads relationship patterns from legacy schemas without bridge-column warnings', async () => {
    const cached: RelationshipPatternRecord[] = [{
      id: 'pattern-1',
      date: '2026-05-01T12:00:00.000Z',
      note: 'Cached note',
      tags: ['People-pleasing'],
      activatedEmotions: ['fear'],
      needs: ['space'],
      stateBefore: 'flight',
      stateAfter: 'secure',
    }];
    mockUserPreferences.set(RELATIONSHIP_PATTERNS_CACHE_KEY, cached);

    const missingBridgeColumnError = {
      code: '42703',
      message: 'column relationship_patterns.activated_emotions does not exist',
      details: null,
      hint: null,
    };
    const fullQuery = makeSelectQuery({ data: null, error: missingBridgeColumnError });
    const legacyQuery = makeSelectQuery({
      data: [{
        id: 'pattern-1',
        date: '2026-05-01T12:00:00.000Z',
        note: 'Remote note',
        tags: ['People-pleasing'],
        is_deleted: false,
      }],
      error: null,
    });
    supabaseFrom
      .mockReturnValueOnce(fullQuery)
      .mockReturnValueOnce(legacyQuery);

    await expect(loadRelationshipPatterns()).resolves.toEqual([{
      ...cached[0],
      note: 'Remote note',
    }]);
    expect(fullQuery.select).toHaveBeenCalledWith(expect.stringContaining('activated_emotions'));
    expect(legacyQuery.select).toHaveBeenCalledWith(expect.not.stringContaining('activated_emotions'));
    expect(warn).not.toHaveBeenCalledWith(
      '[SelfKnowledgeStore] Falling back to cached relationship patterns',
      expect.anything(),
    );
  });

  it('retries relationship pattern upserts without bridge columns when schema cache is behind', async () => {
    const entry: RelationshipPatternRecord = {
      id: 'pattern-2',
      date: '2026-05-01T12:15:00.000Z',
      note: 'A new pattern',
      tags: ['Going quiet'],
      activatedEmotions: ['shame'],
      needs: ['clarity'],
      stateBefore: 'freeze',
      stateAfter: 'secure',
    };
    const missingBridgeColumnError = {
      code: 'PGRST204',
      message: "Could not find the 'activated_emotions' column of 'relationship_patterns' in the schema cache",
    };
    const fullUpsert = makeUpsertQuery(missingBridgeColumnError);
    const legacyUpsert = makeUpsertQuery(null);
    supabaseFrom
      .mockReturnValueOnce(fullUpsert)
      .mockReturnValueOnce(legacyUpsert);

    await addRelationshipPattern(entry);

    const fullUpsertRows = (fullUpsert.upsert as jest.Mock).mock.calls[0][0] as Record<string, unknown>[];
    const legacyUpsertRows = (legacyUpsert.upsert as jest.Mock).mock.calls[0][0] as Record<string, unknown>[];

    expect(fullUpsertRows[0]).toMatchObject({
      activated_emotions: ['shame'],
      needs: ['clarity'],
      state_before: 'freeze',
      state_after: 'secure',
    });
    expect(legacyUpsertRows[0]).toMatchObject({
      id: 'pattern-2',
      note: 'A new pattern',
      tags: ['Going quiet'],
    });
    expect(legacyUpsertRows[0]).not.toHaveProperty('activated_emotions');
    expect(legacyUpsertRows[0]).not.toHaveProperty('needs');
    expect(legacyUpsertRows[0]).not.toHaveProperty('state_before');
    expect(legacyUpsertRows[0]).not.toHaveProperty('state_after');
    expect(warn).not.toHaveBeenCalledWith(
      '[SelfKnowledgeStore] Failed to persist relationship pattern to Supabase',
      expect.anything(),
    );
  });
});
