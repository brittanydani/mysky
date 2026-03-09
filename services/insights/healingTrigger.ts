/**
 * Healing Trigger Engine
 *
 * System 3 – Sentiment Tone Tracking
 * System 5 – Theme Engine (Progress / Recovery Cycles)
 *
 * Analyses recent journal entries and check-in data to:
 *  1. Detect a heavy/guarded tone that should surface a "Healing Note"
 *  2. Calculate a Recovery Score — how quickly the user bounces back
 *     after a heavy period, compared to the previous month
 *  3. Suggest a Somatic Anchor (body-based quick action) tied to the
 *     dominant fear/avoidant pattern.
 */

import { JournalEntry } from '../storage/models';
import { DailyCheckIn } from '../patterns/types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SomaticAnchor {
  /** Short action label */
  action: string;
  /** Why it helps — connected to the detected pattern */
  rationale: string;
  /** Duration hint */
  duration: string;
}

export interface RecoveryScore {
  /** Average days to recover from a heavy streak this month */
  thisMonthDays: number | null;
  /** Average days to recover from a heavy streak last month */
  lastMonthDays: number | null;
  /** True when this month is measurably faster */
  improving: boolean;
  /** One-sentence progress insight */
  progressInsight: string;
}

export interface HealingTriggerResult {
  /** Whether a healing note should be surfaced */
  triggered: boolean;
  /** The headline note shown in the "Shadow Work" trigger card */
  healingNote: string;
  /** The detected tone: heavy, guarded, or neutral */
  tone: 'heavy' | 'guarded' | 'neutral';
  /** Suggested body-based action */
  somaticAnchor: SomaticAnchor;
  /** Recovery trajectory insight */
  recoveryScore: RecoveryScore;
  /** Current active theme cycle (e.g. "Communication Review Cycle") */
  activeCycle: string | null;
}

// ── Mood helpers ─────────────────────────────────────────────────────────────

const MOOD_SCORE: Record<string, number> = {
  calm: 5,
  soft: 4,
  okay: 3,
  heavy: 2,
  stormy: 1,
};

function journalMoodScore(entry: JournalEntry): number {
  return MOOD_SCORE[entry.mood] ?? 3;
}

function checkInMoodScore(ci: DailyCheckIn): number {
  return ci.moodScore; // already 1-10; scale down to 1-5 for comparison
}

// ── Somatic Anchors library ──────────────────────────────────────────────────

const SOMATIC_ANCHORS: SomaticAnchor[] = [
  {
    action: 'Box Breathing',
    rationale: 'Signals safety to your nervous system when the threat response is active.',
    duration: '3 minutes',
  },
  {
    action: '5-4-3-2-1 Grounding',
    rationale: 'Brings your attention into the present body, reducing cognitive spiral.',
    duration: '2 minutes',
  },
  {
    action: 'Cold water on wrists',
    rationale: 'Activates the dive reflex — slows heart rate and quiets the alarm system.',
    duration: '30 seconds',
  },
  {
    action: 'Gentle neck rolls',
    rationale: 'Releases stored tension along the vagus nerve pathway.',
    duration: '2 minutes',
  },
  {
    action: 'Hand on heart, slow exhale',
    rationale: 'Self-compassion touch activates the soothing system and reduces cortisol.',
    duration: '1 minute',
  },
];

function pickSomaticAnchor(seed: number): SomaticAnchor {
  return SOMATIC_ANCHORS[seed % SOMATIC_ANCHORS.length];
}

// ── Sentiment helpers ─────────────────────────────────────────────────────────

function parseSentiment(entry: JournalEntry): number | null {
  if (!entry.contentSentiment) return null;
  try {
    const parsed = JSON.parse(entry.contentSentiment);
    if (typeof parsed?.sentiment === 'number') return parsed.sentiment;
  } catch {
    // ignore
  }
  return null;
}

function isHeavyEntry(entry: JournalEntry): boolean {
  if (entry.mood === 'heavy' || entry.mood === 'stormy') return true;
  const sentiment = parseSentiment(entry);
  if (sentiment !== null && sentiment < -0.3) return true;
  return false;
}

function isGuardedEntry(entry: JournalEntry): boolean {
  if (entry.mood === 'okay' && entry.contentWordCount !== undefined && entry.contentWordCount < 30) return true;
  const sentiment = parseSentiment(entry);
  if (sentiment !== null && sentiment >= -0.3 && sentiment < -0.05) return true;
  return false;
}

// ── Recovery score calculator ─────────────────────────────────────────────────

/**
 * Given an ordered (newest-first) array of journal entries, finds heavy-period
 * "recovery arcs" — runs of heavy/stormy entries followed by recovery.
 * Returns the average number of days each recovery took.
 */
function computeRecoveryDays(entries: JournalEntry[]): number | null {
  // Work oldest-first so runs are chronological
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const recoveries: number[] = [];
  let heavyStreakStart: string | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const heavy = isHeavyEntry(entry);

    if (heavy && heavyStreakStart === null) {
      heavyStreakStart = entry.date;
    } else if (!heavy && heavyStreakStart !== null) {
      // Recovery reached
      const startMs = new Date(heavyStreakStart).getTime();
      const endMs = new Date(entry.date).getTime();
      const days = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
      if (days >= 1) recoveries.push(days);
      heavyStreakStart = null;
    }
  }

  if (!recoveries.length) return null;
  return recoveries.reduce((a, b) => a + b, 0) / recoveries.length;
}

function entriesInWindow(entries: JournalEntry[], daysAgo: number, endDaysAgo = 0): JournalEntry[] {
  const now = Date.now();
  const start = now - daysAgo * 24 * 60 * 60 * 1000;
  const end = now - endDaysAgo * 24 * 60 * 60 * 1000;
  return entries.filter(e => {
    const ms = new Date(e.date).getTime();
    return ms >= start && ms <= end;
  });
}

// ── Theme keyword detection ───────────────────────────────────────────────────

const THEME_KEYWORDS: Array<{ keywords: string[]; label: string }> = [
  { keywords: ['communication', 'conversation', 'talk', 'words', 'said', 'listen'], label: 'Communication Review Cycle' },
  { keywords: ['healing', 'progress', 'growth', 'better', 'recovery'], label: 'Healing & Growth Cycle' },
  { keywords: ['boundary', 'boundaries', 'space', 'protect', 'enough'], label: 'Boundaries Cycle' },
  { keywords: ['trust', 'safe', 'safe enough', 'scared', 'afraid'], label: 'Trust & Safety Cycle' },
  { keywords: ['work', 'career', 'job', 'purpose', 'meaning'], label: 'Purpose & Direction Cycle' },
];

function detectActiveCycle(entries: JournalEntry[]): string | null {
  const combined = entries
    .slice(0, 14)
    .map(e => (e.content ?? '') + ' ' + (e.title ?? ''))
    .join(' ')
    .toLowerCase();

  let bestLabel: string | null = null;
  let bestCount = 0;

  for (const theme of THEME_KEYWORDS) {
    const count = theme.keywords.reduce(
      (sum, kw) => sum + (combined.split(kw).length - 1),
      0,
    );
    if (count > bestCount) {
      bestCount = count;
      bestLabel = theme.label;
    }
  }

  return bestCount >= 2 ? bestLabel : null;
}

// ── Main export ──────────────────────────────────────────────────────────────

export function computeHealingTrigger(
  entries: JournalEntry[],
  _checkIns?: DailyCheckIn[], // reserved for future weighting
): HealingTriggerResult {
  const ANCHOR_SEED = new Date().getDate(); // rotates daily

  // Default neutral result
  const neutralAnchor = pickSomaticAnchor(ANCHOR_SEED);
  const neutral: HealingTriggerResult = {
    triggered: false,
    healingNote: '',
    tone: 'neutral',
    somaticAnchor: neutralAnchor,
    recoveryScore: {
      thisMonthDays: null,
      lastMonthDays: null,
      improving: false,
      progressInsight: '',
    },
    activeCycle: null,
  };

  if (!entries.length) return neutral;

  // Look at the 7 most recent entries for tone detection
  const recent = entries.slice(0, 7);
  const heavyRecent = recent.filter(isHeavyEntry);
  const guardedRecent = recent.filter(isGuardedEntry);

  let tone: 'heavy' | 'guarded' | 'neutral' = 'neutral';
  let healingNote = '';

  if (heavyRecent.length >= 2) {
    tone = 'heavy';
    healingNote =
      'Your recent entries carry a heavy tone. This is your nervous system asking for gentleness, not force. A healing note has been prepared for you.';
  } else if (guardedRecent.length >= 3) {
    tone = 'guarded';
    healingNote =
      'Your writing has been brief and protected lately. Something may be asking to be held — not fixed. This is a safe space to explore it.';
  }

  const triggered = tone !== 'neutral';

  // Recovery score: this month vs. last month
  const thisMonthEntries = entriesInWindow(entries, 30);
  const lastMonthEntries = entriesInWindow(entries, 60, 30);

  const thisMonthDays = computeRecoveryDays(thisMonthEntries);
  const lastMonthDays = computeRecoveryDays(lastMonthEntries);

  let improving = false;
  let progressInsight = '';

  if (thisMonthDays !== null && lastMonthDays !== null) {
    improving = thisMonthDays < lastMonthDays;
    const diff = Math.round(Math.abs(lastMonthDays - thisMonthDays));
    const activeCycleLabel = detectActiveCycle(entries) ?? 'heaviness';

    if (improving) {
      progressInsight = `You are moving through a ${activeCycleLabel}. Last month, this theme caused a ${Math.round(lastMonthDays)}-day mood dip. This month, you recovered in ${Math.round(thisMonthDays)} day${Math.round(thisMonthDays) === 1 ? '' : 's'}. This is measurable growth.`;
    } else if (diff <= 1) {
      progressInsight = `Your recovery time from heavy periods is staying steady at around ${Math.round(thisMonthDays)} day${Math.round(thisMonthDays) === 1 ? '' : 's'}. Stability is growth too.`;
    } else {
      progressInsight = `Your recovery from heavy periods is taking about ${Math.round(thisMonthDays)} day${Math.round(thisMonthDays) === 1 ? '' : 's'} this month — a little longer than last month. Be patient with yourself.`;
    }
  } else if (thisMonthDays !== null) {
    progressInsight = `You tend to recover from heavy periods in around ${Math.round(thisMonthDays)} day${Math.round(thisMonthDays) === 1 ? '' : 's'}. Keep tracking to see your growth trajectory.`;
  }

  const activeCycle = detectActiveCycle(entries);

  return {
    triggered,
    healingNote,
    tone,
    somaticAnchor: pickSomaticAnchor(ANCHOR_SEED),
    recoveryScore: {
      thisMonthDays,
      lastMonthDays,
      improving,
      progressInsight,
    },
    activeCycle,
  };
}
