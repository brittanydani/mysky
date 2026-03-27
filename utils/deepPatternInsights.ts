/**
 * deepPatternInsights.ts
 *
 * Aggregates all data sources available in MySky into a single typed bundle
 * for the Patterns screen's 8 insight lenses:
 *
 *   1. Mood & Energy Patterns
 *   2. What Restores & Drains You
 *   3. Journal & Reflection
 *   4. Dream Life
 *   5. Inner Blueprint  (natal chart framed in psychological language)
 *   6. Body & Nervous System
 *   7. Relationship Mirror
 *   8. Inner Tensions
 *
 * All computation is synchronous and local — no network calls.
 * Astrology terms are intentionally absent from labels and descriptions.
 */

import { computeInsightBundle, InsightBundle, ChartThemeCard } from './insightsEngine';
import {
  computeInnerTensions,
  InnerTensionsData,
  NS_BRANCH_COLORS,
  NS_STATE_FULL_LABELS,
  NS_STATE_DESCRIPTIONS,
  TRIGGER_DISPLAY,
} from '../services/premium/innerTensionsEngine';
import type { DailyCheckIn } from '../services/patterns/types';
import type { JournalEntry, SleepEntry } from '../services/storage/models';
import type { NatalChart } from '../services/astrology/types';

export type { InnerTensionsData };

// ── Blueprint theme (chart, no astrology labels) ──────────────────────────────

export interface BlueprintTheme {
  title: string;
  body: string;
  icon: string;
}

// ── Relational pattern from check-in tags ────────────────────────────────────

export interface RelationalPattern {
  avgMoodWithRelTags: number | null;
  avgMoodWithoutRelTags: number | null;
  moodLift: number | null;
  relationalDays: number;
  socialDays: number;
  conflictDays: number;
  boundaryDays: number;
  familyDays: number;
  intimacyDays: number;
  totalDays: number;
  insight: string;
}

// ── Full deep bundle ──────────────────────────────────────────────────────────

export interface DeepPatternBundle {
  bundle: InsightBundle;
  innerTensions: InnerTensionsData;
  blueprint: BlueprintTheme[];
  relational: RelationalPattern | null;
  bodyTagStats: BodyTagStats;
}

export interface BodyTagStat {
  tag: string;
  label: string;
  days: number;
  avgMood: number;
}

export interface BodyTagStats {
  entries: BodyTagStat[];
  totalDays: number;
}

// ── Tag sets ──────────────────────────────────────────────────────────────────

const RELATIONAL_TAGS = ['relationships', 'social', 'intimacy', 'family'];

const BODY_TAG_MAP: Record<string, string> = {
  sleep: 'Sleep',
  movement: 'Movement',
  rest: 'Rest',
  hormones: 'Hormones',
  food: 'Food',
  overstimulated: 'Overstimulated',
  substances: 'Substances',
  screens: 'Screens',
  nature: 'Nature',
  alone_time: 'Alone Time',
};

// ── Main entry point ─────────────────────────────────────────────────────────

export function computeDeepPatternBundle(
  checkIns: DailyCheckIn[],
  journalEntries: JournalEntry[],
  sleepEntries: SleepEntry[],
  chart: NatalChart | null,
): DeepPatternBundle {
  const bundle = computeInsightBundle(checkIns, journalEntries, chart);
  const innerTensions = computeInnerTensions(sleepEntries);
  const blueprint = translateChartThemes(bundle.chartThemes);
  const relational = computeRelationalPattern(checkIns);
  const bodyTagStats = computeBodyTagStats(checkIns);

  return { bundle, innerTensions, blueprint, relational, bodyTagStats };
}

// ── Chart theme translation (no astrology labels) ─────────────────────────────

function translateChartThemes(themes: ChartThemeCard[]): BlueprintTheme[] {
  return themes.map(theme => {
    switch (theme.source) {
      case 'moon':
        return { title: 'Emotional Core', body: theme.body, icon: '🌙' };
      case 'saturn':
        return { title: 'Growth Edge', body: theme.body, icon: '🌿' };
      case 'chiron':
        return { title: 'Sensitivity Zone', body: theme.body, icon: '🔑' };
      case 'element':
        if (theme.label.startsWith('Dominant Modality')) {
          return { title: 'How You Move Through Change', body: theme.body, icon: '🌀' };
        }
        return { title: 'Your Inner Nature', body: theme.body, icon: '✦' };
      case 'house':
        if (theme.label.includes('6th')) {
          return { title: 'Daily Rhythm & Wellbeing', body: theme.body, icon: '⚙️' };
        }
        return { title: 'Rest & Inner Life', body: theme.body, icon: '🌌' };
      default:
        return { title: theme.label, body: theme.body, icon: '◎' };
    }
  });
}

// ── Relational pattern ────────────────────────────────────────────────────────

function computeRelationalPattern(checkIns: DailyCheckIn[]): RelationalPattern | null {
  if (checkIns.length < 3) return null;

  const withRelTags = checkIns.filter(c => c.tags.some(t => RELATIONAL_TAGS.includes(t)));
  const withoutRelTags = checkIns.filter(c => !c.tags.some(t => RELATIONAL_TAGS.includes(t)));

  const avgMood = (arr: DailyCheckIn[]): number | null =>
    arr.length === 0 ? null : arr.reduce((s, c) => s + c.moodScore, 0) / arr.length;

  const avgWith = avgMood(withRelTags);
  const avgWithout = avgMood(withoutRelTags);
  const moodLift = avgWith !== null && avgWithout !== null ? avgWith - avgWithout : null;

  const totalDays = checkIns.length;
  const relationalDays = withRelTags.length;
  const socialDays = checkIns.filter(c => c.tags.includes('social')).length;
  const conflictDays = checkIns.filter(c => c.tags.includes('conflict')).length;
  const boundaryDays = checkIns.filter(c => c.tags.includes('boundaries')).length;
  const familyDays = checkIns.filter(c => c.tags.includes('family')).length;
  const intimacyDays = checkIns.filter(c => c.tags.includes('intimacy')).length;

  let insight: string;
  if (relationalDays < 3) {
    insight = 'Log more check-ins on relational days to reveal your social patterns.';
  } else if (moodLift !== null && moodLift > 0.7) {
    insight = `Connection lifts you — days involving relationships average ${moodLift.toFixed(1)} points higher.`;
  } else if (moodLift !== null && moodLift < -0.7) {
    insight = `Relational days tend to carry more weight — your mood averages ${Math.abs(moodLift).toFixed(1)} points lower. This may reflect the depth of your involvement rather than harm.`;
  } else {
    insight = 'Your inner state stays fairly consistent across relational and solo days — you carry yourself well across contexts.';
  }

  return {
    avgMoodWithRelTags: avgWith,
    avgMoodWithoutRelTags: avgWithout,
    moodLift,
    relationalDays,
    socialDays,
    conflictDays,
    boundaryDays,
    familyDays,
    intimacyDays,
    totalDays,
    insight,
  };
}

// ── Body tag stats ────────────────────────────────────────────────────────────

function computeBodyTagStats(checkIns: DailyCheckIn[]): BodyTagStats {
  const totalDays = checkIns.length;
  if (totalDays === 0) return { entries: [], totalDays: 0 };

  const entries: BodyTagStat[] = Object.entries(BODY_TAG_MAP)
    .map(([tag, label]) => {
      const matching = checkIns.filter(c => c.tags.includes(tag));
      if (matching.length === 0) return null;
      const avgMood = matching.reduce((s, c) => s + c.moodScore, 0) / matching.length;
      return { tag, label, days: matching.length, avgMood };
    })
    .filter((e): e is BodyTagStat => e !== null)
    .sort((a, b) => b.days - a.days);

  return { entries, totalDays };
}

// ── Display helpers (re-exported for the UI) ──────────────────────────────────

export { NS_BRANCH_COLORS, NS_STATE_FULL_LABELS, NS_STATE_DESCRIPTIONS, TRIGGER_DISPLAY };
