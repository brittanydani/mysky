import { UserSignal } from '../types/knowledgeEngine';
import { DailyCheckIn } from '../../patterns/types';
import { SIGNALS } from '../signalDefinitions';

/**
 * Normalizes a DailyCheckIn into UserSignals.
 */
export function normalizeDailyCheckIn(checkIn: DailyCheckIn): UserSignal[] {
  const signals: UserSignal[] = [];
  const date = checkIn.date;

  // Mood/Energy/Stress → Low Capacity
  if (checkIn.moodScore <= 3 || checkIn.energyLevel === 'low' || checkIn.stressLevel === 'high') {
    signals.push({
      key: SIGNALS.LOW_CAPACITY.key,
      source: 'dailyCheckIn',
      date,
      strength: 0.8,
      evidence: {
        source: 'dailyCheckIn',
        date,
        signal: `mood: ${checkIn.moodScore}, energy: ${checkIn.energyLevel}, stress: ${checkIn.stressLevel}`,
      },
    });
  }

  // Energy Signal
  if (checkIn.energyLevel === 'low') {
    signals.push({
      key: SIGNALS.LOW_ENERGY.key,
      source: 'dailyCheckIn',
      date,
      strength: 1.0,
      evidence: { source: 'dailyCheckIn', date, signal: 'low energy check-in' },
    });
  }

  // Tags → Signal Mapping
  const tagToSignal: Record<string, string> = {
    alone_time: SIGNALS.QUIET_AS_REPAIR.key,
    rest: SIGNALS.REST_RESISTANCE.key, // Fixed: rest tag should contribute to rest_resistance pattern
    loneliness: SIGNALS.LONELINESS.key,
    gratitude: SIGNALS.GRATITUDE.key,
    overwhelmed: SIGNALS.OVEREXTENSION.key,
    boundaries: SIGNALS.BOUNDARY_GROWTH.key,
  };

  for (const tag of checkIn.tags) {
    const signalKey = tagToSignal[tag];
    if (signalKey) {
      signals.push({
        key: signalKey,
        source: 'dailyCheckIn',
        date,
        strength: 0.7,
        evidence: { source: 'dailyCheckIn', date, label: tag },
      });
    }
  }

  return signals;
}
