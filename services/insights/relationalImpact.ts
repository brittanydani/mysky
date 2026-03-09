/**
 * Relational Impact Engine
 *
 * Scans journal entries for a person's name and calculates
 * how that person affects the user's nervous system / mood.
 *
 * Example output:
 *   "When you write about Sarah, your mood averages 7.2 / 10.
 *    That's 1.8 points higher than your baseline — she is a
 *    Regulating Presence for your nervous system."
 */

import { JournalEntry } from '../storage/models';

// ── Mood → numeric map ──────────────────────────────────────────────────────
const MOOD_SCORES: Record<string, number> = {
  calm: 5,
  soft: 4,
  okay: 3,
  heavy: 2,
  stormy: 1,
};

// ── Types ───────────────────────────────────────────────────────────────────

export interface RelationalImpactResult {
  /** Number of journal entries that mention this person */
  mentionCount: number;
  /** Average mood score on days entries mention this person (0 if no mentions) */
  avgMoodWithPerson: number;
  /** Baseline average mood across all entries */
  baselineMoodAvg: number;
  /** Delta: avgMoodWithPerson - baselineMoodAvg */
  impactDelta: number;
  /** Human-readable impact label */
  impactLabel: string;
  /** The one-sentence dynamic insight shown on the card */
  insight: string;
  /** ISO date string of the most recent mention */
  lastMentionDate: string | null;
  /** Whether there is enough data to show this card */
  hasData: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function moodScore(entry: JournalEntry): number {
  return MOOD_SCORES[entry.mood] ?? 3;
}

function containsName(text: string, name: string): boolean {
  if (!text || !name) return false;
  // Whole-word match, case-insensitive
  const firstName = name.trim().split(/\s+/)[0];
  if (!firstName || firstName.length < 2) return false;
  const escaped = firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

function impactLabelFromDelta(delta: number): string {
  if (delta >= 1.5) return 'Highly Regulating';
  if (delta >= 0.7) return 'Regulating Presence';
  if (delta >= 0.2) return 'Stabilising';
  if (delta > -0.2) return 'Neutral';
  if (delta > -0.7) return 'Activating';
  if (delta > -1.5) return 'Dysregulating';
  return 'Highly Activating';
}

// ── Main Function ────────────────────────────────────────────────────────────

export function calculateRelationalImpact(
  personName: string,
  entries: JournalEntry[],
): RelationalImpactResult {
  const MIN_ENTRIES_FOR_DATA = 3;

  if (!entries.length || !personName) {
    return {
      mentionCount: 0,
      avgMoodWithPerson: 0,
      baselineMoodAvg: 0,
      impactDelta: 0,
      impactLabel: 'Not enough data',
      insight: 'Keep journaling to unlock relational insights.',
      lastMentionDate: null,
      hasData: false,
    };
  }

  const allScores = entries.map(moodScore);
  const baselineMoodAvg = allScores.reduce((a, b) => a + b, 0) / allScores.length;

  const mentionedEntries = entries.filter(e =>
    containsName(e.content ?? '', personName) ||
    containsName(e.title ?? '', personName),
  );

  if (mentionedEntries.length < MIN_ENTRIES_FOR_DATA) {
    return {
      mentionCount: mentionedEntries.length,
      avgMoodWithPerson: 0,
      baselineMoodAvg,
      impactDelta: 0,
      impactLabel: 'Building picture',
      insight: `Mention ${personName} in a few more journal entries to see their impact on your emotional state.`,
      lastMentionDate: mentionedEntries[0]?.date ?? null,
      hasData: false,
    };
  }

  const mentionScores = mentionedEntries.map(moodScore);
  const avgMoodWithPerson =
    mentionScores.reduce((a, b) => a + b, 0) / mentionScores.length;
  const impactDelta = avgMoodWithPerson - baselineMoodAvg;
  const impactLabel = impactLabelFromDelta(impactDelta);

  const firstName = personName.trim().split(/\s+/)[0];
  const direction = impactDelta >= 0 ? 'higher' : 'lower';
  const absFormatted = Math.abs(impactDelta).toFixed(1);

  const insight = impactDelta >= 0.2
    ? `When you write about ${firstName}, your mood averages ${absFormatted} points ${direction} than your baseline — ${firstName} is a ${impactLabel} for your nervous system.`
    : impactDelta <= -0.2
    ? `Entries about ${firstName} coincide with mood that is ${absFormatted} points ${direction} than your baseline. This connection may be ${impactLabel} for your system.`
    : `Your mood stays near baseline when you write about ${firstName} — a neutral, steady dynamic.`;

  const lastMentionDate = mentionedEntries[0]?.date ?? null;

  return {
    mentionCount: mentionedEntries.length,
    avgMoodWithPerson,
    baselineMoodAvg,
    impactDelta,
    impactLabel,
    insight,
    lastMentionDate,
    hasData: true,
  };
}
