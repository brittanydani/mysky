import type { DataSource, EvidenceAnchor, UserSignal } from './types/knowledgeEngine';

export const PRIMARY_SOURCE_ORDER: DataSource[] = [
  'reflectionBank',
  'bodyMap',
  'triggerLog',
  'glimmerLog',
  'relationshipMirror',
  'journal',
  'dailyCheckIn',
  'sleep',
  'dream',
  'astrology',
  'natalChart',
];

const SOURCE_RANK = new Map<DataSource, number>(
  PRIMARY_SOURCE_ORDER.map((source, index) => [source, index]),
);

const SOURCE_GROUP_RANK: Record<DataSource, number> = {
  reflectionBank: 0,
  bodyMap: 0,
  triggerLog: 0,
  glimmerLog: 0,
  relationshipMirror: 0,
  journal: 1,
  dailyCheckIn: 2,
  sleep: 3,
  dream: 3,
  astrology: 4,
  natalChart: 4,
};

export function sourcePriorityRank(source: DataSource): number {
  return SOURCE_GROUP_RANK[source] ?? PRIMARY_SOURCE_ORDER.length;
}

export function compareSourcesByPrimaryOrder(a: DataSource, b: DataSource): number {
  const priorityDiff = sourcePriorityRank(a) - sourcePriorityRank(b);
  if (priorityDiff !== 0) return priorityDiff;
  return (SOURCE_RANK.get(a) ?? PRIMARY_SOURCE_ORDER.length) - (SOURCE_RANK.get(b) ?? PRIMARY_SOURCE_ORDER.length);
}

export function sourcePriorityScore(source: DataSource): number {
  const rank = sourcePriorityRank(source);
  if (rank === 0) return 1;
  if (rank === 1) return 0.82;
  if (rank === 2) return 0.64;
  if (rank === 3) return 0.46;
  if (rank === 4) return 0.28;
  return 0;
}

export function compareSignalsByPrimarySource(a: UserSignal, b: UserSignal): number {
  const sourceDiff = compareSourcesByPrimaryOrder(a.source, b.source);
  if (sourceDiff !== 0) return sourceDiff;

  const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
  if (Number.isFinite(dateDiff) && dateDiff !== 0) return dateDiff;

  return b.strength - a.strength;
}

export function compareEvidenceByPrimarySource(a: EvidenceAnchor, b: EvidenceAnchor): number {
  const sourceDiff = compareSourcesByPrimaryOrder(a.source, b.source);
  if (sourceDiff !== 0) return sourceDiff;

  const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
  if (Number.isFinite(dateDiff) && dateDiff !== 0) return dateDiff;

  return 0;
}

export function orderSourcesByPrimaryPriority(sources: DataSource[]): DataSource[] {
  return Array.from(new Set(sources)).sort(compareSourcesByPrimaryOrder);
}
