import { UserSignal } from '../types/knowledgeEngine';
import { SleepEntry } from '../../storage/models';
import { SIGNALS } from '../signalDefinitions';

function parseJson<T>(raw?: string): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

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

  const dreamFeelings = parseJson<Array<{ id?: string } | string>>(entry.dreamFeelings);
  for (const feeling of dreamFeelings ?? []) {
    const id = typeof feeling === 'string' ? feeling : feeling.id;
    if (!id) continue;
    const normalized = id.toLowerCase();

    if (['anxious', 'panicked', 'terrified', 'scared', 'chased', 'trapped', 'overwhelmed'].includes(normalized)) {
      signals.push({
        key: SIGNALS.CALM_BRACING.key,
        source: 'dream',
        date,
        strength: 0.75,
        evidence: { source: 'dream', date, label: normalized },
      });
    }

    if (['betrayed', 'lonely', 'isolated', 'vulnerable', 'powerless'].includes(normalized)) {
      signals.push({
        key: SIGNALS.MUTUALITY_NEED.key,
        source: 'dream',
        date,
        strength: 0.7,
        evidence: { source: 'dream', date, label: normalized },
      });
    }

    if (['heavy', 'exhausted', 'numb', 'grieving'].includes(normalized)) {
      signals.push({
        key: SIGNALS.LOW_CAPACITY.key,
        source: 'dream',
        date,
        strength: 0.75,
        evidence: { source: 'dream', date, label: normalized },
      });
    }
  }

  const dreamMetadata = parseJson<{ theme?: string }>(entry.dreamMetadata);
  if (dreamMetadata?.theme) {
    const theme = dreamMetadata.theme.toLowerCase();
    const key = ['transformation', 'discovery', 'mystery'].includes(theme)
      ? SIGNALS.TRANSFORMATION.key
      : ['connection', 'loss', 'conflict'].includes(theme)
        ? SIGNALS.MUTUALITY_NEED.key
        : SIGNALS.DREAM_UNFINISHED_PROCESSING.key;

    signals.push({
      key,
      source: 'dream',
      date,
      strength: 0.65,
      evidence: { source: 'dream', date, label: theme },
    });
  }

  return signals;
}
