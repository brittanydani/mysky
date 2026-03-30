/**
 * checkInStore — unit tests
 *
 * Tests the Zustand store logic for saving and loading daily check-ins.
 * supabase is mocked inline so no network calls are made.
 */

// ─── Mock supabase before imports ─────────────────────────────────────────────

const mockUpsert = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockRpc = jest.fn();
const mockGetSession = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
    from: jest.fn(() => ({
      upsert: mockUpsert,
      select: jest.fn(() => ({ eq: mockEq })),
    })),
    rpc: mockRpc,
  },
}));

// Also mock expo-secure-store transitively required by lib/supabase
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { useCheckInStore } from '../checkInStore';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getStore() {
  return useCheckInStore.getState();
}

function resetStore() {
  useCheckInStore.setState({
    isSaving: false,
    isLoadingToday: false,
    saveStatus: 'idle',
    error: null,
    todayMood: null,
  });
}

function mockAuthenticated(userId = 'user-123') {
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: userId } } },
    error: null,
  });
}

function mockUnauthenticated() {
  mockGetSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
}

function mockAuthError(message = 'Auth failed') {
  mockGetSession.mockResolvedValue({
    data: { session: null },
    error: { message },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup / teardown
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('defaults to idle with no error', () => {
    const state = getStore();
    expect(state.isSaving).toBe(false);
    expect(state.isLoadingToday).toBe(false);
    expect(state.saveStatus).toBe('idle');
    expect(state.error).toBeNull();
    expect(state.todayMood).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resetStatus
// ─────────────────────────────────────────────────────────────────────────────

describe('resetStatus', () => {
  it('resets saveStatus to idle and clears error', () => {
    useCheckInStore.setState({ saveStatus: 'error', error: 'Something went wrong', isSaving: true });
    getStore().resetStatus();
    const state = getStore();
    expect(state.saveStatus).toBe('idle');
    expect(state.error).toBeNull();
    expect(state.isSaving).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// saveDailyLog
// ─────────────────────────────────────────────────────────────────────────────

describe('saveDailyLog — success', () => {
  beforeEach(() => {
    mockAuthenticated();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it('sets saveStatus to success and stores todayMood', async () => {
    await getStore().saveDailyLog(7);
    const state = getStore();
    expect(state.saveStatus).toBe('success');
    expect(state.todayMood).toBe(7);
    expect(state.isSaving).toBe(false);
    expect(state.error).toBeNull();
  });

  it('clamps mood above 10 to 10', async () => {
    await getStore().saveDailyLog(15);
    expect(getStore().todayMood).toBe(10);
  });

  it('clamps mood below 0 to 0', async () => {
    await getStore().saveDailyLog(-5);
    expect(getStore().todayMood).toBe(0);
  });

  it('rounds fractional mood values', async () => {
    await getStore().saveDailyLog(6.7);
    expect(getStore().todayMood).toBe(7);
  });

  it('sets isSaving=true during operation, false after', async () => {
    let wasSaving = false;
    mockUpsert.mockImplementation(() => {
      wasSaving = useCheckInStore.getState().isSaving;
      return Promise.resolve({ error: null });
    });
    await getStore().saveDailyLog(5);
    expect(wasSaving).toBe(true);
    expect(getStore().isSaving).toBe(false);
  });
});

describe('saveDailyLog — not authenticated', () => {
  it('sets saveStatus to error when session is null', async () => {
    mockUnauthenticated();
    await getStore().saveDailyLog(5);
    const state = getStore();
    expect(state.saveStatus).toBe('error');
    expect(state.error).toBeTruthy();
    expect(state.isSaving).toBe(false);
  });

  it('sets saveStatus to error on auth error', async () => {
    mockAuthError('Token expired');
    await getStore().saveDailyLog(5);
    const state = getStore();
    expect(state.saveStatus).toBe('error');
    expect(state.error).toContain('Token expired');
  });
});

describe('saveDailyLog — database error', () => {
  it('sets saveStatus to error when upsert fails', async () => {
    mockAuthenticated();
    mockUpsert.mockResolvedValue({ error: { message: 'DB write failed' } });
    await getStore().saveDailyLog(5);
    const state = getStore();
    expect(state.saveStatus).toBe('error');
    expect(state.error).toContain('DB write failed');
    expect(state.isSaving).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// loadTodayCheckIn
// ─────────────────────────────────────────────────────────────────────────────

describe('loadTodayCheckIn — success', () => {
  it('sets todayMood when check-in exists', async () => {
    mockRpc.mockResolvedValue({ data: { exists: true, moodValue: 8 }, error: null });
    const result = await getStore().loadTodayCheckIn();
    expect(result).toBe(8);
    expect(getStore().todayMood).toBe(8);
    expect(getStore().isLoadingToday).toBe(false);
  });

  it('returns null and sets todayMood=null when no check-in exists', async () => {
    mockRpc.mockResolvedValue({ data: { exists: false }, error: null });
    const result = await getStore().loadTodayCheckIn();
    expect(result).toBeNull();
    expect(getStore().todayMood).toBeNull();
  });

  it('clamps returned mood value', async () => {
    mockRpc.mockResolvedValue({ data: { exists: true, moodValue: 11 }, error: null });
    const result = await getStore().loadTodayCheckIn();
    expect(result).toBe(10);
  });

  it('sets isLoadingToday=true during operation, false after', async () => {
    let wasLoading = false;
    mockRpc.mockImplementation(() => {
      wasLoading = useCheckInStore.getState().isLoadingToday;
      return Promise.resolve({ data: { exists: false }, error: null });
    });
    await getStore().loadTodayCheckIn();
    expect(wasLoading).toBe(true);
    expect(getStore().isLoadingToday).toBe(false);
  });
});

describe('loadTodayCheckIn — error', () => {
  it('sets error and returns null on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });
    const result = await getStore().loadTodayCheckIn();
    expect(result).toBeNull();
    const state = getStore();
    expect(state.error).toContain('RPC failed');
    expect(state.isLoadingToday).toBe(false);
  });

  it('sets error and returns null when RPC throws', async () => {
    mockRpc.mockRejectedValue(new Error('Network error'));
    const result = await getStore().loadTodayCheckIn();
    expect(result).toBeNull();
    expect(getStore().error).toContain('Network error');
    expect(getStore().isLoadingToday).toBe(false);
  });
});
