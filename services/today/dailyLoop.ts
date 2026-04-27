/**
 * Daily Loop Service
 *
 * Implements the "Daily Loop" growth model for MySky.
 * Computes streak status, weekly summaries, human-readable insights,
 * sleep-mood correlations, and return-motivation nudges.
 *
 * All functions are pure or async (reading from Supabase-backed storage only).
 * No side effects — just data for the Home dashboard.
 *
 * Design philosophy:
 *  - Insights should be simple and emotional, not technical
 *  - "You reported higher mood on days when you slept longer" > "r=0.72 p<0.01"
 *  - Keep the daily loop under 60 seconds
 *  - Make the user feel understood, not analyzed
 */

import { supabaseDb } from '../storage/supabaseDb';
import { toLocalDateString, getCheckInDateString } from '../../utils/dateUtils';
import { mean } from '../../utils/stats';
import { logger } from '../../utils/logger';
import type { SelfKnowledgeContext } from '../insights/selfKnowledgeContext';
import { DRAIN_TAG_MAP, RESTORE_TAG_MAP } from '../../utils/selfKnowledgeCrossRef';
import { generateWeeklySynthesis, type WeeklySynthesisContext } from './weeklySynthesisLibrary';
import type { DailyCheckIn } from '../patterns/types';
import { selectPremiumInsightDraft } from '../insightsV2/selectPremiumInsightDraft';

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

export interface DailyInsight {
  /** The insight text — always human-readable */
  text: string;
  /** Category of the insight */
  type: 'sleep-mood' | 'consistency' | 'pattern' | 'encouragement' | 'milestone' | 'check-in';
  /** Accent color hint for the UI */
  accentColor: 'gold' | 'emerald' | 'silverBlue' | 'copper' | 'rose';
  /** Icon name (Ionicons) */
  icon: string;
  /**
   * Affirmation pairing theme — used by todayContentLibrary to bias the
   * daily affirmation toward a complementary tone.
   * calm | energy | growth | focus | reflect | milestone
   */
  theme?: 'calm' | 'energy' | 'growth' | 'focus' | 'reflect' | 'milestone';
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
  todayInsight: DailyInsight;
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

    // Journal count — getJournalEntries() returns all non-deleted entries
    let journalCount = 0;
    try {
      const journals = await supabaseDb.getJournalEntries();
      journalCount = journals.filter(j => j.date >= sevenDaysAgoKey).length;
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
// Sleep–Mood Correlation Insight
// ─────────────────────────────────────────────────────────────────────────────

async function getSleepMoodInsight(chartId: string): Promise<DailyInsight | null> {
  try {
    const checkIns = await supabaseDb.getCheckIns(chartId, 30);
    const sleepEntries = await supabaseDb.getSleepEntries(chartId, 30);

    if (checkIns.length < 7 || sleepEntries.length < 5) return null;

    // Build date-indexed maps
    // Build mood map — most recent check-in per date wins.
    // checkIns are returned newest-first, so iterate in reverse so the last
    // write for any date is the most-recent entry (not the earliest).
    const moodByDate: Record<string, number> = {};
    for (let i = checkIns.length - 1; i >= 0; i--) {
      const c = checkIns[i];
      if (c.moodScore != null) {
        moodByDate[c.date] = c.moodScore;
      }
    }

    const sleepByDate: Record<string, number> = {};
    for (const s of sleepEntries) {
      if (s.durationHours != null) {
        sleepByDate[s.date] = s.durationHours;
      }
    }

    // Find overlapping dates
    const sharedDates = Object.keys(moodByDate).filter(d => d in sleepByDate);
    if (sharedDates.length < 5) return null;

    // Split into good-sleep and poor-sleep groups
    const goodSleepMoods: number[] = [];
    const poorSleepMoods: number[] = [];

    for (const date of sharedDates) {
      const sleep = sleepByDate[date];
      const mood = moodByDate[date];
      if (sleep >= 7) {
        goodSleepMoods.push(mood);
      } else {
        poorSleepMoods.push(mood);
      }
    }

    // Need data in both groups to make a comparison
    if (goodSleepMoods.length < 2 || poorSleepMoods.length < 2) return null;

    const goodAvg = mean(goodSleepMoods);
    const poorAvg = mean(poorSleepMoods);
    const diff = goodAvg - poorAvg;

    if (Math.abs(diff) < 0.3) return null; // Not meaningful enough

    if (diff > 0) {
      return {
        text: `You reported higher mood on days when you slept 7+ hours — an average of ${goodAvg.toFixed(1)} vs ${poorAvg.toFixed(1)}.`,
        type: 'sleep-mood',
        accentColor: 'silverBlue',
        icon: 'moon-outline',
        theme: 'calm',
      };
    } else {
      return {
        text: `Interestingly, your mood has been slightly higher on shorter sleep nights. You may thrive on efficiency — or restless nights follow good days.`,
        type: 'sleep-mood',
        accentColor: 'silverBlue',
        icon: 'moon-outline',
        theme: 'focus',
      };
    }
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Consistency Insight
// ─────────────────────────────────────────────────────────────────────────────

function getConsistencyInsight(streak: StreakStatus): DailyInsight | null {
  if (streak.milestone != null) {
    const milestoneMessages: Record<number, string> = {
      7: `Seven consecutive days. That is enough data for MySky to start detecting real patterns in your mood and energy — not just individual moments.`,
      14: `Two weeks of daily tracking. The gap between who you think you are and what your data actually shows is starting to narrow.`,
      30: `Thirty days logged. A full month of behavioral data means your patterns are no longer theoretical — they are visible and specific to you.`,
      60: `Sixty check-ins. You have now built an archive detailed enough that MySky can detect subtle shifts most people would never notice about themselves.`,
      90: `Ninety days. At this depth, your data reveals not just what you feel but what reliably causes it — and that is a different kind of knowledge.`,
      180: `Six months of consistent tracking. Your archive now spans multiple seasons, stress cycles, and life contexts. That longitudinal depth is genuinely rare.`,
      365: `One year. Your data now covers enough variation — highs, lows, seasons, hard weeks and strong ones — that the patterns inside it are no longer guesses. They are yours.`,
    };

    return {
      text: milestoneMessages[streak.milestone] ?? `${streak.milestone} days of reflection — a meaningful milestone.`,
      type: 'milestone',
      accentColor: 'gold',
      icon: 'trophy-outline',
      theme: 'milestone',
    };
  }

  if (streak.current >= 5 && streak.current < 7) {
    return {
      text: `Five days logged this week. You are close enough to a full week of data that MySky can start detecting whether your mood follows a weekly rhythm — most people's does.`,
      type: 'consistency',
      accentColor: 'emerald',
      icon: 'flame-outline',
      theme: 'milestone',
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Today's Check-In Reflection
// ─────────────────────────────────────────────────────────────────────────────

function getLatestCheckInForDate(checkIns: DailyCheckIn[], date: string): DailyCheckIn | null {
  const todays = checkIns.filter((c) => c.date === date);
  if (todays.length === 0) return null;

  return [...todays].sort((a, b) => {
    const bTime = b.updatedAt ?? b.createdAt ?? '';
    const aTime = a.updatedAt ?? a.createdAt ?? '';
    return bTime.localeCompare(aTime);
  })[0] ?? null;
}

function getTodayCheckInDateCandidates(): string[] {
  const dates = [getCheckInDateString()];
  const now = new Date();
  if (now.getHours() < 6) {
    const logicalYesterday = new Date(now);
    logicalYesterday.setDate(logicalYesterday.getDate() - 1);
    dates.push(toLocalDateString(logicalYesterday));
  }
  return Array.from(new Set(dates));
}

function labelForTag(tag?: string): string | null {
  if (!tag) return null;
  return tag
    .replace(/^eq_/, '')
    .replace(/_(pos|neg)$/, '')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || null;
}

async function getTodayCheckInReflectionInsight(chartId: string): Promise<DailyInsight | null> {
  try {
    const checkIns = await supabaseDb.getCheckIns(chartId, 8);
    const latest = getTodayCheckInDateCandidates()
      .map((date) => getLatestCheckInForDate(checkIns, date))
      .find((checkIn): checkIn is DailyCheckIn => checkIn != null) ?? null;
    if (!latest) return null;

    // Day-of-year seed so text rotates daily even when conditions are identical
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    // Use a prime multiplier to spread consecutive days across small content pools
    const pick = <T>(arr: T[]): T => arr[((dayOfYear * 37) >>> 0) % arr.length];

    if (latest.moodScore >= 7 && latest.stressLevel === 'high') {
      return {
        text: pick([
          'High mood alongside high stress is a specific state — activated and stretched at the same time. Your capacity is real today, but it has a cost attached. Use it deliberately, not continuously.',
          'Your check-in shows energy up but stress also elevated. That combination can feel productive while quietly depleting reserves. Build a deliberate stop point into the day before you hit the wall.',
          'You are in an interesting spot today — mood is solid but stress is running high. That usually means you are carrying more than the surface shows. Front-load the important things while the capacity is there, but do not confuse stretched for sustainable.',
          'High mood and high stress is not contradiction — it is high engagement with elevated cost. The practice today is to notice when the engagement tips into depletion, not wait until after it does.',
        ]),
        type: 'check-in',
        accentColor: 'copper',
        icon: 'flash-outline',
        theme: 'focus',
      };
    }

    if (latest.moodScore <= 4 && latest.energyLevel === 'low') {
      return {
        text: pick([
          'Your check-in points to lower fuel and a heavier emotional load today. The useful move is not to force clarity — it is to lower the demand and choose one supportive next step.',
          'Low mood and low energy together signal that your system is in conservation mode. Today is not a day to push through. Protect your baseline and keep the agenda minimal.',
          'Today\'s data shows both mood and energy contracted. The most productive thing you can do right now is reduce what you are asking of yourself, not increase effort.',
          'Your check-in reads as a depleted day. That is information, not a verdict. One small act of recovery now is worth more than forcing your way through everything on the list.',
        ]),
        type: 'check-in',
        accentColor: 'rose',
        icon: 'pulse-outline',
        theme: 'calm',
      };
    }

    if (latest.stressLevel === 'high') {
      return {
        text: pick([
          'You logged high stress today, which makes this a day for smaller decisions and earlier recovery cues. Notice what can be simplified before your system has to get louder.',
          'High stress means your cognitive load is already elevated. Add as few new decisions as possible and move recovery activities earlier in the day rather than saving them for tonight.',
          'Today\'s check-in flags high stress. The most useful practice is to narrow your focus to one or two non-negotiables and let everything else wait. Stress amplifies urgency — not everything that feels urgent is.',
          'Your stress signal is high. That tends to compress your ability to assess risk accurately. Defer any decision that can wait 24 hours and build in a deliberate reset before the day ends.',
        ]),
        type: 'check-in',
        accentColor: 'copper',
        icon: 'leaf-outline',
        theme: 'calm',
      };
    }

    if (latest.energyLevel === 'low') {
      return {
        text: pick([
          'Your energy is low today, so the clearest insight is about pacing. Choose the version of the day that leaves enough of you intact for tonight.',
          'Low energy on today\'s check-in suggests your body needs more from you than your task list does. Sequence the most important thing first while you still have reserves, then give yourself permission to coast.',
          'Today calls for strategic conserving. Low energy is not an excuse — it is a constraint. Work with it by front-loading what matters and protecting your recovery window.',
          'Your energy reading is low. That usually means something upstream — sleep, food, emotional load, or all three. Name which one is most likely the source, and address that rather than pushing past the symptom.',
        ]),
        type: 'check-in',
        accentColor: 'silverBlue',
        icon: 'battery-dead-outline',
        theme: 'calm',
      };
    }

    if (latest.moodScore >= 8 && latest.stressLevel === 'low') {
      return {
        text: pick([
          'Your check-in shows a steadier, brighter baseline today. Study what is supporting that, because repeatable support is more useful than a lucky good mood.',
          'High mood and low stress is not just a good day — it is a data point worth analyzing. What did yesterday and this morning look like? The conditions driving this are worth knowing.',
          'Today\'s check-in reads as a genuinely strong day. That makes it a good time to handle the harder conversations or decisions you have been deferring. You have more capacity than usual right now.',
          'A clean check-in like today\'s is worth pausing on. What was different? Sleep, connection, reduced demands? Identifying the input helps you reproduce the output.',
        ]),
        type: 'check-in',
        accentColor: 'emerald',
        icon: 'trending-up-outline',
        theme: 'energy',
      };
    }

    const primaryTag = labelForTag(latest.tags?.[0]);
    if (primaryTag) {
      return {
        text: pick([
          `You named "${primaryTag}" in today's check-in. That signal is worth watching — repeated tags often reveal what shapes your baseline before the pattern is obvious.`,
          `"${primaryTag}" showed up in your check-in today. MySky will track whether it keeps appearing. Tags that recur across different mood days tell a different story than ones that cluster at the extremes.`,
          `Today you tagged "${primaryTag}". The most useful thing to notice is whether this tag tends to appear when mood is higher, lower, or does not seem to matter. That correlation takes a few more data points to confirm.`,
          `You logged "${primaryTag}" as part of today's picture. Consistent tagging is how MySky eventually shows you which situations reliably move your needle — in either direction.`,
        ]),
        type: 'check-in',
        accentColor: 'gold',
        icon: 'sparkles-outline',
        theme: 'focus',
      };
    }

    return {
      text: pick([
        "Today's check-in gives MySky a fresh read on your inner weather. Things look workable — the practice is to stay close to what keeps you steady.",
        "Check-in logged. Your baseline looks stable today. Stable is worth noting — it means what you are doing right now is working well enough to sustain.",
        "Today\'s entry is captured. A mid-range day is not a wasted one — it is the reference point that makes your highs and lows more legible over time.",
        "MySky has your check-in for today. Consistent logging on ordinary days is what makes pattern recognition possible on the interesting ones.",
      ]),
      type: 'check-in',
      accentColor: 'silverBlue',
      icon: 'checkmark-circle-outline',
      theme: 'reflect',
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern-Based Insights (simple, emotional language)
// ─────────────────────────────────────────────────────────────────────────────

async function getPatternInsight(chartId: string): Promise<DailyInsight | null> {
  try {
    const checkIns = await supabaseDb.getCheckIns(chartId, 30);
    if (checkIns.length < 10) return null;

    // Use calendar-date boundaries so "this week" and "last week" are accurate
    // regardless of how many check-ins occurred per day.
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const sevenDaysAgoKey = toLocalDateString(sevenDaysAgo);
    const fourteenDaysAgoKey = toLocalDateString(fourteenDaysAgo);

    const thisWeekMoods = checkIns
      .filter(c => c.moodScore != null && c.date >= sevenDaysAgoKey)
      .map(c => c.moodScore as number);
    const lastWeekMoods = checkIns
      .filter(c => c.moodScore != null && c.date >= fourteenDaysAgoKey && c.date < sevenDaysAgoKey)
      .map(c => c.moodScore as number);

    if (thisWeekMoods.length < 3 || lastWeekMoods.length < 3) return null;

    const recentAvg = mean(thisWeekMoods);
    const olderAvg = mean(lastWeekMoods);
    const delta = recentAvg - olderAvg;

    if (delta > 0.5) {
      return {
        text: `Your mood has been running higher this week than last. Something in your routine, rest, or emotional environment seems to be supporting you more gently right now.`,
        type: 'pattern',
        accentColor: 'emerald',
        icon: 'trending-up-outline',
        theme: 'energy',
      };
    }

    if (delta < -0.5) {
      return {
        text: `Your mood has softened slightly this week. It may not feel dramatic, but there is a real shift underneath, and noticing it early gives you more choice in how you meet it.`,
        type: 'pattern',
        accentColor: 'copper',
        icon: 'leaf-outline',
        theme: 'reflect',
      };
    }

    // Check for tag-based insight using all 30-day check-ins
    const allMoodScores = checkIns
      .filter(c => c.moodScore != null)
      .map(c => c.moodScore as number);
    if (allMoodScores.length < 7) return null;

    const tagCounts: Record<string, { total: number; moodSum: number }> = {};
    for (const c of checkIns) {
      if (c.tags && c.moodScore != null) {
        for (const tag of c.tags) {
          if (!tagCounts[tag]) tagCounts[tag] = { total: 0, moodSum: 0 };
          tagCounts[tag].total++;
          tagCounts[tag].moodSum += c.moodScore;
        }
      }
    }

    // Find a tag that lifts mood
    let bestTag: string | null = null;
    let bestLift = 0;
    const overallAvg = mean(allMoodScores);

    for (const [tag, data] of Object.entries(tagCounts)) {
      if (data.total >= 3) {
        const tagAvg = data.moodSum / data.total;
        const lift = tagAvg - overallAvg;
        if (lift > bestLift && lift > 0.5) {
          bestLift = lift;
          bestTag = tag;
        }
      }
    }

    if (bestTag) {
      const tagLabel = bestTag.charAt(0).toUpperCase() + bestTag.slice(1).replace(/_/g, ' ');
      return {
        text: `Days you tagged "${tagLabel}" correlate with higher mood — an average lift of ${bestLift.toFixed(1)} points above your baseline. That is a pattern worth protecting.`,
        type: 'pattern',
        accentColor: 'gold',
        icon: 'sparkles-outline',
        theme: 'growth',
      };
    }

    // Find the tag most correlated with lower mood (negative lift)
    let worstTag: string | null = null;
    let worstDrop = 0;
    for (const [tag, data] of Object.entries(tagCounts)) {
      if (data.total >= 3) {
        const tagAvg = data.moodSum / data.total;
        const drop = overallAvg - tagAvg;
        if (drop > worstDrop && drop > 0.7) {
          worstDrop = drop;
          worstTag = tag;
        }
      }
    }

    if (worstTag) {
      const tagLabel = worstTag.charAt(0).toUpperCase() + worstTag.slice(1).replace(/_/g, ' ');
      return {
        text: `Days tagged "${tagLabel}" tend to run ${worstDrop.toFixed(1)} points below your mood baseline. That is a consistent enough signal to take seriously, not explain away.`,
        type: 'pattern',
        accentColor: 'copper',
        icon: 'trending-down-outline',
        theme: 'reflect',
      };
    }

    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Encouragement Pool (fallback when no data-driven insight is available)
// ─────────────────────────────────────────────────────────────────────────────

const ENCOURAGEMENTS: DailyInsight[] = [
  {
    text: 'A check-in today gives MySky a real data point instead of a guess. The picture it builds is one only you can see.',
    type: 'encouragement',
    accentColor: 'gold',
    icon: 'sunny-outline',
    theme: 'reflect',
  },
  {
    text: 'The patterns that matter most accumulate quietly over time. Consistency surfaces what urgency buries.',
    type: 'encouragement',
    accentColor: 'silverBlue',
    icon: 'water-outline',
    theme: 'focus',
  },
  {
    text: 'Your emotional baseline is specific to you. The more you observe it, the harder it is for your patterns to stay invisible.',
    type: 'encouragement',
    accentColor: 'rose',
    icon: 'heart-outline',
    theme: 'reflect',
  },
  {
    text: 'Recovery is data too. Noticing what restores you is as informative as noticing what drains you.',
    type: 'encouragement',
    accentColor: 'silverBlue',
    icon: 'moon-outline',
    theme: 'calm',
  },
  {
    text: 'A single honest entry is worth more than a detailed analysis you never write. Log what is true right now.',
    type: 'encouragement',
    accentColor: 'emerald',
    icon: 'leaf-outline',
    theme: 'reflect',
  },
  {
    text: 'Your body often registers a shift before your thoughts name it. A check-in lets you capture that early signal.',
    type: 'encouragement',
    accentColor: 'rose',
    icon: 'body-outline',
    theme: 'calm',
  },
  {
    text: 'Even one entry today is the start of a pattern. You are building your personal map in real time.',
    type: 'encouragement',
    accentColor: 'gold',
    icon: 'map-outline',
    theme: 'growth',
  },
  {
    text: 'Self-knowledge is not about fixing — it is about seeing clearly. The act of checking in is already the practice.',
    type: 'encouragement',
    accentColor: 'silverBlue',
    icon: 'compass-outline',
    theme: 'focus',
  },
  {
    text: 'What you log consistently becomes something you can actually understand and act on. Inconsistency makes that impossible.',
    type: 'encouragement',
    accentColor: 'emerald',
    icon: 'analytics-outline',
    theme: 'growth',
  },
  {
    text: 'Difficult feelings are not problems to solve before you check in. They are exactly what is worth capturing.',
    type: 'encouragement',
    accentColor: 'rose',
    icon: 'cloudy-outline',
    theme: 'reflect',
  },
  {
    text: 'Mood and energy are two different signals. They do not always move together, and that difference tells you something.',
    type: 'encouragement',
    accentColor: 'gold',
    icon: 'pulse-outline',
    theme: 'focus',
  },
  {
    text: 'The version of you that skipped check-ins last week left no trace. The version that showed up did.',
    type: 'encouragement',
    accentColor: 'copper',
    icon: 'footsteps-outline',
    theme: 'growth',
  },
  {
    text: 'You do not need to explain your feelings before you log them. Observation comes before interpretation.',
    type: 'encouragement',
    accentColor: 'silverBlue',
    icon: 'eye-outline',
    theme: 'calm',
  },
  {
    text: 'A low score logged honestly is more useful than a high score logged to feel better. MySky needs the truth to help.',
    type: 'encouragement',
    accentColor: 'emerald',
    icon: 'shield-checkmark-outline',
    theme: 'reflect',
  },
  {
    text: 'What you notice today might not make sense until you look back at a week or a month. The value is in the archive.',
    type: 'encouragement',
    accentColor: 'gold',
    icon: 'library-outline',
    theme: 'growth',
  },
  {
    text: 'Your nervous system adapts to what you regularly pay attention to. Consistent reflection trains it toward clarity.',
    type: 'encouragement',
    accentColor: 'silverBlue',
    icon: 'flash-outline',
    theme: 'calm',
  },
  {
    text: 'Some days the most useful insight is simply: I showed up and noticed. That is not nothing — it is the whole practice.',
    type: 'encouragement',
    accentColor: 'rose',
    icon: 'checkmark-circle-outline',
    theme: 'reflect',
  },
  {
    text: 'The gaps in your log have meaning too. What was happening when you stopped tracking?',
    type: 'encouragement',
    accentColor: 'copper',
    icon: 'git-branch-outline',
    theme: 'focus',
  },
  {
    text: 'Energy tells you what your body is doing. Mood tells you what your mind is making of it. Both are worth knowing.',
    type: 'encouragement',
    accentColor: 'gold',
    icon: 'battery-charging-outline',
    theme: 'energy',
  },
  {
    text: 'Tracking stress alongside mood gives you context the score alone cannot. Log what shaped the number.',
    type: 'encouragement',
    accentColor: 'copper',
    icon: 'layers-outline',
    theme: 'reflect',
  },
  {
    text: 'Your patterns are personal. What drains one person restores another. MySky is learning your specific version.',
    type: 'encouragement',
    accentColor: 'silverBlue',
    icon: 'person-outline',
    theme: 'focus',
  },
  {
    text: 'Good days are worth logging as carefully as hard ones. Understanding what drives a high is just as useful.',
    type: 'encouragement',
    accentColor: 'emerald',
    icon: 'trending-up-outline',
    theme: 'energy',
  },
  {
    text: 'Sleep is the variable most likely to explain your mood before you realize it is the cause. Log it consistently.',
    type: 'encouragement',
    accentColor: 'silverBlue',
    icon: 'moon-outline',
    theme: 'calm',
  },
  {
    text: 'Reflection is not rumination. The goal is a brief, honest read — not a full analysis. A minute is enough.',
    type: 'encouragement',
    accentColor: 'rose',
    icon: 'timer-outline',
    theme: 'calm',
  },
];

function getDailyEncouragement(): DailyInsight {
  // Rotate based on day of year for consistency within a day
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return ENCOURAGEMENTS[dayOfYear % ENCOURAGEMENTS.length];
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
// Trigger × Tag Cross-Reference Insight  (self-knowledge informed)
// ─────────────────────────────────────────────────────────────────────────────

async function getTriggerCrossRefInsight(
  chartId: string,
  triggers: NonNullable<SelfKnowledgeContext['triggers']>,
): Promise<DailyInsight | null> {
  try {
    const checkIns = await supabaseDb.getCheckIns(chartId, 30);
    if (checkIns.length < 5) return null;

    const allMoods = checkIns.map(c => c.moodScore).filter((v): v is number => v != null);
    if (!allMoods.length) return null;
    const overallAvg = mean(allMoods);

    const resolveTag = (text: string, map: Record<string, string>): string | null =>
      map[text.toLowerCase()] ?? null;

    // Try restores first — positive framing for the home screen daily insight
    for (const item of triggers.restores) {
      const tag = resolveTag(item, RESTORE_TAG_MAP);
      if (!tag) continue;
      const tagged = checkIns.filter(c => c.tags?.includes(tag as any) && c.moodScore != null);
      if (tagged.length < 3) continue;
      const tagAvg = mean(tagged.map(c => c.moodScore as number));
      if (tagAvg - overallAvg < 0.4) continue;
      return {
        text: `"${item}" is in your restores — and your data confirms it. Mood averages ${tagAvg.toFixed(1)} on those days vs ${overallAvg.toFixed(1)} overall.`,
        type: 'pattern',
        accentColor: 'emerald',
        icon: 'sparkles-outline',
        theme: 'growth',
      };
    }

    // Then drains — informative framing
    for (const item of triggers.drains) {
      const tag = resolveTag(item, DRAIN_TAG_MAP);
      if (!tag) continue;
      const tagged = checkIns.filter(c => c.tags?.includes(tag as any) && c.moodScore != null);
      if (tagged.length < 3) continue;
      const tagAvg = mean(tagged.map(c => c.moodScore as number));
      if (overallAvg - tagAvg < 0.4) continue;
      return {
        text: `You listed "${item}" as a drain — your check-in data reflects this. Mood on "${tag.replace(/_/g, ' ')}" days averages ${tagAvg.toFixed(1)} vs ${overallAvg.toFixed(1)} overall.`,
        type: 'pattern',
        accentColor: 'copper',
        icon: 'leaf-outline',
        theme: 'focus',
      };
    }

    return null;
  } catch {
    return null;
  }
}


function getPremiumInsightCategoryFromCheckIn(checkIn: DailyCheckIn | any):
  | 'restCapacity'
  | 'supportBelonging'
  | 'cognitiveStyle'
  | 'bodySignals'
  | 'boundariesSelfTrust'
  | 'relationships'
  | 'dreamsSymbols'
  | 'glimmersRegulation' {
  const moodScore = Number(checkIn?.moodScore ?? checkIn?.mood ?? 0);
  const energyScore = Number(checkIn?.energyScore ?? checkIn?.energy ?? checkIn?.energyLevel ?? 0);
  const stressLevel = String(checkIn?.stressLevel ?? checkIn?.stress ?? '').toLowerCase();
  const tags = Array.isArray(checkIn?.tags) ? checkIn.tags.map((tag: unknown) => String(tag).toLowerCase()) : [];

  if (
    tags.some((tag: string) =>
      tag.includes('body') ||
      tag.includes('chest') ||
      tag.includes('shoulder') ||
      tag.includes('jaw') ||
      tag.includes('tension') ||
      tag.includes('somatic'),
    )
  ) {
    return 'bodySignals';
  }

  if (
    tags.some((tag: string) =>
      tag.includes('support') ||
      tag.includes('lonely') ||
      tag.includes('belong') ||
      tag.includes('connection'),
    )
  ) {
    return 'supportBelonging';
  }

  if (
    tags.some((tag: string) =>
      tag.includes('boundary') ||
      tag.includes('limit') ||
      tag.includes('peace') ||
      tag.includes('no'),
    )
  ) {
    return 'boundariesSelfTrust';
  }

  if (
    tags.some((tag: string) =>
      tag.includes('relationship') ||
      tag.includes('repair') ||
      tag.includes('trust') ||
      tag.includes('safe'),
    )
  ) {
    return 'relationships';
  }

  if (energyScore > 0 && energyScore <= 4) {
    return 'restCapacity';
  }

  if (moodScore > 0 && moodScore <= 4) {
    return 'cognitiveStyle';
  }

  if (stressLevel === 'high' || stressLevel === 'very_high') {
    return 'restCapacity';
  }

  return 'glimmersRegulation';
}

function getPremiumInsightTheme(category: ReturnType<typeof getPremiumInsightCategoryFromCheckIn>): DailyInsight['theme'] {
  switch (category) {
    case 'restCapacity':
    case 'bodySignals':
    case 'glimmersRegulation':
      return 'calm';
    case 'boundariesSelfTrust':
    case 'relationships':
    case 'supportBelonging':
      return 'growth';
    case 'cognitiveStyle':
    case 'dreamsSymbols':
      return 'reflect';
    default:
      return 'reflect';
  }
}

function getPremiumInsightAccent(category: ReturnType<typeof getPremiumInsightCategoryFromCheckIn>): DailyInsight['accentColor'] {
  switch (category) {
    case 'glimmersRegulation':
      return 'emerald';
    case 'supportBelonging':
    case 'relationships':
      return 'rose';
    case 'boundariesSelfTrust':
      return 'copper';
    case 'restCapacity':
    case 'bodySignals':
      return 'silverBlue';
    case 'cognitiveStyle':
    case 'dreamsSymbols':
    default:
      return 'gold';
  }
}

function getPremiumInsightIcon(category: ReturnType<typeof getPremiumInsightCategoryFromCheckIn>): string {
  switch (category) {
    case 'restCapacity':
      return 'moon-outline';
    case 'supportBelonging':
      return 'people-outline';
    case 'bodySignals':
      return 'body-outline';
    case 'boundariesSelfTrust':
      return 'shield-outline';
    case 'relationships':
      return 'heart-outline';
    case 'dreamsSymbols':
      return 'cloudy-night-outline';
    case 'glimmersRegulation':
      return 'sparkles-outline';
    case 'cognitiveStyle':
    default:
      return 'analytics-outline';
  }
}

async function getPremiumDraftInsight(chartId: string): Promise<DailyInsight | null> {
  try {
    const checkIns = await supabaseDb.getCheckIns(chartId, 1);
    const latest = checkIns[0];

    if (!latest) return null;

    const today = toLocalDateString(new Date());
    const latestDate =
      typeof latest.date === 'string'
        ? latest.date.slice(0, 10)
        : toLocalDateString(new Date(latest.createdAt ?? latest.updatedAt ?? Date.now()));

    if (latestDate !== today) return null;

    const category = getPremiumInsightCategoryFromCheckIn(latest);
    const selected = selectPremiumInsightDraft({
      date: today,
      category,
      seed: `${chartId}:${today}:${latest.moodScore ?? ''}:${(latest as any).energyScore ?? ''}:${latest.stressLevel ?? ''}`,
    });

    return {
      text: `${selected.body}\n\nQuestion to keep: ${selected.reflectionPrompt}`,
      type: 'check-in',
      accentColor: getPremiumInsightAccent(category),
      icon: getPremiumInsightIcon(category),
      theme: getPremiumInsightTheme(category),
    };
  } catch (error) {
    logger.warn('[DailyLoop] Failed to build premium draft insight', error);
    return null;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Today's Best Insight (priority cascade)
// ─────────────────────────────────────────────────────────────────────────────

async function getTodayInsight(
  chartId: string,
  streak: StreakStatus,
  selfKnowledge?: SelfKnowledgeContext,
): Promise<DailyInsight> {
  // 1. Milestone celebration (highest priority)
  const milestoneInsight = getConsistencyInsight(streak);
  if (milestoneInsight) return milestoneInsight;

  // 2. Premium daily insight generated from the curated MySky insight library.
  const premiumDraftInsight = await getPremiumDraftInsight(chartId);
  if (premiumDraftInsight) return premiumDraftInsight;

  // 3. Once the user checks in, today's self-report should replace the
  // calendar-only fallback so the Home card visibly refreshes for the day.
  const checkInInsight = await getTodayCheckInReflectionInsight(chartId);
  if (checkInInsight) return checkInInsight;

  // 4. Sleep-mood correlation
  const sleepInsight = await getSleepMoodInsight(chartId);
  if (sleepInsight) return sleepInsight;

  // 5. Trigger cross-reference (self-knowledge confirmed by behavioral data)
  if (selfKnowledge?.triggers) {
    const triggerInsight = await getTriggerCrossRefInsight(chartId, selfKnowledge.triggers);
    if (triggerInsight) return triggerInsight;
  }

  // 6. Pattern-based insight (tag lift, trend changes)
  const patternInsight = await getPatternInsight(chartId);
  if (patternInsight) return patternInsight;

  // 7. Fallback: daily encouragement
  return getDailyEncouragement();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Entry Point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute all daily loop data for the Home dashboard.
 * Call this once on screen focus.
 *
 * Pass selfKnowledge to unlock trigger cross-reference insights that
 * confirm the user's self-reported drains/restores against their behavioral data.
 */
export async function getDailyLoopData(
  chartId: string,
  selfKnowledge?: SelfKnowledgeContext,
): Promise<DailyLoopData> {
  const streak = await getStreakStatus(chartId);
  const weeklyReflection = await getWeeklyReflection(chartId);
  const todayInsight = await getTodayInsight(chartId, streak, selfKnowledge);
  const returnNudge = buildReturnNudge(streak);
  const weeklySynthesis = await getWeeklySynthesis(chartId);

  return {
    streak,
    weeklyReflection,
    todayInsight,
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
      supabaseDb.getJournalEntries(),
    ]);

    const weekCheckIns = checkIns.filter(c => c.date >= sevenDaysAgoKey);
    const weekSleep = sleepEntries.filter(s => s.date >= sevenDaysAgoKey);
    const weekJournals = journals.filter(j => j.date >= sevenDaysAgoKey);
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
