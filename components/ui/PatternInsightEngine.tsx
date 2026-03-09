/**
 * PatternInsightEngine
 *
 * System 7 — Master Pattern Synthesis
 * Pulls together all available signals (check-ins, sleep, journal)
 * and outputs 3-5 natural-language insight sentences about recurring
 * patterns in the user's life.
 *
 * Pattern types detected:
 *  1. Tag → mood correlation   ("Movement consistently lifts your mood")
 *  2. Sleep → next-day mood    ("Better sleep reliably boosts your energy")
 *  3. Time-of-day pattern      ("Your mornings are consistently your strongest")
 *  4. Weekend vs weekday mood  ("You thrive over weekends — avg +1.4 pts")
 *  5. Streak insight           ("You've improved 5 days in a row")
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DailyCheckIn } from '../../services/patterns/types';
import type { SleepEntry } from '../../services/storage/models';
import type { JournalEntry } from '../../services/storage/models';

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = {
  gold: '#C9AE78',
  emerald: '#6EBF8B',
  copper: '#CD7F5D',
  amethyst: '#9D76C1',
  silverBlue: '#8BC4E8',
  card: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.06)',
  borderTop: 'rgba(255,255,255,0.10)',
  text: 'rgba(240,234,214,0.88)',
  muted: 'rgba(240,234,214,0.50)',
  surface: 'rgba(255,255,255,0.04)',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Insight {
  text: string;
  icon: string;
  color: string;
}

interface Props {
  checkIns: DailyCheckIn[];
  sleepEntries?: SleepEntry[];
  entries?: JournalEntry[];
}

// ─── Pattern detectors ────────────────────────────────────────────────────────

function detectTagMoodPattern(checkIns: DailyCheckIn[]): Insight | null {
  if (checkIns.length < 7) return null;

  const overallAvg = checkIns.reduce((s, c) => s + c.moodScore, 0) / checkIns.length;

  // Build tag → mood scores map
  const tagMoods: Record<string, number[]> = {};
  for (const ci of checkIns) {
    for (const tag of ci.tags) {
      if (!tagMoods[tag]) tagMoods[tag] = [];
      tagMoods[tag].push(ci.moodScore);
    }
  }

  let bestTag: string | null = null;
  let bestDelta = 0;
  let worstTag: string | null = null;
  let worstDelta = 0;

  for (const [tag, moods] of Object.entries(tagMoods)) {
    if (moods.length < 3) continue;
    const avg = moods.reduce((s, v) => s + v, 0) / moods.length;
    const delta = +(avg - overallAvg).toFixed(1);
    if (delta > bestDelta) { bestDelta = delta; bestTag = tag; }
    if (delta < worstDelta) { worstDelta = delta; worstTag = tag; }
  }

  if (bestTag && bestDelta >= 0.7) {
    const label = bestTag.replace(/^eq_/, '').replace(/_/g, ' ');
    return {
      text: `Days tagged "${label}" average ${bestDelta} pts above your baseline — your most uplifting pattern.`,
      icon: 'trending-up',
      color: PALETTE.emerald,
    };
  }

  if (worstTag && worstDelta <= -0.7) {
    const label = worstTag.replace(/^eq_/, '').replace(/_/g, ' ');
    return {
      text: `"${label.charAt(0).toUpperCase() + label.slice(1)}" days tend to pull your mood ${Math.abs(worstDelta)} pts lower. Consider how you resource yourself on these days.`,
      icon: 'alert-circle-outline',
      color: PALETTE.copper,
    };
  }

  return null;
}

function detectSleepMoodPattern(
  checkIns: DailyCheckIn[],
  sleepEntries: SleepEntry[],
): Insight | null {
  if (sleepEntries.length < 5 || checkIns.length < 5) return null;

  // Map date → next-day checkIn mood
  const moodByDate: Record<string, number> = {};
  for (const ci of checkIns) {
    if (!moodByDate[ci.date]) moodByDate[ci.date] = 0;
    moodByDate[ci.date] = Math.max(moodByDate[ci.date], ci.moodScore);
  }

  const pairs: { quality: number; nextMood: number }[] = [];
  for (const sleep of sleepEntries) {
    const nextDay = getNextDay(sleep.date);
    const mood = moodByDate[nextDay];
    if (mood !== undefined && sleep.quality != null) {
      pairs.push({ quality: sleep.quality, nextMood: mood });
    }
  }

  if (pairs.length < 4) return null;

  // Pearson correlation
  const n = pairs.length;
  const meanQ = pairs.reduce((s, p) => s + p.quality, 0) / n;
  const meanM = pairs.reduce((s, p) => s + p.nextMood, 0) / n;
  let cov = 0, varQ = 0, varM = 0;
  for (const p of pairs) {
    cov += (p.quality - meanQ) * (p.nextMood - meanM);
    varQ += (p.quality - meanQ) ** 2;
    varM += (p.nextMood - meanM) ** 2;
  }
  const r = varQ * varM > 0 ? cov / Math.sqrt(varQ * varM) : 0;

  if (r >= 0.35) {
    return {
      text: `Your sleep quality has a strong ripple effect on next-day mood (r = ${r.toFixed(2)}). Rest is not optional — it's foundational.`,
      icon: 'moon-outline',
      color: PALETTE.silverBlue,
    };
  }

  if (r <= -0.25) {
    return {
      text: `Interestingly, your mood scores don't closely follow sleep quality. Your resilience may come from other sources.`,
      icon: 'partly-sunny-outline',
      color: PALETTE.gold,
    };
  }

  return null;
}

function detectTimeOfDayPattern(checkIns: DailyCheckIn[]): Insight | null {
  if (checkIns.length < 8) return null;

  const byTime: Record<string, number[]> = {};
  for (const ci of checkIns) {
    if (!byTime[ci.timeOfDay]) byTime[ci.timeOfDay] = [];
    byTime[ci.timeOfDay].push(ci.moodScore);
  }

  const timeAvgs = Object.entries(byTime)
    .filter(([, scores]) => scores.length >= 2)
    .map(([time, scores]) => ({
      time,
      avg: scores.reduce((s, v) => s + v, 0) / scores.length,
    }))
    .sort((a, b) => b.avg - a.avg);

  if (timeAvgs.length < 2) return null;

  const best = timeAvgs[0];
  const worst = timeAvgs[timeAvgs.length - 1];
  const delta = +(best.avg - worst.avg).toFixed(1);

  if (delta >= 1.2) {
    const timeLabel: Record<string, string> = {
      morning: 'mornings', afternoon: 'afternoons', evening: 'evenings', night: 'nights',
    };
    return {
      text: `Your ${timeLabel[best.time] ?? best.time} are your emotional peak — ${delta} pts above your ${timeLabel[worst.time] ?? worst.time}.`,
      icon: 'time-outline',
      color: PALETTE.gold,
    };
  }

  return null;
}

function detectWeekendPattern(checkIns: DailyCheckIn[]): Insight | null {
  if (checkIns.length < 10) return null;

  const weekday: number[] = [];
  const weekend: number[] = [];

  for (const ci of checkIns) {
    const day = new Date(ci.date).getDay();
    if (day === 0 || day === 6) weekend.push(ci.moodScore);
    else weekday.push(ci.moodScore);
  }

  if (weekday.length < 4 || weekend.length < 2) return null;

  const wdAvg = weekday.reduce((s, v) => s + v, 0) / weekday.length;
  const weAvg = weekend.reduce((s, v) => s + v, 0) / weekend.length;
  const delta = +(weAvg - wdAvg).toFixed(1);

  if (Math.abs(delta) >= 0.8) {
    const better = delta > 0 ? 'weekends' : 'weekdays';
    const worse = delta > 0 ? 'weekdays' : 'weekends';
    const absDelta = Math.abs(delta);
    return {
      text: `You consistently thrive over ${better} — ${absDelta} pts above your ${worse} average. Your rhythm craves ${delta > 0 ? 'recovery and freedom' : 'structure and purpose'}.`,
      icon: 'calendar-outline',
      color: PALETTE.amethyst,
    };
  }

  return null;
}

function detectRecentStreak(checkIns: DailyCheckIn[]): Insight | null {
  if (checkIns.length < 5) return null;

  // Sort by date descending
  const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));

  // Check the last 5 entries for improvement
  let streak = 1;
  for (let i = 0; i < Math.min(sorted.length - 1, 6); i++) {
    if (sorted[i].moodScore >= sorted[i + 1].moodScore) {
      streak++;
    } else {
      break;
    }
  }

  if (streak >= 4) {
    return {
      text: `You've been rising for ${streak} consecutive check-ins. Something is working — keep noticing what.`,
      icon: 'flame-outline',
      color: PALETTE.emerald,
    };
  }

  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNextDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PatternInsightEngine({ checkIns, sleepEntries = [], entries = [] }: Props) {
  const insights = useMemo(() => {
    const all: Insight[] = [];

    const tag = detectTagMoodPattern(checkIns);
    if (tag) all.push(tag);

    const sleep = detectSleepMoodPattern(checkIns, sleepEntries);
    if (sleep) all.push(sleep);

    const time = detectTimeOfDayPattern(checkIns);
    if (time) all.push(time);

    const weekend = detectWeekendPattern(checkIns);
    if (weekend) all.push(weekend);

    const streak = detectRecentStreak(checkIns);
    if (streak) all.push(streak);

    return all.slice(0, 5); // max 5 insights
  }, [checkIns, sleepEntries, entries]);

  if (insights.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Patterns</Text>
        <Text style={styles.subtitle}>INTELLIGENCE SYNTHESIS</Text>
      </View>

      <View style={styles.insightList}>
        {insights.map((insight, i) => (
          <View key={i} style={styles.insightRow}>
            <View style={[styles.iconWrap, { backgroundColor: `${insight.color}15` }]}>
              <Ionicons name={insight.icon as any} size={15} color={insight.color} />
            </View>
            <Text style={styles.insightText}>{insight.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: PALETTE.card,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderTopColor: PALETTE.borderTop,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  subtitle: {
    color: PALETTE.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  insightList: {
    gap: 10,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  insightText: {
    flex: 1,
    color: PALETTE.text,
    fontSize: 13,
    lineHeight: 19,
  },
});
