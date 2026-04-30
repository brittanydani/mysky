import { UserSignal } from '../types/knowledgeEngine';
import { JournalEntry } from '../../storage/models';
import { SIGNALS } from '../signalDefinitions';

/**
 * Normalizes a JournalEntry into UserSignals.
 */
export function normalizeJournal(entry: JournalEntry): UserSignal[] {
  const signals: UserSignal[] = [];
  const date = entry.date;
  const content = (entry.content ?? '').toLowerCase();

  // Keyword / Theme Analysis (Basic Regex)
  const themeMap: Record<string, { key: string; keywords: string[] }> = {
    support: {
      key: SIGNALS.SUPPORT_NEED.key,
      keywords: ['support', 'help', 'lonely', 'scarcity', 'catch me', 'small circle'],
    },
    guilt: {
      key: SIGNALS.GUILT_AROUND_STOPPING.key,
      keywords: ['guilt', 'should have', 'lazy', 'selfish', 'permission'],
    },
    responsibility: {
      key: SIGNALS.HIGH_RESPONSIBILITY.key,
      keywords: ['responsibility', 'obligation', 'must', 'have to', 'carrying'],
    },
    processing: {
      key: SIGNALS.DEEP_PROCESSING.key,
      keywords: ['meaning', 'why', 'understand', 'cause', 'pattern'],
    },
    relationship: {
      key: SIGNALS.MUTUALITY_NEED.key,
      keywords: ['relationship', 'partner', 'friend', 'repair', 'connection', 'closeness'],
    },
    boundaries: {
      key: SIGNALS.BOUNDARY_GROWTH.key,
      keywords: ['boundary', 'boundaries', 'limit', 'said no', 'space'],
    },
    reassurance: {
      key: SIGNALS.REASSURANCE_NEED.key,
      keywords: ['reassurance', 'abandon', 'chosen', 'unseen', 'ignored'],
    },
  };

  for (const [_, config] of Object.entries(themeMap)) {
    const matches = config.keywords.filter((k) => content.includes(k));
    if (matches.length > 0) {
      signals.push({
        key: config.key,
        source: 'journal',
        date,
        strength: Math.min(0.5 + matches.length * 0.1, 1.0),
        evidence: {
          source: 'journal',
          date,
          phrase: matches[0], // Anchor on the first keyword found
        },
      });
    }
  }

  // Sentiment / Tone
  if (entry.mood === 'heavy' || entry.mood === 'stormy') {
    signals.push({
      key: SIGNALS.LOW_CAPACITY.key,
      source: 'journal',
      date,
      strength: 0.7,
      evidence: { source: 'journal', date, label: entry.mood },
    });
  }

  const tagToSignal: Record<string, string> = {
    relationships: SIGNALS.MUTUALITY_NEED.key,
    intimacy: SIGNALS.MUTUALITY_NEED.key,
    conflict: SIGNALS.MUTUALITY_NEED.key,
    boundaries: SIGNALS.BOUNDARY_GROWTH.key,
    gratitude: SIGNALS.GRATITUDE.key,
    grief: SIGNALS.LOW_CAPACITY.key,
    anxiety: SIGNALS.CALM_BRACING.key,
    overwhelm: SIGNALS.OVEREXTENSION.key,
    loneliness: SIGNALS.LONELINESS.key,
    clarity: SIGNALS.MEANING_MAKING.key,
    growth: SIGNALS.TRANSFORMATION.key,
  };

  for (const tag of entry.tags ?? []) {
    const signalKey = tagToSignal[tag];
    if (!signalKey) continue;

    signals.push({
      key: signalKey,
      source: 'journal',
      date,
      strength: 0.65,
      evidence: { source: 'journal', date, label: tag },
    });
  }

  try {
    const parsed = entry.contentKeywords
      ? JSON.parse(entry.contentKeywords) as {
          keywords?: string[];
          relationshipContext?: { names?: string[]; roles?: string[]; anchors?: string[] };
        }
      : null;
    const relationshipAnchors = [
      ...(parsed?.relationshipContext?.roles ?? []),
      ...(parsed?.relationshipContext?.anchors ?? []),
    ];
    if (relationshipAnchors.length > 0) {
      signals.push({
        key: SIGNALS.MUTUALITY_NEED.key,
        source: 'journal',
        date,
        strength: 0.7,
        evidence: {
          source: 'journal',
          date,
          phrase: relationshipAnchors[0],
        },
      });
    }
  } catch { /* skip malformed summaries */ }

  return signals;
}
