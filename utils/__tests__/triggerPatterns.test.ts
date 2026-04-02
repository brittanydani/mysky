import {
  timestampToTimeOfDay,
  computeTriggerPatternSummary,
  buildTriggerPatternNarrative,
} from '../triggerPatterns';
import type { TriggerEvent } from '../triggerEventTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeDrain(overrides: Partial<TriggerEvent> = {}): TriggerEvent {
  return {
    id: `d-${Math.random()}`,
    timestamp: Date.now(),
    mode: 'drain',
    event: 'Something draining happened',
    nsState: 'sympathetic',
    sensations: [],
    ...overrides,
  };
}

function makeGlimmer(overrides: Partial<TriggerEvent> = {}): TriggerEvent {
  return {
    id: `g-${Math.random()}`,
    timestamp: Date.now(),
    mode: 'nourish',
    event: 'Something nourishing happened',
    nsState: 'ventral',
    sensations: [],
    ...overrides,
  };
}

/** Return a timestamp for a specific hour of today */
function atHour(h: number): number {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return d.getTime();
}

// ─────────────────────────────────────────────────────────────────────────────
// timestampToTimeOfDay()
// ─────────────────────────────────────────────────────────────────────────────

describe('timestampToTimeOfDay()', () => {
  it('returns Late Night for hours 0–5', () => {
    for (const h of [0, 1, 4, 5]) {
      expect(timestampToTimeOfDay(atHour(h))).toBe('Late Night');
    }
  });

  it('returns Morning for hours 6–11', () => {
    for (const h of [6, 9, 11]) {
      expect(timestampToTimeOfDay(atHour(h))).toBe('Morning');
    }
  });

  it('returns Afternoon for hours 12–16', () => {
    for (const h of [12, 14, 16]) {
      expect(timestampToTimeOfDay(atHour(h))).toBe('Afternoon');
    }
  });

  it('returns Evening for hours 17–20', () => {
    for (const h of [17, 19, 20]) {
      expect(timestampToTimeOfDay(atHour(h))).toBe('Evening');
    }
  });

  it('returns Night for hours 21–23', () => {
    for (const h of [21, 22, 23]) {
      expect(timestampToTimeOfDay(atHour(h))).toBe('Night');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeTriggerPatternSummary()
// ─────────────────────────────────────────────────────────────────────────────

describe('computeTriggerPatternSummary()', () => {
  it('returns zero counts for empty events', () => {
    const s = computeTriggerPatternSummary([]);
    expect(s.drainCount).toBe(0);
    expect(s.glimmerCount).toBe(0);
    expect(s.topDrainArea).toBeNull();
    expect(s.avgDrainIntensity).toBeNull();
    expect(s.resolvedDrainCount).toBe(0);
  });

  it('counts drains and glimmers correctly', () => {
    const events = [makeDrain(), makeDrain(), makeGlimmer()];
    const s = computeTriggerPatternSummary(events);
    expect(s.drainCount).toBe(2);
    expect(s.glimmerCount).toBe(1);
  });

  it('computes ratio as glimmers / drains', () => {
    const events = [makeDrain(), makeDrain(), makeGlimmer(), makeGlimmer(), makeGlimmer()];
    const s = computeTriggerPatternSummary(events);
    expect(s.ratio).toBeCloseTo(1.5);
  });

  it('ratio is Infinity when there are no drains', () => {
    const s = computeTriggerPatternSummary([makeGlimmer(), makeGlimmer()]);
    expect(s.ratio).toBe(Infinity);
  });

  it('identifies the most common drain context area', () => {
    const events = [
      makeDrain({ contextArea: 'Work' }),
      makeDrain({ contextArea: 'Work' }),
      makeDrain({ contextArea: 'Family' }),
    ];
    const s = computeTriggerPatternSummary(events);
    expect(s.topDrainArea).toBe('Work');
  });

  it('returns null topDrainArea when no drains have a context area', () => {
    const s = computeTriggerPatternSummary([makeDrain(), makeDrain()]);
    expect(s.topDrainArea).toBeNull();
  });

  it('identifies top time-of-day when >= minDrainsForTod entries', () => {
    const events = [
      makeDrain({ timestamp: atHour(9) }),  // Morning
      makeDrain({ timestamp: atHour(10) }), // Morning
      makeDrain({ timestamp: atHour(11) }), // Morning
      makeDrain({ timestamp: atHour(14) }), // Afternoon
    ];
    const s = computeTriggerPatternSummary(events, 4);
    expect(s.topDrainTimeOfDay).toBe('Morning');
  });

  it('returns null topDrainTimeOfDay when fewer than minDrainsForTod drains', () => {
    const events = [
      makeDrain({ timestamp: atHour(9) }),
      makeDrain({ timestamp: atHour(10) }),
      makeDrain({ timestamp: atHour(11) }),
    ];
    const s = computeTriggerPatternSummary(events, 4);
    expect(s.topDrainTimeOfDay).toBeNull();
  });

  it('computes average intensity only from drains with intensity set', () => {
    const events = [
      makeDrain({ intensity: 3 }),
      makeDrain({ intensity: 5 }),
      makeDrain(),            // no intensity — excluded from average
      makeGlimmer({ intensity: 1 }), // glimmer — excluded from drain average
    ];
    const s = computeTriggerPatternSummary(events);
    expect(s.avgDrainIntensity).toBeCloseTo(4);
  });

  it('returns null avgDrainIntensity when no drains have intensity', () => {
    const s = computeTriggerPatternSummary([makeDrain(), makeDrain()]);
    expect(s.avgDrainIntensity).toBeNull();
  });

  it('counts resolved drains correctly', () => {
    const events = [
      makeDrain({ resolution: 'Walked outside' }),
      makeDrain({ resolution: '  ' }), // whitespace only — not counted
      makeDrain(),                     // no resolution
    ];
    const s = computeTriggerPatternSummary(events);
    expect(s.resolvedDrainCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildTriggerPatternNarrative()
// ─────────────────────────────────────────────────────────────────────────────

describe('buildTriggerPatternNarrative()', () => {
  it('says glimmers are keeping pace when ratio >= 1', () => {
    const narrative = buildTriggerPatternNarrative({
      drainCount: 3,
      glimmerCount: 3,
      ratio: 1,
      topDrainArea: null,
      topDrainTimeOfDay: null,
      avgDrainIntensity: null,
      resolvedDrainCount: 0,
    });
    expect(narrative).toContain('keeping pace');
    expect(narrative).toContain('3 vs 3');
  });

  it('says drains are outpacing when ratio < 1', () => {
    const narrative = buildTriggerPatternNarrative({
      drainCount: 5,
      glimmerCount: 1,
      ratio: 0.2,
      topDrainArea: null,
      topDrainTimeOfDay: null,
      avgDrainIntensity: null,
      resolvedDrainCount: 0,
    });
    expect(narrative).toContain('outpacing');
    expect(narrative).toContain('5 to 1');
  });

  it('includes area text when topDrainArea is set', () => {
    const narrative = buildTriggerPatternNarrative({
      drainCount: 3,
      glimmerCount: 1,
      ratio: 0.33,
      topDrainArea: 'Work',
      topDrainTimeOfDay: null,
      avgDrainIntensity: null,
      resolvedDrainCount: 0,
    });
    expect(narrative).toContain('work');
  });

  it('omits area text when topDrainArea is null', () => {
    const narrative = buildTriggerPatternNarrative({
      drainCount: 3,
      glimmerCount: 1,
      ratio: 0.33,
      topDrainArea: null,
      topDrainTimeOfDay: null,
      avgDrainIntensity: null,
      resolvedDrainCount: 0,
    });
    expect(narrative).not.toContain('context of');
  });

  it('includes time-of-day text when topDrainTimeOfDay is set', () => {
    const narrative = buildTriggerPatternNarrative({
      drainCount: 5,
      glimmerCount: 2,
      ratio: 0.4,
      topDrainArea: null,
      topDrainTimeOfDay: 'Morning',
      avgDrainIntensity: null,
      resolvedDrainCount: 0,
    });
    expect(narrative).toContain('morning');
  });

  it('includes intensity text when avgDrainIntensity is set', () => {
    const narrative = buildTriggerPatternNarrative({
      drainCount: 2,
      glimmerCount: 3,
      ratio: 1.5,
      topDrainArea: null,
      topDrainTimeOfDay: null,
      avgDrainIntensity: 3.5,
      resolvedDrainCount: 0,
    });
    expect(narrative).toContain('3.5/5');
  });

  it('includes resolution text when resolvedDrainCount > 0', () => {
    const narrative = buildTriggerPatternNarrative({
      drainCount: 4,
      glimmerCount: 2,
      ratio: 0.5,
      topDrainArea: null,
      topDrainTimeOfDay: null,
      avgDrainIntensity: null,
      resolvedDrainCount: 2,
    });
    expect(narrative).toContain('2 of 4');
    expect(narrative).toContain('regulation toolkit');
  });

  it('omits resolution text when resolvedDrainCount is 0', () => {
    const narrative = buildTriggerPatternNarrative({
      drainCount: 4,
      glimmerCount: 2,
      ratio: 0.5,
      topDrainArea: null,
      topDrainTimeOfDay: null,
      avgDrainIntensity: null,
      resolvedDrainCount: 0,
    });
    expect(narrative).not.toContain('regulation toolkit');
  });
});
