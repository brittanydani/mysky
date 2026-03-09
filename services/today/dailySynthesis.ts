/**
 * Daily Synthesis Engine
 *
 * Generates the "Story of the Day" narrative — the deep-dive morning report
 * combining real astronomical transits, recent check-in data, and somatic
 * guidance into three readable paragraphs plus forward-looking modules.
 *
 * Systems engaged:
 *   System 3  — Sentiment Tone Tracking (recent check-in deltas)
 *   System 7  — Theme Engine (transit-to-narrative mapping)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDb } from '../storage/localDb';
import { getTransitInfo, getTransitingLongitudes, computeTransitAspectsToNatal } from '../astrology/transits';
import { NatalChart, SimpleAspect } from '../astrology/types';
import { getMoonPhaseInfo } from '../../utils/moonPhase';
import { signFromLongitude } from '../astrology/sharedHelpers';
import { toLocalDateString } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface SomaticAnchor {
  title: string;
  instruction: string;
  durationLabel: string;
  icon: string;
  accentColor: string;
}

export interface LookAheadPoint {
  timeLabel: string;
  description: string;
  accentColor: string;
  icon: string;
}

export interface DailySynthesis {
  /** Moon phase for hero header */
  moonPhaseName: string;
  moonPhaseAngle: number;
  moonPhaseEmoji: string;
  moonSign: string;

  /** Section 1 — Atmosphere */
  atmosphereParagraph: string;

  /** Section 2 — Reflection */
  reflectionParagraph: string;

  /** Section 3 — Advice / Focus */
  adviceParagraph: string;

  /** Somatic Anchor card */
  somaticAnchor: SomaticAnchor;

  /** Look Ahead — next 48 hours */
  lookAhead: LookAheadPoint[];

  /** For the validation loop persisted in AsyncStorage */
  primaryTransitKey: string | null;

  /** One-sentence micro-insight for Completion Screen (weather type) */
  weatherMicroInsight: string;

  /** One-sentence micro-insight for Completion Screen (rest/dream type) */
  restMicroInsight: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transit-to-plain-English library
// ─────────────────────────────────────────────────────────────────────────────

const ASPECT_INTERPRETATIONS: Record<string, Record<string, string>> = {
  conjunction: {
    Moon: 'The transiting Moon is merging with one of your natal points, amplifying your emotional sensitivity. Your feelings today carry important information — listen closely before reacting.',
    Sun: 'A solar conjunction is highlighting your sense of identity. Something about who you are is coming into focus — decisions made today tend to last.',
    Mercury: 'Mental energy is sharp and accelerated. Words carry extra weight today; conversations started under a Mercury conjunction have unusual staying power.',
    Venus: 'Your capacity for love, beauty, and pleasure is being activated. A natural moment to repair a relationship or create something meaningful.',
    Mars: 'Drive and initiative are spiking. This is powerful, directed energy — channel it into what you most want to move forward.',
    Jupiter: 'Expansion is the word for today. Opportunities in your chart are being illuminated. Say yes where your gut says go.',
    Saturn: 'Structure, accountability, and long-term thinking are being called forward. What needs to be more solid in your life?',
    Uranus: 'Unexpected pivots are likely. The cosmos is testing your flexibility — the most nimble version of you handles this best.',
    Neptune: 'Your intuition is your most powerful instrument today. Rational analysis may feel slippery; trust the quieter voice.',
    Pluto: 'Deep transformation is underway beneath the surface. What feels heavy today is asking to be permanently released.',
    default: 'A planetary activation is meeting one of your natal points. Notice the themes this stirs — they carry a message.',
  },
  trine: {
    Moon: 'Your emotional life and the cosmic current are moving in the same direction. Lean into this ease — it is real, not luck.',
    Sun: 'Your vitality and sense of purpose feel supported today. Actions taken now have flow behind them.',
    Mars: 'Your energy reserves are quietly replenished. This is a productive day that does not require force.',
    Venus: 'Harmony in connection comes easily. A natural window for reconciliation, creativity, or simply being present with someone you love.',
    Jupiter: 'Fortune is gently available. Reach for things just beyond your usual comfort zone — the stretch is supported.',
    default: 'The cosmic energy flows smoothly through your chart today. Move with it rather than against it.',
  },
  opposition: {
    Moon: 'Emotional tension is asking for resolution. Two parts of your inner world are in dialogue — see if you can hold both without collapsing one.',
    Sun: 'You may feel the pull between self and other, between what you want and what is expected of you. Neither is wrong.',
    Mars: 'There may be friction with others today. Choose your battles deliberately. The provocation visible on the surface is rarely the real issue.',
    Saturn: 'A structure in your life is being tested. The pressure is not punishment — it is refinement.',
    default: 'An inner tension is present today. Two valid forces are negotiating. Give each one space before making decisions.',
  },
  square: {
    Moon: 'Emotional discomfort is present. Rather than avoiding it, get curious. What is this feeling protecting you from?',
    Sun: 'You may meet resistance in self-expression today. The friction is not telling you to stop — it is asking you to be more precise.',
    Mars: 'Frustration or impatience may surface. Breathe deliberately before responding. The pressure you feel is also activating your problem-solving.',
    Saturn: 'A real limitation is presenting itself. Working within it skillfully builds resilience that outlasts the transit.',
    default: 'A challenge point is active in your chart. Approach it with investigative curiosity, not force.',
  },
  sextile: {
    default: 'A gentle supportive energy is present in your background. Small, well-timed actions carry positive momentum today.',
  },
};

function getAspectText(type: string, planet: string): string {
  const byType = ASPECT_INTERPRETATIONS[type.toLowerCase()];
  if (!byType) return ASPECT_INTERPRETATIONS.conjunction.default;
  return byType[planet] ?? byType.default ?? ASPECT_INTERPRETATIONS.conjunction.default;
}

// Moon sign tonal qualities for the Atmosphere paragraph
const MOON_SIGN_TONE: Record<string, string> = {
  Aries: 'The Moon in Aries charges the atmosphere with urgency and initiative. Emotional responses are quick and honest today.',
  Taurus: 'The Moon in Taurus brings a slower, sensory quality to the day. Your body knows things your mind is still catching up with.',
  Gemini: 'The Moon in Gemini makes the mind especially active. Multiple perspectives feel equally valid — this is a feature, not a flaw.',
  Cancer: 'The Moon in Cancer deepens the waters of home, family, and inner safety. Emotional memory is close to the surface.',
  Leo: 'The Moon in Leo warms the atmosphere with visibility, creativity, and a quiet need to be seen and appreciated.',
  Virgo: 'The Moon in Virgo sharpens discernment. The impulse toward precision and order is useful — as long as it does not become self-criticism.',
  Libra: 'The Moon in Libra seeks balance and connection. Harmony with others feels essential, but not at the cost of your own clarity.',
  Scorpio: 'The Moon in Scorpio makes today psychologically intense. What moves beneath the surface is worth paying attention to.',
  Sagittarius: 'The Moon in Sagittarius opens up the horizon. A deeper truth is available if you are willing to ask a bigger question.',
  Capricorn: 'The Moon in Capricorn steadies the waters. There is dignity in quiet discipline today — in showing up without needing applause.',
  Aquarius: 'The Moon in Aquarius loosens conventional thinking. Your most original ideas are trying to surface — give them room.',
  Pisces: 'The Moon in Pisces dissolves hard edges. Empathy is strong, boundaries require conscious maintenance, and dreams are significant.',
};

// ─────────────────────────────────────────────────────────────────────────────
// Somatic Anchor library — chosen based on dominant stress/energy signal
// ─────────────────────────────────────────────────────────────────────────────

const SOMATIC_ANCHORS: Array<{
  condition: (avgStress: number, avgEnergy: number, avgMood: number) => boolean;
  anchor: SomaticAnchor;
}> = [
  {
    condition: (s) => s >= 7,
    anchor: {
      title: 'High Tension Anchor',
      instruction: 'Place one hand on your chest and one on your belly. Take a full breath in through your nose for 4 counts, hold for 2, then open your mouth and let it go with a quiet "sigh" sound. Repeat 3 times without rushing.',
      durationLabel: '60 seconds',
      icon: 'hand-left-outline',
      accentColor: '#E07A7A',
    },
  },
  {
    condition: (s, e) => e <= 3,
    anchor: {
      title: 'Energy Activation',
      instruction: 'Stand up if you can. Roll your shoulders back 3 times, let your arms hang loose, and shake your hands gently for 10 seconds as if you are trying to flick water off them. This resets the peripheral nervous system.',
      durationLabel: '30 seconds',
      icon: 'flash-outline',
      accentColor: '#C9AE78',
    },
  },
  {
    condition: (s, e, m) => m <= 4,
    anchor: {
      title: 'Emotional Grounding',
      instruction: 'Name 5 things you can see. 4 you can hear. 3 you can touch. 2 you can smell. 1 you can taste. This is the 5-4-3-2-1 protocol — it interrupts rumination and returns you to the present moment in under 90 seconds.',
      durationLabel: '90 seconds',
      icon: 'eye-outline',
      accentColor: '#9D76C1',
    },
  },
  {
    condition: (s, e, m) => m >= 7 && e >= 7,
    anchor: {
      title: 'Integration Pause',
      instruction: 'You are in a high-coherence state. This is worth anchoring. Close your eyes for 30 seconds and simply notice what "good" feels like in your body right now. Make a quiet internal note — this is your baseline to return to.',
      durationLabel: '30 seconds',
      icon: 'sparkles-outline',
      accentColor: '#6EBF8B',
    },
  },
  {
    condition: () => true,
    anchor: {
      title: 'Centering Breath',
      instruction: 'Inhale slowly through your nose for 5 counts. Exhale through your mouth for 7 counts. The extended exhale activates the parasympathetic nervous system — you are not trying to relax, you are signalling safety.',
      durationLabel: '60 seconds',
      icon: 'leaf-outline',
      accentColor: '#8BC4E8',
    },
  },
];

function chooseSomaticAnchor(avgStress: number, avgEnergy: number, avgMood: number): SomaticAnchor {
  for (const entry of SOMATIC_ANCHORS) {
    if (entry.condition(avgStress, avgEnergy, avgMood)) {
      return entry.anchor;
    }
  }
  return SOMATIC_ANCHORS[SOMATIC_ANCHORS.length - 1].anchor;
}

// ─────────────────────────────────────────────────────────────────────────────
// Look Ahead generator — computes +24h / +48h transit notes
// ─────────────────────────────────────────────────────────────────────────────

function buildLookAheadPoints(chart: NatalChart, now: Date): LookAheadPoint[] {
  const points: LookAheadPoint[] = [];

  try {
    const lat = chart.birthData.latitude;
    const lng = chart.birthData.longitude;

    // Tonight (~+12h)
    const tonight = new Date(now);
    tonight.setHours(now.getHours() + 12);
    const tonightTransits = getTransitingLongitudes(tonight, lat, lng);
    const tonightAspects = computeTransitAspectsToNatal(chart, tonightTransits)
      .sort((a, b) => a.orb - b.orb)
      .slice(0, 1);

    if (tonightAspects.length > 0) {
      const a = tonightAspects[0];
      points.push({
        timeLabel: 'Tonight',
        description: `${a.pointA} forms a ${a.type} to your natal ${a.pointB}. ${getAspectText(a.type, a.pointA).split('.')[0]}.`,
        accentColor: '#8BC4E8',
        icon: 'moon-outline',
      });
    }

    // Tomorrow morning (~+24h)
    const tomorrow = new Date(now);
    tomorrow.setHours(now.getHours() + 24);
    const tomorrowTransits = getTransitingLongitudes(tomorrow, lat, lng);
    const tomorrowAspects = computeTransitAspectsToNatal(chart, tomorrowTransits)
      .sort((a, b) => a.orb - b.orb)
      .slice(0, 1);

    if (tomorrowAspects.length > 0) {
      const a = tomorrowAspects[0];
      points.push({
        timeLabel: 'Tomorrow',
        description: `${a.pointA} continues its ${a.type} to your natal ${a.pointB}. This influence carries forward.`,
        accentColor: '#C9AE78',
        icon: 'sunny-outline',
      });
    } else {
      points.push({
        timeLabel: 'Tomorrow',
        description: 'Planetary pressure eases. Tomorrow favours consolidation over initiation — a natural pause in the cosmic rhythm.',
        accentColor: '#6EBF8B',
        icon: 'sunny-outline',
      });
    }
  } catch (err) {
    logger.error('[DailySynthesis] lookAhead failed:', err);
    points.push({
      timeLabel: 'Next 48h',
      description: 'The cosmic weather continues to shift. Stay attuned to what arises.',
      accentColor: '#8BC4E8',
      icon: 'telescope-outline',
    });
  }

  return points;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation loop — transit weight persistence
// ─────────────────────────────────────────────────────────────────────────────

const TRANSIT_WEIGHT_PREFIX = 'transit_weight_';

export async function storeTransitFeedback(
  chartId: string,
  transitKey: string,
  felt: 'yes' | 'no',
): Promise<void> {
  try {
    const storageKey = `${chartId}_${TRANSIT_WEIGHT_PREFIX}${transitKey}`;
    const existing = await AsyncStorage.getItem(storageKey);
    const weight = existing ? parseFloat(existing) : 1.0;
    // "Yes" slightly increases weight (max 1.5x), "No" decreases it (min 0.25x)
    const updated = felt === 'yes'
      ? Math.min(1.5, weight + 0.1)
      : Math.max(0.25, weight - 0.15);
    await AsyncStorage.setItem(storageKey, updated.toString());
  } catch (err) {
    logger.error('[DailySynthesis] storeTransitFeedback failed:', err);
  }
}

async function getTransitWeight(chartId: string, transitKey: string): Promise<number> {
  try {
    const storageKey = `${chartId}_${TRANSIT_WEIGHT_PREFIX}${transitKey}`;
    const val = await AsyncStorage.getItem(storageKey);
    return val ? Math.max(0.25, Math.min(1.5, parseFloat(val))) : 1.0;
  } catch {
    return 1.0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────────────────────────────────────

export async function generateDailySynthesis(
  chart: NatalChart,
  chartId: string,
): Promise<DailySynthesis> {
  const now = new Date();
  const today = toLocalDateString(now);

  // ── Moon phase ──
  const moonInfo = getMoonPhaseInfo(now);

  // ── Current transits ──
  const lat = chart.birthData.latitude;
  const lng = chart.birthData.longitude;

  let moonSign = 'Scorpio'; // fallback
  let transitAspects: SimpleAspect[] = [];

  try {
    const transits = getTransitingLongitudes(now, lat, lng);
    const moonDeg = transits['Moon'];
    if (moonDeg != null) {
      const sign = signFromLongitude(moonDeg);
      moonSign = typeof sign === 'string' ? sign : (sign as any).name ?? 'Scorpio';
    }
    transitAspects = computeTransitAspectsToNatal(chart, transits)
      .sort((a, b) => a.orb - b.orb);
  } catch (err) {
    logger.error('[DailySynthesis] transit computation failed:', err);
  }

  // Weight aspects by user feedback history
  const weightedAspects = await Promise.all(
    transitAspects.slice(0, 6).map(async (a) => {
      const key = `${a.pointA}_${a.type}_${a.pointB}`;
      const weight = await getTransitWeight(chartId, key);
      return { aspect: a, weight };
    }),
  );
  const sortedWeighted = weightedAspects.sort((a, b) => (a.aspect.orb / a.weight) - (b.aspect.orb / b.weight));
  const primaryAspect = sortedWeighted[0]?.aspect ?? null;
  const primaryTransitKey = primaryAspect
    ? `${primaryAspect.pointA}_${primaryAspect.type}_${primaryAspect.pointB}`
    : null;

  // ── Recent check-ins (last 3 days) ──
  let avgMood = 6;
  let avgEnergy = 5;
  let avgStress = 5;
  let moodTrend: 'rising' | 'falling' | 'stable' = 'stable';
  let dominantTag = '';

  try {
    const checkIns = await localDb.getCheckIns(chartId, 7);
    const recent = checkIns.filter(c => {
      const d = new Date(c.date);
      const diffDays = (now.getTime() - d.getTime()) / 86400000;
      return diffDays <= 3;
    });

    if (recent.length > 0) {
      const energyMap: Record<string, number> = { low: 2, medium: 5, high: 8 };
      const stressMap: Record<string, number> = { low: 2, medium: 5, high: 8 };

      const moodScores = recent.map(c => c.moodScore ?? 5);
      avgMood = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
      avgEnergy = recent.map(c => energyMap[c.energyLevel] ?? 5).reduce((a, b) => a + b, 0) / recent.length;
      avgStress = recent.map(c => stressMap[c.stressLevel] ?? 5).reduce((a, b) => a + b, 0) / recent.length;

      // Trend: compare last check-in vs. earlier ones
      if (recent.length >= 2) {
        const newest = moodScores[0];
        const older = moodScores.slice(1).reduce((a, b) => a + b, 0) / (moodScores.length - 1);
        moodTrend = newest > older + 0.5 ? 'rising' : newest < older - 0.5 ? 'falling' : 'stable';
      }

      // Most common tag
      const tagCounts: Record<string, number> = {};
      for (const ci of recent) {
        for (const t of ci.tags ?? []) {
          tagCounts[t] = (tagCounts[t] ?? 0) + 1;
        }
      }
      dominantTag = Object.entries(tagCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '';
    }
  } catch (err) {
    logger.error('[DailySynthesis] checkIn loading failed:', err);
  }

  // ── Paragraph 1: The Atmosphere ──
  const moonTone = MOON_SIGN_TONE[moonSign] ?? `The Moon is in ${moonSign} today, coloring the emotional atmosphere with its distinctive quality.`;
  let atmosphereParagraph = moonTone;

  if (primaryAspect) {
    const aspectText = getAspectText(primaryAspect.type, primaryAspect.pointA);
    atmosphereParagraph += ` ${aspectText}`;
  } else {
    atmosphereParagraph += ' The sky is relatively quiet in terms of hard activations, which makes this a good day for completing things rather than starting them.';
  }

  // Retrograde mention
  try {
    const rInfo = getTransitInfo(now, lat, lng);
    if (rInfo.retrogrades.length > 0) {
      const retro = rInfo.retrogrades.slice(0, 2).join(' and ');
      atmosphereParagraph += ` ${retro} ${rInfo.retrogrades.length === 1 ? 'is' : 'are'} retrograde — review, refine, and reconsider rather than pushing into new territory.`;
    }
  } catch {}

  // ── Paragraph 2: The Reflection ──
  const moodDesc = avgMood >= 7 ? 'elevated' : avgMood >= 5 ? 'moderate' : 'subdued';
  const trendDesc = moodTrend === 'rising' ? 'trending upward over the last few days'
    : moodTrend === 'falling' ? 'dipped compared to earlier in the week'
    : 'holding steady';

  let reflectionParagraph = `Your emotional weather over the past three days has been ${moodDesc}, ${trendDesc}.`;

  if (dominantTag) {
    const tagLabel = dominantTag.replace(/_/g, ' ');
    reflectionParagraph += ` The theme of "${tagLabel}" has appeared consistently in your check-ins — this is not coincidence.`;
  }

  if (primaryAspect && avgStress >= 6) {
    reflectionParagraph += ` The elevated tension you have been carrying correlates directly with the ${primaryAspect.type} between transiting ${primaryAspect.pointA} and your natal ${primaryAspect.pointB}. This transit does not create stress — it illuminates where stress was already waiting. Recognizing the source is the first step toward metabolizing it.`;
  } else if (primaryAspect && avgMood >= 7) {
    reflectionParagraph += ` The higher-than-usual clarity you have been experiencing aligns with the ${primaryAspect.type} transiting ${primaryAspect.pointA}. Your inner work is producing visible results.`;
  } else {
    reflectionParagraph += ` The current transit pattern suggests that what you are processing internally is right on schedule — even if it does not always feel that way.`;
  }

  // ── Paragraph 3: The Advice ──
  let adviceParagraph: string;
  if (avgStress >= 7) {
    adviceParagraph = 'Your focus for today: protection over performance. Give yourself explicit permission to do less than you think you should. The most important thing you can do in a high-tension period is keep your nervous system regulated — everything else becomes easier from there.';
  } else if (moodTrend === 'rising' && avgMood >= 7) {
    adviceParagraph = 'Your focus for today: consolidate what is working. You are in a rising window — this is the moment to name and reinforce the habits, relationships, and practices that got you here. What you anchor now tends to persist.';
  } else if (moodTrend === 'falling') {
    adviceParagraph = 'Your focus for today: reduce friction. Do not add anything new. Cancel what can be cancelled. The dip in your emotional weather is temporary, but it requires less stimulation and more stillness to pass through cleanly.';
  } else if (avgEnergy <= 3) {
    adviceParagraph = 'Your focus for today: restoration before output. Low energy is your body communicating a need for inputs before outputs. Nourishment, sunlight, water, and short rest cycles are not luxuries today — they are prerequisites for everything else you want to do.';
  } else {
    adviceParagraph = 'Your focus for today: follow the thread of genuine curiosity. Not obligation, not performance — the thing that actually has a quiet pull to it. Even 20 minutes of attention toward what genuinely interests you recalibrates the nervous system toward its natural creative orientation.';
  }

  // ── Somatic Anchor ──
  const somaticAnchor = chooseSomaticAnchor(avgStress, avgEnergy, avgMood);

  // ── Look Ahead ──
  const lookAhead = buildLookAheadPoints(chart, now);

  // ── Micro-insights (for Completion Screen) ──
  const sevenDayBaseline = avgMood; // use 3-day avg as proxy; ideally would use 7-day
  const stressPercent = Math.round(((avgStress - 5) / 5) * 100);
  const stressLabel = avgStress >= 7 ? 'high' : avgStress >= 5 ? 'moderate' : 'low';

  const weatherMicroInsight = avgStress >= 7
    ? `Data sealed. Your tension is running ${Math.abs(stressPercent)}% above baseline. Place a hand on your heart — one slow breath goes further than you think.`
    : avgMood >= 7
    ? `Weather logged. You are currently in a radiant state — ${Math.round(avgMood * 10)}% above your recent baseline. This is worth protecting.`
    : `Internal weather recorded. Your current readings are ${stressLabel} tension, ${avgMood >= 5 ? 'stable' : 'subdued'} mood. The pattern becomes visible over time.`;

  const restMicroInsight = moonInfo.name === 'Full Moon' || moonInfo.name === 'New Moon'
    ? `Rest sealed under the ${moonInfo.name}. ${moonInfo.message} Your dream data is part of this lunar chapter.`
    : `Rest recorded. The Moon is ${moonInfo.name.toLowerCase()} — ${moonInfo.message.toLowerCase()} Move through today at your own pace.`;

  return {
    moonPhaseName: moonInfo.name,
    moonPhaseAngle: moonInfo.angle,
    moonPhaseEmoji: moonInfo.emoji,
    moonSign,
    atmosphereParagraph,
    reflectionParagraph,
    adviceParagraph,
    somaticAnchor,
    lookAhead,
    primaryTransitKey,
    weatherMicroInsight,
    restMicroInsight,
  };
}
