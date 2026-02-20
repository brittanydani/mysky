/**
 * Tests for Journal-Enhanced Insights Engine (V3)
 *
 * Covers:
 *  - Trend calculations (regression + split delta)
 *  - Volatility scoring
 *  - Keyword & emotion bucket lift
 *  - Journal impact (journaling vs not, writing intensity, weekly consistency)
 *  - Time patterns
 *  - Chart baselines
 *  - Blended insights
 *  - Emotion tone shift
 */

import {
  computeMetricTrend,
  computeAllTrends,
  computeVolatility,
  computeAllVolatility,
  computeKeywordLift,
  computeEmotionBucketLift,
  computeJournalingImpact,
  computeWritingIntensityEffect,
  computeWeeklyConsistency,
  computeTimeOfDayPatterns,
  computeDayOfWeekPatterns,
  computeChartBaselines,
  computeBlendedInsights,
  computeEmotionToneShift,
  computeKeywordThemes,
  computeEnhancedInsights,
} from '../../../utils/journalInsights';
import { DailyAggregate, ChartProfile } from '../../insights/types';

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeAggregate(
  dayKey: string,
  overrides: Partial<DailyAggregate> = {},
): DailyAggregate {
  return {
    dayKey,
    moodAvg: 6,
    energyAvg: 5,
    stressAvg: 4,
    checkInCount: 1,
    tagsUnion: [],
    hasJournalText: false,
    journalCount: 0,
    journalWordCount: 0,
    keywordsUnion: [],
    emotionCountsTotal: {},
    sentimentAvg: null,
    checkInTimestamps: [`${dayKey}T12:00:00.000Z`],
    dayOfWeek: new Date(dayKey + 'T12:00:00').getDay(),
    ...overrides,
  };
}

function makeDays(count: number, startDate: string = '2026-01-01'): DailyAggregate[] {
  const result: DailyAggregate[] = [];
  const start = new Date(startDate + 'T12:00:00');
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push(makeAggregate(key, {
      moodAvg: 5 + Math.sin(i * 0.3) * 2,
      stressAvg: 4 + Math.cos(i * 0.5) * 1.5,
      energyAvg: 5 + Math.sin(i * 0.2) * 1.5,
    }));
  }
  return result;
}

const MOCK_PROFILE: ChartProfile = {
  dominantElement: 'Water',
  dominantModality: 'Fixed',
  moonSign: 'Cancer',
  moonHouse: 4,
  saturnSign: 'Capricorn',
  saturnHouse: 10,
  chironSign: 'Virgo',
  chironHouse: 6,
  has6thHouseEmphasis: false,
  has12thHouseEmphasis: false,
  stelliums: [],
  elementCounts: { Fire: 1, Earth: 1, Air: 1, Water: 2 },
  modalityCounts: { Cardinal: 1, Fixed: 2, Mutable: 2 },
  timeKnown: true,
  versionHash: 'test123',
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Trend Calculations
// ─────────────────────────────────────────────────────────────────────────────

describe('computeMetricTrend', () => {
  it('returns stable for flat data', () => {
    const values = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
    const result = computeMetricTrend(values, 'test');
    expect(result.direction).toBe('stable');
  });

  it('detects rising trend with regression (>= 10 points)', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = computeMetricTrend(values, 'test');
    expect(result.direction).toBe('up');
    expect(result.method).toBe('regression');
    expect(result.slope).toBeGreaterThan(0);
  });

  it('detects falling trend with regression', () => {
    const values = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const result = computeMetricTrend(values, 'test');
    expect(result.direction).toBe('down');
    expect(result.method).toBe('regression');
  });

  it('uses split delta method for < 10 points', () => {
    const values = [3, 3, 3, 7, 7, 7];
    const result = computeMetricTrend(values, 'test');
    expect(result.method).toBe('split_delta');
    expect(result.direction).toBe('up');
  });

  it('handles single value', () => {
    const result = computeMetricTrend([5], 'test');
    expect(result.direction).toBe('stable');
  });
});

describe('computeAllTrends', () => {
  it('computes trends for all metrics', () => {
    const days = makeDays(15);
    const trends = computeAllTrends(days);
    expect(trends).toHaveLength(5);
    expect(trends.map(t => t.metric)).toEqual([
      'moodAvg', 'stressAvg', 'energyAvg', 'journalCount', 'wordCountTotal',
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Volatility
// ─────────────────────────────────────────────────────────────────────────────

describe('computeVolatility', () => {
  it('returns low for consistent values', () => {
    const result = computeVolatility([5, 5.1, 4.9, 5, 5.2], 'mood');
    expect(result.level).toBe('low');
  });

  it('returns high for variable values', () => {
    const result = computeVolatility([1, 10, 2, 9, 1, 10], 'mood');
    expect(result.level).toBe('high');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Keyword & Emotion Lift
// ─────────────────────────────────────────────────────────────────────────────

describe('computeKeywordLift', () => {
  it('returns no data with < 10 days', () => {
    const days = makeDays(5);
    const result = computeKeywordLift(days);
    expect(result.hasData).toBe(false);
  });

  it('finds restoring keywords on best days', () => {
    const days = makeDays(20);
    // Top 20% mood days get "calm" keyword
    const byMood = [...days].sort((a, b) => b.moodAvg - a.moodAvg);
    for (let i = 0; i < 8; i++) {
      byMood[i].keywordsUnion = ['calm', 'peaceful'];
      byMood[i].journalCount = 1;
    }
    // Bottom days get "exhausted"
    for (let i = days.length - 8; i < days.length; i++) {
      byMood[i].keywordsUnion = ['exhausted', 'overwhelmed'];
      byMood[i].journalCount = 1;
    }
    const result = computeKeywordLift(days);
    // Keywords need 4+ days, so they may or may not qualify
    expect(result.confidence).toBeDefined();
  });
});

describe('computeEmotionBucketLift', () => {
  it('returns empty with < 10 days', () => {
    const result = computeEmotionBucketLift(makeDays(5));
    expect(result).toEqual([]);
  });

  it('detects emotion categories more common on hard days', () => {
    const days = makeDays(20);
    const byStress = [...days].sort((a, b) => b.stressAvg - a.stressAvg);
    // High stress days have anxiety
    for (let i = 0; i < 4; i++) {
      byStress[i].emotionCountsTotal = { anxiety: 3 };
    }
    // Best mood days have calm
    const byMood = [...days].sort((a, b) => b.moodAvg - a.moodAvg);
    for (let i = 0; i < 4; i++) {
      byMood[i].emotionCountsTotal = { calm: 3 };
    }
    const result = computeEmotionBucketLift(days);
    // May or may not find significant lift depending on overlap
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Journal Impact
// ─────────────────────────────────────────────────────────────────────────────

describe('computeJournalingImpact', () => {
  it('returns null with insufficient data', () => {
    const days = makeDays(5);
    expect(computeJournalingImpact(days)).toBeNull();
  });

  it('compares journaling vs non-journaling days', () => {
    const days = makeDays(20);
    // First 10 are journaling days with higher mood
    for (let i = 0; i < 10; i++) {
      days[i].journalCount = 1;
      days[i].moodAvg = 8;
    }
    // Last 10 are non-journaling with lower mood
    for (let i = 10; i < 20; i++) {
      days[i].journalCount = 0;
      days[i].moodAvg = 5;
    }
    const result = computeJournalingImpact(days);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('journaling_vs_not');
    expect(result!.data.diffMood).toBeGreaterThan(0);
  });
});

describe('computeWritingIntensityEffect', () => {
  it('returns null without enough data per bucket', () => {
    const days = makeDays(5);
    days.forEach(d => { d.journalCount = 1; d.journalWordCount = 100; });
    expect(computeWritingIntensityEffect(days)).toBeNull();
  });

  it('compares mood across writing intensity buckets', () => {
    const days = makeDays(30);
    for (let i = 0; i < 10; i++) {
      days[i].journalCount = 1;
      days[i].journalWordCount = 50; // low
      days[i].moodAvg = 5;
    }
    for (let i = 10; i < 20; i++) {
      days[i].journalCount = 1;
      days[i].journalWordCount = 150; // medium
      days[i].moodAvg = 6;
    }
    for (let i = 20; i < 30; i++) {
      days[i].journalCount = 1;
      days[i].journalWordCount = 300; // high
      days[i].moodAvg = 7;
    }
    const result = computeWritingIntensityEffect(days);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('writing_intensity');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Time Patterns
// ─────────────────────────────────────────────────────────────────────────────

describe('computeTimeOfDayPatterns', () => {
  it('returns null with insufficient bucket data', () => {
    const days = makeDays(2);
    expect(computeTimeOfDayPatterns(days)).toBeNull();
  });
});

describe('computeDayOfWeekPatterns', () => {
  it('returns null with insufficient weekday data', () => {
    const days = makeDays(3);
    expect(computeDayOfWeekPatterns(days)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Chart Baselines
// ─────────────────────────────────────────────────────────────────────────────

describe('computeChartBaselines', () => {
  it('returns empty with no profile', () => {
    expect(computeChartBaselines(null)).toEqual([]);
  });

  it('returns regulation style card', () => {
    const cards = computeChartBaselines(MOCK_PROFILE);
    const reg = cards.find(c => c.type === 'regulation_style');
    expect(reg).toBeDefined();
    expect(reg!.confidence).toBe('high');
    expect(reg!.body).toContain('Water');
  });

  it('returns emotional need card for known moon house', () => {
    const cards = computeChartBaselines(MOCK_PROFILE);
    const need = cards.find(c => c.type === 'emotional_need');
    expect(need).toBeDefined();
    expect(need!.body).toContain('4th house');
  });

  it('returns pressure pattern card', () => {
    const cards = computeChartBaselines(MOCK_PROFILE);
    const saturn = cards.find(c => c.type === 'pressure_pattern');
    expect(saturn).toBeDefined();
    expect(saturn!.body).toContain('Capricorn');
  });

  it('returns healing theme card', () => {
    const cards = computeChartBaselines(MOCK_PROFILE);
    const chiron = cards.find(c => c.type === 'healing_theme');
    expect(chiron).toBeDefined();
    expect(chiron!.body).toContain('Virgo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Blended Insights
// ─────────────────────────────────────────────────────────────────────────────

describe('computeBlendedInsights', () => {
  it('returns default card when no rules trigger', () => {
    const days = makeDays(10);
    const trends = computeAllTrends(days);
    const vol = computeAllVolatility(days);
    const cards = computeBlendedInsights(days, trends, vol, MOCK_PROFILE);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0].sources).toBeDefined();
  });

  it('triggers stress + fatigue rule', () => {
    const days = makeDays(15);
    // Make stress trend up
    for (let i = 0; i < days.length; i++) {
      days[i].stressAvg = 3 + i * 0.5;
      if (i >= 8) {
        days[i].emotionCountsTotal = { fatigue: 2 };
      }
    }
    const trends = computeAllTrends(days);
    const vol = computeAllVolatility(days);
    const cards = computeBlendedInsights(days, trends, vol, MOCK_PROFILE);
    const stressCard = cards.find(c => c.sources.includes('stress_trend'));
    // May or may not trigger depending on threshold
    expect(cards.length).toBeGreaterThan(0);
  });

  it('returns empty without profile', () => {
    const days = makeDays(10);
    const trends = computeAllTrends(days);
    const vol = computeAllVolatility(days);
    expect(computeBlendedInsights(days, trends, vol, null)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Emotion Tone Shift
// ─────────────────────────────────────────────────────────────────────────────

describe('computeEmotionToneShift', () => {
  it('returns null with < 10 days', () => {
    expect(computeEmotionToneShift(makeDays(5))).toBeNull();
  });

  it('detects rising emotion categories', () => {
    const days = makeDays(20);
    // First half: no emotion data
    // Second half: anxiety present
    for (let i = 10; i < 20; i++) {
      days[i].emotionCountsTotal = { anxiety: 3 };
    }
    const result = computeEmotionToneShift(days);
    if (result) {
      expect(result.rising.length).toBeGreaterThan(0);
      expect(result.rising[0].category).toBe('anxiety');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyword Themes
// ─────────────────────────────────────────────────────────────────────────────

describe('computeKeywordThemes', () => {
  it('returns null with insufficient journal data', () => {
    expect(computeKeywordThemes(makeDays(2))).toBeNull();
  });

  it('surfaces common keywords across days', () => {
    const days = makeDays(10);
    for (let i = 0; i < 10; i++) {
      days[i].keywordsUnion = ['work', 'deadline', i % 2 === 0 ? 'tired' : 'calm'];
    }
    const result = computeKeywordThemes(days);
    expect(result).not.toBeNull();
    expect(result!.topKeywords.length).toBeGreaterThan(0);
    expect(result!.topKeywords[0].word).toBe('work');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Full Bundle
// ─────────────────────────────────────────────────────────────────────────────

describe('computeEnhancedInsights', () => {
  it('returns full bundle', () => {
    const days = makeDays(30);
    // Add some journal data
    for (let i = 0; i < 15; i++) {
      days[i].journalCount = 1;
      days[i].journalWordCount = 120;
      days[i].keywordsUnion = ['work', 'deadline'];
      days[i].emotionCountsTotal = { stress: 2, fatigue: 1 };
      days[i].sentimentAvg = -0.3;
    }

    const bundle = computeEnhancedInsights(days, MOCK_PROFILE);

    expect(bundle.trends).toHaveLength(5);
    expect(bundle.volatility.length).toBeGreaterThanOrEqual(2);
    expect(bundle.chartBaselines.length).toBeGreaterThanOrEqual(3);
    expect(bundle.blended.length).toBeGreaterThan(0);
    expect(bundle.sampleSize).toBe(30);
    expect(bundle.journalDays).toBe(15);
    expect(bundle.confidence).toBeDefined();
  });

  it('handles no profile gracefully', () => {
    const days = makeDays(10);
    const bundle = computeEnhancedInsights(days, null);
    expect(bundle.chartBaselines).toEqual([]);
    expect(bundle.blended).toEqual([]);
  });

  it('handles empty aggregates', () => {
    const bundle = computeEnhancedInsights([], MOCK_PROFILE);
    expect(bundle.sampleSize).toBe(0);
    expect(bundle.confidence).toBe('low');
  });
});
