// Use a simple in-memory map as AsyncStorage so there is no shared singleton
// across test files — avoids cross-file mock contamination when Jest runs
// multiple files in the same worker.
const asyncStorageMap = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => asyncStorageMap.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => { asyncStorageMap.set(key, value); }),
  removeItem: jest.fn(async (key: string) => { asyncStorageMap.delete(key); }),
  clear: jest.fn(async () => { asyncStorageMap.clear(); }),
}));

jest.mock('../../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import {
  trackGrowthEvent,
  getGrowthAnalyticsSnapshot,
  getGrowthExperimentVariant,
} from '../localAnalytics';

const ANALYTICS_KEY = 'mysky.growth.analytics.v1';

describe('localAnalytics', () => {
  beforeEach(() => {
    asyncStorageMap.clear();
    jest.clearAllMocks();
  });

  describe('trackGrowthEvent()', () => {
    it('increments count for a simple event', async () => {
      await trackGrowthEvent('app_opened');
      const snapshot = await getGrowthAnalyticsSnapshot();
      expect(snapshot.counts['app_opened']).toBe(1);
    });

    it('accumulates count across multiple calls', async () => {
      await trackGrowthEvent('app_opened');
      await trackGrowthEvent('app_opened');
      await trackGrowthEvent('app_opened');
      const snapshot = await getGrowthAnalyticsSnapshot();
      expect(snapshot.counts['app_opened']).toBe(3);
    });

    it('sets firstSeenAt only on first occurrence', async () => {
      await trackGrowthEvent('journal_entry_saved');
      const snap1 = await getGrowthAnalyticsSnapshot();
      const first = snap1.firstSeenAt['journal_entry_saved'];

      await new Promise((r) => setTimeout(r, 5));
      await trackGrowthEvent('journal_entry_saved');
      const snap2 = await getGrowthAnalyticsSnapshot();

      expect(snap2.firstSeenAt['journal_entry_saved']).toBe(first);
    });

    it('updates lastSeenAt on every call', async () => {
      await trackGrowthEvent('checkin_hub_viewed');
      const snap1 = await getGrowthAnalyticsSnapshot();
      const first = snap1.lastSeenAt['checkin_hub_viewed'];

      await new Promise((r) => setTimeout(r, 5));
      await trackGrowthEvent('checkin_hub_viewed');
      const snap2 = await getGrowthAnalyticsSnapshot();

      expect(snap2.lastSeenAt['checkin_hub_viewed']).not.toBe(first);
    });

    it('creates dimension count keys from metadata', async () => {
      await trackGrowthEvent('paywall_viewed', { plan: 'monthly' });
      const snapshot = await getGrowthAnalyticsSnapshot();
      expect(snapshot.counts['paywall_viewed']).toBe(1);
      expect(snapshot.counts['paywall_viewed:plan=monthly']).toBe(1);
    });

    it('appends to recentEvents', async () => {
      await trackGrowthEvent('mood_checkin_saved', { score: 8 });
      const snapshot = await getGrowthAnalyticsSnapshot();
      expect(snapshot.recentEvents).toHaveLength(1);
      expect(snapshot.recentEvents[0].name).toBe('mood_checkin_saved');
      expect(snapshot.recentEvents[0].metadata?.score).toBe(8);
    });

    it('truncates metadata strings to 64 characters', async () => {
      const longString = 'a'.repeat(100);
      await trackGrowthEvent('journal_entry_saved', { label: longString });
      const snapshot = await getGrowthAnalyticsSnapshot();
      expect(snapshot.recentEvents[0].metadata?.label).toHaveLength(64);
    });

    it('limits metadata to 6 fields', async () => {
      const metadata: Record<string, string> = {};
      for (let i = 0; i < 10; i++) metadata[`key${i}`] = `val${i}`;
      await trackGrowthEvent('app_opened', metadata);
      const snapshot = await getGrowthAnalyticsSnapshot();
      expect(Object.keys(snapshot.recentEvents[0].metadata ?? {})).toHaveLength(6);
    });

    it('caps recentEvents at 120', async () => {
      for (let i = 0; i < 125; i++) {
        await trackGrowthEvent('app_opened');
      }
      const snapshot = await getGrowthAnalyticsSnapshot();
      expect(snapshot.recentEvents.length).toBeLessThanOrEqual(120);
    });

    it('returns default state when AsyncStorage is empty', async () => {
      const snapshot = await getGrowthAnalyticsSnapshot();
      expect(snapshot.schemaVersion).toBe(1);
      expect(snapshot.counts).toEqual({});
      expect(snapshot.recentEvents).toEqual([]);
    });

    it('handles corrupted AsyncStorage data gracefully', async () => {
      asyncStorageMap.set(ANALYTICS_KEY, 'NOT_JSON{{{');
      await expect(trackGrowthEvent('app_opened')).resolves.not.toThrow();
    });
  });

  describe('getGrowthExperimentVariant()', () => {
    it('assigns a variant from the provided list', async () => {
      const variant = await getGrowthExperimentVariant('onboarding_cta', ['control', 'variant_a']);
      expect(['control', 'variant_a']).toContain(variant);
    });

    it('returns the same variant on repeated calls (sticky assignment)', async () => {
      const v1 = await getGrowthExperimentVariant('test_exp', ['a', 'b', 'c']);
      const v2 = await getGrowthExperimentVariant('test_exp', ['a', 'b', 'c']);
      expect(v1).toBe(v2);
    });

    it('throws when variants array is empty', async () => {
      await expect(getGrowthExperimentVariant('bad_exp', [])).rejects.toThrow(
        'Experiment variants must not be empty.',
      );
    });

    it('re-assigns if stored variant is no longer in the variants list', async () => {
      const v1 = await getGrowthExperimentVariant('rotate_exp', ['old_variant']);
      expect(v1).toBe('old_variant');

      // Now call with a new set that excludes the old value
      const v2 = await getGrowthExperimentVariant('rotate_exp', ['new_a', 'new_b']);
      expect(['new_a', 'new_b']).toContain(v2);
    });
  });

  describe('getGrowthAnalyticsSnapshot()', () => {
    it('returns default state when nothing has been tracked', async () => {
      const snapshot = await getGrowthAnalyticsSnapshot();
      expect(snapshot).toMatchObject({
        schemaVersion: 1,
        counts: {},
        firstSeenAt: {},
        lastSeenAt: {},
        recentEvents: [],
        experiments: {},
      });
    });

    it('reflects events that were tracked', async () => {
      await trackGrowthEvent('sleep_entry_saved');
      const snapshot = await getGrowthAnalyticsSnapshot();
      expect(snapshot.counts['sleep_entry_saved']).toBe(1);
    });
  });
});
