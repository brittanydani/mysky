import { mean, stdDev, clamp, linearRegression, computeTrend, confidence, confidenceLabel, trendArrow, stressTrendArrow } from '../stats';

// ── mean ─────────────────────────────────────────────────────────────────────

describe('mean', () => {
  it('returns 0 for empty array', () => {
    expect(mean([])).toBe(0);
  });

  it('returns the single value for a singleton', () => {
    expect(mean([7])).toBe(7);
  });

  it('computes correct average', () => {
    expect(mean([2, 4, 6])).toBe(4);
  });

  it('handles negative values', () => {
    expect(mean([-2, 2])).toBe(0);
  });
});

// ── stdDev ───────────────────────────────────────────────────────────────────

describe('stdDev', () => {
  it('returns 0 for empty array', () => {
    expect(stdDev([])).toBe(0);
  });

  it('returns 0 for a single value', () => {
    expect(stdDev([5])).toBe(0);
  });

  it('computes Bessel-corrected sample std dev', () => {
    // [2, 4, 4, 4, 5, 5, 7, 9] → mean=5, stdDev≈2
    const result = stdDev([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(result).toBeCloseTo(2.0, 0);
  });

  it('returns 0 for identical values', () => {
    expect(stdDev([3, 3, 3])).toBe(0);
  });
});

// ── clamp ────────────────────────────────────────────────────────────────────

describe('clamp', () => {
  it('clamps below minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps above maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns value when in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('handles boundaries', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

// ── linearRegression ─────────────────────────────────────────────────────────

describe('linearRegression', () => {
  it('returns slope 0 for empty array', () => {
    expect(linearRegression([]).slope).toBe(0);
  });

  it('returns slope 0 for single value', () => {
    expect(linearRegression([5]).slope).toBe(0);
  });

  it('computes positive slope for ascending series', () => {
    const { slope } = linearRegression([1, 2, 3, 4, 5]);
    expect(slope).toBeCloseTo(1, 5);
  });

  it('computes negative slope for descending series', () => {
    const { slope } = linearRegression([5, 4, 3, 2, 1]);
    expect(slope).toBeCloseTo(-1, 5);
  });

  it('returns slope 0 for constant series', () => {
    const { slope } = linearRegression([3, 3, 3, 3]);
    expect(slope).toBe(0);
  });

  it('handles near-zero denominator gracefully', () => {
    // Single distinct value repeated — denominator approaches zero
    const { slope } = linearRegression([5, 5]);
    expect(slope).toBe(0);
    expect(Number.isFinite(slope)).toBe(true);
  });
});

// ── computeTrend ─────────────────────────────────────────────────────────────

describe('computeTrend', () => {
  it('returns stable for empty array', () => {
    const result = computeTrend([]);
    expect(result.direction).toBe('stable');
    expect(result.change).toBe(0);
  });

  it('returns stable for single value', () => {
    const result = computeTrend([5]);
    expect(result.direction).toBe('stable');
  });

  it('uses delta method for < 10 values', () => {
    const result = computeTrend([1, 2, 3, 4, 5]);
    expect(result.method).toBe('delta');
  });

  it('uses regression method for >= 10 values', () => {
    const result = computeTrend([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result.method).toBe('regression');
    expect(result.direction).toBe('up');
  });

  it('detects upward trend', () => {
    const result = computeTrend([1, 1, 1, 5, 5, 5]);
    expect(result.direction).toBe('up');
  });

  it('detects downward trend', () => {
    const result = computeTrend([5, 5, 5, 1, 1, 1]);
    expect(result.direction).toBe('down');
  });

  it('detects stable when change is small', () => {
    const result = computeTrend([5, 5, 5, 5.2, 5.2, 5.2]);
    expect(result.direction).toBe('stable');
  });

  it('formats displayChange with sign', () => {
    const up = computeTrend([1, 1, 5, 5]);
    expect(up.displayChange).toMatch(/^\+/);
    const down = computeTrend([5, 5, 1, 1]);
    expect(down.displayChange).toMatch(/^-/);
  });
});

// ── confidence ───────────────────────────────────────────────────────────────

describe('confidence', () => {
  it('returns low for < 14', () => {
    expect(confidence(5)).toBe('low');
    expect(confidence(13)).toBe('low');
  });

  it('returns medium for 14-29', () => {
    expect(confidence(14)).toBe('medium');
    expect(confidence(29)).toBe('medium');
  });

  it('returns high for >= 30', () => {
    expect(confidence(30)).toBe('high');
    expect(confidence(100)).toBe('high');
  });
});

// ── confidenceLabel ──────────────────────────────────────────────────────────

describe('confidenceLabel', () => {
  it('maps levels to labels', () => {
    expect(confidenceLabel('high')).toBe('Strong');
    expect(confidenceLabel('medium')).toBe('Growing');
    expect(confidenceLabel('low')).toBe('Emerging');
  });
});

// ── trendArrow / stressTrendArrow ────────────────────────────────────────────

describe('trendArrow', () => {
  it('returns correct arrows', () => {
    expect(trendArrow('up')).toBe('↑');
    expect(trendArrow('down')).toBe('↓');
    expect(trendArrow('stable')).toBe('→');
  });
});

describe('stressTrendArrow', () => {
  it('returns correct arrows (inverted for stress)', () => {
    expect(stressTrendArrow('down')).toBe('↓');
    expect(stressTrendArrow('up')).toBe('↑');
    expect(stressTrendArrow('stable')).toBe('→');
  });
});
