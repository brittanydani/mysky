import { ordinal, moodLabel, energyWord, stressWord, confidenceLabel, trendArrow, stressTrendArrow } from '../insightsEngine';

// ── ordinal ──────────────────────────────────────────────────────────────────

describe('ordinal', () => {
  it('handles 0 and negatives', () => {
    expect(ordinal(0)).toBe('0');
    expect(ordinal(-3)).toBe('-3');
  });

  it('handles 1st, 2nd, 3rd', () => {
    expect(ordinal(1)).toBe('1st');
    expect(ordinal(2)).toBe('2nd');
    expect(ordinal(3)).toBe('3rd');
  });

  it('handles teens (11th, 12th, 13th)', () => {
    expect(ordinal(11)).toBe('11th');
    expect(ordinal(12)).toBe('12th');
    expect(ordinal(13)).toBe('13th');
  });

  it('handles 21st, 22nd, 23rd', () => {
    expect(ordinal(21)).toBe('21st');
    expect(ordinal(22)).toBe('22nd');
    expect(ordinal(23)).toBe('23rd');
  });

  it('handles standard th cases', () => {
    expect(ordinal(4)).toBe('4th');
    expect(ordinal(10)).toBe('10th');
    expect(ordinal(100)).toBe('100th');
  });
});

// ── moodLabel ────────────────────────────────────────────────────────────────

describe('moodLabel', () => {
  it('returns Thriving for >= 8', () => {
    expect(moodLabel(8)).toBe('Thriving');
    expect(moodLabel(10)).toBe('Thriving');
  });

  it('returns Good for >= 6.5', () => {
    expect(moodLabel(6.5)).toBe('Good');
    expect(moodLabel(7.9)).toBe('Good');
  });

  it('returns Okay for >= 5', () => {
    expect(moodLabel(5)).toBe('Okay');
    expect(moodLabel(6.4)).toBe('Okay');
  });

  it('returns Low for >= 3.5', () => {
    expect(moodLabel(3.5)).toBe('Low');
    expect(moodLabel(4.9)).toBe('Low');
  });

  it('returns Struggling for < 3.5', () => {
    expect(moodLabel(3.4)).toBe('Struggling');
    expect(moodLabel(1)).toBe('Struggling');
  });
});

// ── energyWord ───────────────────────────────────────────────────────────────

describe('energyWord', () => {
  it('returns High for >= 7', () => {
    expect(energyWord(7)).toBe('High');
    expect(energyWord(10)).toBe('High');
  });

  it('returns Medium for >= 3.5', () => {
    expect(energyWord(3.5)).toBe('Medium');
    expect(energyWord(6.9)).toBe('Medium');
  });

  it('returns Low for < 3.5', () => {
    expect(energyWord(3.4)).toBe('Low');
    expect(energyWord(1)).toBe('Low');
  });
});

// ── stressWord ───────────────────────────────────────────────────────────────

describe('stressWord', () => {
  it('returns High for >= 7', () => {
    expect(stressWord(7)).toBe('High');
  });

  it('returns Medium for >= 3.5', () => {
    expect(stressWord(5)).toBe('Medium');
  });

  it('returns Low for < 3.5', () => {
    expect(stressWord(2)).toBe('Low');
  });
});

// ── confidenceLabel (insightsEngine version) ─────────────────────────────────

describe('confidenceLabel (insightsEngine)', () => {
  it('maps levels correctly', () => {
    expect(confidenceLabel('high')).toBe('High confidence');
    expect(confidenceLabel('medium')).toBe('Building clarity');
    expect(confidenceLabel('low')).toBe('Early signal');
  });
});

// ── trendArrow (insightsEngine version) ──────────────────────────────────────

describe('trendArrow (insightsEngine)', () => {
  it('returns arrows', () => {
    expect(trendArrow('up')).toBe('↑');
    expect(trendArrow('down')).toBe('↓');
    expect(trendArrow('stable')).toBe('→');
  });
});

// ── stressTrendArrow (insightsEngine version) ────────────────────────────────

describe('stressTrendArrow (insightsEngine)', () => {
  it('returns descriptive arrows', () => {
    expect(stressTrendArrow('down')).toBe('↓ easing');
    expect(stressTrendArrow('up')).toBe('↑ rising');
    expect(stressTrendArrow('stable')).toBe('→ steady');
  });
});
