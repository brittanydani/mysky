import { UserSignal } from '../types/knowledgeEngine';
import { SIGNALS } from '../signalDefinitions';

/**
 * Normalizes somatic entries from the reflection bank into UserSignals.
 */
export function normalizeSomatic(entries: any[]): UserSignal[] {
  const signals: UserSignal[] = [];

  const regionToSignal: Record<string, string> = {
    head: SIGNALS.BODY_KNOWS_FIRST.key,
    chest: SIGNALS.CHEST_TIGHTNESS.key,
    throat: SIGNALS.JAW_TENSION.key,
    gut: SIGNALS.STOMACH_UNEASE.key,
    back: SIGNALS.SHOULDER_TENSION.key,
  };

  for (const entry of entries) {
    const signalKey = regionToSignal[entry.region];
    if (signalKey) {
      signals.push({
        key: signalKey,
        source: 'bodyMap',
        date: entry.date.slice(0, 10),
        strength: (entry.intensity || 5) / 10,
        evidence: {
          source: 'bodyMap',
          date: entry.date.slice(0, 10),
          signal: `${entry.region}: ${entry.emotion}`,
        },
      });
    }
  }

  return signals;
}
