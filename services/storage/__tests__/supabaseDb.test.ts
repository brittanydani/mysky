import {
  deleteChart,
  getCharts,
  getSettings,
  saveInsight,
  saveChart,
  saveJournalEntry,
  saveRelationshipChart,
  updateSettings,
} from '../supabaseDb';
import type { AppSettings, JournalEntry, RelationshipChart, SavedChart } from '../models';
import type { SavedInsight } from '../insightHistory';

const mockGetSession = jest.fn();
const mockFrom = jest.fn();
const mockInvokeBirthProfileSync = jest.fn();
const mockIsBirthProfileSyncUnavailableError = jest.fn((error: unknown) => {
  const candidate = error as { name?: string; message?: string } | null;
  return candidate?.name === 'FunctionsHttpError'
    || candidate?.message?.includes('Network request failed') === true;
});
const mockWarnBirthProfileSyncUnavailable = jest.fn();
const mockLocalGetCharts = jest.fn();
const mockUpsertChartFromSync = jest.fn().mockResolvedValue(undefined);
const mockDeleteChartFromSync = jest.fn().mockResolvedValue(undefined);
const mockUpsertJournalEntryRaw = jest.fn().mockResolvedValue(undefined);
const mockLocalSaveChart = jest.fn().mockResolvedValue(undefined);
const mockLocalSaveJournalEntry = jest.fn().mockResolvedValue(undefined);
const mockLocalDeleteChart = jest.fn().mockResolvedValue(undefined);
const mockLocalSaveRelationshipChart = jest.fn().mockResolvedValue(undefined);
const mockLocalSaveInsight = jest.fn().mockResolvedValue(undefined);
const mockSealIdentity = jest.fn().mockResolvedValue(undefined);
const mockDestroyIdentity = jest.fn().mockResolvedValue(undefined);
const mockAccountScopedGetItem = jest.fn().mockResolvedValue(null);
const mockAccountScopedSetItem = jest.fn().mockResolvedValue(undefined);
const mockAccountScopedRemoveItem = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('../syncService', () => ({
  __esModule: true,
  invokeBirthProfileSync: (...args: unknown[]) => mockInvokeBirthProfileSync(...args),
  isBirthProfileSyncUnavailableError: (...args: unknown[]) =>
    mockIsBirthProfileSyncUnavailableError(args[0]),
  warnBirthProfileSyncUnavailable: (...args: unknown[]) =>
    mockWarnBirthProfileSyncUnavailable(...args),
}));

jest.mock('../localDb', () => ({
  localDb: {
    getCharts: () => mockLocalGetCharts(),
    upsertChartFromSync: (...args: unknown[]) => mockUpsertChartFromSync(...args),
    deleteChartFromSync: (...args: unknown[]) => mockDeleteChartFromSync(...args),
    upsertJournalEntryRaw: (...args: unknown[]) => mockUpsertJournalEntryRaw(...args),
    saveChart: (...args: unknown[]) => mockLocalSaveChart(...args),
    saveJournalEntry: (...args: unknown[]) => mockLocalSaveJournalEntry(...args),
    deleteChart: (...args: unknown[]) => mockLocalDeleteChart(...args),
    saveRelationshipChart: (...args: unknown[]) => mockLocalSaveRelationshipChart(...args),
    saveInsight: (...args: unknown[]) => mockLocalSaveInsight(...args),
  },
}));

jest.mock('../accountScopedStorage', () => ({
  AccountScopedAsyncStorage: {
    getItem: (...args: unknown[]) => mockAccountScopedGetItem(...args),
    setItem: (...args: unknown[]) => mockAccountScopedSetItem(...args),
    removeItem: (...args: unknown[]) => mockAccountScopedRemoveItem(...args),
  },
}));

jest.mock('../../../utils/IdentityVault', () => ({
  IdentityVault: {
    sealIdentity: (...args: unknown[]) => mockSealIdentity(...args),
    destroyIdentity: () => mockDestroyIdentity(),
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const chart: SavedChart = {
  id: 'chart-1',
  name: 'Brittany',
  birthDate: '1990-01-01',
  birthTime: '12:30:00',
  hasUnknownTime: false,
  birthPlace: 'Detroit, MI',
  latitude: 42.3314,
  longitude: -83.0458,
  timezone: 'America/Detroit',
  houseSystem: 'placidus',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-02T00:00:00.000Z',
  isDeleted: false,
};

const profile = {
  chartId: chart.id,
  name: chart.name,
  birthDate: chart.birthDate,
  birthTime: chart.birthTime,
  hasUnknownTime: chart.hasUnknownTime,
  birthPlace: chart.birthPlace,
  latitude: chart.latitude,
  longitude: chart.longitude,
  timezone: chart.timezone,
  houseSystem: chart.houseSystem,
  createdAt: chart.createdAt,
  updatedAt: chart.updatedAt,
  isDeleted: false,
};

const journalEntry: JournalEntry = {
  id: 'journal-1',
  date: '2026-04-02',
  mood: 'calm',
  moonPhase: 'waxing',
  title: 'Signal',
  content: 'Remote first journal entry',
  chartId: 'chart-1',
  createdAt: '2026-04-02T00:00:00.000Z',
  updatedAt: '2026-04-02T00:00:00.000Z',
  isDeleted: false,
};

const relationshipChart: RelationshipChart = {
  id: 'rel-1',
  name: 'Alex',
  relationship: 'partner',
  birthDate: '1992-02-02',
  birthTime: '08:15:00',
  hasUnknownTime: false,
  birthPlace: 'Chicago, IL',
  latitude: 41.8781,
  longitude: -87.6298,
  timezone: 'America/Chicago',
  userChartId: 'chart-1',
  createdAt: '2026-04-02T00:00:00.000Z',
  updatedAt: '2026-04-02T00:00:00.000Z',
  isDeleted: false,
};

const appSettings: AppSettings = {
  id: 'default',
  cloudSyncEnabled: false,
  lastSyncAt: '2026-04-01T00:00:00.000Z',
  lastBackupAt: undefined,
  userId: 'user-1',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-02T00:00:00.000Z',
};

const insight: SavedInsight = {
  id: 'insight-1',
  date: '2026-04-02',
  chartId: 'chart-1',
  greeting: 'Today opens gently.',
  loveHeadline: 'Connection',
  loveMessage: 'Let connection be simple.',
  energyHeadline: 'Energy',
  energyMessage: 'Move at the pace that is true.',
  growthHeadline: 'Growth',
  growthMessage: 'Notice what keeps repeating.',
  gentleReminder: 'You do not have to force clarity.',
  journalPrompt: 'What is asking for attention today?',
  moonSign: 'Cancer',
  moonPhase: 'waxing',
  signals: JSON.stringify([{ description: 'Moon trine Venus', orb: '0.5' }]),
  isFavorite: false,
  createdAt: '2026-04-02T00:00:00.000Z',
  updatedAt: '2026-04-02T00:00:00.000Z',
};

describe('supabaseDb birth profile cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    mockLocalGetCharts.mockResolvedValue([]);
    mockAccountScopedGetItem.mockResolvedValue(null);
    mockAccountScopedSetItem.mockResolvedValue(undefined);
    mockAccountScopedRemoveItem.mockResolvedValue(undefined);
    mockFrom.mockReturnValue({
      upsert: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  it('reads the birth profile from remote Supabase and refreshes the local cache', async () => {
    mockInvokeBirthProfileSync.mockResolvedValue({ profile });

    await expect(getCharts()).resolves.toEqual([chart]);

    expect(mockInvokeBirthProfileSync).toHaveBeenCalledWith(
      'getLatest',
      {},
      { swallowUnavailableReadError: false },
    );
    expect(mockUpsertChartFromSync).toHaveBeenCalledWith(chart);
    expect(mockLocalSaveChart).not.toHaveBeenCalled();
  });

  it('uses the cached local chart only when remote birth profile loading is unavailable', async () => {
    const error = { name: 'FunctionsHttpError', message: 'Edge Function returned a non-2xx status code' };
    mockInvokeBirthProfileSync.mockRejectedValue(error);
    mockLocalGetCharts.mockResolvedValue([chart]);

    await expect(getCharts()).resolves.toEqual([chart]);

    expect(mockWarnBirthProfileSyncUnavailable).toHaveBeenCalledWith(error);
    expect(mockLocalGetCharts).toHaveBeenCalled();
    expect(mockUpsertChartFromSync).not.toHaveBeenCalled();
  });

  it('saves the birth profile to remote Supabase before refreshing the local cache', async () => {
    mockInvokeBirthProfileSync.mockResolvedValue({ profile });

    await saveChart(chart);

    expect(mockInvokeBirthProfileSync).toHaveBeenCalledWith('upsert', {
      profile: expect.objectContaining({
        chartId: chart.id,
        birthDate: chart.birthDate,
        birthPlace: chart.birthPlace,
      }),
    });
    expect(mockUpsertChartFromSync).toHaveBeenCalledWith(chart);
    expect(mockLocalSaveChart).not.toHaveBeenCalled();
    expect(mockSealIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        birthDate: chart.birthDate,
        locationCity: chart.birthPlace,
      }),
    );
  });

  it('writes to local storage and queues retry only when remote save is unavailable', async () => {
    mockInvokeBirthProfileSync.mockRejectedValue({ name: 'FunctionsHttpError' });

    await saveChart(chart);

    expect(mockLocalSaveChart).toHaveBeenCalledWith(chart);
    expect(mockUpsertChartFromSync).not.toHaveBeenCalled();
  });

  it('deletes remotely before clearing the cached local chart', async () => {
    mockLocalGetCharts.mockResolvedValue([chart]);
    mockInvokeBirthProfileSync.mockResolvedValue({
      profile: {
        ...profile,
        isDeleted: true,
        deletedAt: '2026-04-03T00:00:00.000Z',
        updatedAt: '2026-04-03T00:00:00.000Z',
      },
    });

    await deleteChart(chart.id);

    expect(mockInvokeBirthProfileSync).toHaveBeenCalledWith(
      'delete',
      expect.objectContaining({ chartId: chart.id }),
    );
    expect(mockDeleteChartFromSync).toHaveBeenCalledWith(
      chart.id,
      '2026-04-03T00:00:00.000Z',
    );
    expect(mockLocalDeleteChart).not.toHaveBeenCalled();
    expect(mockDestroyIdentity).toHaveBeenCalled();
  });

  it('saves journal entries to Supabase before refreshing the local cache', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert });

    await saveJournalEntry(journalEntry);

    expect(mockFrom).toHaveBeenCalledWith('journal_entries');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: journalEntry.id,
        user_id: 'user-1',
        content: journalEntry.content,
      }),
      { onConflict: 'id' },
    );
    expect(mockUpsertJournalEntryRaw).toHaveBeenCalledWith(journalEntry);
    expect(mockLocalSaveJournalEntry).not.toHaveBeenCalled();
  });

  it('queues journal retry through local storage only when remote save is unavailable', async () => {
    const upsert = jest.fn().mockResolvedValue({
      error: { message: 'Network request failed' },
    });
    mockFrom.mockReturnValue({ upsert });

    await saveJournalEntry(journalEntry);

    expect(mockLocalSaveJournalEntry).toHaveBeenCalledWith(journalEntry);
    expect(mockUpsertJournalEntryRaw).not.toHaveBeenCalled();
  });

  it('saves relationship charts to Supabase before refreshing the local cache', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert });

    await saveRelationshipChart(relationshipChart);

    expect(mockFrom).toHaveBeenCalledWith('relationship_charts');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: relationshipChart.id,
        user_id: 'user-1',
        user_chart_id: relationshipChart.userChartId,
      }),
      { onConflict: 'id' },
    );
    expect(mockLocalSaveRelationshipChart).toHaveBeenCalledWith(relationshipChart);
  });

  it('upserts insight history by user date and chart to avoid duplicate insights at the same time', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert });

    await saveInsight(insight);

    expect(mockFrom).toHaveBeenCalledWith('insight_history');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: insight.id,
        user_id: 'user-1',
        date: insight.date,
        chart_id: insight.chartId,
      }),
      { onConflict: 'user_id,date,chart_id' },
    );
    expect(mockLocalSaveInsight).toHaveBeenCalledWith(insight);
  });

  it('reads app settings from Supabase before refreshing the local cache', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        user_id: 'user-1',
        id: 'default',
        cloud_sync_enabled: false,
        last_sync_at: '2026-04-01T00:00:00.000Z',
        last_backup_at: null,
        created_at: '2026-04-01T00:00:00.000Z',
        updated_at: '2026-04-02T00:00:00.000Z',
      },
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select });

    await expect(getSettings()).resolves.toEqual(appSettings);

    expect(mockFrom).toHaveBeenCalledWith('app_settings');
    expect(mockAccountScopedSetItem).toHaveBeenCalledWith(
      '@mysky:app_settings',
      JSON.stringify(appSettings),
    );
  });

  it('saves app settings to Supabase before refreshing the local cache', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert });

    await updateSettings(appSettings);

    expect(mockFrom).toHaveBeenCalledWith('app_settings');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        id: 'default',
        cloud_sync_enabled: false,
      }),
      { onConflict: 'user_id' },
    );
    expect(mockAccountScopedSetItem).toHaveBeenCalledWith(
      '@mysky:app_settings',
      JSON.stringify(appSettings),
    );
  });
});
