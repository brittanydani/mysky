/**
 * Pattern Analysis Engine
 * 
 * The brain behind pattern tracking.
 * Correlates user check-ins with astro context to find personal patterns.
 * 
 * Phase 1: Rule-based counts (ships now, feels smart)
 * Phase 2: Weighted scoring (tighter orbs = more weight)
 * Phase 3: Clustering (future, optional)
 */

import { DailyCheckIn, PatternCard, PatternSummary, ThemeTag } from './types';
import { logger } from '../../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const MIN_DATA_POINTS = 5;          // Need at least 5 check-ins to show patterns
const EMERGING_THRESHOLD = 7;       // 7+ for "emerging" patterns
const MODERATE_THRESHOLD = 14;      // 14+ for "moderate" patterns
const STRONG_THRESHOLD = 21;        // 21+ for "strong" patterns

const MOON_HOUSE_LABELS: Record<number, string> = {
  1: 'identity & self-expression',
  2: 'comfort & security',
  3: 'communication & learning',
  4: 'home & emotional safety',
  5: 'creativity & joy',
  6: 'routines & wellness',
  7: 'relationships & partnerships',
  8: 'depth & transformation',
  9: 'meaning & adventure',
  10: 'ambition & visibility',
  11: 'community & belonging',
  12: 'rest & inner world',
};

const TAG_LABELS: Record<ThemeTag, string> = {
  relationships: '💞 Relationships',
  confidence: '💪 Confidence',
  money: '💰 Money & Resources',
  family: '🏠 Family',
  creativity: '🎨 Creativity',
  health: '🌿 Health & Body',
  boundaries: '🛡 Boundaries',
  career: '📈 Career',
  anxiety: '😰 Anxiety',
  joy: '✨ Joy',
  grief: '🖤 Grief',
  clarity: '🔮 Clarity',
  overwhelm: '🌊 Overwhelm',
  loneliness: '💔 Loneliness',
  gratitude: '🙏 Gratitude',
};

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Analysis
// ─────────────────────────────────────────────────────────────────────────────

export class PatternAnalyzer {

  /**
   * Generate pattern cards from check-in history.
   * This is the main entry point for pattern analysis.
   */
  static analyzePatterns(checkIns: DailyCheckIn[]): PatternCard[] {
    if (checkIns.length < MIN_DATA_POINTS) return [];

    const cards: PatternCard[] = [];

    // 1. Moon House Mood Map
    cards.push(...this.analyzeMoonHouseMood(checkIns));

    // 2. Transit Triggers
    cards.push(...this.analyzeTransitTriggers(checkIns));

    // 3. Best/Worst Days
    cards.push(...this.analyzeBestDays(checkIns));

    // 4. Theme Frequency
    cards.push(...this.analyzeThemeFrequency(checkIns));

    // 5. Energy Cycles
    cards.push(...this.analyzeEnergyCycles(checkIns));

    // 6. Stress Patterns
    cards.push(...this.analyzeStressPatterns(checkIns));

    // 7. Growth Milestones
    cards.push(...this.generateMilestones(checkIns));

    // Sort: strong first, then moderate, then emerging
    const strengthOrder = { strong: 0, moderate: 1, emerging: 2 };
    cards.sort((a, b) => strengthOrder[a.strength] - strengthOrder[b.strength]);

    return cards;
  }

  /**
   * Moon House Mood Map
   * "You feel most at peace when Moon is in your 4th house"
   */
  private static analyzeMoonHouseMood(checkIns: DailyCheckIn[]): PatternCard[] {
    const cards: PatternCard[] = [];
    const houseData: Record<number, { moods: number[]; count: number }> = {};

    for (const c of checkIns) {
      if (!houseData[c.moonHouse]) houseData[c.moonHouse] = { moods: [], count: 0 };
      houseData[c.moonHouse].moods.push(c.moodScore);
      houseData[c.moonHouse].count++;
    }

    // Find best and worst moon houses
    const averages = Object.entries(houseData)
      .filter(([_, d]) => d.count >= 2)
      .map(([house, d]) => ({
        house: parseInt(house),
        avg: d.moods.reduce((a, b) => a + b, 0) / d.moods.length,
        count: d.count,
      }))
      .sort((a, b) => b.avg - a.avg);

    if (averages.length >= 2) {
      const best = averages[0];
      const worst = averages[averages.length - 1];
      const strength = this.getStrength(checkIns.length);

      cards.push({
        id: `moon_house_best_${best.house}`,
        type: 'moon_house_mood',
        title: 'Your comfort zone',
        insight: `You tend to feel most at ease when the Moon moves through your ${this.ordinal(best.house)} house — the area of ${MOON_HOUSE_LABELS[best.house] || 'life'}.`,
        detail: `Average mood: ${best.avg.toFixed(1)}/10 across ${best.count} days`,
        strength,
        isPremium: false,
        icon: '🌙',
        color: '#8BC4E8',
        dataPoints: best.count,
      });

      if (worst.avg < 5) {
        cards.push({
          id: `moon_house_watch_${worst.house}`,
          type: 'moon_house_mood',
          title: 'Moon sensitivity',
          insight: `When the Moon transits your ${this.ordinal(worst.house)} house (${MOON_HOUSE_LABELS[worst.house] || 'life'}), you often report lower mood. This isn't weakness — it's awareness.`,
          detail: `Average mood: ${worst.avg.toFixed(1)}/10 across ${worst.count} days`,
          strength,
          isPremium: true,
          icon: '🔮',
          color: '#7A8BE0',
          dataPoints: worst.count,
        });
      }
    }

    return cards;
  }

  /**
   * Transit Triggers
   * "Mars-Venus aspects correlate with relationship tension"
   */
  private static analyzeTransitTriggers(checkIns: DailyCheckIn[]): PatternCard[] {
    const cards: PatternCard[] = [];
    
    // Group by transit signature
    const transitGroups: Record<string, { moods: number[]; tags: ThemeTag[]; count: number }> = {};

    for (const c of checkIns) {
      for (const t of c.transitEvents) {
        const key = `${t.transitPlanet}_${t.aspect}_${t.natalPlanet}`;
        if (!transitGroups[key]) transitGroups[key] = { moods: [], tags: [], count: 0 };
        transitGroups[key].moods.push(c.moodScore);
        transitGroups[key].tags.push(...c.tags);
        transitGroups[key].count++;
      }
    }

    // Find significant transit correlations
    const overallAvg = checkIns.reduce((s, c) => s + c.moodScore, 0) / checkIns.length;

    for (const [key, data] of Object.entries(transitGroups)) {
      if (data.count < 3) continue;

      const avg = data.moods.reduce((s, m) => s + m, 0) / data.moods.length;
      const diff = avg - overallAvg;
      const [transit, aspect, natal] = key.split('_');

      if (Math.abs(diff) >= 1.5) {
        const isPositive = diff > 0;
        cards.push({
          id: `transit_${key}`,
          type: 'transit_trigger',
          title: isPositive ? 'Support transit' : 'Watch-for transit',
          insight: isPositive
            ? `When ${transit} ${this.aspectLabel(aspect)} your natal ${natal}, you tend to feel notably better. This is your cosmic wind at your back.`
            : `${transit} ${this.aspectLabel(aspect)} your natal ${natal} tends to correlate with tougher days. Knowing this in advance lets you prepare, not react.`,
          detail: `${data.count} occurrences, mood ${isPositive ? '+' : ''}${diff.toFixed(1)} vs average`,
          strength: this.getStrength(data.count),
          isPremium: true,
          icon: isPositive ? '🌟' : '⚡',
          color: isPositive ? '#6EBF8B' : '#E07A7A',
          dataPoints: data.count,
        });
      }
    }

    return cards;
  }

  /**
   * Best Days Analysis
   */
  private static analyzeBestDays(checkIns: DailyCheckIn[]): PatternCard[] {
    const cards: PatternCard[] = [];
    
    // Group by day of week
    const dayData: Record<string, number[]> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const c of checkIns) {
      const day = dayNames[new Date(c.date).getDay()];
      if (!dayData[day]) dayData[day] = [];
      dayData[day].push(c.moodScore);
    }

    const dayAverages = Object.entries(dayData)
      .filter(([_, moods]) => moods.length >= 2)
      .map(([day, moods]) => ({
        day,
        avg: moods.reduce((s, m) => s + m, 0) / moods.length,
        count: moods.length,
      }))
      .sort((a, b) => b.avg - a.avg);

    if (dayAverages.length >= 2) {
      const best = dayAverages[0];
      cards.push({
        id: 'best_day',
        type: 'best_days',
        title: 'Your best day',
        insight: `${best.day}s tend to be your brightest days, with an average mood of ${best.avg.toFixed(1)}/10.`,
        strength: this.getStrength(checkIns.length),
        isPremium: false,
        icon: '☀️',
        color: '#C9A962',
        dataPoints: best.count,
      });
    }

    return cards;
  }

  /**
   * Theme Frequency Analysis
   */
  private static analyzeThemeFrequency(checkIns: DailyCheckIn[]): PatternCard[] {
    const cards: PatternCard[] = [];
    const tagCounts: Record<string, number> = {};

    for (const c of checkIns) {
      for (const tag of c.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

    if (sorted.length > 0) {
      const [topTag, count] = sorted[0];
      const pct = Math.round((count / checkIns.length) * 100);
      
      cards.push({
        id: `theme_${topTag}`,
        type: 'theme_frequency',
        title: 'Your current theme',
        insight: `${TAG_LABELS[topTag as ThemeTag] || topTag} has shown up in ${pct}% of your check-ins recently. This is where your energy is being called.`,
        detail: `${count} out of ${checkIns.length} days`,
        strength: this.getStrength(count),
        isPremium: false,
        icon: '🔍',
        color: '#E0B07A',
        dataPoints: count,
      });
    }

    // Recurring loop detection (premium)
    if (sorted.length >= 2) {
      const topTwo = sorted.slice(0, 2);
      const bothAppear = checkIns.filter(c =>
        c.tags.includes(topTwo[0][0] as ThemeTag) && c.tags.includes(topTwo[1][0] as ThemeTag)
      ).length;

      if (bothAppear >= 3) {
        cards.push({
          id: 'theme_loop',
          type: 'theme_frequency',
          title: 'A pattern loop',
          insight: `${TAG_LABELS[topTwo[0][0] as ThemeTag]} and ${TAG_LABELS[topTwo[1][0] as ThemeTag]} keep appearing together. This pairing often reveals a deeper dynamic worth exploring.`,
          strength: this.getStrength(bothAppear),
          isPremium: true,
          icon: '🔄',
          color: '#9B6EBF',
          dataPoints: bothAppear,
        });
      }
    }

    return cards;
  }

  /**
   * Energy Cycle Analysis
   */
  private static analyzeEnergyCycles(checkIns: DailyCheckIn[]): PatternCard[] {
    const cards: PatternCard[] = [];

    // Correlate energy with moon phase
    const phaseEnergy: Record<string, { high: number; low: number; total: number }> = {};

    for (const c of checkIns) {
      if (!phaseEnergy[c.lunarPhase]) phaseEnergy[c.lunarPhase] = { high: 0, low: 0, total: 0 };
      phaseEnergy[c.lunarPhase].total++;
      if (c.energyLevel === 'high') phaseEnergy[c.lunarPhase].high++;
      if (c.energyLevel === 'low') phaseEnergy[c.lunarPhase].low++;
    }

    const phaseLabels: Record<string, string> = {
      new: 'New Moon',
      waxing_crescent: 'Waxing Crescent',
      first_quarter: 'First Quarter',
      waxing_gibbous: 'Waxing Gibbous',
      full: 'Full Moon',
      waning_gibbous: 'Waning Gibbous',
      last_quarter: 'Last Quarter',
      waning_crescent: 'Waning Crescent',
    };

    // Find peak energy phase
    let peakPhase = '';
    let peakRatio = 0;
    for (const [phase, data] of Object.entries(phaseEnergy)) {
      if (data.total < 2) continue;
      const ratio = data.high / data.total;
      if (ratio > peakRatio) {
        peakRatio = ratio;
        peakPhase = phase;
      }
    }

    if (peakPhase && peakRatio > 0.4) {
      cards.push({
        id: 'energy_peak_phase',
        type: 'energy_cycle',
        title: 'Your power phase',
        insight: `Your energy tends to peak during the ${phaseLabels[peakPhase] || peakPhase}. Consider scheduling important initiatives around this lunar phase.`,
        strength: this.getStrength(checkIns.length),
        isPremium: true,
        icon: '⚡',
        color: '#6EBFBF',
        dataPoints: phaseEnergy[peakPhase].total,
      });
    }

    return cards;
  }

  /**
   * Stress Pattern Analysis
   */
  private static analyzeStressPatterns(checkIns: DailyCheckIn[]): PatternCard[] {
    const cards: PatternCard[] = [];

    const highStressDays = checkIns.filter(c => c.stressLevel === 'high');
    if (highStressDays.length < 3) return cards;

    // Find common moon houses on high stress days
    const stressHouses: Record<number, number> = {};
    for (const c of highStressDays) {
      stressHouses[c.moonHouse] = (stressHouses[c.moonHouse] || 0) + 1;
    }

    const topStressHouse = Object.entries(stressHouses)
      .sort((a, b) => b[1] - a[1])[0];

    if (topStressHouse && parseInt(topStressHouse[0]) && topStressHouse[1] >= 2) {
      const house = parseInt(topStressHouse[0]);
      cards.push({
        id: `stress_house_${house}`,
        type: 'stress_pattern',
        title: 'Stress awareness',
        insight: `You report higher stress when the Moon moves through your ${this.ordinal(house)} house (${MOON_HOUSE_LABELS[house]}). This isn't something to fix — just to prepare for.`,
        detail: `${topStressHouse[1]} out of ${highStressDays.length} high-stress days`,
        strength: this.getStrength(highStressDays.length),
        isPremium: true,
        icon: '🫧',
        color: '#E07A98',
        dataPoints: topStressHouse[1],
      });
    }

    // Find common tags on high stress days
    const stressTags: Record<string, number> = {};
    for (const c of highStressDays) {
      for (const tag of c.tags) {
        stressTags[tag] = (stressTags[tag] || 0) + 1;
      }
    }

    const topStressTag = Object.entries(stressTags)
      .sort((a, b) => b[1] - a[1])[0];

    if (topStressTag && topStressTag[1] >= 3) {
      cards.push({
        id: `stress_tag_${topStressTag[0]}`,
        type: 'stress_pattern',
        title: 'Stress trigger',
        insight: `${TAG_LABELS[topStressTag[0] as ThemeTag]} is your most common theme on high-stress days. Recognizing this pattern is the first step toward breaking it.`,
        strength: this.getStrength(topStressTag[1]),
        isPremium: true,
        icon: '🎯',
        color: '#E07A7A',
        dataPoints: topStressTag[1],
      });
    }

    return cards;
  }

  /**
   * Growth Milestones — "wow" moments that feel personal
   */
  private static generateMilestones(checkIns: DailyCheckIn[]): PatternCard[] {
    const cards: PatternCard[] = [];
    const count = checkIns.length;

    // Milestone at 7 days
    if (count >= 7 && count < 14) {
      cards.push({
        id: 'milestone_7',
        type: 'growth_milestone',
        title: 'First week ✨',
        insight: `You've checked in for 7 days. Your first personal signature is starting to emerge. Keep going — the patterns get clearer.`,
        strength: 'emerging',
        isPremium: false,
        icon: '🌱',
        color: '#6EBF8B',
        dataPoints: count,
      });
    }

    // Milestone at 14 days
    if (count >= 14 && count < 30) {
      const avgMood = checkIns.reduce((s, c) => s + c.moodScore, 0) / count;
      cards.push({
        id: 'milestone_14',
        type: 'growth_milestone',
        title: 'Two weeks of self-knowledge',
        insight: `14 days of check-ins. Your average mood is ${avgMood.toFixed(1)}/10. The app is starting to learn your rhythms.`,
        strength: 'moderate',
        isPremium: false,
        icon: '🌿',
        color: '#6EBF8B',
        dataPoints: count,
      });
    }

    // Milestone at 30 days
    if (count >= 30) {
      cards.push({
        id: 'milestone_30',
        type: 'growth_milestone',
        title: 'One month of patterns',
        insight: `You've tracked ${count} days. Your personal pattern library is now substantial — this data is uniquely yours.`,
        strength: 'strong',
        isPremium: false,
        icon: '🌳',
        color: '#6EBF8B',
        dataPoints: count,
      });
    }

    return cards;
  }

  /**
   * Generate a monthly pattern summary (premium)
   */
  static generateMonthlySummary(checkIns: DailyCheckIn[]): PatternSummary | null {
    if (checkIns.length < MIN_DATA_POINTS) return null;

    // Top themes
    const tagCounts: Record<string, number> = {};
    for (const c of checkIns) {
      for (const tag of c.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    const topThemes = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, count]) => ({
        tag: tag as ThemeTag,
        count,
        trend: 'stable' as const,
      }));

    // Average mood
    const averageMood = checkIns.reduce((s, c) => s + c.moodScore, 0) / checkIns.length;

    // Mood trend (compare first half vs second half)
    const mid = Math.floor(checkIns.length / 2);
    const firstHalf = checkIns.slice(0, mid);
    const secondHalf = checkIns.slice(mid);
    const firstAvg = firstHalf.reduce((s, c) => s + c.moodScore, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((s, c) => s + c.moodScore, 0) / (secondHalf.length || 1);
    const moodTrend = secondAvg - firstAvg > 0.5 ? 'improving' 
                    : secondAvg - firstAvg < -0.5 ? 'declining' 
                    : 'stable';

    // Best days
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayData: Record<string, number[]> = {};
    for (const c of checkIns) {
      const day = dayNames[new Date(c.date).getDay()];
      if (!dayData[day]) dayData[day] = [];
      dayData[day].push(c.moodScore);
    }
    const bestDays = Object.entries(dayData)
      .map(([day, moods]) => ({
        dayOfWeek: day,
        averageMood: moods.reduce((s, m) => s + m, 0) / moods.length,
      }))
      .sort((a, b) => b.averageMood - a.averageMood);

    // Pattern cards
    const allCards = this.analyzePatterns(checkIns);
    const triggers = allCards.filter(c => 
      c.type === 'transit_trigger' || c.type === 'stress_pattern'
    );
    const supports = allCards.filter(c => 
      c.type === 'best_days' || c.type === 'energy_cycle' || c.color === '#6EBF8B'
    );

    // Next month watch-fors (based on current patterns)
    const nextMonthWatchFors: string[] = [];
    if (topThemes.length > 0) {
      nextMonthWatchFors.push(`Continue noticing your ${topThemes[0].tag} pattern — is it shifting?`);
    }
    if (moodTrend === 'declining') {
      nextMonthWatchFors.push(`Your mood has been trending down — be extra gentle with yourself.`);
    }
    nextMonthWatchFors.push(`Track which Moon house days feel easiest and hardest.`);

    return {
      period: 'monthly',
      topThemes,
      averageMood,
      moodTrend,
      bestDays,
      triggers,
      supports,
      nextMonthWatchFors,
    };
  }

  // ── Helpers ──

  private static getStrength(dataPoints: number): 'strong' | 'moderate' | 'emerging' {
    if (dataPoints >= STRONG_THRESHOLD) return 'strong';
    if (dataPoints >= MODERATE_THRESHOLD) return 'moderate';
    return 'emerging';
  }

  private static ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  private static aspectLabel(aspect: string): string {
    const labels: Record<string, string> = {
      conjunction: 'meets',
      opposition: 'opposes',
      square: 'squares',
      trine: 'trines',
      sextile: 'sextiles',
    };
    return labels[aspect] || aspect;
  }
}
