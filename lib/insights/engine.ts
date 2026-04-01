// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyCheckIn {
  date: string;
  mood: number;
  energy: number;
  stress: number;
  sleepQuality: number;
  sleepHours: number;
  connection: number;
  overwhelm: number;
  emotions: string[];
  tags: string[];
  journalText: string;
  dreamLogged: boolean;
  dreamText?: string;
}

export interface NormalizedScores {
  moodScore: number;
  energyScore: number;
  stressScore: number;
  inverseStressScore: number;
  sleepQualityScore: number;
  sleepHoursScore: number;
  connectionScore: number;
  overwhelmScore: number;
  inverseOverwhelmScore: number;
}

export interface DerivedScores {
  stabilityScore: number;
  restorationScore: number;
  strainScore: number;
}

export interface DailyDerivedScores {
  normalized: NormalizedScores;
  derived: DerivedScores;
}

export interface JournalSignals {
  heaviness: number;
  overwhelm: number;
  restorationNeed: number;
  connection: number;
  hope: number;
}

export interface DreamThemeResult {
  themes: Record<string, number>;
  undercurrent: string;
  intensity: number;
}

export interface SleepMoodResult {
  hasEnoughData: boolean;
  effectSize: number;
  relationship: string;
  strength: string;
}

export interface PatternResult {
  hasEnoughData: boolean;
  commonFactors: Record<string, boolean>;
}

export interface InsightCard {
  type: string;
  title: string;
  body: string;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

export function scaleTo100(value: number, min: number, max: number): number {
  const scaled = ((value - min) / (max - min)) * 100;
  return Math.round(Math.min(100, Math.max(0, scaled)));
}

export function inverseScaleTo100(value: number, min: number, max: number): number {
  return 100 - scaleTo100(value, min, max);
}

// ---------------------------------------------------------------------------
// Composite score helpers (exported for direct-weight tests)
// ---------------------------------------------------------------------------

export function computeStabilityScore(input: {
  moodScore: number;
  energyScore: number;
  sleepQualityScore: number;
  inverseStressScore: number;
  inverseOverwhelmScore: number;
}): number {
  // Mood 0.30, Energy 0.20, Sleep 0.20, InvStress 0.20, InvOverwhelm 0.10
  const raw =
    input.moodScore * 0.3 +
    input.energyScore * 0.2 +
    input.sleepQualityScore * 0.2 +
    input.inverseStressScore * 0.2 +
    input.inverseOverwhelmScore * 0.1;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function computeRestorationScore(input: {
  sleepQualityScore: number;
  sleepHoursScore: number;
  energyScore: number;
  inverseStressScore: number;
  connectionScore: number;
}): number {
  // SleepQuality 0.30, SleepHours 0.20, Energy 0.20, InvStress 0.15, Connection 0.15
  const raw =
    input.sleepQualityScore * 0.3 +
    input.sleepHoursScore * 0.2 +
    input.energyScore * 0.2 +
    input.inverseStressScore * 0.15 +
    input.connectionScore * 0.15;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function computeStrainScore(input: {
  stressScore: number;
  overwhelmScore: number;
  energyScore: number;
  sleepQualityScore: number;
}): number {
  // Higher stress/overwhelm + lower energy/sleep = more strain
  // We use raw stress & overwhelm (not inverse) plus inverse of energy & sleep
  const raw =
    input.stressScore * 0.3 +
    input.overwhelmScore * 0.3 +
    (100 - input.energyScore) * 0.2 +
    (100 - input.sleepQualityScore) * 0.2;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

// ---------------------------------------------------------------------------
// Daily score computation
// ---------------------------------------------------------------------------

export function computeDailyScores(day: DailyCheckIn): DailyDerivedScores {
  const moodScore = scaleTo100(day.mood, 1, 5);
  const energyScore = scaleTo100(day.energy, 1, 5);
  const stressScore = scaleTo100(day.stress, 1, 5);
  const inverseStressScore = inverseScaleTo100(day.stress, 1, 5);
  const sleepQualityScore = scaleTo100(day.sleepQuality, 1, 5);
  const sleepHoursScore = scaleTo100(day.sleepHours, 4, 10);
  const connectionScore = scaleTo100(day.connection, 1, 5);
  const overwhelmScore = scaleTo100(day.overwhelm, 1, 5);
  const inverseOverwhelmScore = inverseScaleTo100(day.overwhelm, 1, 5);

  const normalized: NormalizedScores = {
    moodScore,
    energyScore,
    stressScore,
    inverseStressScore,
    sleepQualityScore,
    sleepHoursScore,
    connectionScore,
    overwhelmScore,
    inverseOverwhelmScore,
  };

  const stabilityScore = computeStabilityScore({
    moodScore,
    energyScore,
    sleepQualityScore,
    inverseStressScore,
    inverseOverwhelmScore,
  });

  const restorationScore = computeRestorationScore({
    sleepQualityScore,
    sleepHoursScore,
    energyScore,
    inverseStressScore,
    connectionScore,
  });

  const strainScore = computeStrainScore({
    stressScore,
    overwhelmScore,
    energyScore,
    sleepQualityScore,
  });

  return {
    normalized,
    derived: { stabilityScore, restorationScore, strainScore },
  };
}

// ---------------------------------------------------------------------------
// Trend & volatility
// ---------------------------------------------------------------------------

export function computeTrendDirection(
  recent: number,
  previous: number
): 'improving' | 'declining' | 'steady' {
  const diff = recent - previous;
  if (diff >= 8) return 'improving';
  if (diff <= -8) return 'declining';
  return 'steady';
}

export function computeVolatility(values: number[]): number {
  if (values.length < 2) return 0;
  const diffs = values.slice(1).map((v, i) => Math.abs(v - values[i]));
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return Math.round(mean);
}

// ---------------------------------------------------------------------------
// Journal signal extraction
// ---------------------------------------------------------------------------

const HEAVINESS_WORDS = ['heavy', 'weighed down', 'drained', 'exhausted', 'numb', 'dark', 'sinking'];
const OVERWHELM_WORDS = ['overwhelmed', 'stretched thin', 'too much', 'drowning', 'overloaded', 'crushed'];
const RESTORATION_WORDS = ['quiet', 'space', 'rest', 'relief', 'break', 'alone time', 'solitude', 'recharge'];
const CONNECTION_WORDS = ['supported', 'close', 'loved', 'connected', 'together', 'held', 'understood', 'seen'];
const HOPE_WORDS = ['hopeful', 'calmer', 'lighter', 'grateful', 'optimistic', 'looking forward', 'better'];

function countMatches(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  return words.filter((w) => lower.includes(w)).length;
}

export function extractJournalSignals(text: string): JournalSignals {
  if (!text || text.trim().length === 0) {
    return { heaviness: 0, overwhelm: 0, restorationNeed: 0, connection: 0, hope: 0 };
  }

  const normalize = (count: number, total: number) =>
    total === 0 ? 0 : Math.min(1, count / Math.max(total, 1));

  const heaviness = normalize(countMatches(text, HEAVINESS_WORDS), HEAVINESS_WORDS.length);
  const overwhelm = normalize(countMatches(text, OVERWHELM_WORDS), OVERWHELM_WORDS.length);
  const restorationNeed = normalize(countMatches(text, RESTORATION_WORDS), RESTORATION_WORDS.length);
  const connection = normalize(countMatches(text, CONNECTION_WORDS), CONNECTION_WORDS.length);
  const hope = normalize(countMatches(text, HOPE_WORDS), HOPE_WORDS.length);

  return { heaviness, overwhelm, restorationNeed, connection, hope };
}

// ---------------------------------------------------------------------------
// Dream theme analysis
// ---------------------------------------------------------------------------

const DREAM_THEMES: Record<string, string[]> = {
  lost: ['lost', 'could not find', 'wandering', 'searching', 'turned around', 'no direction', 'trying to get somewhere'],
  pursuit: ['chasing', 'chased', 'running', 'hiding', 'escape', 'escaping', 'fleeing', 'get away'],
  falling: ['falling', 'dropped', 'plummeting', 'slipping'],
  water: ['water', 'ocean', 'flood', 'drowning', 'swimming', 'waves'],
  flying: ['flying', 'floating', 'soaring', 'above'],
};

const DREAM_UNDERCURRENTS: Record<string, string> = {
  lost: 'Searching and uncertainty',
  pursuit: 'Tension and self-protection',
  falling: 'Loss of control',
  water: 'Emotional depth',
  flying: 'Freedom and aspiration',
};

export function analyzeDreamThemes(text: string): DreamThemeResult {
  const lower = text.toLowerCase();
  const themes: Record<string, number> = {};
  let topTheme = '';
  let topScore = 0;

  for (const [theme, words] of Object.entries(DREAM_THEMES)) {
    const matches = words.filter((w) => lower.includes(w)).length;
    const score = Math.min(1, matches / Math.max(2, words.length * 0.4));
    themes[theme] = score;
    if (score > topScore) {
      topScore = score;
      topTheme = theme;
    }
  }

  const undercurrent = topTheme ? DREAM_UNDERCURRENTS[topTheme] : 'No clear undercurrent';
  const intensity = topScore;

  return { themes, undercurrent, intensity };
}

// ---------------------------------------------------------------------------
// Sleep–mood relationship
// ---------------------------------------------------------------------------

const MIN_DATA_POINTS = 5;

export function analyzeSleepMoodRelationship(days: DailyCheckIn[]): SleepMoodResult {
  if (days.length < MIN_DATA_POINTS) {
    return { hasEnoughData: false, effectSize: 0, relationship: 'unknown', strength: 'insufficient_data' };
  }

  const median = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const sleepMedian = median(days.map((d) => d.sleepQuality));
  const goodSleep = days.filter((d) => d.sleepQuality >= sleepMedian + 1);
  const poorSleep = days.filter((d) => d.sleepQuality <= sleepMedian - 1);

  if (goodSleep.length < 2 || poorSleep.length < 2) {
    return { hasEnoughData: false, effectSize: 0, relationship: 'unknown', strength: 'insufficient_data' };
  }

  const avgMood = (arr: DailyCheckIn[]) => arr.reduce((s, d) => s + d.mood, 0) / arr.length;
  const goodMood = avgMood(goodSleep);
  const poorMood = avgMood(poorSleep);
  const effectSize = scaleTo100(goodMood, 1, 5) - scaleTo100(poorMood, 1, 5);

  const relationship = effectSize > 0 ? 'positive' : effectSize < 0 ? 'negative' : 'none';
  const absEffect = Math.abs(effectSize);
  const strength = absEffect >= 30 ? 'strong' : absEffect >= 15 ? 'moderate' : 'weak';

  return { hasEnoughData: true, effectSize: absEffect, relationship, strength };
}

// ---------------------------------------------------------------------------
// Best-day / hard-day pattern detection
// ---------------------------------------------------------------------------

export function detectBestDayPatterns(days: DailyCheckIn[]): PatternResult {
  if (days.length < 5) {
    return { hasEnoughData: false, commonFactors: {} };
  }

  const scored = days.map((d) => ({ day: d, score: computeDailyScores(d).derived.stabilityScore }));
  scored.sort((a, b) => b.score - a.score);

  const topN = Math.max(2, Math.floor(days.length * 0.3));
  const best = scored.slice(0, topN).map((s) => s.day);
  const rest = scored.slice(topN).map((s) => s.day);

  const avg = (arr: DailyCheckIn[], fn: (d: DailyCheckIn) => number) =>
    arr.reduce((s, d) => s + fn(d), 0) / arr.length;

  return {
    hasEnoughData: true,
    commonFactors: {
      sleepQualityHigher: avg(best, (d) => d.sleepQuality) > avg(rest, (d) => d.sleepQuality) + 0.3,
      stressLower: avg(best, (d) => d.stress) < avg(rest, (d) => d.stress) - 0.3,
      connectionHigher: avg(best, (d) => d.connection) > avg(rest, (d) => d.connection) + 0.3,
      energyHigher: avg(best, (d) => d.energy) > avg(rest, (d) => d.energy) + 0.3,
    },
  };
}

export function detectHardDayPatterns(days: DailyCheckIn[]): PatternResult {
  if (days.length < 5) {
    return { hasEnoughData: false, commonFactors: {} };
  }

  const scored = days.map((d) => ({ day: d, score: computeDailyScores(d).derived.strainScore }));
  scored.sort((a, b) => b.score - a.score);

  const topN = Math.max(2, Math.floor(days.length * 0.3));
  const hard = scored.slice(0, topN).map((s) => s.day);
  const rest = scored.slice(topN).map((s) => s.day);

  const avg = (arr: DailyCheckIn[], fn: (d: DailyCheckIn) => number) =>
    arr.reduce((s, d) => s + fn(d), 0) / arr.length;

  return {
    hasEnoughData: true,
    commonFactors: {
      lowSleep: avg(hard, (d) => d.sleepQuality) < avg(rest, (d) => d.sleepQuality) - 0.3,
      highStress: avg(hard, (d) => d.stress) > avg(rest, (d) => d.stress) + 0.3,
      lowEnergy: avg(hard, (d) => d.energy) < avg(rest, (d) => d.energy) - 0.3,
      highOverwhelm: avg(hard, (d) => d.overwhelm) > avg(rest, (d) => d.overwhelm) + 0.3,
    },
  };
}

// ---------------------------------------------------------------------------
// Confidence scoring
// ---------------------------------------------------------------------------

export function computeInsightConfidence(input: {
  dataCoverageScore: number;
  effectSizeScore: number;
  consistencyScore: number;
  recencyScore: number;
}): number {
  // Coverage weighted heavily to penalize sparse data
  const raw =
    input.dataCoverageScore * 0.35 +
    input.effectSizeScore * 0.25 +
    input.consistencyScore * 0.25 +
    input.recencyScore * 0.15;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

// ---------------------------------------------------------------------------
// Insight card generation
// ---------------------------------------------------------------------------

export function buildInsightCards(input: { days: DailyCheckIn[] }): InsightCard[] {
  const { days } = input;
  const cards: InsightCard[] = [];
  const usedTypes = new Set<string>();

  const addCard = (card: InsightCard) => {
    if (usedTypes.has(card.type)) return;
    usedTypes.add(card.type);
    cards.push(card);
  };

  // Sleep connection card
  buildSleepCard(days, addCard);

  // Best-day pattern card
  buildBestDayCard(days, addCard);

  // Hard-day pattern card
  buildHardDayCard(days, addCard);

  // Emerging theme from journals
  buildEmergingThemeCard(days, addCard);

  // Dream theme card
  buildDreamThemeCard(days, addCard);

  return cards.slice(0, 6);
}

function buildSleepCard(days: DailyCheckIn[], addCard: (card: InsightCard) => void): void {
  const result = analyzeSleepMoodRelationship(days);
  if (!result.hasEnoughData) return;

  const confidence = computeInsightConfidence({
    dataCoverageScore: Math.min(100, days.length * 12),
    effectSizeScore: Math.min(100, result.effectSize * 2),
    consistencyScore: result.strength === 'strong' ? 85 : result.strength === 'moderate' ? 60 : 30,
    recencyScore: 80,
  });

  if (confidence < 40) return;

  let body: string;
  if (confidence >= 70) {
    body = `On days with better sleep quality, your mood and energy tend to follow — a ${result.strength} ${result.relationship} relationship with a ${result.effectSize}-point effect. Restful sleep appears to be one of the steadiest foundations for your stronger days.`;
  } else {
    body = `There seems to be a ${result.strength} connection between your sleep quality and how your days feel (${result.effectSize}-point difference). It may be worth noticing how restful sleep appears to shape your mood.`;
  }

  addCard({
    type: 'sleep_connection',
    title: 'Sleep & Your Days',
    body,
    confidence,
  });
}

function buildBestDayCard(days: DailyCheckIn[], addCard: (card: InsightCard) => void): void {
  const result = detectBestDayPatterns(days);
  if (!result.hasEnoughData) return;

  const factors: string[] = [];
  if (result.commonFactors.sleepQualityHigher) factors.push('sleep');
  if (result.commonFactors.stressLower) factors.push('lower stress');
  if (result.commonFactors.connectionHigher) factors.push('connection');
  if (result.commonFactors.energyHigher) factors.push('higher energy');

  if (factors.length === 0) return;

  const confidence = computeInsightConfidence({
    dataCoverageScore: Math.min(100, days.length * 10),
    effectSizeScore: factors.length >= 3 ? 80 : 60,
    consistencyScore: factors.length >= 2 ? 75 : 50,
    recencyScore: 75,
  });

  addCard({
    type: 'best_day_pattern',
    title: 'Your Strongest Days',
    body: `Your strongest days tend to share some common ingredients: ${factors.join(', ')}. These patterns suggest that when sleep and stress are more settled, your steadier days follow.`,
    confidence,
  });
}

function buildHardDayCard(days: DailyCheckIn[], addCard: (card: InsightCard) => void): void {
  const result = detectHardDayPatterns(days);
  if (!result.hasEnoughData) return;

  const factors: string[] = [];
  if (result.commonFactors.lowSleep) factors.push('poor sleep');
  if (result.commonFactors.highStress) factors.push('stress');
  if (result.commonFactors.lowEnergy) factors.push('low energy');
  if (result.commonFactors.highOverwhelm) factors.push('overwhelm');

  if (factors.length === 0) return;

  const confidence = computeInsightConfidence({
    dataCoverageScore: Math.min(100, days.length * 10),
    effectSizeScore: factors.length >= 3 ? 80 : 60,
    consistencyScore: factors.length >= 2 ? 75 : 50,
    recencyScore: 75,
  });

  addCard({
    type: 'hard_day_pattern',
    title: 'Your Harder Days',
    body: `Your most difficult days tend to involve ${factors.join(', ')}. Noticing these patterns in your harder days can help you recognize when to ease up and take care of yourself.`,
    confidence,
  });
}

function buildEmergingThemeCard(days: DailyCheckIn[], addCard: (card: InsightCard) => void): void {
  const journalDays = days.filter((d) => d.journalText && d.journalText.trim().length > 0);
  if (journalDays.length < 4) return;

  const allSignals = journalDays.map((d) => extractJournalSignals(d.journalText));

  const avg = (fn: (s: JournalSignals) => number) =>
    allSignals.reduce((sum, s) => sum + fn(s), 0) / allSignals.length;

  const heaviness = avg((s) => s.heaviness);
  const overwhelm = avg((s) => s.overwhelm);
  const restoration = avg((s) => s.restorationNeed);
  const connection = avg((s) => s.connection);
  const hope = avg((s) => s.hope);

  const dominant = Math.max(heaviness, overwhelm, restoration, connection, hope);
  if (dominant < 0.15) return;

  const themes: string[] = [];
  if (heaviness > 0.15) themes.push('heaviness');
  if (overwhelm > 0.15) themes.push('pressure');
  if (restoration > 0.15) themes.push('a need for quiet and space');
  if (connection > 0.15) themes.push('connection');
  if (hope > 0.15) themes.push('relief');

  const confidence = computeInsightConfidence({
    dataCoverageScore: Math.min(100, journalDays.length * 15),
    effectSizeScore: Math.min(100, dominant * 100),
    consistencyScore: Math.min(100, journalDays.length * 12),
    recencyScore: 75,
  });

  addCard({
    type: 'emerging_theme',
    title: 'A Recurring Theme',
    body: `A recurring pattern is showing up across ${journalDays.length} journal entries: ${themes.join(', ')}. The strongest signal is ${dominant >= 0.3 ? 'notably present' : 'emerging'} at ${Math.round(dominant * 100)}% intensity. This theme may point to something worth paying attention to.`,
    confidence,
  });
}

function buildDreamThemeCard(days: DailyCheckIn[], addCard: (card: InsightCard) => void): void {
  const dreamDays = days.filter((d) => d.dreamLogged && d.dreamText && d.dreamText.trim().length > 0);
  if (dreamDays.length < 2) return;

  const analyses = dreamDays.map((d) => analyzeDreamThemes(d.dreamText!));

  // Find dominant theme across all dreams
  const themeTotals: Record<string, number> = {};
  for (const a of analyses) {
    for (const [theme, score] of Object.entries(a.themes)) {
      themeTotals[theme] = (themeTotals[theme] || 0) + score;
    }
  }

  let topTheme = '';
  let topTotal = 0;
  for (const [theme, total] of Object.entries(themeTotals)) {
    if (total > topTotal) {
      topTotal = total;
      topTheme = theme;
    }
  }

  if (!topTheme || topTotal < 1) return;

  const avgIntensity = analyses.reduce((s, a) => s + a.intensity, 0) / analyses.length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- planned for dream narrative feature
  const undercurrent = DREAM_UNDERCURRENTS[topTheme] || 'something unresolved';

  const themeDescriptions: Record<string, string> = {
    lost: 'searching and uncertainty',
    pursuit: 'tension and self-protection',
    falling: 'a sense of lost control',
    water: 'emotional depth',
    flying: 'freedom and aspiration',
  };

  const themeLabel = themeDescriptions[topTheme] || topTheme;

  const confidence = computeInsightConfidence({
    dataCoverageScore: Math.min(100, dreamDays.length * 20),
    effectSizeScore: Math.min(100, avgIntensity * 100),
    consistencyScore: Math.min(100, (topTotal / dreamDays.length) * 80),
    recencyScore: 70,
  });

  addCard({
    type: 'dream_theme',
    title: 'A Thread in Your Dreams',
    body: `Across ${dreamDays.length} dreams, a thread of ${themeLabel} emerges at ${Math.round(avgIntensity * 100)}% intensity. This may reflect something your mind is working through — an undercurrent of ${undercurrent.toLowerCase()} that could point to deeper feelings worth noticing.`,
    confidence,
  });
}
