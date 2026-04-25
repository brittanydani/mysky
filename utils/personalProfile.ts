/**
 * Personal Profile — The Living User Model
 *
 * Builds an evolving inner map of the user from their PatternProfile.
 * This is NOT a visible personality test — it's a quiet accumulation
 * of recurring truths that power deeper, more personal insights.
 *
 * The profile answers:
 *   - What affects this person most?
 *   - What restores them?
 *   - What patterns do they live inside without noticing?
 *   - How do they respond to difficulty?
 *   - What kind of person are they, underneath it all?
 *
 * Pure function — no I/O, no side effects. Deterministic from inputs.
 */

import { DailyAggregate } from '../services/insights/types';
import { mean, stdDev } from './stats';
import {
  PatternProfile,
  ScoredDay,
  buildPatternProfile,
} from './dailyScores';
import {
  generateSleepSensitivityTrait,
  generateConnectionSensitivityTrait,
  generateCrowdingSensitivityTrait,
  generateGradualAccumulatorTrait,
  generateResilientRecovererTrait,
  generateRecoveryStyleDescription,
  generateStressPatternDescription,
  generateStrengthDescription,
  generateAnticipationBody,
  generateProgressMarkerDescription,
} from './personalProfileLibrary';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Data maturity determines which insight layers are available. */
export type DataMaturity = 'early' | 'developing' | 'established' | 'deep';

/** A personal trait detected in the user's data. */
export interface PersonalTrait {
  /** Machine-readable key */
  id: string;
  /** What the app has learned, in user-facing language */
  description: string;
  /** How strongly this trait is supported by data (0–100) */
  strength: number;
  /** Which domain this trait belongs to */
  domain: TraitDomain;
  /** When this was first detectable (approximate window size) */
  firstDetectedDays: number;
}

export type TraitDomain =
  | 'sensitivity'     // what affects them most
  | 'restoration'     // what restores them
  | 'regulation'      // how they self-regulate
  | 'resilience'      // how they recover
  | 'identity';       // deeper themes of who they are

/** Recovery style detected from the data. */
export interface RecoveryStyle {
  /** Primary recovery mode */
  mode: 'softness' | 'structure' | 'connection' | 'solitude' | 'movement' | 'mixed';
  /** How quickly they typically bounce back (days) */
  avgRecoveryDays: number;
  /** Tags/conditions most associated with recovery */
  recoveryIngredients: string[];
  /** Strength of detection (0–100) */
  confidence: number;
}

/** Stress response pattern. */
export interface StressPattern {
  /** How stress accumulates */
  buildupStyle: 'gradual' | 'sudden' | 'cyclic';
  /** Average days before strain peaks */
  avgBuildupDays: number;
  /** Primary drain factors */
  primaryDrains: string[];
  /** Whether they tend to push through or collapse */
  responseStyle: 'push-through' | 'withdraw' | 'mixed';
  confidence: number;
}

/** The core themes appearing in their reflections over time. */
export interface InnerTheme {
  theme: string;
  frequency: number;  // how many days this appeared
  domain: 'emotional' | 'relational' | 'existential' | 'somatic';
  strength: number;   // 0–100
}

/** The complete living user model. */
export interface PersonalProfile {
  /** How mature the data is */
  maturity: DataMaturity;
  /** Total days of data */
  totalDays: number;

  /** Core traits the app has learned */
  traits: PersonalTrait[];

  /** How they recover from difficulty */
  recoveryStyle: RecoveryStyle;

  /** How stress builds and manifests */
  stressPattern: StressPattern;

  /** Sleep sensitivity score (0–100, higher = more sleep-sensitive) */
  sleepSensitivity: number;

  /** Connection sensitivity (0–100, higher = more affected by relational quality) */
  connectionSensitivity: number;

  /** Emotional range: how wide their emotional swings typically are */
  emotionalRange: number;

  /** Baseline stability: their typical stability when not under strain */
  baselineStability: number;

  /** What their best days look like */
  bestDayIngredients: string[];

  /** Recurring inner themes from journals and emotions */
  innerThemes: InnerTheme[];

  /** Personal truths: high-confidence statements derived from sustained patterns */
  personalTruths: string[];

  /** The underlying PatternProfile this was built from */
  patternProfile: PatternProfile;

  // ── Today-aware fields ──

  /** How today compares to baseline: 'anomaly' | 'rough-patch' | 'pattern' | 'baseline' */
  todayContext: TodayContext;

  /** Whether the user appears to be in a low-capacity state */
  isLowCapacity: boolean;

  /** Detected strengths from the data */
  strengths: PersonalStrength[];

  /** Forward-looking risk signals */
  anticipations: Anticipation[];

  /** Humane progress markers (not just "feeling better") */
  progressMarkers: ProgressMarker[];
}

/** How today relates to the user's overall pattern. */
export interface TodayContext {
  type: 'anomaly' | 'rough-patch' | 'pattern' | 'baseline';
  description: string;
  /** How many recent days share this character */
  streakDays: number;
}

/** A real strength detected from data, not flattery. */
export interface PersonalStrength {
  id: string;
  description: string;
  strength: number;  // 0–100
}

/** A forward-looking signal about what may be coming. */
export interface Anticipation {
  id: string;
  body: string;
  urgency: 'gentle' | 'notable' | 'important';
  confidence: number;  // 0–100
}

/** A humane progress marker — not just "feeling better." */
export interface ProgressMarker {
  id: string;
  description: string;
  type: 'noticing' | 'recovering' | 'naming' | 'protecting' | 'stabilizing' | 'honesty';
  strength: number;  // 0–100
}

// ─────────────────────────────────────────────────────────────────────────────
// Maturity detection
// ─────────────────────────────────────────────────────────────────────────────

export function detectMaturity(days: number): DataMaturity {
  if (days >= 90) return 'deep';
  if (days >= 30) return 'established';
  if (days >= 14) return 'developing';
  return 'early';
}

// ─────────────────────────────────────────────────────────────────────────────
// Trait detection
// ─────────────────────────────────────────────────────────────────────────────

function detectTraits(profile: PatternProfile): PersonalTrait[] {
  const traits: PersonalTrait[] = [];
  const { scoredDays, overallAvg, bestDayProfile, hardDayProfile } = profile;
  const days = profile.windowDays;

  // ── Sleep sensitivity ──
  const withSleep = scoredDays.filter(d => d.aggregate.sleepQuality != null);
  if (withSleep.length >= 5) {
    const good = withSleep.filter(d => (d.aggregate.sleepQuality ?? 0) >= 4);
    const poor = withSleep.filter(d => (d.aggregate.sleepQuality ?? 0) <= 2);
    if (good.length >= 2 && poor.length >= 2) {
      const goodAvg = mean(good.map(d => d.scores.stability));
      const poorAvg = mean(poor.map(d => d.scores.stability));
      const diff = goodAvg - poorAvg;
      if (diff > 10) {
        const strength = Math.min(diff * 2, 100);
        traits.push({
          id: 'sleep-sensitive',
          description: generateSleepSensitivityTrait(strength, goodAvg, poorAvg),
          strength,
          domain: 'sensitivity',
          firstDetectedDays: days,
        });
      }
    }
  }

  // ── Connection sensitivity ──
  const connected = scoredDays.filter(d => d.scores.connection > 60);
  const disconnected = scoredDays.filter(d => d.scores.connection < 40);
  if (connected.length >= 3 && disconnected.length >= 3) {
    const connectedAvg = mean(connected.map(d => d.scores.stability));
    const disconnectedAvg = mean(disconnected.map(d => d.scores.stability));
    const spread = connectedAvg - disconnectedAvg;
    if (spread > 10) {
      const strength = Math.min(spread * 2, 100);
      traits.push({
        id: 'connection-sensitive',
        description: generateConnectionSensitivityTrait(strength, connectedAvg, disconnectedAvg),
        strength,
        domain: 'sensitivity',
        firstDetectedDays: days,
      });
    }
  }

  // ── Emotional crowding sensitivity ──
  const highIntensity = scoredDays.filter(d => d.scores.emotionalIntensity > 70);
  if (highIntensity.length >= 3) {
    const hiStab = mean(highIntensity.map(d => d.scores.stability));
    const loStab = mean(scoredDays.filter(d => d.scores.emotionalIntensity <= 50).map(d => d.scores.stability));
    if (loStab - hiStab > 10) {
      const strength = Math.min((loStab - hiStab) * 2, 100);
      traits.push({
        id: 'crowding-sensitive',
        description: generateCrowdingSensitivityTrait(strength, loStab, hiStab),
        strength,
        domain: 'sensitivity',
        firstDetectedDays: days,
      });
    }
  }

  // ── Gradual accumulator (push-through pattern) ──
  let maxBuildupStreak = 0;
  let curStreak = 0;
  for (let i = 1; i < scoredDays.length; i++) {
    if (scoredDays[i].scores.strain > scoredDays[i - 1].scores.strain + 2) {
      curStreak++;
      maxBuildupStreak = Math.max(maxBuildupStreak, curStreak);
    } else {
      curStreak = 0;
    }
  }
  if (maxBuildupStreak >= 3) {
    const strength = Math.min(maxBuildupStreak * 20, 100);
    traits.push({
      id: 'gradual-accumulator',
      description: generateGradualAccumulatorTrait(strength, maxBuildupStreak),
      strength,
      domain: 'regulation',
      firstDetectedDays: days,
    });
  }

  // ── Resilient recoverer ──
  let bounces = 0;
  let lows = 0;
  for (let i = 0; i < scoredDays.length - 1; i++) {
    if (scoredDays[i].scores.stability < 40) {
      lows++;
      if (scoredDays[i + 1].scores.stability > scoredDays[i].scores.stability + 10) bounces++;
    }
  }
  if (lows >= 3 && bounces / lows > 0.5) {
    const bounceRate = bounces / lows;
    const strength = Math.min(Math.round(bounceRate * 100), 100);
    // Calculate average recovery days for this trait
    const recoveryGaps: number[] = [];
    for (let i = 0; i < scoredDays.length - 1; i++) {
      if (scoredDays[i].scores.stability < 40) {
        for (let j = i + 1; j < scoredDays.length && j <= i + 7; j++) {
          if (scoredDays[j].scores.stability > overallAvg.stability) {
            recoveryGaps.push(j - i);
            break;
          }
        }
      }
    }
    const avgRecoveryDays = recoveryGaps.length > 0 ? mean(recoveryGaps) : 2;
    traits.push({
      id: 'resilient-recoverer',
      description: generateResilientRecovererTrait(strength, bounceRate, avgRecoveryDays),
      strength,
      domain: 'resilience',
      firstDetectedDays: days,
    });
  }

  // ── Steadiness-seeker ──
  const vol = stdDev(scoredDays.map(d => d.scores.stability));
  if (vol < 12 && overallAvg.stability >= 55) {
    traits.push({
      id: 'steadiness-seeker',
      description: 'Your data suggests you value and maintain emotional steadiness. Your system seems to prioritize stability over intensity.',
      strength: Math.min(Math.round((100 - vol) * 0.8), 100),
      domain: 'identity',
      firstDetectedDays: days,
    });
  }

  // ── Deep feeler ──
  const avgIntensity = overallAvg.emotionalIntensity;
  if (avgIntensity > 60) {
    traits.push({
      id: 'deep-feeler',
      description: 'You seem to be someone who feels deeply. Your emotional intensity is consistently higher than neutral, even during stable periods.',
      strength: Math.min(avgIntensity, 100),
      domain: 'identity',
      firstDetectedDays: days,
    });
  }

  // ── Structure-dependent ──
  if (bestDayProfile && bestDayProfile.dayCount >= 2 && hardDayProfile && hardDayProfile.dayCount >= 2) {
    const bestVol = stdDev(scoredDays.filter(d => d.scores.stability > 75).map(d => d.scores.strain));
    const hardVol = stdDev(scoredDays.filter(d => d.scores.stability < 40).map(d => d.scores.strain));
    if (bestVol < hardVol - 5) {
      traits.push({
        id: 'structure-dependent',
        description: 'Your best days tend to be more predictable and structured. You seem to function well under consistency, and destabilize when life becomes chaotic.',
        strength: Math.min(Math.round((hardVol - bestVol) * 3), 100),
        domain: 'regulation',
        firstDetectedDays: days,
      });
    }
  }

  return traits.sort((a, b) => b.strength - a.strength);
}

// ─────────────────────────────────────────────────────────────────────────────
// Recovery style detection
// ─────────────────────────────────────────────────────────────────────────────

function detectRecoveryStyle(profile: PatternProfile): RecoveryStyle {
  const { scoredDays, overallAvg } = profile;

  // Find recovery days: days following low-stability days where stability improved
  const recoveryDays: ScoredDay[] = [];
  const recoveryGaps: number[] = [];

  for (let i = 0; i < scoredDays.length - 1; i++) {
    if (scoredDays[i].scores.stability < 40) {
      // Find when they recovered
      for (let j = i + 1; j < scoredDays.length && j <= i + 7; j++) {
        if (scoredDays[j].scores.stability > overallAvg.stability) {
          recoveryDays.push(scoredDays[j]);
          recoveryGaps.push(j - i);
          break;
        }
      }
    }
  }

  const avgRecoveryDays = recoveryGaps.length > 0 ? mean(recoveryGaps) : 3;

  // What tags appear on recovery days?
  const tagCounts: Record<string, number> = {};
  for (const d of recoveryDays) {
    for (const t of d.aggregate.tagsUnion) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
  }
  const recoveryIngredients = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag.replace(/_/g, ' '));

  // Detect mode
  const softTags = ['rest', 'alone_time', 'quiet', 'sleep'];
  const structureTags = ['routine', 'planning', 'work', 'exercise'];
  const connectionTags = ['social', 'relationships', 'intimacy', 'family'];
  const solitudeTags = ['alone_time', 'quiet', 'nature', 'creative'];
  const movementTags = ['movement', 'exercise', 'walking', 'yoga'];

  function tagScore(tags: string[]): number {
    return recoveryDays.filter(d => d.aggregate.tagsUnion.some(t => tags.includes(t))).length;
  }

  const scores = [
    { mode: 'softness' as const, score: tagScore(softTags) },
    { mode: 'structure' as const, score: tagScore(structureTags) },
    { mode: 'connection' as const, score: tagScore(connectionTags) },
    { mode: 'solitude' as const, score: tagScore(solitudeTags) },
    { mode: 'movement' as const, score: tagScore(movementTags) },
  ].sort((a, b) => b.score - a.score);

  const mode = scores[0].score > 0 ? scores[0].mode : 'mixed';
  const confidence = recoveryDays.length >= 5 ? 80 : recoveryDays.length >= 3 ? 55 : 30;

  return { mode, avgRecoveryDays: Math.round(avgRecoveryDays * 10) / 10, recoveryIngredients, confidence };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stress pattern detection
// ─────────────────────────────────────────────────────────────────────────────

function detectStressPattern(profile: PatternProfile): StressPattern {
  const { scoredDays, overallAvg } = profile;

  // Detect buildup style
  let gradualCount = 0;
  let suddenCount = 0;
  for (let i = 1; i < scoredDays.length; i++) {
    const jump = scoredDays[i].scores.strain - scoredDays[i - 1].scores.strain;
    if (jump > 15) suddenCount++;
    else if (jump > 3) gradualCount++;
  }

  const buildupStyle: StressPattern['buildupStyle'] =
    gradualCount > suddenCount * 2 ? 'gradual' :
    suddenCount > gradualCount * 2 ? 'sudden' : 'cyclic';

  // Average buildup days (time from below-avg strain to peak)
  const buildups: number[] = [];
  let buildStart = -1;
  for (let i = 0; i < scoredDays.length; i++) {
    if (scoredDays[i].scores.strain > overallAvg.strain + 15) {
      if (buildStart >= 0) buildups.push(i - buildStart);
      buildStart = -1;
    } else if (buildStart < 0 && scoredDays[i].scores.strain < overallAvg.strain) {
      buildStart = i;
    }
  }
  const avgBuildupDays = buildups.length > 0 ? mean(buildups) : 3;

  // Primary drains from high-strain days
  const highStrain = scoredDays.filter(d => d.scores.strain > 65);
  const drainTags: Record<string, number> = {};
  for (const d of highStrain) {
    for (const t of d.aggregate.tagsUnion) {
      drainTags[t] = (drainTags[t] ?? 0) + 1;
    }
  }
  const primaryDrains = Object.entries(drainTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag.replace(/_/g, ' '));

  // Push-through vs withdraw: do they maintain high strain for many days?
  let pushThroughDays = 0;
  for (let i = 0; i < scoredDays.length - 1; i++) {
    if (scoredDays[i].scores.strain > 60 && scoredDays[i + 1].scores.strain > 55) {
      pushThroughDays++;
    }
  }
  const responseStyle: StressPattern['responseStyle'] =
    pushThroughDays > highStrain.length * 0.4 ? 'push-through' :
    pushThroughDays < highStrain.length * 0.15 ? 'withdraw' : 'mixed';

  const confidence = profile.windowDays >= 21 ? 75 : profile.windowDays >= 14 ? 50 : 25;

  return {
    buildupStyle,
    avgBuildupDays: Math.round(avgBuildupDays * 10) / 10,
    primaryDrains,
    responseStyle,
    confidence,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner themes detection
// ─────────────────────────────────────────────────────────────────────────────

const EMOTIONAL_THEMES = ['sadness', 'anxiety', 'joy', 'anger', 'fear', 'grief', 'tenderness', 'longing', 'hope', 'guilt', 'shame', 'gratitude', 'overwhelm', 'peace'];
const RELATIONAL_THEMES = ['loneliness', 'conflict', 'intimacy', 'boundaries', 'belonging', 'rejection', 'trust', 'support'];
const EXISTENTIAL_THEMES = ['meaning', 'purpose', 'identity', 'pressure', 'responsibility', 'freedom', 'growth', 'change'];
const SOMATIC_THEMES = ['exhaustion', 'tension', 'restlessness', 'numbness', 'heaviness', 'lightness', 'pain'];

function detectInnerThemes(profile: PatternProfile): InnerTheme[] {
  const themes: InnerTheme[] = [];
  const { scoredDays } = profile;

  function scanThemes(words: string[], domain: InnerTheme['domain']): void {
    for (const word of words) {
      let count = 0;
      for (const d of scoredDays) {
        const tokens = new Set(
          [
            ...d.aggregate.tagsUnion,
          ]
            .map((s) => s.toLowerCase().trim())
            .filter(Boolean)
        );

        if (tokens.has(word)) count++;
      }
      if (count >= 2) {
        themes.push({
          theme: word,
          frequency: count,
          domain,
          strength: Math.min(Math.round((count / scoredDays.length) * 200), 100),
        });
      }
    }
  }

  scanThemes(EMOTIONAL_THEMES, 'emotional');
  scanThemes(RELATIONAL_THEMES, 'relational');
  scanThemes(EXISTENTIAL_THEMES, 'existential');
  scanThemes(SOMATIC_THEMES, 'somatic');

  return themes.sort((a, b) => b.strength - a.strength).slice(0, 12);
}

// ─────────────────────────────────────────────────────────────────────────────
// Personal truths generation
// ─────────────────────────────────────────────────────────────────────────────

function generatePersonalTruths(
  traits: PersonalTrait[],
  recovery: RecoveryStyle,
  stress: StressPattern,
  themes: InnerTheme[],
  profile: PatternProfile,
): string[] {
  const truths: string[] = [];
  const maturity = detectMaturity(profile.windowDays);

  // Only generate personal truths with enough data
  if (maturity === 'early') return [];

  // From traits (high-confidence ones)
  for (const trait of traits.filter(t => t.strength >= 60)) {
    truths.push(trait.description);
  }

  // From recovery style
  if (recovery.confidence >= 50) {
    const modeDescription: Record<RecoveryStyle['mode'], string> = {
      softness: 'You seem to recover best through quiet, gentleness, and lower-pressure environments.',
      structure: 'You appear to stabilize through routine and structure — predictability helps you reset.',
      connection: 'Feeling supported and understood appears to regulate you more than solitude does.',
      solitude: 'You seem to need solitary, quiet time to genuinely restore — social rest may not be the same for you.',
      movement: 'Physical movement appears to be one of your most effective forms of recovery.',
      mixed: 'Your recovery pattern draws from multiple sources — no single approach dominates.',
    };
    truths.push(modeDescription[recovery.mode]);
  }

  // From stress pattern
  if (stress.confidence >= 50) {
    if (stress.buildupStyle === 'gradual' && stress.responseStyle === 'push-through') {
      truths.push('You tend to keep going well past the point where your system is asking for care. By the time you feel depleted, you may already have been carrying too much for a while.');
    } else if (stress.buildupStyle === 'sudden') {
      truths.push('Stress tends to arrive suddenly for you rather than building gradually. This may mean environmental or relational triggers have outsized impact.');
    }
  }

  // From themes (deep maturity only)
  if (maturity === 'deep' && themes.length >= 3) {
    const topThemeStr = themes.slice(0, 3).map(t => t.theme).join(', ');
    truths.push(`Recurring themes in your reflections include ${topThemeStr}. These form an undercurrent in how you experience your life.`);
  }

  // Composite truths from multiple signals
  const sleepTrait = traits.find(t => t.id === 'sleep-sensitive');
  const connectionTrait = traits.find(t => t.id === 'connection-sensitive');
  if (sleepTrait && sleepTrait.strength >= 50) {
    truths.push('Sleep has a stronger effect on your steadiness than most other tracked factors.');
  }
  if (connectionTrait && connectionTrait.strength >= 50 && recovery.mode === 'connection') {
    truths.push('Feeling understood appears to regulate you more than being productive does. Connection may be closer to a need than a preference for you.');
  }

  // Best-day formula (established+ maturity)
  if ((maturity === 'established' || maturity === 'deep') && profile.bestDayProfile && profile.bestDayProfile.dayCount >= 3) {
    const bp = profile.bestDayProfile;
    const ingredients: string[] = [];
    if (bp.avgSleepQuality != null && bp.avgSleepQuality >= 3.5) ingredients.push('better sleep');
    if (bp.avgStrain < profile.overallAvg.strain - 5) ingredients.push('less strain');
    if (bp.avgRestoration > profile.overallAvg.restoration + 5) ingredients.push('higher restoration');
    if (bp.topTags.length > 0) ingredients.push(...bp.topTags.slice(0, 2).map(t => t.tag.replace(/_/g, ' ')));
    if (ingredients.length >= 2) {
      truths.push(`Your most stable days tend to share common foundations: ${ingredients.join(', ')}. That may be closer to your natural rhythm than you once thought.`);
    }
  }

  // Deduplicate (keep unique truths only)
  return [...new Set(truths)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Today context: anomaly vs pattern vs rough patch
// ─────────────────────────────────────────────────────────────────────────────

function detectTodayContext(profile: PatternProfile): TodayContext {
  const days = profile.scoredDays;
  if (days.length < 3) {
    return { type: 'baseline', description: 'Not enough data yet to distinguish patterns from one-off days.', streakDays: 0 };
  }

  const latest = days[days.length - 1];
  const avg = profile.overallAvg;
  const sd = stdDev(days.map(d => d.scores.stability));

  // How far is today from average?
  const deviation = Math.abs(latest.scores.stability - avg.stability);
  // Guard against zero stdDev (all identical scores) — use absolute threshold as fallback
  const isOff = sd > 0 ? deviation > sd * 1.2 : deviation > 5;

  if (!isOff) {
    return { type: 'baseline', description: 'Today looks roughly in line with your usual range.', streakDays: 0 };
  }

  // Count consecutive similar days
  let streak = 1;
  for (let i = days.length - 2; i >= 0 && i >= days.length - 7; i--) {
    const d = days[i];
    const alsoOff = Math.abs(d.scores.stability - avg.stability) > sd * 0.8;
    const sameDirection = (latest.scores.stability < avg.stability) === (d.scores.stability < avg.stability);
    if (alsoOff && sameDirection) streak++;
    else break;
  }

  if (streak === 1) {
    return {
      type: 'anomaly',
      description: latest.scores.stability < avg.stability
        ? 'Today looks heavier than usual. This may just be a one-off — not everything means something deep.'
        : 'Today looks unusually steady. Enjoy it without needing to explain it.',
      streakDays: 1,
    };
  }

  if (streak <= 4) {
    return {
      type: 'rough-patch',
      description: `The last ${streak} days have been ${latest.scores.stability < avg.stability ? 'harder' : 'steadier'} than your usual. This looks like a short-term shift, not yet a pattern.`,
      streakDays: streak,
    };
  }

  return {
    type: 'pattern',
    description: `This has persisted for ${streak} days. A recurring pattern may be emerging here.`,
    streakDays: streak,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Low-capacity detection
// ─────────────────────────────────────────────────────────────────────────────

function detectLowCapacity(profile: PatternProfile): boolean {
  const days = profile.scoredDays;
  if (days.length === 0) return false;

  const recent = days.slice(-3);
  const avgStrain = mean(recent.map(d => d.scores.strain));
  const avgStab = mean(recent.map(d => d.scores.stability));
  const avgRest = mean(recent.map(d => d.scores.restoration));

  // Low capacity: high strain + low stability, OR very low restoration + low stability
  return (avgStrain > 60 && avgStab < 40) || (avgRest < 25 && avgStab < 35);
}

// ─────────────────────────────────────────────────────────────────────────────
// Strength detection — real strengths, not flattery
// ─────────────────────────────────────────────────────────────────────────────

function detectStrengths(profile: PatternProfile, traits: PersonalTrait[], recoveryStyle: RecoveryStyle): PersonalStrength[] {
  const strengths: PersonalStrength[] = [];
  const days = profile.scoredDays;
  if (days.length < 7) return strengths;

  // Consistency of showing up
  const checkInDensity = days.length / profile.windowDays;
  if (checkInDensity > 0.6) {
    strengths.push({
      id: 'consistent-presence',
      description: 'Your data shows that you keep returning, even through lower stretches. That pattern matters because harder moments are becoming visible instead of disappearing.',
      strength: Math.min(Math.round(checkInDensity * 100), 100),
    });
  }

  // Emotional honesty (high variance + journal entries suggests honest tracking)
  const hasJournalDays = days.filter(d => d.aggregate.hasJournalText).length;
  const emotionVariance = stdDev(days.map(d => d.scores.emotionalIntensity));
  if (hasJournalDays >= 5 && emotionVariance > 15) {
    strengths.push({
      id: 'emotional-honesty',
      description: 'Your reflections suggest emotional honesty is one of your strengths. You don\'t flatten your experience to look good — you track what\'s real.',
      strength: Math.min(Math.round(emotionVariance * 2 + hasJournalDays), 100),
    });
  }

  // Resilience (bouncing back after bad days)
  const resilientTrait = traits.find(t => t.id === 'resilient-recoverer');
  if (resilientTrait && resilientTrait.strength >= 40) {
    strengths.push({
      id: 'resilience',
      description: `You recover ${recoveryStyle.avgRecoveryDays <= 2 ? 'quickly' : 'slowly, but consistently'}. Even after your hardest days, your system finds its way back.`,
      strength: resilientTrait.strength,
    });
  }

  // Perceptiveness (rich journal content, many keywords/emotions tracked)
  const avgKeywords = mean(days.map(d => d.aggregate.keywordsUnion.length));
  const avgEmotions = mean(days.map(d => Object.keys(d.aggregate.journalEmotionCountsTotal).length));
  if (avgKeywords > 2 || avgEmotions > 2) {
    strengths.push({
      id: 'inner-perceptiveness',
      description: 'You seem highly perceptive about your inner world. Your reflections carry more nuance than surface-level tracking.',
      strength: Math.min(Math.round((avgKeywords + avgEmotions) * 15), 100),
    });
  }

  // Connection maintenance
  const connDays = days.filter(d => d.scores.connection > 55).length;
  if (connDays / days.length > 0.5) {
    strengths.push({
      id: 'connection-maintenance',
      description: 'Even when overwhelmed, you remain responsive to connection. That relational awareness is a real strength.',
      strength: Math.min(Math.round((connDays / days.length) * 100), 100),
    });
  }

  return strengths.sort((a, b) => b.strength - a.strength).slice(0, 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// Anticipation — forward-looking signals
// ─────────────────────────────────────────────────────────────────────────────

function detectAnticipations(profile: PatternProfile, stressPattern: StressPattern): Anticipation[] {
  const anticipations: Anticipation[] = [];
  const days = profile.scoredDays;
  if (days.length < 7) return anticipations;

  const recent = days.slice(-5);
  const recentStrain = mean(recent.map(d => d.scores.strain));
  const recentStab = mean(recent.map(d => d.scores.stability));
  const avg = profile.overallAvg;

  // Strain buildup warning
  let strainRising = 0;
  for (let i = days.length - 4; i < days.length - 1; i++) {
    if (i >= 0 && days[i + 1].scores.strain > days[i].scores.strain + 2) strainRising++;
  }
  if (strainRising >= 2 && recentStrain > avg.strain) {
    anticipations.push({
      id: 'strain-building',
      body: 'Your strain has been building over the last few days. That does not mean anything is wrong with you, but it may be a sign that your system is carrying more than usual. Protecting a little extra space right now could help you stay steadier.',
      urgency: recentStrain > avg.strain + 15 ? 'important' : 'notable',
      confidence: Math.min(strainRising * 25 + 20, 85),
    });
  }

  // Sleep-stability risk
  const recentSleep = recent.filter(d => d.aggregate.sleepQuality != null);
  if (recentSleep.length >= 2) {
    const avgSleep = mean(recentSleep.map(d => d.aggregate.sleepQuality ?? 3));
    if (avgSleep < 2.5) {
      anticipations.push({
        id: 'sleep-risk',
        body: 'Sleep has been lower quality lately. Because your system seems fairly sleep-sensitive, this could start showing up in your steadiness soon. It may help to treat rest as support rather than something you have to earn.',
        urgency: avgSleep < 2 ? 'important' : 'gentle',
        confidence: 60,
      });
    }
  }

  // Restoration deficit
  const recentRest = mean(recent.map(d => d.scores.restoration));
  if (recentRest < avg.restoration - 10 && recentStrain > avg.strain) {
    anticipations.push({
      id: 'restoration-deficit',
      body: 'You have had less restoration than usual while strain is still running high. That combination often leaves people feeling depleted after a few days. A small act of replenishment now may matter more than pushing through.',
      urgency: 'notable',
      confidence: 55,
    });
  }

  // Emotional intensity building
  const recentIntensity = mean(recent.map(d => d.scores.emotionalIntensity));
  if (recentIntensity > avg.emotionalIntensity + 10 && recentStab < avg.stability) {
    anticipations.push({
      id: 'intensity-rising',
      body: 'Emotional intensity has been higher than usual while stability looks a little lower. If things have felt crowded inside, the data supports that. This may be a good time to soften expectations and give yourself a little more room.',
      urgency: 'gentle',
      confidence: 50,
    });
  }

  return anticipations;
}

// ─────────────────────────────────────────────────────────────────────────────
// Humane progress markers
// ─────────────────────────────────────────────────────────────────────────────

function detectProgressMarkers(profile: PatternProfile, traits: PersonalTrait[]): ProgressMarker[] {
  const markers: ProgressMarker[] = [];
  const days = profile.scoredDays;
  if (days.length < 14) return markers;

  const half = Math.floor(days.length / 2);
  const earlier = days.slice(0, half);
  const later = days.slice(half);

  // Recovering faster
  function avgRecoveryTime(subset: typeof days): number {
    const gaps: number[] = [];
    for (let i = 0; i < subset.length - 1; i++) {
      if (subset[i].scores.stability < 40) {
        for (let j = i + 1; j < subset.length && j <= i + 7; j++) {
          if (subset[j].scores.stability > mean(subset.map(d => d.scores.stability))) {
            gaps.push(j - i);
            break;
          }
        }
      }
    }
    return gaps.length > 0 ? mean(gaps) : 4;
  }

  const earlyRecovery = avgRecoveryTime(earlier);
  const lateRecovery = avgRecoveryTime(later);
  if (earlyRecovery > lateRecovery + 0.5) {
    markers.push({
      id: 'faster-recovery',
      description: `You appear to be recovering faster from difficult days. Earlier, it took about ${Math.round(earlyRecovery)} days; more recently, closer to ${Math.round(lateRecovery)}.`,
      type: 'recovering',
      strength: Math.min(Math.round((earlyRecovery - lateRecovery) * 30), 100),
    });
  }

  // Fewer extreme swings
  const earlySwings = earlier.filter(d => Math.abs(d.scores.stability - mean(earlier.map(x => x.scores.stability))) > 25).length / earlier.length;
  const lateSwings = later.filter(d => Math.abs(d.scores.stability - mean(later.map(x => x.scores.stability))) > 25).length / later.length;
  if (earlySwings > lateSwings + 0.08) {
    markers.push({
      id: 'fewer-swings',
      description: 'Your emotional swings have narrowed over time. The extreme highs and lows appear less frequently now.',
      type: 'stabilizing',
      strength: Math.min(Math.round((earlySwings - lateSwings) * 200), 100),
    });
  }

  // More honest/detailed journaling
  const earlyJournalRate = earlier.filter(d => d.aggregate.hasJournalText).length / earlier.length;
  const lateJournalRate = later.filter(d => d.aggregate.hasJournalText).length / later.length;
  if (lateJournalRate > earlyJournalRate + 0.1) {
    markers.push({
      id: 'more-reflective',
      description: 'You\'ve been reflecting more frequently over time. That alone is a form of progress — showing up to know yourself better.',
      type: 'honesty',
      strength: Math.min(Math.round((lateJournalRate - earlyJournalRate) * 200), 100),
    });
  }

  // Earlier strain detection (checking in earlier on harder days)
  const earlyHighStrainCheckinHour = earlier
    .filter(d => d.scores.strain > 60 && d.aggregate.checkInTimestamps.length > 0)
    .map(d => {
      const ts = d.aggregate.checkInTimestamps[0];
      return ts ? new Date(ts).getHours() : 12;
    });
  const lateHighStrainCheckinHour = later
    .filter(d => d.scores.strain > 60 && d.aggregate.checkInTimestamps.length > 0)
    .map(d => {
      const ts = d.aggregate.checkInTimestamps[0];
      return ts ? new Date(ts).getHours() : 12;
    });
  if (earlyHighStrainCheckinHour.length >= 3 && lateHighStrainCheckinHour.length >= 3) {
    const earlyAvgHour = mean(earlyHighStrainCheckinHour);
    const lateAvgHour = mean(lateHighStrainCheckinHour);
    if (earlyAvgHour > lateAvgHour + 1) {
      markers.push({
        id: 'earlier-noticing',
        description: 'On harder days, you seem to be checking in earlier than you used to. That suggests you\'re noticing your needs sooner.',
        type: 'noticing',
        strength: Math.min(Math.round((earlyAvgHour - lateAvgHour) * 20), 100),
      });
    }
  }

  // Protecting energy (more restoration on high-strain days lately)
  const earlyStrainRest = earlier.filter(d => d.scores.strain > 55).map(d => d.scores.restoration);
  const lateStrainRest = later.filter(d => d.scores.strain > 55).map(d => d.scores.restoration);
  if (earlyStrainRest.length >= 3 && lateStrainRest.length >= 3) {
    const earlyAvg = mean(earlyStrainRest);
    const lateAvg = mean(lateStrainRest);
    if (lateAvg > earlyAvg + 5) {
      markers.push({
        id: 'protecting-energy',
        description: 'When strain is high, you\'ve been engaging in more restoration recently. You may be learning to protect your energy earlier.',
        type: 'protecting',
        strength: Math.min(Math.round((lateAvg - earlyAvg) * 4), 100),
      });
    }
  }

  return markers.sort((a, b) => b.strength - a.strength);
}

/**
 * Build the complete personal profile from daily aggregates.
 *
 * This creates a living model of the user based on all available data.
 * The profile powers deeper insight generation and evolves as more
 * data accumulates.
 *
 * Pure function — no I/O, no side effects.
 */
export function buildPersonalProfile(aggregates: DailyAggregate[]): PersonalProfile {
  const profile = buildPatternProfile(aggregates);
  const maturity = detectMaturity(profile.windowDays);
  const traits = detectTraits(profile);
  const recoveryStyle = detectRecoveryStyle(profile);
  const stressPattern = detectStressPattern(profile);
  const innerThemes = detectInnerThemes(profile);
  const personalTruths = generatePersonalTruths(traits, recoveryStyle, stressPattern, innerThemes, profile);

  // Compute sensitivity scores
  const withSleep = profile.scoredDays.filter(d => d.aggregate.sleepQuality != null);
  let sleepSensitivity = 50;
  if (withSleep.length >= 5) {
    const good = withSleep.filter(d => (d.aggregate.sleepQuality ?? 0) >= 4);
    const poor = withSleep.filter(d => (d.aggregate.sleepQuality ?? 0) <= 2);
    if (good.length >= 2 && poor.length >= 2) {
      const diff = mean(good.map(d => d.scores.stability)) - mean(poor.map(d => d.scores.stability));
      sleepSensitivity = Math.min(Math.round(diff * 2.5), 100);
    }
  }

  const connected = profile.scoredDays.filter(d => d.scores.connection > 60);
  const disconnected = profile.scoredDays.filter(d => d.scores.connection < 40);
  let connectionSensitivity = 50;
  if (connected.length >= 2 && disconnected.length >= 2) {
    const spread = mean(connected.map(d => d.scores.stability)) - mean(disconnected.map(d => d.scores.stability));
    connectionSensitivity = Math.min(Math.round(spread * 2.5), 100);
  }

  const emotionalRange = stdDev(profile.scoredDays.map(d => d.scores.emotionalIntensity));
  const calmDays = profile.scoredDays.filter(d => d.scores.strain < 40 && d.scores.emotionalIntensity < 50);
  const baselineStability = calmDays.length >= 3 ? mean(calmDays.map(d => d.scores.stability)) : profile.overallAvg.stability;

  // Best day ingredients
  const bestDayIngredients: string[] = [];
  if (profile.bestDayProfile) {
    const bp = profile.bestDayProfile;
    if (bp.avgSleepQuality != null && bp.avgSleepQuality >= 3.5) bestDayIngredients.push('good sleep');
    if (bp.avgRestoration > profile.overallAvg.restoration + 5) bestDayIngredients.push('restoration');
    if (bp.avgStrain < profile.overallAvg.strain - 5) bestDayIngredients.push('low strain');
    bestDayIngredients.push(...bp.topTags.filter(t => t.count >= 2).slice(0, 3).map(t => t.tag.replace(/_/g, ' ')));
  }

  const todayContext = detectTodayContext(profile);
  const isLowCapacity = detectLowCapacity(profile);
  const strengths = detectStrengths(profile, traits, recoveryStyle);
  const anticipations = detectAnticipations(profile, stressPattern);
  const progressMarkers = detectProgressMarkers(profile, traits);

  return {
    maturity,
    totalDays: profile.windowDays,
    traits,
    recoveryStyle,
    stressPattern,
    sleepSensitivity,
    connectionSensitivity,
    emotionalRange: Math.round(emotionalRange),
    baselineStability: Math.round(baselineStability),
    bestDayIngredients,
    innerThemes,
    personalTruths,
    patternProfile: profile,
    todayContext,
    isLowCapacity,
    strengths,
    anticipations,
    progressMarkers,
  };
}
