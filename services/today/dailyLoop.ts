/**
 * Daily Loop Service
 *
 * Implements the "Daily Loop" growth model for MySky.
 * Computes streak status, weekly summaries, human-readable insights,
 * sleep-mood correlations, and return-motivation nudges.
 *
 * All functions are pure or async (reading from localDb only).
 * No side effects — just data for the Home dashboard.
 *
 * Design philosophy:
 *  - Insights should be simple and emotional, not technical
 *  - "You reported higher mood on days when you slept longer" > "r=0.72 p<0.01"
 *  - Keep the daily loop under 60 seconds
 *  - Make the user feel understood, not analyzed
 */

import { localDb } from '../storage/localDb';
import { toLocalDateString, getCheckInDateString } from '../../utils/dateUtils';
import { mean } from '../../utils/stats';
import { logger } from '../../utils/logger';
import type { SelfKnowledgeContext } from '../insights/selfKnowledgeContext';
import { DRAIN_TAG_MAP, RESTORE_TAG_MAP } from '../../utils/selfKnowledgeCrossRef';

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
  /** Total lifetime check-ins */
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
  type: 'sleep-mood' | 'consistency' | 'pattern' | 'encouragement' | 'milestone';
  /** Accent color hint for the UI */
  accentColor: 'gold' | 'emerald' | 'silverBlue' | 'copper' | 'rose';
  /** Icon name (Ionicons) */
  icon: string;
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
    const checkIns = await localDb.getCheckIns(chartId, 90);
    const totalCheckIns = await localDb.getCheckInCount(chartId);

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
    const checkIns = await localDb.getCheckIns(chartId, 14);
    const sleepEntries = await localDb.getSleepEntries(chartId, 14);

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

    const thisWeekMoods = thisWeek.map(c => c.moodScore).filter(Boolean) as number[];
    const lastWeekMoods = lastWeek.map(c => c.moodScore).filter(Boolean) as number[];

    const avgMood = thisWeekMoods.length > 0 ? mean(thisWeekMoods) : 0;
    const prevAvgMood = lastWeekMoods.length > 0 ? mean(lastWeekMoods) : null;

    const moodDelta = prevAvgMood != null ? avgMood - prevAvgMood : 0;
    const moodDirection: 'up' | 'down' | 'stable' =
      moodDelta > 0.3 ? 'up' : moodDelta < -0.3 ? 'down' : 'stable';

    // Sleep this week
    const thisWeekSleep = sleepEntries
      .filter(s => new Date(s.date) >= sevenDaysAgo)
      .map(s => s.durationHours)
      .filter(Boolean) as number[];
    const avgSleep = thisWeekSleep.length > 0 ? mean(thisWeekSleep) : 0;

    // Journal count — getJournalEntries() returns all non-deleted entries
    let journalCount = 0;
    try {
      const journals = await localDb.getJournalEntries();
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

  const moodLabel =
    data.avgMood >= 7 ? 'positive' : data.avgMood >= 5 ? 'balanced' : 'lower';

  const parts: string[] = [];

  // Mood trajectory
  if (data.prevAvgMood != null) {
    if (data.moodDirection === 'up') {
      parts.push(`Your mood has lifted this week, averaging ${data.avgMood.toFixed(1)} compared with ${data.prevAvgMood.toFixed(1)} last week. That suggests something in your recent rhythm may be giving you a little more room to breathe.`);
    } else if (data.moodDirection === 'down') {
      parts.push(`Your mood has softened a bit this week, averaging ${data.avgMood.toFixed(1)} after ${data.prevAvgMood.toFixed(1)} last week. It may not feel dramatic, but the shift suggests something underneath is asking for attention or more care.`);
    } else {
      parts.push(`Your mood has stayed relatively steady this week at ${data.avgMood.toFixed(1)}. Even without a dramatic swing, consistency like this can say a lot about what is quietly supporting you.`);
    }
  } else {
    parts.push(`Your average mood this week is ${data.avgMood.toFixed(1)}, which points to a ${moodLabel} emotional baseline right now. Think of it as a starting signal rather than a verdict.`);
  }

  // Sleep
  if (data.avgSleep > 0) {
    if (data.avgSleep >= 7) {
      parts.push(`You averaged ${data.avgSleep.toFixed(1)} hours of sleep, which gives your system a steadier recovery base. That kind of support often shows up emotionally before you fully notice it mentally.`);
    } else {
      parts.push(`Your sleep averaged ${data.avgSleep.toFixed(1)} hours. If things have felt thinner or harder to hold lately, the body may be part of that story.`);
    }
  }

  // Journaling
  if (data.journalCount >= 3) {
    parts.push('You journaled regularly this week, which usually helps subtle feelings become easier to understand before they spill over.');
  } else if (data.journalCount > 0) {
    parts.push(`You reflected ${data.journalCount} time${data.journalCount === 1 ? '' : 's'} this week. Even brief entries give this reflection more texture and make it easier to ground the pattern in something real.`);
  }

  return parts.join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Sleep–Mood Correlation Insight
// ─────────────────────────────────────────────────────────────────────────────

async function getSleepMoodInsight(chartId: string): Promise<DailyInsight | null> {
  try {
    const checkIns = await localDb.getCheckIns(chartId, 30);
    const sleepEntries = await localDb.getSleepEntries(chartId, 30);

    if (checkIns.length < 7 || sleepEntries.length < 5) return null;

    // Build date-indexed maps
    const moodByDate: Record<string, number> = {};
    for (const c of checkIns) {
      if (c.moodScore != null) {
        // Use the latest check-in per date
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
      };
    } else {
      return {
        text: `Interestingly, your mood has been slightly higher on shorter sleep nights. You may thrive on efficiency — or restless nights follow good days.`,
        type: 'sleep-mood',
        accentColor: 'silverBlue',
        icon: 'moon-outline',
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
      7: 'One week of consistent reflection. The patterns you\'re building now create the foundation for real self-understanding.',
      14: 'Two weeks of daily awareness. Research suggests this is when habit formation becomes natural.',
      30: 'A full month of reflection. You\'ve built something rare — a genuine practice of self-awareness.',
      60: 'Sixty days of tracking your inner world. The insights you\'re gathering now are truly personal.',
      90: 'Three months of consistent reflection. This kind of dedication creates deep self-knowledge.',
      180: 'Six months of daily awareness. You know yourself better than most people ever will.',
      365: 'One year of reflection. What started as a habit has become a profound practice of self-understanding.',
    };

    return {
      text: milestoneMessages[streak.milestone] ?? `${streak.milestone} days of reflection — a meaningful milestone.`,
      type: 'milestone',
      accentColor: 'gold',
      icon: 'trophy-outline',
    };
  }

  if (streak.current >= 5 && streak.current < 7) {
    return {
      text: `You're on a ${streak.current}-day streak — almost a full week of consistent reflection.`,
      type: 'consistency',
      accentColor: 'emerald',
      icon: 'flame-outline',
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern-Based Insights (simple, emotional language)
// ─────────────────────────────────────────────────────────────────────────────

async function getPatternInsight(chartId: string): Promise<DailyInsight | null> {
  try {
    const checkIns = await localDb.getCheckIns(chartId, 30);
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
      };
    }

    if (delta < -0.5) {
      return {
        text: `Your mood has softened slightly this week. It may not feel dramatic, but there is a real shift underneath, and noticing it early gives you more choice in how you meet it.`,
        type: 'pattern',
        accentColor: 'copper',
        icon: 'leaf-outline',
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
        text: `Days you tagged "${tagLabel}" tend to have higher mood scores — it seems to be a positive influence.`,
        type: 'pattern',
        accentColor: 'gold',
        icon: 'sparkles-outline',
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
    text: 'Tracking how you feel each day builds a picture only you can see. Every entry matters.',
    type: 'encouragement',
    accentColor: 'gold',
    icon: 'sunny-outline',
  },
  {
    text: 'Reflection doesn\'t require perfection. A single honest check-in is more valuable than a detailed analysis.',
    type: 'encouragement',
    accentColor: 'emerald',
    icon: 'leaf-outline',
  },
  {
    text: 'The patterns that matter most often appear quietly over time. Consistency reveals what urgency hides.',
    type: 'encouragement',
    accentColor: 'silverBlue',
    icon: 'water-outline',
  },
  {
    text: 'Your emotional landscape is unique. The more you observe it, the better you understand what supports you.',
    type: 'encouragement',
    accentColor: 'rose',
    icon: 'heart-outline',
  },
  {
    text: 'Rest is just as important as action. Noticing how you recover is part of understanding yourself.',
    type: 'encouragement',
    accentColor: 'silverBlue',
    icon: 'moon-outline',
  },
  {
    text: 'Small moments of honesty with yourself accumulate into real self-knowledge. Keep going.',
    type: 'encouragement',
    accentColor: 'gold',
    icon: 'sparkles-outline',
  },
  {
    text: 'Your body keeps score even when your mind moves on. Checking in bridges that gap.',
    type: 'encouragement',
    accentColor: 'rose',
    icon: 'body-outline',
  },
  {
    text: 'There is no wrong way to feel. What matters is that you noticed.',
    type: 'encouragement',
    accentColor: 'emerald',
    icon: 'eye-outline',
  },
  {
    text: 'Even one data point is the beginning of a pattern. You are already building your own map.',
    type: 'encouragement',
    accentColor: 'gold',
    icon: 'map-outline',
  },
  {
    text: 'Self-awareness is not about fixing — it is about seeing clearly. You are doing that now.',
    type: 'encouragement',
    accentColor: 'silverBlue',
    icon: 'compass-outline',
  },
  {
    text: 'Difficult feelings are not failures. They are information. Let them teach you something.',
    type: 'encouragement',
    accentColor: 'rose',
    icon: 'cloudy-outline',
  },
  {
    text: 'What you track consistently becomes something you can actually understand and change.',
    type: 'encouragement',
    accentColor: 'emerald',
    icon: 'analytics-outline',
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
    const checkIns = await localDb.getCheckIns(chartId, 30);
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
      const tagged = checkIns.filter(c => c.tags.includes(tag as any) && c.moodScore != null);
      if (tagged.length < 3) continue;
      const tagAvg = mean(tagged.map(c => c.moodScore as number));
      if (tagAvg - overallAvg < 0.4) continue;
      return {
        text: `"${item}" is in your restores — and your data confirms it. Mood averages ${tagAvg.toFixed(1)} on those days vs ${overallAvg.toFixed(1)} overall.`,
        type: 'pattern',
        accentColor: 'emerald',
        icon: 'sparkles-outline',
      };
    }

    // Then drains — informative framing
    for (const item of triggers.drains) {
      const tag = resolveTag(item, DRAIN_TAG_MAP);
      if (!tag) continue;
      const tagged = checkIns.filter(c => c.tags.includes(tag as any) && c.moodScore != null);
      if (tagged.length < 3) continue;
      const tagAvg = mean(tagged.map(c => c.moodScore as number));
      if (overallAvg - tagAvg < 0.4) continue;
      return {
        text: `You listed "${item}" as a drain — your check-in data reflects this. Mood on "${tag.replace(/_/g, ' ')}" days averages ${tagAvg.toFixed(1)} vs ${overallAvg.toFixed(1)} overall.`,
        type: 'pattern',
        accentColor: 'copper',
        icon: 'leaf-outline',
      };
    }

    return null;
  } catch {
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

  // 2. Sleep-mood correlation
  const sleepInsight = await getSleepMoodInsight(chartId);
  if (sleepInsight) return sleepInsight;

  // 3. Trigger cross-reference (self-knowledge confirmed by behavioral data)
  if (selfKnowledge?.triggers) {
    const triggerInsight = await getTriggerCrossRefInsight(chartId, selfKnowledge.triggers);
    if (triggerInsight) return triggerInsight;
  }

  // 4. Pattern-based insight (tag lift, trend changes)
  const patternInsight = await getPatternInsight(chartId);
  if (patternInsight) return patternInsight;

  // 5. Fallback: daily encouragement
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

  return {
    streak,
    weeklyReflection,
    todayInsight,
    returnNudge,
  };
}
