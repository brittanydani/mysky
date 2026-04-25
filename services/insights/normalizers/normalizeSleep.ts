import { UserSignal } from '../types/knowledgeEngine';
import { SleepEntry } from '../../storage/models';
import { SIGNALS } from '../signalDefinitions';

/**
 * Normalizes a SleepEntry into UserSignals.
 */
export function normalizeSleep(entry: SleepEntry): UserSignal[] {
  const signals: UserSignal[] = [];
  const date = entry.date;

  // Sleep Debt
  if (entry.durationHours && entry.durationHours < 6) {
    signals.push({
      key: SIGNALS.SLEEP_DEBT.key,
      source: 'sleep',
      date,
      strength: Math.min(1.0, (6 - entry.durationHours) / 2),
      evidence: {
        source: 'sleep',
        date,
        signal: `${entry.durationHours} hours sleep`,
      },
    });
  }

  // Low Capacity from poor sleep
  if (entry.quality && entry.quality <= 2) {
    signals.push({
      key: SIGNALS.LOW_CAPACITY.key,
      source: 'sleep',
      date,
      strength: 0.6,
      evidence: { source: 'sleep', date, label: 'low quality sleep' },
    });
  }

  // Dream processing
  if (entry.dreamText && entry.dreamText.trim().length > 20) {
    signals.push({
      key: SIGNALS.DREAM_UNFINISHED_PROCESSING.key,
      source: 'dream',
      date,
      strength: 0.7,
      evidence: { source: 'dream', date, label: 'active dreaming' },
    });
  }

  return signals;
}
