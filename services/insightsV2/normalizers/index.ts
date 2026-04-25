import type { UserSignal, InsightRawInputs, SignalKey } from '../types';

/**
 * Normalizes Daily Check-Ins into V2 UserSignals.
 */
export function normalizeDailyCheckInV2(checkIns: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  for (const ci of checkIns) {
    const date = ci.date.slice(0, 10);

    // Energy
    if (ci.energy <= 2) {
      signals.push({
        key: 'low_energy',
        source: 'dailyCheckIn',
        date,
        strength: 0.8,
        evidence: { source: 'dailyCheckIn', date, label: 'Low energy', value: ci.energy },
      });
    }

    // Mood
    if (ci.mood <= 2) {
      signals.push({
        key: 'low_mood',
        source: 'dailyCheckIn',
        date,
        strength: 0.8,
        evidence: { source: 'dailyCheckIn', date, label: 'Low mood', value: ci.mood },
      });
    }

    // Stress
    if (ci.stress >= 4) {
      signals.push({
        key: 'high_stress',
        source: 'dailyCheckIn',
        date,
        strength: 0.9,
        evidence: { source: 'dailyCheckIn', date, label: 'High stress', value: ci.stress },
      });
    }

    // Tags
    if (ci.tags) {
      const tagMap: Record<string, SignalKey> = {
        rest: 'rest_resistance',
        overwhelmed: 'overextension',
        lonely: 'loneliness',
        gratitude: 'relief',
        boundaries: 'boundary_rebuilding',
      };
      for (const tag of ci.tags) {
        if (tagMap[tag]) {
          signals.push({
            key: tagMap[tag],
            source: 'dailyCheckIn',
            date,
            strength: 0.7,
            evidence: { source: 'dailyCheckIn', date, label: tag },
          });
        }
      }
    }
  }

  return signals;
}

/**
 * Normalizes Journals into V2 UserSignals.
 */
export function normalizeJournalV2(journals: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  for (const j of journals) {
    const date = j.date.slice(0, 10);
    const content = j.text.toLowerCase();

    // Simple keyword matching for V2 signals
    const keywordMap: Record<string, SignalKey> = {
      guilt: 'rest_guilt',
      lazy: 'rest_resistance',
      must: 'responsibility_weight',
      should: 'excellence_pressure',
      meaning: 'meaning_making',
      why: 'asks_why',
      support: 'support_need',
      alone: 'loneliness',
      angry: 'anger',
    };

    for (const [kw, key] of Object.entries(keywordMap)) {
      if (content.includes(kw)) {
        signals.push({
          key,
          source: 'journal',
          date,
          strength: 0.6,
          evidence: { source: 'journal', date, phrase: kw },
        });
      }
    }
  }

  return signals;
}

/**
 * Normalizes Sleep into V2 UserSignals.
 */
export function normalizeSleepV2(sleepLogs: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  for (const s of sleepLogs) {
    const date = s.date.slice(0, 10);

    if (s.hours && s.hours < 6) {
      signals.push({
        key: 'low_sleep',
        source: 'sleep',
        date,
        strength: 0.8,
        evidence: { source: 'sleep', date, label: 'Short sleep', value: s.hours },
      });
    }

    if (s.quality && s.quality <= 2) {
      signals.push({
        key: 'poor_sleep_quality',
        source: 'sleep',
        date,
        strength: 0.7,
        evidence: { source: 'sleep', date, label: 'Poor sleep quality', value: s.quality },
      });
    }
  }

  return signals;
}

/**
 * Normalizes Body Map into V2 UserSignals.
 */
export function normalizeBodyMapV2(bodyMaps: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  for (const bm of bodyMaps) {
    const date = bm.date.slice(0, 10);
    const cueMap: Record<string, SignalKey> = {
      chest: 'chest_pressure',
      shoulders: 'shoulder_burden',
      jaw: 'jaw_restraint',
      stomach: 'gut_signal',
    };

    for (const cue of bm.cues || []) {
      if (cueMap[cue]) {
        signals.push({
          key: cueMap[cue],
          source: 'bodyMap',
          date,
          strength: 0.7,
          evidence: { source: 'bodyMap', date, label: cue },
        });
        // Also trigger the general "Body Knows First" signal
        signals.push({
            key: 'body_knows_first',
            source: 'bodyMap',
            date,
            strength: 0.5,
            evidence: { source: 'bodyMap', date, label: 'Physical cue' },
          });
      }
    }
  }

  return signals;
}

/**
 * Main Normalizer
 */
export function normalizeInsightInputsV2(raw: InsightRawInputs): UserSignal[] {
  const signals = [
    ...normalizeDailyCheckInV2(raw.dailyCheckIns),
    ...normalizeJournalV2(raw.journals),
    ...normalizeSleepV2(raw.sleepLogs),
    ...normalizeBodyMapV2(raw.bodyMaps),
  ];

  // Logic for low_capacity cross-source
  const today = new Date().toISOString().slice(0, 10);
  const todaySignals = signals.filter(s => s.date === today);
  const sources = new Set(todaySignals.map(s => s.source));
  
  const capacityTriggers = ['low_energy', 'low_mood', 'high_stress', 'low_sleep', 'poor_sleep_quality'];
  const hasCapacityTrigger = todaySignals.some(s => capacityTriggers.includes(s.key));

  if (hasCapacityTrigger || sources.size >= 2) {
      signals.push({
          key: 'low_capacity',
          source: 'dailyCheckIn', // Attribution placeholder
          date: today,
          strength: 0.6,
          evidence: { source: 'dailyCheckIn', date: today, label: 'Capacity signal' }
      });
  }

  return signals;
}
