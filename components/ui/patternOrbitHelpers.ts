import type { DailyCheckIn } from '../../services/patterns/types';

export const PATTERN_ORBIT_DIMENSIONS = [
  'emotional',
  'creativity',
  'connection',
  'stress',
  'rest',
  'trust',
  'clarity',
] as const;

type OrbitDimensionKey = typeof PATTERN_ORBIT_DIMENSIONS[number];

export function derivePatternOrbitScores(checkIns: DailyCheckIn[]) {
  if (!checkIns.length) return PATTERN_ORBIT_DIMENSIONS.map(() => 0.28);

  const tagCount = (needle: string[]) => checkIns.filter((checkIn) => needle.some((tag) => checkIn.tags.includes(tag as never))).length;
  const avgMood = checkIns.reduce((sum, checkIn) => sum + checkIn.moodScore, 0) / checkIns.length;
  const lowStressCount = checkIns.filter((checkIn) => checkIn.stressLevel === 'low').length;
  const highStressCount = checkIns.filter((checkIn) => checkIn.stressLevel === 'high').length;
  const highEnergyCount = checkIns.filter((checkIn) => checkIn.energyLevel === 'high').length;

  const rawScores: Record<OrbitDimensionKey, number> = {
    emotional: avgMood / 10,
    creativity: Math.max(tagCount(['creative', 'creativity']) / checkIns.length, highEnergyCount / Math.max(checkIns.length * 2, 1)),
    connection: tagCount(['relationships', 'social', 'intimacy']) / checkIns.length,
    stress: Math.max(highStressCount / checkIns.length, tagCount(['overwhelm', 'anxiety', 'conflict', 'overstimulated']) / checkIns.length),
    rest: Math.max(tagCount(['rest', 'sleep', 'alone_time', 'nature']) / checkIns.length, lowStressCount / checkIns.length),
    trust: Math.max(tagCount(['boundaries', 'grounded', 'gratitude']) / checkIns.length, avgMood >= 6.5 ? 0.65 : 0.35),
    clarity: Math.max(tagCount(['clarity', 'focused', 'routine', 'productivity']) / checkIns.length, (lowStressCount + Math.max(avgMood - 5, 0)) / (checkIns.length + 5)),
  };

  return PATTERN_ORBIT_DIMENSIONS.map((dimension) => clampScore(rawScores[dimension] ?? 0.3));
}

export function getPatternOrbitThemes(scores: number[]) {
  return PATTERN_ORBIT_DIMENSIONS
    .map((dimension, index) => ({ label: dimension === 'emotional' ? 'depth' : dimension, score: scores[index] ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.label.toUpperCase());
}

export function getPatternOrbitSummary(checkIns: DailyCheckIn[], themes: string[]) {
  if (checkIns.length < 5) return 'Patterns sharpen as more entries land.';

  const topTheme = themes[0]?.toLowerCase() ?? 'clarity';
  if (topTheme === 'stress') return 'Your system is asking for more room than usual.';
  if (topTheme === 'rest') return 'Recovery is becoming part of the pattern, not an afterthought.';
  if (topTheme === 'depth') return 'Your emotional world is carrying the strongest signal right now.';
  if (topTheme === 'clarity') return 'A clearer internal signal is starting to hold.';
  return `Your recent check-ins keep circling back to ${topTheme}.`;
}

export function clampScore(value: number) {
  return Math.max(0.2, Math.min(0.95, value));
}