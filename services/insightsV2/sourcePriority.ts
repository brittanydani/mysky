import type { EvidenceAnchor, InsightDataSource, UserSignal } from './types';

export const PRIMARY_SOURCE_ORDER_V2: InsightDataSource[] = [
  'reflectionBank',
  'bodyMap',
  'triggerLog',
  'glimmerLog',
  'relationshipMirror',
  'journal',
  'dailyCheckIn',
  'sleep',
  'dream',
  'natalChart',
];

const SOURCE_RANK = new Map<InsightDataSource, number>(
  PRIMARY_SOURCE_ORDER_V2.map((source, index) => [source, index]),
);

const SOURCE_GROUP_RANK: Record<InsightDataSource, number> = {
  reflectionBank: 0,
  bodyMap: 0,
  triggerLog: 0,
  glimmerLog: 0,
  relationshipMirror: 0,
  journal: 1,
  dailyCheckIn: 2,
  sleep: 3,
  dream: 3,
  natalChart: 4,
};

export function sourcePriorityRank(source: InsightDataSource): number {
  return SOURCE_GROUP_RANK[source] ?? PRIMARY_SOURCE_ORDER_V2.length;
}

export function compareSourcesByPrimaryOrder(a: InsightDataSource, b: InsightDataSource): number {
  const priorityDiff = sourcePriorityRank(a) - sourcePriorityRank(b);
  if (priorityDiff !== 0) return priorityDiff;
  return (SOURCE_RANK.get(a) ?? PRIMARY_SOURCE_ORDER_V2.length) - (SOURCE_RANK.get(b) ?? PRIMARY_SOURCE_ORDER_V2.length);
}

export function sourcePriorityScore(source: InsightDataSource): number {
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

export function orderSourcesByPrimaryPriority(sources: InsightDataSource[]): InsightDataSource[] {
  return Array.from(new Set(sources)).sort(compareSourcesByPrimaryOrder);
}
