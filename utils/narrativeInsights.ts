/**
 * Narrative Insights Engine (v2)
 *
 * Three-layer architecture:
 *   Layer 1: Raw inputs (DailyAggregate — from pipeline.ts)
 *   Layer 2: Scored patterns (PatternProfile — from dailyScores.ts)
 *   Layer 3: Human-sounding insight generation (this file)
 *
 * All functions are pure — no I/O, no side effects.
 */

import { DailyAggregate } from '../services/insights/types';
import { mean, stdDev } from './stats';
import {
  PatternProfile,
  ScoredDay,
  Correlation,
  TrendWindow,
  buildPatternProfile,
} from './dailyScores';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type NarrativeCategory =
  | 'emotional_undercurrent'
  | 'energy_rhythm'
  | 'stress_signal'
  | 'sleep_connection'
  | 'restoration_pattern'
  | 'best_day'
  | 'hard_day'
  | 'sensitivity_theme'
  | 'connection_pattern'
  | 'growth_reflection'
  | 'dream_theme'
  | 'emerging_pattern';

export interface NarrativeInsight {
  id: string;
  category: NarrativeCategory;
  label: string;
  body: string;
  stat: string;
  confidence: 'low' | 'medium' | 'high';
  accent: 'gold' | 'silverBlue' | 'copper' | 'emerald' | 'rose' | 'lavender';
}

export interface NarrativeInsightBundle {
  insights: NarrativeInsight[];
  generatedAt: string;
  dataPoints: number;
  profile: PatternProfile;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function topN<T extends string>(counts: Record<T, number>, n: number): { key: T; count: number }[] {
  return (Object.entries(counts) as [T, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

function latestTrend(trends: TrendWindow[]): TrendWindow | null {
  return trends.length > 0 ? trends[0] : null;
}

function findCorrelation(correlations: Correlation[], a: string, b: string): Correlation | null {
  return correlations.find(c =>
    (c.metricA === a && c.metricB === b) ||
    (c.metricA === b && c.metricB === a),
  ) ?? null;
}

function insightConfidence(
  dataPoints: number,
  effectStrength: number,
  isConsistent: boolean,
): 'low' | 'medium' | 'high' {
  const dataCoverage = dataPoints >= 30 ? 100 : dataPoints >= 14 ? 70 : dataPoints >= 7 ? 45 : 20;
  const effect = Math.min(effectStrength, 100);
  const consistency = isConsistent ? 80 : 40;
  const score = dataCoverage * 0.35 + effect * 0.35 + consistency * 0.20 + 7;
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

function confidentPhrase(conf: 'low' | 'medium' | 'high', strong: string, mid: string, emerging: string): string {
  if (conf === 'high') return strong;
  if (conf === 'medium') return mid;
  return emerging;
}

const SENSITIVITY_TAGS = ['overstimulated', 'anxiety', 'conflict', 'loneliness', 'overwhelm', 'screens', 'routine'];
const MIN_DAYS = 7;
const MIN_DAYS_STRONG = 14;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Emotional Undercurrent
// ─────────────────────────────────────────────────────────────────────────────

function buildEmotionalUndercurrent(profile: PatternProfile): NarrativeInsight | null {
  if (profile.windowDays < MIN_DAYS) return null;

  const { overallAvg, recentAvg } = profile;
  const stabilityTrend = latestTrend(profile.trends.stability);
  const recentDiff = recentAvg.stability - overallAvg.stability;
  const volatility = stabilityTrend?.volatility ?? 0;

  let body: string;
  let effectStrength: number;

  if (volatility > 15) {
    body = 'Your emotional tone has been moving through wider swings lately. This isn\'t necessarily a problem — it may reflect a period of processing, transition, or heightened sensitivity. Noticing the rhythm matters more than steadying it by force.';
    effectStrength = 60;
  } else if (recentDiff < -10) {
    body = 'Your recent entries suggest a quieter heaviness beneath the surface. Even when you keep going, your system may be asking for more softness than pressure. This may be a season for gentleness.';
    effectStrength = Math.abs(recentDiff);
  } else if (recentDiff > 10) {
    body = 'There\'s a noticeable lift in your recent emotional tone. Something is settling — whether it\'s external circumstances or your own internal recalibration. Worth noticing what\'s different right now.';
    effectStrength = recentDiff;
  } else if (volatility < 5 && overallAvg.stability >= 60) {
    body = 'Your emotional landscape has been remarkably steady. This kind of consistency often reflects either genuine stability or a practiced steadiness. Either way, it\'s something your system seems to be holding well.';
    effectStrength = 40;
  } else if (overallAvg.stability < 40) {
    body = 'Your entries carry a persistent undertone of heaviness. This isn\'t about fixing anything — it\'s about recognizing what your inner world has been carrying, and whether it needs more room to breathe.';
    effectStrength = 100 - overallAvg.stability;
  } else {
    body = 'Your emotional tone has been moving through a gentle middle range — not dramatic, but textured. Subtle shifts often carry information that extremes don\'t. Pay attention to the quiet undercurrents.';
    effectStrength = 30;
  }

  const conf = insightConfidence(profile.windowDays, effectStrength, volatility < 12);
  const trendLabel = stabilityTrend?.direction === 'rising' ? 'rising' : stabilityTrend?.direction === 'falling' ? 'falling' : 'steady';

  return {
    id: 'narrative-emotional-undercurrent',
    category: 'emotional_undercurrent',
    label: 'Emotional Undercurrent',
    body,
    stat: `${profile.windowDays}-day window · Stability: ${overallAvg.stability}/100 · Trend: ${trendLabel} · Variability: ${volatility < 8 ? 'low' : volatility < 15 ? 'moderate' : 'high'}`,
    confidence: conf,
    accent: 'lavender',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Energy Rhythm
// ─────────────────────────────────────────────────────────────────────────────

function buildEnergyRhythm(profile: PatternProfile): NarrativeInsight | null {
  if (profile.windowDays < MIN_DAYS) return null;
  const { scoredDays, overallAvg } = profile;
  const restorationTrend = latestTrend(profile.trends.restoration);

  let maxLowStreak = 0;
  let cur = 0;
  for (const d of scoredDays) {
    if (d.scores.restoration < 35) { cur++; maxLowStreak = Math.max(maxLowStreak, cur); } else { cur = 0; }
  }

  let recoveries = 0;
  let lowDays = 0;
  for (let i = 0; i < scoredDays.length - 1; i++) {
    if (scoredDays[i].scores.restoration < 35) {
      lowDays++;
      if (scoredDays[i + 1].scores.restoration > scoredDays[i].scores.restoration + 10) recoveries++;
    }
  }

  let body: string;
  let effectStrength: number;

  if (maxLowStreak >= 3) {
    body = `Your energy tends to drop after multiple depleted days in a row — your longest recent stretch was ${maxLowStreak} consecutive low-restoration days. Your system may be pushing through exhaustion more often than restoring from it.`;
    effectStrength = maxLowStreak * 15;
  } else if (restorationTrend?.direction === 'falling') {
    body = 'Your restoration has been gradually declining over this window. This kind of slow drain can be easy to miss day-to-day but adds up. Consider what\'s been drawing from your reserves without replenishing them.';
    effectStrength = 55;
  } else if (recoveries >= 3 && lowDays >= 3) {
    const rate = Math.round((recoveries / lowDays) * 100);
    body = `You show a pattern of bouncing back after depleted days — recovering about ${rate}% of the time. Your system has a recovery rhythm — it may not feel fast enough, but the data suggests real resilience in how you recharge.`;
    effectStrength = 50;
  } else if (overallAvg.restoration >= 65) {
    body = 'Your restoration levels have stayed relatively strong across this period. This consistency is worth protecting — notice what routines, rhythms, or choices seem to be sustaining it.';
    effectStrength = 40;
  } else {
    body = 'Your energy moves in waves, shifting between periods of depletion and restoration. Understanding your personal rhythm — what drains and what refills — is key to working with your capacity rather than against it.';
    effectStrength = 30;
  }

  return {
    id: 'narrative-energy-rhythm',
    category: 'energy_rhythm',
    label: 'Energy Rhythm',
    body,
    stat: `Restoration avg: ${overallAvg.restoration}/100 · ${restorationTrend?.direction === 'falling' ? 'Declining' : restorationTrend?.direction === 'rising' ? 'Rising' : 'Steady'} · ${maxLowStreak > 0 ? `Longest low streak: ${maxLowStreak} days` : 'No extended low streaks'}`,
    confidence: insightConfidence(profile.windowDays, effectStrength, maxLowStreak <= 2),
    accent: 'gold',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Stress Signal
// ─────────────────────────────────────────────────────────────────────────────

function buildStressSignal(profile: PatternProfile): NarrativeInsight | null {
  if (profile.windowDays < MIN_DAYS) return null;
  const { scoredDays, overallAvg, recentAvg } = profile;
  const strainTrend = latestTrend(profile.trends.strain);

  let buildupStreak = 0;
  let maxBuildup = 0;
  for (let i = 1; i < scoredDays.length; i++) {
    if (scoredDays[i].scores.strain > scoredDays[i - 1].scores.strain + 3) {
      buildupStreak++; maxBuildup = Math.max(maxBuildup, buildupStreak);
    } else { buildupStreak = 0; }
  }
  const dualLoadDays = scoredDays.filter(d => d.scores.strain > 70 && d.scores.restoration < 35).length;

  let body: string;
  let effectStrength: number;

  if (strainTrend?.direction === 'rising' && recentAvg.strain > overallAvg.strain + 8) {
    body = confidentPhrase(
      insightConfidence(profile.windowDays, 70, true),
      'Stress is clearly building. Your recent entries show a sustained upward trajectory in strain.',
      'Stress appears to be building. Your recent entries show an upward trajectory.',
      'There may be an emerging pattern of rising stress in your recent entries.',
    ) + ' This pattern often signals that demands are stacking up without enough space to reset. It may be worth gently intervening before it compounds further.';
    effectStrength = recentAvg.strain - overallAvg.strain;
  } else if (maxBuildup >= 3) {
    body = `Your entries suggest stress builds gradually, not suddenly — you had stretches of ${maxBuildup}+ days where strain rose day after day. By the time you feel it, it may already be carrying momentum. Catching the first signal earlier could help.`;
    effectStrength = maxBuildup * 15;
  } else if (dualLoadDays >= 3) {
    body = `Your hardest days often combine both high strain and low restoration (${dualLoadDays} days in this window). When both stack up together, your system has fewer resources to cope. These are the days that matter most for self-compassion.`;
    effectStrength = dualLoadDays * 15;
  } else if (overallAvg.strain <= 35) {
    body = 'Your strain levels have been relatively manageable. This is a genuinely good signal — low baseline strain gives your system room to handle whatever comes. Protect whatever conditions are supporting this.';
    effectStrength = 35;
  } else {
    body = 'Stress shows up regularly but hasn\'t reached a sustained peak. It appears to ebb and flow rather than spiraling. Noticing the conditions that let it recede may be more useful than fighting what raises it.';
    effectStrength = 30;
  }

  return {
    id: 'narrative-stress-signal',
    category: 'stress_signal',
    label: 'Stress Signal',
    body,
    stat: `Strain avg: ${overallAvg.strain}/100 · Trend: ${strainTrend?.direction === 'rising' ? 'rising' : strainTrend?.direction === 'falling' ? 'easing' : 'steady'} · ${dualLoadDays > 0 ? `${dualLoadDays} dual-load days` : 'No dual-load days'}`,
    confidence: insightConfidence(profile.windowDays, effectStrength, maxBuildup <= 2),
    accent: 'copper',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Sleep Connection
// ─────────────────────────────────────────────────────────────────────────────

function buildSleepConnection(profile: PatternProfile): NarrativeInsight | null {
  const withSleep = profile.scoredDays.filter(d => d.aggregate.sleepQuality != null);
  if (withSleep.length < 5) return null;

  const goodSleep = withSleep.filter(d => (d.aggregate.sleepQuality ?? 0) >= 4);
  const poorSleep = withSleep.filter(d => (d.aggregate.sleepQuality ?? 0) <= 2);
  if (goodSleep.length < 2 && poorSleep.length < 2) return null;

  let body: string;
  let stat: string;
  let effectStrength: number;

  if (goodSleep.length >= 2 && poorSleep.length >= 2) {
    const goodStab = mean(goodSleep.map(d => d.scores.stability));
    const poorStab = mean(poorSleep.map(d => d.scores.stability));
    const diff = goodStab - poorStab;
    effectStrength = Math.abs(diff);
    const conf = insightConfidence(withSleep.length, effectStrength, diff > 5);

    if (diff > 15) {
      body = confidentPhrase(conf,
        `Better sleep is strongly tied to more emotional steadiness for you. Your stability score averages ${Math.round(goodStab)} on good-sleep days compared to ${Math.round(poorStab)} on poor-sleep days.`,
        `Better sleep seems to support steadier mood for you. Your stability averages ${Math.round(goodStab)} on good-sleep days vs ${Math.round(poorStab)} on poor-sleep days.`,
        `There may be an emerging connection between sleep and emotional steadiness. Good-sleep days average ${Math.round(goodStab)} stability vs ${Math.round(poorStab)}.`,
      ) + ' Even slight improvements in sleep seem to shift your day in a positive direction.';
    } else if (diff > 5) {
      body = 'Sleep quality appears to have a gentle but real effect on your stability. The difference isn\'t dramatic, but it\'s consistent — better rest tends to create more space for emotional steadiness.';
    } else {
      body = 'Interestingly, your stability doesn\'t shift dramatically with sleep quality. This doesn\'t mean sleep doesn\'t matter — it may affect your strain or restoration more than your emotional tone.';
    }
    const goodStrain = mean(goodSleep.map(d => d.scores.strain));
    const poorStrain = mean(poorSleep.map(d => d.scores.strain));
    if (poorStrain - goodStrain > 15) {
      body += ' Notably, low sleep quality tends to show up as heightened strain rather than just lower mood — your nervous system carries what your rest doesn\'t resolve.';
    }
    stat = `Good-sleep stability: ${Math.round(goodStab)} · Poor-sleep stability: ${Math.round(poorStab)} · Difference: ${Math.round(diff)} pts · ${withSleep.length} sleep-tracked days`;
  } else if (goodSleep.length >= 2) {
    const goodStab = mean(goodSleep.map(d => d.scores.stability));
    effectStrength = goodStab - profile.overallAvg.stability;
    body = `On nights when you sleep well, your stability the next day tends to lift — averaging ${Math.round(goodStab)} compared to your overall ${profile.overallAvg.stability}. Sleep may be affecting your emotional regulation more than you realize.`;
    stat = `Good-sleep stability: ${Math.round(goodStab)} · Overall: ${profile.overallAvg.stability} · ${goodSleep.length} good-sleep days`;
  } else {
    const poorStab = mean(poorSleep.map(d => d.scores.stability));
    effectStrength = profile.overallAvg.stability - poorStab;
    body = `Nights with poor sleep are followed by noticeably different days. Your stability after bad sleep averages ${Math.round(poorStab)} — below your overall ${profile.overallAvg.stability}. Your body seems to feel it before your mind names it.`;
    stat = `Poor-sleep stability: ${Math.round(poorStab)} · Overall: ${profile.overallAvg.stability} · ${poorSleep.length} poor-sleep days`;
  }

  return {
    id: 'narrative-sleep-connection',
    category: 'sleep_connection',
    label: 'Sleep Connection',
    body,
    stat,
    confidence: insightConfidence(withSleep.length, effectStrength, true),
    accent: 'silverBlue',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Restoration Pattern
// ─────────────────────────────────────────────────────────────────────────────

function buildRestorationPattern(profile: PatternProfile): NarrativeInsight | null {
  if (profile.windowDays < MIN_DAYS) return null;
  const RESTORATION_TAGS = ['nature', 'movement', 'rest', 'alone_time', 'creative', 'sleep', 'social'];
  const { scoredDays, overallAvg } = profile;

  const restoreSignals: { tag: string; lift: number; dayCount: number }[] = [];
  for (const tag of RESTORATION_TAGS) {
    const tagDays = scoredDays.filter(d => d.aggregate.tagsUnion.includes(tag));
    if (tagDays.length < 2) continue;
    const tagAvg = mean(tagDays.map(d => d.scores.restoration));
    const lift = tagAvg - overallAvg.restoration;
    if (lift > 5) restoreSignals.push({ tag, lift, dayCount: tagDays.length });
  }
  restoreSignals.sort((a, b) => b.lift - a.lift);

  let recoveries = 0;
  let lowDays = 0;
  for (let i = 0; i < scoredDays.length - 1; i++) {
    if (scoredDays[i].scores.stability < 40) {
      lowDays++;
      if (scoredDays[i + 1].scores.restoration > scoredDays[i].scores.restoration + 10) recoveries++;
    }
  }

  let body: string;
  let effectStrength: number;

  if (restoreSignals.length >= 2) {
    const top = restoreSignals.slice(0, 3).map(s => s.tag.replace(/_/g, ' ')).join(', ');
    effectStrength = restoreSignals[0].lift;
    body = `Your data points to specific conditions that tend to support your wellbeing: ${top}. These aren\'t just nice-to-haves — on days involving them, your restoration score is measurably higher.`;
  } else if (lowDays >= 3 && recoveries > 0) {
    const rate = Math.round((recoveries / lowDays) * 100);
    effectStrength = rate * 0.7;
    body = `After difficult days, your restoration improves about ${rate}% of the time the very next day. Your system knows how to come back — even when it doesn\'t feel like it.`;
  } else if (restoreSignals.length === 1) {
    effectStrength = restoreSignals[0].lift;
    body = `Among your tracked activities, ${restoreSignals[0].tag.replace(/_/g, ' ')} stands out as restorative — your restoration score averages ${Math.round(restoreSignals[0].lift)} points higher on those days.`;
  } else {
    effectStrength = 20;
    body = 'Your restoration pattern is still emerging. As you continue logging, MySky will identify which conditions, activities, and rhythms truly help you recover.';
  }

  const stat = restoreSignals.length > 0
    ? `${restoreSignals.length} restorative signal${restoreSignals.length > 1 ? 's' : ''} · Top lift: +${Math.round(restoreSignals[0].lift)} restoration pts`
    : `${profile.windowDays} days analyzed · Still gathering restoration signals`;

  return {
    id: 'narrative-restoration-pattern',
    category: 'restoration_pattern',
    label: 'Restoration Pattern',
    body,
    stat,
    confidence: insightConfidence(profile.windowDays, effectStrength, restoreSignals.length >= 2),
    accent: 'emerald',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Best-Day Insight
// ─────────────────────────────────────────────────────────────────────────────

function buildBestDayInsight(profile: PatternProfile): NarrativeInsight | null {
  const { bestDayProfile, overallAvg } = profile;
  if (!bestDayProfile || bestDayProfile.dayCount < 2) return null;
  const bp = bestDayProfile;

  const ingredients: string[] = [];
  if (bp.avgRestoration - overallAvg.restoration > 8) ingredients.push('higher restoration');
  if (overallAvg.strain - bp.avgStrain > 8) ingredients.push('lower strain');
  if (bp.avgSleepQuality != null && bp.avgSleepQuality >= 3.5) ingredients.push('better sleep');
  if (bp.topTags.length > 0) {
    const mt = bp.topTags.filter(t => t.count >= 2).slice(0, 2);
    if (mt.length > 0) ingredients.push(mt.map(t => t.tag.replace(/_/g, ' ')).join(', '));
  }
  if (bp.journalPct > 60) ingredients.push('journaling');

  const effectStrength = bp.avgStability - overallAvg.stability;
  let body: string;
  if (ingredients.length >= 2) {
    body = `Your best days tend to share a pattern: ${ingredients.join(', ')}. Your strongest days are not always your busiest — the pattern suggests that stability, not intensity, helps you feel your best.`;
  } else if (ingredients.length === 1) {
    body = `One ingredient stands out on your best days: ${ingredients[0]}. Protect what works.`;
  } else {
    body = 'Your best days don\'t follow an obvious formula yet — which is its own insight. Your wellbeing may depend on subtler factors like emotional safety, pacing, or inner quiet.';
  }

  return {
    id: 'narrative-best-day',
    category: 'best_day',
    label: 'Best-Day Insight',
    body,
    stat: `${bp.dayCount} best days analyzed (stability > 75) · Avg stability: ${bp.avgStability} · Avg strain: ${bp.avgStrain} · Avg mood: ${bp.avgMood}`,
    confidence: insightConfidence(bp.dayCount, effectStrength, ingredients.length >= 2),
    accent: 'gold',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Hard-Day Reflection
// ─────────────────────────────────────────────────────────────────────────────

function buildHardDayReflection(profile: PatternProfile): NarrativeInsight | null {
  const { hardDayProfile, overallAvg } = profile;
  if (!hardDayProfile || hardDayProfile.dayCount < 2) return null;
  const hp = hardDayProfile;

  const conditions: string[] = [];
  if (hp.avgRestoration < overallAvg.restoration - 8) conditions.push('low restoration');
  if (hp.avgStrain > overallAvg.strain + 8) conditions.push('elevated strain');
  if (hp.avgSleepQuality != null && hp.avgSleepQuality <= 2.5) conditions.push('poor sleep');
  if (hp.topTags.length > 0) {
    const mt = hp.topTags.filter(t => t.count >= 2).slice(0, 2);
    if (mt.length > 0) conditions.push(mt.map(t => t.tag.replace(/_/g, ' ')).join(', '));
  }

  const effectStrength = overallAvg.stability - hp.avgStability;
  let body: string;
  if (conditions.length >= 2) {
    body = `Your hardest days often involve ${conditions.slice(0, 2).join(' and ')}${conditions.length > 2 ? `, alongside ${conditions.slice(2).join(', ')}` : ''}. These conditions tend to compound — one alone is manageable, but together they lower your floor.`;
  } else if (conditions.length === 1) {
    body = `${capitalize(conditions[0])} appears to be a common thread on your harder days. This isn\'t a verdict — it\'s a signal worth noticing.`;
  } else {
    body = 'Your harder days don\'t follow a single identifiable pattern yet. Emotional difficulty often comes from accumulation rather than any one cause.';
  }
  if (hp.topEmotions.length > 0) {
    body += ` Emotionally, ${hp.topEmotions.map(e => e.emotion).join(' and ')} show up more prominently on these days.`;
  }

  return {
    id: 'narrative-hard-day',
    category: 'hard_day',
    label: 'Hard-Day Reflection',
    body,
    stat: `${hp.dayCount} hard days (stability < 40 or strain > 70) · Avg stability: ${hp.avgStability} · Avg strain: ${hp.avgStrain}`,
    confidence: insightConfidence(hp.dayCount, effectStrength, conditions.length >= 2),
    accent: 'copper',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Sensitivity Theme
// ─────────────────────────────────────────────────────────────────────────────

function buildSensitivityTheme(profile: PatternProfile): NarrativeInsight | null {
  if (profile.windowDays < MIN_DAYS) return null;
  const { scoredDays, overallAvg } = profile;

  const signals: { tag: string; stabilityDrop: number; dayCount: number }[] = [];
  for (const tag of SENSITIVITY_TAGS) {
    const tagDays = scoredDays.filter(d => d.aggregate.tagsUnion.includes(tag));
    if (tagDays.length < 2) continue;
    const tagStab = mean(tagDays.map(d => d.scores.stability));
    const drop = overallAvg.stability - tagStab;
    if (drop > 5) signals.push({ tag, stabilityDrop: drop, dayCount: tagDays.length });
  }
  signals.sort((a, b) => b.stabilityDrop - a.stabilityDrop);

  if (signals.length === 0) {
    const volatility = stdDev(scoredDays.map(d => d.scores.emotionalIntensity));
    if (volatility < 15) return null;
    return {
      id: 'narrative-sensitivity-theme',
      category: 'sensitivity_theme',
      label: 'Sensitivity Theme',
      body: 'Your emotional intensity shifts noticeably on certain days, though the triggers aren\'t yet clear in your tags. Pay attention to what\'s happening on days when your system reacts more strongly.',
      stat: `Emotional intensity variability: ${Math.round(volatility)} · Still detecting patterns`,
      confidence: 'low',
      accent: 'rose',
    };
  }

  const top = signals[0];
  const topLabel = top.tag.replace(/_/g, ' ');
  const effectStrength = top.stabilityDrop;
  let body: string;

  if (signals.length >= 2) {
    const labels = signals.slice(0, 3).map(s => s.tag.replace(/_/g, ' '));
    const conf = insightConfidence(profile.windowDays, effectStrength, true);
    body = confidentPhrase(conf,
      `Your system is most reactive to ${labels.join(', ')}.`,
      `Your system appears most reactive to ${labels.join(', ')}.`,
      `There may be emerging sensitivities around ${labels.join(', ')}.`,
    ) + ` ${capitalize(labels[0])} has the strongest impact — stability falls ${Math.round(top.stabilityDrop)} points on those days.`;
  } else {
    const conf = insightConfidence(profile.windowDays, effectStrength, false);
    body = confidentPhrase(conf,
      `${capitalize(topLabel)} is clearly affecting you more than other stressors right now.`,
      `${capitalize(topLabel)} seems to be affecting you more than other stressors right now.`,
      `${capitalize(topLabel)} may be affecting you more than other stressors right now.`,
    ) + ` On the ${top.dayCount} days it appeared, your stability dropped ${Math.round(top.stabilityDrop)} points below baseline.`;
  }

  return {
    id: 'narrative-sensitivity-theme',
    category: 'sensitivity_theme',
    label: 'Sensitivity Theme',
    body,
    stat: `${signals.length} sensitivity pattern${signals.length > 1 ? 's' : ''} · Strongest: ${topLabel} (−${Math.round(top.stabilityDrop)} stability)`,
    confidence: insightConfidence(profile.windowDays, effectStrength, signals.length >= 2),
    accent: 'rose',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Connection Pattern
// ─────────────────────────────────────────────────────────────────────────────

function buildConnectionPattern(profile: PatternProfile): NarrativeInsight | null {
  if (profile.windowDays < MIN_DAYS) return null;
  const { scoredDays, overallAvg } = profile;

  const connectedDays = scoredDays.filter(d => d.scores.connection > 60);
  const disconnectedDays = scoredDays.filter(d => d.scores.connection < 40);
  if (connectedDays.length < 2 && disconnectedDays.length < 2) return null;

  let body: string;
  let effectStrength: number;

  if (connectedDays.length >= 2 && disconnectedDays.length >= 2) {
    const connStab = mean(connectedDays.map(d => d.scores.stability));
    const discStab = mean(disconnectedDays.map(d => d.scores.stability));
    const spread = connStab - discStab;
    effectStrength = Math.abs(spread);
    if (spread > 15) {
      const conf = insightConfidence(profile.windowDays, effectStrength, true);
      body = confidentPhrase(conf,
        `Connection deeply shapes your emotional world. Your stability swings ${Math.round(spread)} points between days of positive connection and relational strain.`,
        `Connection appears to shape your emotional world. Your stability differs by about ${Math.round(spread)} points between connected and strained days.`,
        `There may be a link between connection and your emotional stability, with a ${Math.round(spread)}-point difference emerging.`,
      ) + ' Feeling supported noticeably improves your nervous system state.';
    } else {
      body = 'Relational themes show up regularly in your data, and your stability responds — though not dramatically. Emotional safety in connection seems to matter to your wellbeing.';
    }
  } else if (disconnectedDays.length >= 2) {
    const discStab = mean(disconnectedDays.map(d => d.scores.stability));
    effectStrength = overallAvg.stability - discStab;
    body = `On days with relational strain, your stability averages ${Math.round(discStab)} — ${Math.round(effectStrength)} points below your baseline.`;
  } else {
    const connStab = mean(connectedDays.map(d => d.scores.stability));
    effectStrength = connStab - overallAvg.stability;
    body = `Your stability tends to lift on days with relational connection — averaging ${Math.round(connStab)} compared to your overall ${overallAvg.stability}. Feeling connected may be one of your strongest emotional supports.`;
  }

  return {
    id: 'narrative-connection-pattern',
    category: 'connection_pattern',
    label: 'Connection Pattern',
    body,
    stat: `${connectedDays.length} connected days · ${disconnectedDays.length} strained days · Connection avg: ${overallAvg.connection}/100`,
    confidence: insightConfidence(connectedDays.length + disconnectedDays.length, effectStrength, true),
    accent: 'rose',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Growth Reflection
// ─────────────────────────────────────────────────────────────────────────────

function buildGrowthReflection(profile: PatternProfile): NarrativeInsight | null {
  if (profile.windowDays < MIN_DAYS_STRONG) return null;
  const { scoredDays } = profile;
  const mid = Math.floor(scoredDays.length / 2);
  const older = scoredDays.slice(0, mid);
  const newer = scoredDays.slice(mid);
  if (older.length < 5 || newer.length < 5) return null;

  const olderStab = mean(older.map(d => d.scores.stability));
  const newerStab = mean(newer.map(d => d.scores.stability));
  const olderVol = stdDev(older.map(d => d.scores.stability));
  const newerVol = stdDev(newer.map(d => d.scores.stability));
  const olderRest = mean(older.map(d => d.scores.restoration));
  const newerRest = mean(newer.map(d => d.scores.restoration));

  function recRate(days: ScoredDay[]): number {
    let bounces = 0;
    let lows = 0;
    for (let i = 0; i < days.length - 1; i++) {
      if (days[i].scores.stability < 40) {
        lows++;
        if (days[i + 1].scores.stability > days[i].scores.stability + 8) bounces++;
      }
    }
    return lows > 0 ? bounces / lows : 0;
  }

  const olderJPct = older.filter(d => d.aggregate.hasJournalText).length / older.length;
  const newerJPct = newer.filter(d => d.aggregate.hasJournalText).length / newer.length;

  const signals: string[] = [];
  if (newerVol < olderVol - 3) signals.push('increasing steadiness');
  if (newerStab > olderStab + 5) signals.push('a lift in emotional tone');
  if (recRate(newer) > recRate(older) + 0.15) signals.push('faster recovery after dips');
  if (newerJPct > olderJPct + 0.15) signals.push('more consistent journaling');
  if (newerRest > olderRest + 5) signals.push('improved restoration');

  let body: string;
  let effectStrength: number;
  if (signals.length >= 2) {
    effectStrength = signals.length * 20;
    body = `Your data shows signs of real growth: ${signals.join(', ')}. These changes may feel invisible day-to-day, but comparing your earlier entries to more recent ones reveals a meaningful shift.`;
  } else if (signals.length === 1) {
    effectStrength = 35;
    body = `There\'s a quiet signal in your data: ${signals[0]}. It may not feel like much, but this kind of shift often marks a deeper change in how you relate to difficulty.`;
  } else if (newerStab >= olderStab - 3) {
    effectStrength = 25;
    body = 'Even on difficult days, you continue showing up for yourself — logging, reflecting, and staying present to your inner world. That consistency is itself a form of resilience.';
  } else {
    effectStrength = 20;
    body = 'This period has been challenging. Your entries show more strain than before. But the fact that you\'re still tracking, still paying attention — that matters.';
  }

  return {
    id: 'narrative-growth-reflection',
    category: 'growth_reflection',
    label: 'Growth Reflection',
    body,
    stat: `Comparing ${older.length}-day windows · Stability: ${Math.round(olderStab)} → ${Math.round(newerStab)} · Variability: ${newerVol < olderVol ? 'decreasing' : 'increasing'}`,
    confidence: insightConfidence(profile.windowDays, effectStrength, signals.length >= 2),
    accent: 'emerald',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Dream Theme
// ─────────────────────────────────────────────────────────────────────────────

function buildDreamTheme(profile: PatternProfile): NarrativeInsight | null {
  const dreamDays = profile.scoredDays.filter(d => d.aggregate.hasDream);
  if (dreamDays.length < 3) return null;

  const dreamStrain = mean(dreamDays.map(d => d.scores.strain));
  const highStrainDreams = dreamDays.filter(d => d.scores.strain > 60).length;
  const highStrainPct = highStrainDreams / dreamDays.length;
  const dreamCorr = findCorrelation(profile.correlations, 'dream presence', 'emotional intensity');

  const dreamKw: Record<string, number> = {};
  for (const d of dreamDays) {
    for (const kw of d.aggregate.keywordsUnion) { dreamKw[kw] = (dreamKw[kw] ?? 0) + 1; }
  }
  const topKw = topN(dreamKw, 4).filter(k => k.count >= 2);

  let body: string;
  let effectStrength: number;

  if (highStrainPct >= 0.5 && dreamDays.length >= 3) {
    effectStrength = 60;
    body = 'Your dream world seems more active during emotionally intense periods. The majority of your logged dreams fall on higher-strain days — your subconscious may be processing what daytime awareness hasn\'t fully addressed.';
  } else if (dreamCorr && dreamCorr.strength > 10) {
    effectStrength = Math.abs(dreamCorr.strength);
    body = 'Dreams appear more prominently during your more emotionally activated periods. Your inner world may be reflecting — or trying to resolve — the tensions you carry.';
  } else if (topKw.length >= 2) {
    effectStrength = 40;
    body = `Recurring themes in your dream-adjacent entries include ${topKw.map(k => k.key).join(', ')}. These patterns may reflect deeper needs surfacing beneath daily life.`;
  } else {
    effectStrength = 20;
    body = 'You\'ve been logging dreams consistently. Over time, MySky will surface recurring themes and emotional patterns from your dream world.';
  }

  return {
    id: 'narrative-dream-theme',
    category: 'dream_theme',
    label: 'Dream Theme',
    body,
    stat: `${dreamDays.length} dream days · Dream-day strain: ${Math.round(dreamStrain)} (overall: ${profile.overallAvg.strain}) · ${highStrainDreams} on high-strain days`,
    confidence: insightConfidence(dreamDays.length, effectStrength, highStrainPct > 0.3),
    accent: 'lavender',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Emerging Pattern
// ─────────────────────────────────────────────────────────────────────────────

function buildEmergingPattern(profile: PatternProfile): NarrativeInsight | null {
  if (profile.windowDays < MIN_DAYS_STRONG) return null;
  const recent = profile.scoredDays.slice(-14);
  if (recent.length < 7) return null;

  const recentAvg = {
    stability: mean(recent.map(d => d.scores.stability)),
    strain: mean(recent.map(d => d.scores.strain)),
  };

  const recentEmotions: Record<string, number> = {};
  for (const d of recent) {
    for (const [k, v] of Object.entries(d.aggregate.emotionCountsTotal)) {
      recentEmotions[k] = (recentEmotions[k] ?? 0) + (v ?? 0);
    }
  }
  const topEmotions = topN(recentEmotions, 3).filter(e => e.count >= 2);

  const recentTags: Record<string, number> = {};
  for (const d of recent) {
    for (const t of d.aggregate.tagsUnion) { recentTags[t] = (recentTags[t] ?? 0) + 1; }
  }
  const topTags = topN(recentTags, 3).filter(t => t.count >= 3);

  const recentKw: Record<string, number> = {};
  for (const d of recent) {
    for (const kw of d.aggregate.keywordsUnion) { recentKw[kw] = (recentKw[kw] ?? 0) + 1; }
  }
  const topKw = topN(recentKw, 3).filter(k => k.count >= 2);

  const themes: string[] = [];
  if (topEmotions.length > 0) themes.push(...topEmotions.map(e => e.key));
  if (topTags.length > 0) themes.push(...topTags.map(t => t.key.replace(/_/g, ' ')));

  let body: string;
  let effectStrength: number;

  if (themes.length >= 3) {
    const unique = [...new Set(themes)].slice(0, 4).join(', ');
    effectStrength = 50;
    const diff = recentAvg.stability - profile.overallAvg.stability;
    if (diff < -8) {
      body = `A pattern is emerging in your recent entries: themes of ${unique} appear alongside a dip in emotional stability. This may be a season of processing — your inner world is active, and it\'s surfacing things that need attention.`;
    } else if (diff > 8) {
      body = `Recent themes of ${unique} coincide with a lift in your stability. Something is aligning — worth noticing and protecting.`;
    } else {
      body = `Your recent inner landscape carries recurring themes: ${unique}. These aren\'t random — they form an undercurrent that shapes how you experience your days.`;
    }
  } else if (topKw.length >= 2) {
    effectStrength = 35;
    body = `Your writing has been circling around ${topKw.map(k => k.key).join(', ')} recently. When the same words keep surfacing, they often carry more weight than they seem.`;
  } else {
    effectStrength = 15;
    body = 'Your recent entries carry subtle textures that are still forming into patterns. As you continue reflecting, the themes that matter most will become clearer.';
  }

  return {
    id: 'narrative-emerging-pattern',
    category: 'emerging_pattern',
    label: 'Emerging Pattern',
    body,
    stat: `Last ${recent.length} days · Stability: ${Math.round(recentAvg.stability)} (overall: ${profile.overallAvg.stability}) · ${themes.length} recurring theme${themes.length !== 1 ? 's' : ''}`,
    confidence: insightConfidence(recent.length, effectStrength, themes.length >= 3),
    accent: 'gold',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate all narrative insight cards from daily aggregates.
 *
 * Three-layer pipeline:
 *   1. Raw DailyAggregates -> scored via buildPatternProfile()
 *   2. PatternProfile provides trends, correlations, best/hard day ingredients
 *   3. Each builder converts scored patterns into human-readable reflections
 *
 * Pure function -- no I/O, no side effects.
 */
export function computeNarrativeInsights(
  aggregates: DailyAggregate[],
): NarrativeInsightBundle {
  const profile = buildPatternProfile(aggregates);

  const builders = [
    buildEmotionalUndercurrent,
    buildEnergyRhythm,
    buildStressSignal,
    buildSleepConnection,
    buildRestorationPattern,
    buildBestDayInsight,
    buildHardDayReflection,
    buildSensitivityTheme,
    buildConnectionPattern,
    buildGrowthReflection,
    buildDreamTheme,
    buildEmergingPattern,
  ];

  const insights: NarrativeInsight[] = [];
  for (const build of builders) {
    const result = build(profile);
    if (result) insights.push(result);
  }

  return {
    insights,
    generatedAt: new Date().toISOString(),
    dataPoints: aggregates.length,
    profile,
  };
}
