// utils/microInsights.ts
// MySky — Micro-Insight Generator
//
// Generates simple, data-driven observations from 3–7 days of check-in data.
// These replace heavy "AI insight" cards with grounded pattern recognition.

export interface DailySnapshot {
  date: string;
  mood?: number;
  energy?: number;
  stress?: number;
  sleepHours?: number;
  sleepQuality?: number;
  dayOfWeek: number; // 0 = Sunday
}

export interface MicroInsight {
  id: string;
  type: 'mood_trend' | 'best_day' | 'hardest_day' | 'sleep_mood' | 'energy_pattern' | 'stress_sleep';
  text: string;
  priority: number; // lower = higher priority
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Generate micro-insights from recent daily snapshots.
 * Requires at least 3 data points. Returns max 3 insights.
 */
export function generateMicroInsights(snapshots: DailySnapshot[]): MicroInsight[] {
  if (snapshots.length < 3) return [];

  const insights: MicroInsight[] = [];

  // ── Mood Trend ──
  const moodValues = snapshots.filter((s) => s.mood != null).map((s) => s.mood!);
  if (moodValues.length >= 3) {
    const first = moodValues.slice(0, Math.ceil(moodValues.length / 2));
    const second = moodValues.slice(Math.ceil(moodValues.length / 2));
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
    const diff = avgSecond - avgFirst;

    if (diff >= 1) {
      insights.push({
        id: 'mood_trend_up',
        type: 'mood_trend',
        text: 'Your mood has been trending upward over the past few days.',
        priority: 1,
      });
    } else if (diff <= -1) {
      insights.push({
        id: 'mood_trend_down',
        type: 'mood_trend',
        text: 'Your mood has been dipping recently. That\'s worth noticing — not judging.',
        priority: 1,
      });
    }
  }

  // ── Best & Hardest Day of Week ──
  const dayMoods = new Map<number, number[]>();
  for (const s of snapshots) {
    if (s.mood != null) {
      if (!dayMoods.has(s.dayOfWeek)) dayMoods.set(s.dayOfWeek, []);
      dayMoods.get(s.dayOfWeek)!.push(s.mood);
    }
  }

  if (dayMoods.size >= 3) {
    let bestDay = -1, bestAvg = -Infinity;
    let hardestDay = -1, hardestAvg = Infinity;
    for (const [day, moods] of dayMoods) {
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
      if (avg > bestAvg) { bestAvg = avg; bestDay = day; }
      if (avg < hardestAvg) { hardestAvg = avg; hardestDay = day; }
    }
    if (bestDay >= 0 && bestAvg - hardestAvg >= 1.5) {
      insights.push({
        id: 'best_day',
        type: 'best_day',
        text: `${DAY_NAMES[bestDay]}s tend to be your best days. What happens on those days?`,
        priority: 2,
      });
    }
    if (hardestDay >= 0 && bestAvg - hardestAvg >= 1.5) {
      insights.push({
        id: 'hardest_day',
        type: 'hardest_day',
        text: `${DAY_NAMES[hardestDay]}s seem harder for you. Is there a pattern you can spot?`,
        priority: 3,
      });
    }
  }

  // ── Sleep–Mood Correlation ──
  const sleepMoodPairs = snapshots.filter((s) => s.sleepHours != null && s.mood != null);
  if (sleepMoodPairs.length >= 3) {
    const goodSleep = sleepMoodPairs.filter((s) => s.sleepHours! >= 7);
    const poorSleep = sleepMoodPairs.filter((s) => s.sleepHours! < 6);
    if (goodSleep.length >= 2 && poorSleep.length >= 1) {
      const avgGood = goodSleep.reduce((a, s) => a + s.mood!, 0) / goodSleep.length;
      const avgPoor = poorSleep.reduce((a, s) => a + s.mood!, 0) / poorSleep.length;
      if (avgGood - avgPoor >= 1.5) {
        insights.push({
          id: 'sleep_mood',
          type: 'sleep_mood',
          text: 'Your mood tends to be noticeably better when you sleep 7+ hours.',
          priority: 2,
        });
      }
    }
  }

  // ── Energy Pattern ──
  const energyValues = snapshots.filter((s) => s.energy != null).map((s) => s.energy!);
  if (energyValues.length >= 3) {
    const lowDays = energyValues.filter((e) => e <= 3).length;
    const ratio = lowDays / energyValues.length;
    if (ratio >= 0.5) {
      insights.push({
        id: 'energy_low',
        type: 'energy_pattern',
        text: 'You\'ve been logging low energy often. Rest isn\'t laziness — it\'s maintenance.',
        priority: 2,
      });
    }
  }

  // Sort by priority, return max 3
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 3);
}
