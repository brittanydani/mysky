import { type DailyAggregate } from '../../services/insights/types';
import type { CrossRefInsight } from '../../utils/selfKnowledgeCrossRef';

export type PatternLibraryItem = {
  title: string;
  body: string;
};

export function buildPatternLibraryState(dailyAggregates: DailyAggregate[]) {
  const entryCount = dailyAggregates.reduce((sum, day) => sum + day.checkInCount, 0);
  const hasThreshold = entryCount >= 5;

  if (!hasThreshold) {
    return {
      statusLine: 'Needs more entries',
      helperText: 'Patterns update as you log. Add at least a few more check-ins so the library can separate real signals from one-off days.',
      items: [] as PatternLibraryItem[],
    };
  }

  const tagCounts = new Map<string, number>();
  const keywordCounts = new Map<string, number>();
  let dreamDays = 0;
  let highStressDays = 0;

  for (const day of dailyAggregates) {
    if (day.hasDream) dreamDays += 1;
    if (day.stressAvg >= 6) highStressDays += 1;
    for (const tag of day.tagsUnion) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    for (const keyword of day.keywordsUnion) {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) ?? 0) + 1);
    }
  }

  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  const topKeywords = [...keywordCounts.entries()].sort((a, b) => b[1] - a[1]).filter(([, count]) => count >= 2).slice(0, 2);
  const items: PatternLibraryItem[] = [];

  if (topTags.length > 0) {
    items.push({
      title: 'Recurring moods and states',
      body: `${topTags.map(([tag]) => readableLabel(tag)).join(' and ')} are returning most often in your recent check-ins, which suggests they are part of the emotional climate your system has been revisiting.`,
    });
  }

  if (topKeywords.length > 0) {
    items.push({
      title: 'Reflection themes',
      body: `${topKeywords.map(([keyword]) => readableLabel(keyword)).join(' and ')} keep surfacing in your reflections. The pattern looks steady enough to treat as an undercurrent rather than a one-day mood.`,
    });
  }

  if (dreamDays >= 3 || highStressDays >= 3) {
    items.push({
      title: 'Rhythm check',
      body: dreamDays >= 3
        ? `${dreamDays} recent days include dream material, giving the pattern view more depth when rest and reflection overlap.`
        : `${highStressDays} recent days landed in a higher-stress range, which gives the library enough contrast to notice when your system is tightening or softening.`,
    });
  }

  return {
    statusLine: 'Last updated today',
    helperText: 'Patterns refresh as you log, edit, and remove entries, so this view reflects your latest check-in history rather than a fixed summary.',
    items,
  };
}

export function readableLabel(value: string) {
  return value
    .replace(/^eq_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function refineCrossRefCopy(insight: CrossRefInsight): CrossRefInsight {
  if (insight.source === 'values') {
    return {
      ...insight,
      title: 'Your core anchors are becoming clearer',
      body: insight.body.replace(/^Your top values are/i, 'Connection, compassion, and stability are showing up as your core anchors right now'),
    };
  }

  return insight;
}