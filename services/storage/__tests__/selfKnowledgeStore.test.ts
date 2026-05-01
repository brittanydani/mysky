import { supabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';
import {
  addRelationshipPattern,
  loadRelationshipPatterns,
  type RelationshipPatternRecord,
} from '../selfKnowledgeStore';

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
    order: jest.Mock;
    limit: jest.Mock;
  };

  query.select = jest.fn(() => query);
  query.eq = jest.fn(() => query);
  query.order = jest.fn(() => query);
  query.limit = jest.fn(async () => result);

  return query;
}

function makeUpsertQuery(error: unknown) {
  return {
    upsert: jest.fn(async () => ({ error })),
  };
}

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
