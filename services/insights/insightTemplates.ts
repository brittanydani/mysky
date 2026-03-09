/**
 * Insight Templates
 *
 * Converts scored PatternCandidates into elegant human-readable insight text.
 * Language confidence tracks the tier:
 *
 *   strong   → firm, declarative: "Movement consistently appears on your highest-mood days."
 *   medium   → softened: "Movement may be one of your strongest restorative anchors."
 *   emerging → reflective: "You often mention boundaries on days that feel heavier."
 *
 * Each output is a PatternInsight — a self-contained card ready for display.
 *
 * Pure functions — no I/O, no side effects.
 */

import type { PatternCandidate } from './patternCandidates';
import { scoreTier, type InsightTier } from './patternScoring';

// ─────────────────────────────────────────────────────────────────────────────
// Output types
// ─────────────────────────────────────────────────────────────────────────────

export type InsightCategory =
  | 'regulation'    // sleep, energy, mood relationships
  | 'trigger'       // tags/events associated with drops
  | 'restoration'   // things that improve mood
  | 'relationship'  // person impact patterns
  | 'subconscious'  // dream correlations
  | 'theme'         // text/keyword patterns and co-occurrences
  | 'self_awareness'; // sentiment mismatch, state correlations

export interface PatternInsight {
  /** Unique candidate ID, carried through for deduplication */
  id: string;
  /** Human-readable category label */
  category: InsightCategory;
  /** Primary display sentence */
  observation: string;
  /** Supporting pattern description */
  pattern: string;
  /** Interpretive meaning */
  meaning: string;
  /** Full combined text for single-line display */
  fullText: string;
  /** Tier determines language confidence */
  tier: InsightTier;
  /** Score for ranking */
  finalScore: number;
  /** Supporting data count, for rendering optional badge */
  supportCount: number;
  /** Direction shorthand for colour/icon coding */
  direction: 'restorative' | 'draining' | 'neutral';

  // Debug / traceability (not shown in UI)
  subjectLabel: string;
  relatedSubjectLabel?: string;
  patternType: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Human display label for a raw tag/keyword key */
const DISPLAY_LABELS: Record<string, string> = {
  movement: 'Movement',
  screens: 'Screens',
  work: 'Work',
  finances: 'Finances',
  family: 'Family',
  relationships: 'Relationships',
  boundaries: 'Boundaries',
  anxiety: 'Anxiety',
  exhaustion: 'Exhaustion',
  overwhelm: 'Overwhelm',
  grief: 'Grief',
  joy: 'Joy',
  clarity: 'Clarity',
  confusion: 'Confusion',
  rest: 'Rest',
  creativity: 'Creativity',
  connection: 'Connection',
  loneliness: 'Loneliness',
  pressure: 'Pressure',
  hope: 'Hope',
  shame: 'Shame',
  fear: 'Fear',
  sadness: 'Sadness',
  anger: 'Anger',
  nature: 'Nature',
  social: 'Social',
  conflict: 'Conflict',
  sleep: 'Sleep',
  intimacy: 'Intimacy',
  health: 'Health',
  career: 'Career',
  food: 'Food',
  hormones: 'Hormones',
  productivity: 'Productivity',
  travel: 'Travel',
  weather: 'Weather',
  routine: 'Routine',
  alone_time: 'Time alone',
  overstimulated: 'Overstimulation',
  kids: 'Kids',
  substances: 'Substances',
  // Dream symbols
  water: 'Water imagery',
  house: 'House imagery',
  running: 'Being chased / running',
  falling: 'Falling',
  flying: 'Flying',
  death: 'Death imagery',
  animals: 'Animal imagery',
  darkness: 'Darkness',
  people: 'Unknown people',
  light: 'Light imagery',
  school: 'School settings',
  violence: 'Violence / conflict',
  // Persons
  mother: 'your mother',
  father: 'your father',
  partner: 'your partner',
  sibling: 'your sibling',
  boss: 'your boss',
  colleague: 'a colleague',
  // State labels
  sleep_hours: 'sleep duration',
  sleep_quality: 'sleep quality',
  mood: 'mood',
  energy: 'energy',
  stress: 'stress',
  mood_vs_language: 'what you write vs. how you score',
};

function displayLabel(key: string): string {
  return DISPLAY_LABELS[key] ?? capitalize(key.replace(/_/g, ' '));
}

/** Format a mood delta as "+1.3" or "−0.9" */
function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '−';
  return `${sign}${Math.abs(delta).toFixed(1)}`;
}

/** formatPercent: 0.74 → "74%" */
function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Language confidence bands
// ─────────────────────────────────────────────────────────────────────────────

interface VerbSet {
  appears: string;
  seems: string;
  correlates: string;
  associated: string;
}

const VERB_SETS: Record<InsightTier, VerbSet> = {
  strong: {
    appears: 'consistently appears',
    seems: 'is',
    correlates: 'consistently correlates',
    associated: 'is strongly associated',
  },
  medium: {
    appears: 'often appears',
    seems: 'may be',
    correlates: 'tends to correlate',
    associated: 'appears associated',
  },
  emerging: {
    appears: 'often appears',
    seems: 'may be',
    correlates: 'seems to connect',
    associated: 'is sometimes associated',
  },
  discard: {
    appears: 'appears',
    seems: 'might be',
    correlates: 'may connect',
    associated: 'may be associated',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Template functions per pattern type
// ─────────────────────────────────────────────────────────────────────────────

function templateTagEffect(c: PatternCandidate, tier: InsightTier): Omit<PatternInsight, 'id' | 'tier' | 'finalScore' | 'supportCount' | 'patternType'> {
  const p = c.payload;
  const v = VERB_SETS[tier];
  const label = displayLabel(c.subject);
  const dir = p.direction ?? 'neutral';
  const delta = (p.avgMoodOnSubjectDays ?? 5) - (p.overallMoodAvg ?? 5);
  const absDelta = Math.abs(delta).toFixed(1);
  const rateHigh = pct(p.rateOnHighMoodDays ?? 0);
  const category: InsightCategory = dir === 'restorative' ? 'restoration' : dir === 'draining' ? 'trigger' : 'theme';

  let observation: string;
  let pattern: string;
  let meaning: string;

  if (dir === 'restorative') {
    observation = `${label} ${v.appears} on your highest-mood days.`;
    pattern = `Days with ${label.toLowerCase()} show an average mood ${formatDelta(delta)} points above baseline. It's present on ${rateHigh} of your best days.`;
    meaning = tier === 'strong'
      ? `${label} ${v.seems} one of your strongest restorative anchors.`
      : `${label} ${v.seems} a meaningful contributor to your better days — worth protecting.`;
  } else if (dir === 'draining') {
    observation = `${label} ${v.appears} on days when your mood dips.`;
    pattern = `Days with ${label.toLowerCase()} average ${absDelta} mood points below baseline. It's present on ${pct(p.rateOnLowMoodDays ?? 0)} of your lowest-mood days.`;
    meaning = tier === 'strong'
      ? `${label} ${v.seems} a consistent emotional drain — not just occasionally, but systematically.`
      : `When ${label.toLowerCase()} shows up, your mood tends to be lower. This pattern is worth noticing.`;
  } else {
    observation = `${label} shows up with ${c.supportCount} days of data.`;
    pattern = `It's present on about ${pct((p.baselineRate ?? 0))} of days overall, with a small ${formatDelta(delta)} mood difference.`;
    meaning = `This may be background noise, or it may sharpen with more data.`;
  }

  const fullText = `${observation} ${meaning}`;

  return {
    category,
    observation,
    pattern,
    meaning,
    fullText,
    direction: dir === 'neutral' ? 'neutral' : dir,
    subjectLabel: label,
  };
}

function templateKeywordEffect(c: PatternCandidate, tier: InsightTier): Omit<PatternInsight, 'id' | 'tier' | 'finalScore' | 'supportCount' | 'patternType'> {
  const p = c.payload;
  const v = VERB_SETS[tier];
  const label = displayLabel(c.subject);
  const dir = p.direction ?? 'neutral';
  const delta = (p.avgMoodOnSubjectDays ?? 5) - (p.overallMoodAvg ?? 5);
  const category: InsightCategory = dir === 'restorative' ? 'restoration' : dir === 'draining' ? 'trigger' : 'theme';

  let observation: string;
  let pattern: string;
  let meaning: string;

  if (dir === 'draining') {
    observation = `"${label}" ${v.appears} in your writing on harder days.`;
    pattern = `Journal entries mentioning ${label.toLowerCase()} average ${Math.abs(delta).toFixed(1)} mood points below your baseline. It appears on ${pct(p.rateOnLowMoodDays ?? 0)} of your lowest-mood days.`;
    meaning = tier === 'strong'
      ? `This theme ${v.seems} reliably present during emotionally difficult periods.`
      : `This theme may signal emotional weight when it appears in your writing.`;
  } else if (dir === 'restorative') {
    observation = `"${label}" ${v.appears} in your writing on better days.`;
    pattern = `Journal entries with this theme average ${delta.toFixed(1)} mood points above baseline.`;
    meaning = `When you write about ${label.toLowerCase()}, your days tend to look brighter.`;
  } else {
    observation = `"${label}" is a recurring theme in your journal entries.`;
    pattern = `It appears across ${c.supportCount} journal days with a neutral mood pattern.`;
    meaning = `This may be a consistent throughline in your inner narrative, even without a strong mood signal.`;
  }

  return {
    category,
    observation,
    pattern,
    meaning,
    fullText: `${observation} ${meaning}`,
    direction: dir === 'neutral' ? 'neutral' : dir,
    subjectLabel: label,
  };
}

function templatePersonEffect(c: PatternCandidate, tier: InsightTier): Omit<PatternInsight, 'id' | 'tier' | 'finalScore' | 'supportCount' | 'patternType'> {
  const p = c.payload;
  const v = VERB_SETS[tier];
  const name = displayLabel(c.subject);
  const dir = p.direction ?? 'neutral';
  const moodDelta = (p.avgMoodOnSubjectDays ?? 5) - (p.overallMoodAvg ?? 5);
  const stressDelta = (p.avgStressOnSubjectDays ?? 5) - (p.overallStressAvg ?? 5);

  let observation: string;
  let pattern: string;
  let meaning: string;

  if (dir === 'restorative') {
    observation = `Days when you mention ${name} tend to have a more positive tone.`;
    pattern = `Mood averages ${formatDelta(moodDelta)} points above baseline, with ${stressDelta < 0 ? 'lower' : 'similar'} stress levels.`;
    meaning = tier === 'strong'
      ? `${capitalize(name)} ${v.associated} with emotional stability in your patterns.`
      : `Your data suggests ${name} ${v.seems} a regulating presence in your life.`;
  } else if (dir === 'draining') {
    observation = `Days when you mention ${name} often carry more emotional weight.`;
    pattern = `Mood averages ${Math.abs(moodDelta).toFixed(1)} points below baseline${stressDelta > 0.5 ? `, with elevated stress (+${stressDelta.toFixed(1)})` : ''}.`;
    meaning = tier === 'strong'
      ? `Entries mentioning ${name} ${v.correlates} with lower mood and${stressDelta > 0 ? ' higher stress' : ' emotional heaviness'}.`
      : `${capitalize(name)} ${v.appears} in your journal during heavier periods. This doesn't assign blame — it may reflect what's unresolved.`;
  } else {
    observation = `You mention ${name} across ${c.supportCount} entries.`;
    pattern = `Mood and energy on these days are close to your personal average.`;
    meaning = `The pattern is neutral so far — more data may reveal a clearer signal.`;
  }

  return {
    category: 'relationship' as InsightCategory,
    observation,
    pattern,
    meaning,
    fullText: `${observation} ${meaning}`,
    direction: dir === 'neutral' ? 'neutral' : dir,
    subjectLabel: name,
  };
}

function templateDreamWakingLink(c: PatternCandidate, tier: InsightTier): Omit<PatternInsight, 'id' | 'tier' | 'finalScore' | 'supportCount' | 'patternType'> {
  const p = c.payload;
  const v = VERB_SETS[tier];
  const symbol = displayLabel(c.subject);
  const wakingTheme = displayLabel(c.relatedSubject ?? '');
  const overlapPct = pct(p.overlapRatio ?? 0);

  const observation = `${symbol} ${v.appears} in your dreams during periods when waking entries mention ${wakingTheme.toLowerCase()}.`;
  const pattern = `${overlapPct} of nights with ${symbol.toLowerCase()} had same-day or next-day ${wakingTheme.toLowerCase()} in waking records.`;
  const meaning = tier === 'strong'
    ? `Your subconscious imagery and waking experience appear to be processing the same material.`
    : `This may reflect a thread running between your dream life and waking emotional state worth exploring.`;

  return {
    category: 'subconscious' as InsightCategory,
    observation,
    pattern,
    meaning,
    fullText: `${observation} ${meaning}`,
    direction: 'neutral',
    subjectLabel: symbol,
    relatedSubjectLabel: wakingTheme,
  };
}

function templateSleepImpact(c: PatternCandidate, tier: InsightTier): Omit<PatternInsight, 'id' | 'tier' | 'finalScore' | 'supportCount' | 'patternType'> {
  const p = c.payload;
  const v = VERB_SETS[tier];
  const isDuration = c.subject === 'sleep_hours';
  const moodDiff = ((p.avgNextDayMoodAfterCondition ?? 5) - (p.avgNextDayMoodBaseline ?? 5));
  const absDiff = Math.abs(moodDiff).toFixed(1);

  const sleepLabel = isDuration ? 'fewer than six hours of sleep' : 'poor-quality sleep';
  const observation = `Nights with ${sleepLabel} are often followed by lower mood the next day.`;
  const pattern = `Next-day mood after ${sleepLabel} averages ${absDiff} points below nights with better rest.`;
  const meaning = tier === 'strong'
    ? `Sleep ${v.seems} one of the strongest predictors of your next-day emotional baseline.`
    : `Your data suggests ${isDuration ? 'sleep duration' : 'sleep quality'} ${v.correlates} noticeably with how you feel the following day.`;

  return {
    category: 'regulation' as InsightCategory,
    observation,
    pattern,
    meaning,
    fullText: `${observation} ${meaning}`,
    direction: 'draining',
    subjectLabel: displayLabel(c.subject),
  };
}

function templateStateCorrelation(c: PatternCandidate, tier: InsightTier): Omit<PatternInsight, 'id' | 'tier' | 'finalScore' | 'supportCount' | 'patternType'> {
  const p = c.payload;
  const r = p.correlation ?? 0;
  const isPositive = r > 0;
  const isInverse = r < 0;

  const a = displayLabel(c.subject);
  const b = displayLabel(c.relatedSubject ?? '');
  const strength = Math.abs(r) >= 0.6 ? 'strongly' : 'often';

  let observation: string;
  let meaning: string;

  if (c.subject === 'mood' && c.relatedSubject === 'energy') {
    if (isInverse) {
      observation = `Your energy ${strength} rises when your mood drops.`;
      meaning = `This pattern may reflect activation without emotional ease — a signal of anxiety or stress mobilization.`;
    } else {
      observation = `Your mood and energy ${strength} move together.`;
      meaning = `When one lifts, the other tends to as well — they reinforce each other in your system.`;
    }
  } else if (c.subject === 'mood' && c.relatedSubject === 'stress') {
    observation = `Your mood and stress ${strength} move ${isInverse ? 'inversely' : 'together'}.`;
    meaning = isInverse
      ? `Higher stress consistently accompanies lower mood — these two signals track the same underlying state.`
      : `Your mood and stress unexpectedly move together, which may reflect energized tension or excitement.`;
  } else if (c.subject === 'sleep_hours') {
    observation = `Your ${b} ${strength} reflects how you slept.`;
    meaning = `Sleep duration ${tier === 'strong' ? 'is' : 'appears to be'} a meaningful driver of how you feel the next day.`;
  } else {
    observation = `${a} and ${b} ${strength} move ${isPositive ? 'together' : 'in opposite directions'} in your data.`;
    meaning = `This relationship has emerged consistently across your check-ins.`;
  }

  const pattern = `Correlation r = ${r.toFixed(2)} across ${c.supportCount} paired days.`;

  return {
    category: 'regulation' as InsightCategory,
    observation,
    pattern,
    meaning,
    fullText: `${observation} ${meaning}`,
    direction: isInverse && (c.subject === 'mood') ? 'draining' : 'neutral',
    subjectLabel: a,
    relatedSubjectLabel: b,
  };
}

function templateSentimentMismatch(c: PatternCandidate, tier: InsightTier): Omit<PatternInsight, 'id' | 'tier' | 'finalScore' | 'supportCount' | 'patternType'> {
  const p = c.payload;
  const v = VERB_SETS[tier];
  const mismatchPct = pct(p.baselineRate ?? 0);

  const observation = `Your written language and your mood scores ${v.appears} to tell different stories.`;
  const pattern = `On ${mismatchPct} of your journal days, your mood score is elevated while your writing carries a more negative tone.`;
  const meaning = tier === 'strong'
    ? `This pattern ${v.correlates} with emotional masking or overextension — presenting better than you feel.`
    : `This ${v.seems} worth noticing. Writing reveals what scores sometimes don't.`;

  return {
    category: 'self_awareness' as InsightCategory,
    observation,
    pattern,
    meaning,
    fullText: `${observation} ${meaning}`,
    direction: 'neutral',
    subjectLabel: 'Mood vs. language',
  };
}

function templateCoOccurrence(c: PatternCandidate, tier: InsightTier): Omit<PatternInsight, 'id' | 'tier' | 'finalScore' | 'supportCount' | 'patternType'> {
  const p = c.payload;
  const v = VERB_SETS[tier];
  const a = displayLabel(c.subject);
  const b = displayLabel(c.relatedSubject ?? '');
  const dir = p.direction ?? 'neutral';
  const liftStr = p.pairLift ? `×${p.pairLift.toFixed(1)} more likely` : 'frequently';

  const observation = `"${a}" and "${b}" ${v.appears} together in your entries.`;
  const pattern = `These themes co-occur ${liftStr} than you'd expect by chance, across ${c.supportCount} days.`;

  let meaning: string;
  if (dir === 'draining') {
    meaning = `When both appear, your days tend to be heavier. This may be a recognizable emotional cluster worth examining.`;
  } else {
    meaning = tier === 'strong'
      ? `These themes are linked in your experience — they may be part of the same underlying pattern.`
      : `This pair shows up together often enough to be meaningful rather than random.`;
  }

  return {
    category: 'theme' as InsightCategory,
    observation,
    pattern,
    meaning,
    fullText: `${observation} ${meaning}`,
    direction: dir === 'neutral' ? 'neutral' : dir,
    subjectLabel: a,
    relatedSubjectLabel: b,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main: convert a scored candidate into a PatternInsight
// ─────────────────────────────────────────────────────────────────────────────

export function candidateToInsight(candidate: PatternCandidate): PatternInsight | null {
  const tier = scoreTier(candidate.finalScore ?? 0);
  if (tier === 'discard') return null;

  let parts: Omit<PatternInsight, 'id' | 'tier' | 'finalScore' | 'supportCount' | 'patternType'>;

  switch (candidate.type) {
    case 'tag_effect':
      parts = templateTagEffect(candidate, tier);
      break;
    case 'keyword_effect':
      parts = templateKeywordEffect(candidate, tier);
      break;
    case 'person_effect':
      parts = templatePersonEffect(candidate, tier);
      break;
    case 'dream_waking_link':
      parts = templateDreamWakingLink(candidate, tier);
      break;
    case 'sleep_impact':
      parts = templateSleepImpact(candidate, tier);
      break;
    case 'state_correlation':
      parts = templateStateCorrelation(candidate, tier);
      break;
    case 'sentiment_mismatch':
      parts = templateSentimentMismatch(candidate, tier);
      break;
    case 'co_occurrence':
      parts = templateCoOccurrence(candidate, tier);
      break;
    default:
      return null;
  }

  return {
    id: candidate.id,
    tier,
    finalScore: candidate.finalScore ?? 0,
    supportCount: candidate.supportCount,
    patternType: candidate.type,
    ...parts,
  };
}

/**
 * Convert all scored candidates to insights, filtering nulls.
 */
export function candidatesToInsights(candidates: PatternCandidate[]): PatternInsight[] {
  return candidates
    .map(candidateToInsight)
    .filter((i): i is PatternInsight => i !== null);
}
