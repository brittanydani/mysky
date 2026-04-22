const asyncStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => asyncStore.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => { asyncStore.set(key, value); }),
  removeItem: jest.fn(async (key: string) => { asyncStore.delete(key); }),
}));

const mockGetSession = jest.fn<Promise<{ data: { session: { user: { id: string } } | null } }>, []>(
  async () => ({ data: { session: null } })
);

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

import { AccountScopedAsyncStorage } from '../accountScopedStorage';

describe('AccountScopedAsyncStorage', () => {
  beforeEach(() => {
    asyncStore.clear();
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('uses the legacy key when no user is signed in', async () => {
    await AccountScopedAsyncStorage.setItem('mysky_custom_journal_tags', '["dreams"]');

    expect(asyncStore.get('mysky_custom_journal_tags')).toBe('["dreams"]');
  });

  it('uses a user-scoped key when a user is signed in', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-123' } } } });

    await AccountScopedAsyncStorage.setItem('mysky_custom_journal_tags', '["dreams"]');

    expect(asyncStore.get('mysky_custom_journal_tags::user::user-123')).toBe('["dreams"]');
    expect(asyncStore.has('mysky_custom_journal_tags')).toBe(false);
  });

  it('migrates a legacy value into the current user namespace on read', async () => {
    asyncStore.set('mysky_custom_journal_tags', '["gratitude"]');
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-123' } } } });

    const value = await AccountScopedAsyncStorage.getItem('mysky_custom_journal_tags');

    expect(value).toBe('["gratitude"]');
    expect(asyncStore.get('mysky_custom_journal_tags::user::user-123')).toBe('["gratitude"]');
    expect(asyncStore.has('mysky_custom_journal_tags')).toBe(false);
  });
});