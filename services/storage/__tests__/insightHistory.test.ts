// Mock persistence so no Supabase or SQLite is needed
const mockSaveInsight = jest.fn().mockResolvedValue(undefined);
const mockGetInsightByDate = jest.fn().mockResolvedValue(null);
const mockGetInsightById = jest.fn().mockResolvedValue(null);
const mockGetInsightHistory = jest.fn().mockResolvedValue([]);
const mockUpdateInsightFavorite = jest.fn().mockResolvedValue(undefined);
const mockUpdateInsightViewedAt = jest.fn().mockResolvedValue(undefined);

jest.mock('../supabaseDb', () => ({
  supabaseDb: {
    saveInsight: mockSaveInsight,
    getInsightByDate: mockGetInsightByDate,
    getInsightById: mockGetInsightById,
    getInsightHistory: mockGetInsightHistory,
    updateInsightFavorite: mockUpdateInsightFavorite,
    updateInsightViewedAt: mockUpdateInsightViewedAt,
  },
}));

jest.mock('../models', () => ({
  generateId: jest.fn(() => 'test-id-001'),
}));

jest.mock('../../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// dateUtils.toLocalDateString used by getTodaysInsight / getRecentInsights
jest.mock('../../../utils/dateUtils', () => ({
  toLocalDateString: jest.fn((d: Date) => d.toISOString().slice(0, 10)),
}));

import { InsightHistoryService, SavedInsight } from '../insightHistory';

const makeGuidance = (overrides: Record<string, unknown> = {}) => ({
  date: '2026-03-30',
  greeting: 'Good morning',
  love: { headline: 'Love headline', message: 'Love msg' },
  energy: { headline: 'Energy headline', message: 'Energy msg' },
  growth: { headline: 'Growth headline', message: 'Growth msg' },
  gentleReminder: 'Be kind',
  journalPrompt: 'What moved you today?',
  moonSign: 'Pisces',
  moonPhase: 'Waxing Gibbous',
  ...overrides,
});

const makeSavedInsight = (overrides: Partial<SavedInsight> = {}): SavedInsight => ({
  id: 'insight-1',
  date: '2026-03-30',
  chartId: 'chart-1',
  greeting: 'Good morning',
  loveHeadline: 'Love headline',
  loveMessage: 'Love msg',
  energyHeadline: 'Energy headline',
  energyMessage: 'Energy msg',
  growthHeadline: 'Growth headline',
  growthMessage: 'Growth msg',
  gentleReminder: 'Be kind',
  journalPrompt: 'What moved you today?',
  moonSign: 'Pisces',
  moonPhase: 'Waxing Gibbous',
  isFavorite: false,
  createdAt: '2026-03-30T08:00:00.000Z',
  updatedAt: '2026-03-30T08:00:00.000Z',
  ...overrides,
});

describe('InsightHistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInsightByDate.mockResolvedValue(null);
    mockGetInsightHistory.mockResolvedValue([]);
  });

  // ── saveInsight ─────────────────────────────────────────────────────────────
  describe('saveInsight()', () => {
    it('creates a new insight when none exists for that date', async () => {
      const guidance = makeGuidance();
      const result = await InsightHistoryService.saveInsight(guidance as any, 'chart-1');

      expect(mockSaveInsight).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('test-id-001');
      expect(result.date).toBe('2026-03-30');
      expect(result.chartId).toBe('chart-1');
      expect(result.loveHeadline).toBe('Love headline');
      expect(result.isFavorite).toBe(false);
    });

    it('updates an existing insight for the same date', async () => {
      const existing = makeSavedInsight({ greeting: 'Old greeting' });
      mockGetInsightByDate.mockResolvedValue(existing);

      const guidance = makeGuidance({ greeting: 'New greeting' });
      const result = await InsightHistoryService.saveInsight(guidance as any, 'chart-1');

      expect(result.greeting).toBe('New greeting');
      expect(result.id).toBe(existing.id); // preserves original id
    });

    it('persists signals as JSON string', async () => {
      const signals = [{ description: 'Moon conjunct Venus', orb: '0.5' }];
      const result = await InsightHistoryService.saveInsight(makeGuidance() as any, 'chart-1', signals);
      expect(result.signals).toBe(JSON.stringify(signals));
    });

    it('leaves signals undefined when not provided', async () => {
      const result = await InsightHistoryService.saveInsight(makeGuidance() as any, 'chart-1');
      expect(result.signals).toBeUndefined();
    });
  });

  // ── toggleFavorite ──────────────────────────────────────────────────────────
  describe('toggleFavorite()', () => {
    it('returns true and calls updateInsightFavorite when insight exists and was not favorite', async () => {
      mockGetInsightById.mockResolvedValue(makeSavedInsight({ isFavorite: false }));
      const result = await InsightHistoryService.toggleFavorite('insight-1');
      expect(result).toBe(true);
      expect(mockUpdateInsightFavorite).toHaveBeenCalledWith('insight-1', true);
    });

    it('returns false (unfavorite) when insight was already a favorite', async () => {
      mockGetInsightById.mockResolvedValue(makeSavedInsight({ isFavorite: true }));
      const result = await InsightHistoryService.toggleFavorite('insight-1');
      expect(result).toBe(false);
      expect(mockUpdateInsightFavorite).toHaveBeenCalledWith('insight-1', false);
    });

    it('returns false when insight is not found', async () => {
      mockGetInsightById.mockResolvedValue(null);
      const result = await InsightHistoryService.toggleFavorite('ghost-id');
      expect(result).toBe(false);
      expect(mockUpdateInsightFavorite).not.toHaveBeenCalled();
    });
  });

  // ── markViewed ──────────────────────────────────────────────────────────────
  describe('markViewed()', () => {
    it('calls updateInsightViewedAt with the insight id', async () => {
      await InsightHistoryService.markViewed('insight-1');
      expect(mockUpdateInsightViewedAt).toHaveBeenCalledWith('insight-1', expect.any(String));
    });
  });

  // ── parseSignals ────────────────────────────────────────────────────────────
  describe('parseSignals()', () => {
    it('parses valid signals JSON', () => {
      const raw = [{ description: 'Saturn square natal Moon', orb: '2.0' }];
      const insight = makeSavedInsight({ signals: JSON.stringify(raw) });
      const parsed = InsightHistoryService.parseSignals(insight);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].transit).toBe('Saturn square natal Moon');
      expect(parsed[0].orb).toBe('2.0');
    });

    it('returns empty array when signals is undefined', () => {
      expect(InsightHistoryService.parseSignals(makeSavedInsight())).toEqual([]);
    });

    it('returns empty array for malformed signals JSON', () => {
      const insight = makeSavedInsight({ signals: 'NOT_JSON' });
      expect(InsightHistoryService.parseSignals(insight)).toEqual([]);
    });

    it('infers domain from transit description', () => {
      const cases: [string, string][] = [
        ['Venus trine natal Jupiter', 'love'],
        ['Mars conjunct natal Sun', 'energy'],
        ['Moon in 4th house', 'mood'],
        ['Mercury opposite natal node', 'focus'],
        ['Saturn in 10th house', 'direction'],
        ['Jupiter sextile natal Moon', 'growth'],
        ['Pluto square natal Chiron', 'general'],
      ];
      for (const [description, expectedDomain] of cases) {
        const raw = [{ description, orb: '1.0' }];
        const insight = makeSavedInsight({ signals: JSON.stringify(raw) });
        const [signal] = InsightHistoryService.parseSignals(insight);
        expect(signal.domain).toBe(expectedDomain);
      }
    });

    it('infers strength from orb value', () => {
      const make = (orb: string) =>
        makeSavedInsight({ signals: JSON.stringify([{ description: 'Sun conjunct Venus', orb }]) });

      expect(InsightHistoryService.parseSignals(make('0.5'))[0].strength).toBe('strong');
      expect(InsightHistoryService.parseSignals(make('1'))[0].strength).toBe('strong');
      expect(InsightHistoryService.parseSignals(make('2'))[0].strength).toBe('moderate');
      expect(InsightHistoryService.parseSignals(make('3'))[0].strength).toBe('moderate');
      expect(InsightHistoryService.parseSignals(make('4'))[0].strength).toBe('subtle');
      expect(InsightHistoryService.parseSignals(make('not-a-number'))[0].strength).toBe('moderate');
    });
  });

  // ── getStats ────────────────────────────────────────────────────────────────
  describe('getStats()', () => {
    it('returns zeros when no insights exist', async () => {
      const stats = await InsightHistoryService.getStats('chart-1');
      expect(stats.totalInsights).toBe(0);
      expect(stats.favorites).toBe(0);
      expect(stats.streak).toBe(0);
      expect(stats.mostCommonMood).toBeNull();
    });

    it('counts favorites correctly', async () => {
      mockGetInsightHistory.mockResolvedValue([
        makeSavedInsight({ isFavorite: true }),
        makeSavedInsight({ id: '2', isFavorite: false }),
        makeSavedInsight({ id: '3', isFavorite: true }),
      ]);
      const stats = await InsightHistoryService.getStats('chart-1');
      expect(stats.favorites).toBe(2);
      expect(stats.totalInsights).toBe(3);
    });

    it('returns the most common moon sign as mostCommonMood', async () => {
      const today = new Date().toISOString().slice(0, 10);
      mockGetInsightHistory.mockResolvedValue([
        makeSavedInsight({ date: today, moonSign: 'Aries' }),
        makeSavedInsight({ id: '2', date: today, moonSign: 'Pisces' }),
        makeSavedInsight({ id: '3', date: today, moonSign: 'Pisces' }),
      ]);
      const stats = await InsightHistoryService.getStats('chart-1');
      expect(stats.mostCommonMood).toBe('Pisces');
    });

    it('calculates streak from today backwards', async () => {
      const today = new Date();
      const dates = [0, 1, 2].map(i => {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        return d.toISOString().slice(0, 10);
      });
      mockGetInsightHistory.mockResolvedValue(
        dates.map((date, i) => makeSavedInsight({ id: String(i), date })),
      );
      const stats = await InsightHistoryService.getStats('chart-1');
      expect(stats.streak).toBe(3);
    });
  });

  // ── getRecentInsights ───────────────────────────────────────────────────────
  describe('getRecentInsights()', () => {
    it('calls getInsightHistory with correct date range', async () => {
      await InsightHistoryService.getRecentInsights('chart-1', 7);
      expect(mockGetInsightHistory).toHaveBeenCalledWith(
        'chart-1',
        expect.objectContaining({ startDate: expect.any(String), endDate: expect.any(String) }),
      );
    });
  });
});
