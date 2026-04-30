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
    relationships: SIGNALS.MUTUALITY_NEED.key,
    conflict: SIGNALS.MUTUALITY_NEED.key,
    social: SIGNALS.SUPPORT_NEED.key,
    intimacy: SIGNALS.MUTUALITY_NEED.key,
    family: SIGNALS.HIGH_RESPONSIBILITY.key,
    work: SIGNALS.HIGH_RESPONSIBILITY.key,
    career: SIGNALS.HIGH_RESPONSIBILITY.key,
    anxiety: SIGNALS.CALM_BRACING.key,
    overwhelm: SIGNALS.OVEREXTENSION.key,
    alone_time: SIGNALS.QUIET_AS_REPAIR.key,
    rest: SIGNALS.REST_RESISTANCE.key, // Fixed: rest tag should contribute to rest_resistance pattern
    loneliness: SIGNALS.LONELINESS.key,
    gratitude: SIGNALS.GRATITUDE.key,
    overwhelmed: SIGNALS.OVEREXTENSION.key,
    boundaries: SIGNALS.BOUNDARY_GROWTH.key,
    clarity: SIGNALS.MEANING_MAKING.key,
    joy: SIGNALS.GLIMMER_QUIET_SAFETY.key,
    nature: SIGNALS.BEAUTY_REGULATION.key,
    movement: SIGNALS.QUIET_AS_REPAIR.key,
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

  const noteText = [checkIn.note, checkIn.wins, checkIn.challenges]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (noteText.includes('support') || noteText.includes('help') || noteText.includes('held')) {
    signals.push({
      key: SIGNALS.SUPPORT_NEED.key,
      source: 'dailyCheckIn',
      date,
      strength: 0.65,
      evidence: { source: 'dailyCheckIn', date, phrase: 'support' },
    });
  }
  if (noteText.includes('relationship') || noteText.includes('repair') || noteText.includes('conflict')) {
    signals.push({
      key: SIGNALS.MUTUALITY_NEED.key,
      source: 'dailyCheckIn',
      date,
      strength: 0.65,
      evidence: { source: 'dailyCheckIn', date, phrase: 'relationship' },
    });
  }
  if (noteText.includes('boundary') || noteText.includes('said no') || noteText.includes('space')) {
    signals.push({
      key: SIGNALS.BOUNDARY_GROWTH.key,
      source: 'dailyCheckIn',
      date,
      strength: 0.65,
      evidence: { source: 'dailyCheckIn', date, phrase: 'boundary' },
    });
  }

  return signals;
}
