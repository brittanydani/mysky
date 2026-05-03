/**
 * Daily Loop Service
 *
 * Implements the "Daily Loop" growth model for MySky.
 * Computes streak status, weekly summaries, and return-motivation nudges.
 *
 * All functions are pure or async (reading from Supabase-backed storage only).
 * No side effects — just data for the Home dashboard.
 *
 * Design philosophy:
 *  - Keep the daily loop under 60 seconds
 *  - Leave insight generation to the canonical V2 insight surface
 */

import { supabaseDb } from '../storage/supabaseDb';
import { toLocalDateString, getCheckInDateString } from '../../utils/dateUtils';
import { mean } from '../../utils/stats';
import { logger } from '../../utils/logger';
import type { SelfKnowledgeContext } from '../insights/selfKnowledgeContext';
import { generateWeeklySynthesis, type WeeklySynthesisContext } from './weeklySynthesisLibrary';
import type { DailyCheckIn } from '../patterns/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface StreakStatus {
  /** Current consecutive days with a check-in */
  current: number;
  /** Whether the user has checked in today */
  checkedInToday: boolean;
  /** Whether the streak is at risk (no check-in today, but had one yesterday) */
  atRisk: boolean;
  /** Total check-ins recorded */
  totalCheckIns: number;
  /** Milestone reached (7, 14, 30, 60, 90, 180, 365) or null */
  milestone: number | null;
  /** Days since last check-in (0 = today, 1 = yesterday, etc.) */
  daysSinceLastCheckIn: number;
}

export interface WeeklyReflection {
  /** Average mood this week (1–10) */
  avgMood: number;
  /** Average mood last week (1–10), null if insufficient data */
  prevAvgMood: number | null;
  /** Mood change direction */
  moodDirection: 'up' | 'down' | 'stable';
  /** Average sleep hours this week */
  avgSleep: number;
  /** Number of check-ins this week */
  checkInCount: number;
  /** Number of journal entries this week */
  journalCount: number;
  /** Human-readable weekly summary sentence */
  summary: string;
  /** Whether enough data exists for a meaningful summary (≥3 check-ins) */
  hasEnoughData: boolean;
}

export interface ReturnNudge {
  /** The nudge message */
  text: string;
  /** CTA button label */
  ctaLabel: string;
  /** Where to navigate */
  ctaRoute: string;
  /** Urgency level */
  urgency: 'gentle' | 'warm' | 'motivating';
}

export interface DailyLoopData {
  streak: StreakStatus;
  weeklyReflection: WeeklyReflection;
  returnNudge: ReturnNudge | null;
  weeklySynthesis: WeeklySynthesis | null;
}

export interface WeeklySynthesis {
  /** One-paragraph narrative connecting mood, sleep, journal, and dream data */
  narrative: string;
  /** Individual data points that fed the narrative */
  signals: SynthesisSignal[];
  /** Whether enough cross-domain data exists for a meaningful synthesis */
  hasEnoughData: boolean;
}

export interface SynthesisSignal {
  domain: 'mood' | 'sleep' | 'journal' | 'dream';
  label: string;
  detail: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Milestones
// ─────────────────────────────────────────────────────────────────────────────

const MILESTONES = [7, 14, 30, 60, 90, 180, 365];

function getMilestone(streak: number): number | null {
  // Return the milestone if the streak just hit it today
  if (MILESTONES.includes(streak)) return streak;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

// Streak Status
// ─────────────────────────────────────────────────────────────────────────────

export async function getStreakStatus(chartId: string): Promise<StreakStatus> {
  try {
    const checkIns = await supabaseDb.getCheckIns(chartId, 90);
    const totalCheckIns = await supabaseDb.getTotalCheckInCount();

    if (checkIns.length === 0) {
      return {
        current: 0,
        checkedInToday: false,
        atRisk: false,
        totalCheckIns: 0,
        milestone: null,
        daysSinceLastCheckIn: -1,
      };
    }

    const today = getCheckInDateString();
    const dateSet = new Set(checkIns.map(c => c.date));
    const checkedInToday = dateSet.has(today);

    // Calculate consecutive streak
    // Use the same 2AM-adjusted base date as getCheckInDateString so all date
    // arithmetic is consistent (before 2 AM, check-in day is still "yesterday").
    let streak = 0;
    const now = new Date();
    if (now.getHours() < 2) now.setDate(now.getDate() - 1);
    for (let i = 0; i < 90; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (dateSet.has(toLocalDateString(d))) {
        streak++;
      } else {
        break;
      }
    }

    // Days since last check-in
    let daysSinceLastCheckIn = 0;
    for (let i = 0; i < 90; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (dateSet.has(toLocalDateString(d))) {
        daysSinceLastCheckIn = i;
        break;
      }
    }

    // At risk: had a streak yesterday but haven't checked in today
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const hadYesterday = dateSet.has(toLocalDateString(yesterday));
    const atRisk = !checkedInToday && hadYesterday && streak === 0;

    // If at-risk, show the streak they'd lose (count from yesterday)
    let displayStreak = streak;
    if (atRisk) {
      let yesterdayStreak = 0;
      for (let i = 1; i < 90; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        if (dateSet.has(toLocalDateString(d))) {
          yesterdayStreak++;
        } else {
          break;
        }
      }
      displayStreak = yesterdayStreak;
    }

    return {
      current: displayStreak,
      checkedInToday,
      atRisk,
      totalCheckIns,
      milestone: getMilestone(displayStreak),
      daysSinceLastCheckIn,
    };
  } catch (e) {
    logger.error('[DailyLoop] getStreakStatus failed:', e);
    return {
      current: 0,
      checkedInToday: false,
      atRisk: false,
      totalCheckIns: 0,
      milestone: null,
      daysSinceLastCheckIn: -1,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly Reflection
// ─────────────────────────────────────────────────────────────────────────────

export async function getWeeklyReflection(chartId: string): Promise<WeeklyReflection> {
  try {
    const checkIns = await supabaseDb.getCheckIns(chartId, 14);
    const sleepEntries = await supabaseDb.getSleepEntries(chartId, 14);

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const sevenDaysAgoKey = toLocalDateString(sevenDaysAgo);
    const fourteenDaysAgoKey = toLocalDateString(fourteenDaysAgo);

    const thisWeek = checkIns.filter(c => c.date >= sevenDaysAgoKey);
    const lastWeek = checkIns.filter(
      c => c.date >= fourteenDaysAgoKey && c.date < sevenDaysAgoKey,
    );

    const thisWeekMoods = thisWeek.map(c => c.moodScore).filter((v): v is number => v != null);
    const lastWeekMoods = lastWeek.map(c => c.moodScore).filter((v): v is number => v != null);

    const avgMood = thisWeekMoods.length > 0 ? mean(thisWeekMoods) : 0;
    const prevAvgMood = lastWeekMoods.length > 0 ? mean(lastWeekMoods) : null;

    const moodDelta = prevAvgMood != null ? avgMood - prevAvgMood : 0;
    const moodDirection: 'up' | 'down' | 'stable' =
      moodDelta > 0.3 ? 'up' : moodDelta < -0.3 ? 'down' : 'stable';

    // Sleep this week
    const thisWeekSleep = sleepEntries
      .filter(s => s.date >= sevenDaysAgoKey)
      .map(s => s.durationHours)
      .filter((v): v is number => v != null);
    const avgSleep = thisWeekSleep.length > 0 ? mean(thisWeekSleep) : 0;

    let journalCount = 0;
    try {
      const journals = await supabaseDb.getJournalEntriesInRange(sevenDaysAgoKey, toLocalDateString(now));
      journalCount = journals.length;
    } catch {
      // Journal lookup can fail if table doesn't exist yet
    }

    const hasEnoughData = thisWeekMoods.length >= 3;
    const summary = buildWeeklySummary({
      avgMood,
      prevAvgMood,
      moodDirection,
      avgSleep,
      checkInCount: thisWeek.length,
      journalCount,
      hasEnoughData,
    });

    return {
      avgMood: Math.round(avgMood * 10) / 10,
      prevAvgMood: prevAvgMood != null ? Math.round(prevAvgMood * 10) / 10 : null,
      moodDirection,
      avgSleep: Math.round(avgSleep * 10) / 10,
      checkInCount: thisWeek.length,
      journalCount,
      summary,
      hasEnoughData,
    };
  } catch (e) {
    logger.error('[DailyLoop] getWeeklyReflection failed:', e);
    return {
      avgMood: 0,
      prevAvgMood: null,
      moodDirection: 'stable',
      avgSleep: 0,
      checkInCount: 0,
      journalCount: 0,
      summary: '',
      hasEnoughData: false,
    };
  }
}

function buildWeeklySummary(data: {
  avgMood: number;
  prevAvgMood: number | null;
  moodDirection: 'up' | 'down' | 'stable';
  avgSleep: number;
  checkInCount: number;
  journalCount: number;
  hasEnoughData: boolean;
}): string {
  if (!data.hasEnoughData) {
    if (data.checkInCount === 0) {
      return 'Start tracking this week to see your first weekly reflection.';
    }
    if (data.checkInCount === 1) {
      const moodHint = data.avgMood >= 7 ? 'Your first entry shows a positive start.'
        : data.avgMood >= 5 ? 'Your first entry logged a steady baseline.'
        : 'Your first entry captured a heavier moment — that honesty is valuable.';
      return `You've checked in once this week. ${moodHint} Add a few more and this space will start reflecting back something more reliable than a single moment.`;
    }
    const moodHint = data.avgMood >= 7 ? 'So far your mood is trending positive.'
      : data.avgMood >= 5 ? 'Your mood has been steady so far.'
      : 'Your entries suggest a harder stretch — tracking through it builds real insight.';
    return `You have ${data.checkInCount} check-ins so far this week. ${moodHint} A couple more entries will help this reflection separate a passing day from a meaningful pattern.`;
  }

  const trendFragment = data.prevAvgMood != null
    ? data.moodDirection === 'up'
      ? `, up from ${data.prevAvgMood.toFixed(1)} last week`
      : data.moodDirection === 'down'
        ? `, down from ${data.prevAvgMood.toFixed(1)} last week`
        : `, close to ${data.prevAvgMood.toFixed(1)} last week`
    : '';
  const sleepFragment = data.avgSleep > 0 ? ` while sleep averaged ${data.avgSleep.toFixed(1)} hours.` : '.';
  const lead = `Your mood averaged ${data.avgMood.toFixed(1)} this week${trendFragment}${sleepFragment}`;

  const highObservation = data.checkInCount >= 5;
  const deepReflection = data.journalCount >= 3;
  const lowerBaseline = data.avgMood > 0 && data.avgMood < 5.5;

  let interpretation: string;
  if (highObservation && deepReflection) {
    interpretation = `What stands out is that you still checked in ${data.checkInCount} times and wrote ${data.journalCount} journal entries. That combination usually means you were not avoiding yourself - you were trying to stay close enough to understand what was happening.`;
  } else if (highObservation) {
    interpretation = `What stands out is that you still checked in ${data.checkInCount} times. That usually means the week was being observed instead of left to blur together.`;
  } else if (deepReflection) {
    interpretation = `You wrote ${data.journalCount} journal entries this week. That usually means you were reaching for language, not disappearing from what you felt.`;
  } else if (data.journalCount > 0) {
    interpretation = `Even a lighter archive can still say something real. Your ${data.journalCount} journal ${data.journalCount === 1 ? 'entry adds' : 'entries add'} context around the mood pattern instead of leaving it as a number alone.`;
  } else {
    interpretation = 'The strongest signal here is the combination, not the average alone. Mood and sleep are moving together enough to treat this as pattern rather than noise.';
  }

  let meaning: string;
  if (lowerBaseline && (highObservation || deepReflection)) {
    meaning = `Tracking through a low week is harder than tracking through a good one. The archive you built this week will matter more than an archive built only when things were easy.`;
  } else if (data.moodDirection === 'up') {
    meaning = `Something shifted this week in a positive direction. The data does not explain the cause, but the pattern is real — and patterns that are real once tend to be reproducible.`;
  } else if (data.moodDirection === 'stable' && (highObservation || deepReflection)) {
    meaning = `Stability is its own signal. A steady week with consistent observation means your baseline is holding — and that is the foundation everything else is built on.`;
  } else if (data.avgSleep > 0 && data.avgSleep < 6.8) {
    meaning = `Sleep averaged ${data.avgSleep.toFixed(1)} hours this week, which is below the threshold where most people maintain emotional resilience. That is likely part of the story here.`;
  } else {
    meaning = `This week's data is one chapter, not a conclusion. The pattern becomes readable when enough chapters accumulate — and this one is now part of the record.`;
  }

  return [lead, interpretation, meaning].join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Return Nudge
// ─────────────────────────────────────────────────────────────────────────────

function buildReturnNudge(streak: StreakStatus): ReturnNudge | null {
  // Already checked in today — no nudge needed
  if (streak.checkedInToday) return null;

  // Streak at risk
  if (streak.atRisk && streak.current >= 3) {
    return {
      text: `Your ${streak.current}-day streak is waiting for today's entry.`,
      ctaLabel: 'Quick Check-In',
      ctaRoute: '/(tabs)/internal-weather',
      urgency: 'motivating',
    };
  }

  if (streak.atRisk) {
    return {
      text: 'Pick up where you left off — a quick check-in keeps your rhythm going.',
      ctaLabel: 'Check In Now',
      ctaRoute: '/(tabs)/internal-weather',
      urgency: 'warm',
    };
  }

  // Haven't checked in today (but no active streak to lose)
  if (streak.daysSinceLastCheckIn <= 2) {
    return {
      text: 'A few seconds to check in can shape how you understand your day.',
      ctaLabel: 'Log Your Mood',
      ctaRoute: '/(tabs)/internal-weather',
      urgency: 'gentle',
    };
  }

  // Been away for a while
  if (streak.daysSinceLastCheckIn > 2) {
    return {
      text: 'Welcome back. Your reflection space is ready whenever you are.',
      ctaLabel: 'Start Again',
      ctaRoute: '/(tabs)/internal-weather',
      urgency: 'gentle',
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Entry Point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute all daily loop data for the Home dashboard.
 * Call this once on screen focus.
 *
 * selfKnowledge is kept in the signature for callers that already pass it.
 */
export async function getDailyLoopData(
  chartId: string,
  _selfKnowledge?: SelfKnowledgeContext,
): Promise<DailyLoopData> {
  const streak = await getStreakStatus(chartId);
  const weeklyReflection = await getWeeklyReflection(chartId);
  const returnNudge = buildReturnNudge(streak);
  const weeklySynthesis = await getWeeklySynthesis(chartId);

  return {
    streak,
    weeklyReflection,
    returnNudge,
    weeklySynthesis,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly Cross-Screen Synthesis
// ─────────────────────────────────────────────────────────────────────────────

async function getWeeklySynthesis(chartId: string): Promise<WeeklySynthesis | null> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const sevenDaysAgoKey = toLocalDateString(sevenDaysAgo);

    const [checkIns, sleepEntries, journals] = await Promise.all([
      supabaseDb.getCheckIns(chartId, 14),
      supabaseDb.getSleepEntries(chartId, 14),
      supabaseDb.getJournalEntriesInRange(sevenDaysAgoKey, toLocalDateString(now)),
    ]);

    const weekCheckIns = checkIns.filter(c => c.date >= sevenDaysAgoKey);
    const weekSleep = sleepEntries.filter(s => s.date >= sevenDaysAgoKey);
    const weekJournals = journals;
    const weekDreams = weekSleep.filter(s => s.dreamText?.trim());

    // Previous week for trend analysis
    const prevWeekCheckIns = checkIns.filter(
      c => c.date >= toLocalDateString(fourteenDaysAgo) && c.date < sevenDaysAgoKey
    );

    const domains = [
      weekCheckIns.length > 0,
      weekSleep.length > 0,
      weekJournals.length > 0,
      weekDreams.length > 0,
    ].filter(Boolean).length;

    if (domains < 2) return null;

    // Build signals for UI display
    const signals: SynthesisSignal[] = [];

    // Compute mood metrics
    const moods = weekCheckIns.map(c => c.moodScore).filter((v): v is number => v != null);
    const avgMood = moods.length > 0 ? mean(moods) : 0;
    const highDays = weekCheckIns.filter(c => c.moodScore != null && c.moodScore >= 7).length;
    const lowDays = weekCheckIns.filter(c => c.moodScore != null && c.moodScore <= 4).length;
    const moodRange = moods.length > 0 ? { high: Math.max(...moods), low: Math.min(...moods) } : { high: 0, low: 0 };

    // Determine mood trend
    const prevMoods = prevWeekCheckIns.map(c => c.moodScore).filter((v): v is number => v != null);
    const prevAvgMood = prevMoods.length > 0 ? mean(prevMoods) : null;
    let moodTrend: 'rising' | 'falling' | 'stable' | 'volatile' = 'stable';
    if (prevAvgMood !== null) {
      const delta = avgMood - prevAvgMood;
      if (delta > 0.5) moodTrend = 'rising';
      else if (delta < -0.5) moodTrend = 'falling';
    }
    if (highDays > 0 && lowDays > 0 && moodRange.high - moodRange.low >= 3) {
      moodTrend = 'volatile';
    }

    // Compute sleep metrics
    const sleepHours = weekSleep.map(s => s.durationHours).filter((v): v is number => v != null);
    const avgSleep = sleepHours.length > 0 ? mean(sleepHours) : 0;

    // Extract top tags
    const tagCounts: Record<string, number> = {};
    for (const c of weekCheckIns) {
      if (c.tags) {
        for (const tag of c.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }
    const topTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]).slice(0, 3);

    // Get current week number and season
    const weekNumber = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    const month = now.getMonth();
    const season = month >= 2 && month <= 4 ? 'spring'
      : month >= 5 && month <= 7 ? 'summer'
      : month >= 8 && month <= 10 ? 'fall'
      : 'winter';

    // Build context for premium narrative generation
    const ctx: WeeklySynthesisContext = {
      checkIns: weekCheckIns,
      avgMood,
      moodRange,
      moodTrend,
      highDays,
      lowDays,
      sleepEntries: weekSleep,
      avgSleep,
      sleepQuality: null,
      sleepConsistency: null,
      journals: weekJournals,
      journalCount: weekJournals.length,
      dreams: weekDreams,
      dreamCount: weekDreams.length,
      sleepMoodCorrelation: null,
      topTags,
      weekNumber,
      season,
    };

    // Generate premium narrative using library
    const narrative = generateWeeklySynthesis(ctx);

    // Build signals for UI
    if (weekCheckIns.length > 0) {
      signals.push({
        domain: 'mood',
        label: `${weekCheckIns.length} mood signals`,
        detail: `Avg mood ${avgMood.toFixed(1)}/10`,
      });
    }

    if (weekSleep.length > 0) {
      signals.push({
        domain: 'sleep',
        label: `${weekSleep.length} sleep logs`,
        detail: avgSleep > 0 ? `Avg ${avgSleep.toFixed(1)}h` : 'Quality tracked',
      });
    }

    if (weekJournals.length > 0) {
      signals.push({
        domain: 'journal',
        label: `${weekJournals.length} journal ${weekJournals.length === 1 ? 'entry' : 'entries'}`,
        detail: 'Written reflections',
      });
    }

    if (weekDreams.length > 0) {
      signals.push({
        domain: 'dream',
        label: `${weekDreams.length} dream${weekDreams.length !== 1 ? 's' : ''}`,
        detail: 'Subconscious processing',
      });
    }

    return {
      narrative,
      signals,
      hasEnoughData: domains >= 2,
    };
  } catch (e) {
    logger.error('[DailyLoop] getWeeklySynthesis failed:', e);
    return null;
  }
}
