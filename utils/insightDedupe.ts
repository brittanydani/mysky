import { logger } from './logger';

export type InsightLikeForDedupe = {
  id?: string | number | null;
  title?: string | null;
  body?: string | null;
  text?: string | null;
  description?: string | null;
  reflectionQuestion?: string | null;
  category?: string | null;
  type?: string | null;
  lens?: string | null;
  theme?: string | null;
  metricKey?: string | null;
};

function isDevRuntime(): boolean {
  const globalDev = (globalThis as { __DEV__?: boolean }).__DEV__;
  if (typeof globalDev !== 'undefined') return globalDev;
  if (typeof __DEV__ !== 'undefined') return __DEV__;
  return process.env.NODE_ENV !== 'production';
}

export function normalizeInsightDuplicateKeyPart(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .replace(/[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function buildInsightDuplicateKey(insight: InsightLikeForDedupe): string {
  const contentText =
    normalizeInsightDuplicateKeyPart(insight.body) ||
    normalizeInsightDuplicateKeyPart(insight.text) ||
    normalizeInsightDuplicateKeyPart(insight.description);
  const contentParts = [
    insight.category,
    insight.type,
    insight.lens,
    insight.theme,
    insight.metricKey,
    insight.title,
    contentText,
    insight.reflectionQuestion,
  ]
    .map(normalizeInsightDuplicateKeyPart)
    .filter(Boolean);

  if (contentParts.length > 0) return contentParts.join('|');

  const fallbackId = normalizeInsightDuplicateKeyPart(insight.id);
  return fallbackId ? `id:${fallbackId}` : 'empty-insight';
}

export function dedupeExactInsights<T extends InsightLikeForDedupe>(
  insights: readonly T[],
  sourceName: string,
): T[] {
  const seen = new Set<string>();
  const filtered: T[] = [];

  for (const insight of insights) {
    const duplicateKey = buildInsightDuplicateKey(insight);
    if (!seen.has(duplicateKey)) {
      seen.add(duplicateKey);
      filtered.push(insight);
      continue;
    }

    if (isDevRuntime()) {
      logger.warn('[InsightDedupe] Removed exact duplicate insight', {
        sourceName,
        duplicateKey,
        duplicateTitle: insight.title ?? '',
      });
    }
  }

  return filtered;
}
