import { type DailyAggregate } from '../../services/insights/types';
import type { CrossRefInsight } from '../../utils/selfKnowledgeCrossRef';

export type PatternLibraryItem = {
  title: string;
  body: string;
};

export type PatternLibrarySection = {
  title: string;
  items: PatternLibraryItem[];
};

function sectionTitleForSource(source: CrossRefInsight['source']) {
  switch (source) {
    case 'relationship':
      return 'Relationship Patterns';
    case 'values':
      return 'Core Values';
    case 'somatic':
      return 'Somatic Signals';
    case 'triggers':
      return 'Trigger Patterns';
    case 'reflection':
      return 'Reflection Practice';
    case 'archetype':
      return 'Archetype Patterns';
    case 'cognitive':
      return 'Cognitive Style';
    default:
      return 'Pattern Analysis';
  }
}

export function buildPatternLibraryState(
  dailyAggregates: DailyAggregate[],
  crossRefs: CrossRefInsight[] = [],
) {
  const entryCount = dailyAggregates.reduce((sum, day) => sum + day.checkInCount, 0);
  const refinedCrossRefs = crossRefs.map(refineCrossRefCopy);
  const groupedInsightSections = refinedCrossRefs.reduce<PatternLibrarySection[]>((sections, insight) => {
    const title = sectionTitleForSource(insight.source);
    const existing = sections.find((section) => section.title === title);
    const item = {
      title: insight.title,
      body: insight.body,
    };

    if (existing) {
      existing.items.push(item);
    } else {
      sections.push({ title, items: [item] });
    }

    return sections;
  }, []);
  const realInsightItems = groupedInsightSections.flatMap((section) => section.items);
  const hasThreshold = entryCount >= 5 || groupedInsightSections.length > 0;

  if (!hasThreshold) {
    return {
      statusLine: 'Needs more entries',
      helperText: 'Patterns update as you log. Add at least a few more check-ins, then add self-knowledge inputs like relationship reflections, triggers, somatic entries, or daily reflections so the library has enough evidence to build real analysis.',
      items: [] as PatternLibraryItem[],
      sections: [] as PatternLibrarySection[],
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
  const aggregateItems: PatternLibraryItem[] = [];

  if (topTags.length > 0) {
    aggregateItems.push({
      title: 'Recurring moods and states',
      body: `${topTags.map(([tag]) => readableLabel(tag)).join(' and ')} are returning most often in your recent check-ins, which suggests they are part of the emotional climate your system has been revisiting.`,
    });
  }

  if (topKeywords.length > 0) {
    aggregateItems.push({
      title: 'Reflection themes',
      body: `${topKeywords.map(([keyword]) => readableLabel(keyword)).join(' and ')} keep surfacing in your reflections. The pattern looks steady enough to treat as an undercurrent rather than a one-day mood.`,
    });
  }

  if (dreamDays >= 3 || highStressDays >= 3) {
    aggregateItems.push({
      title: 'Rhythm check',
      body: dreamDays >= 3
        ? `${dreamDays} recent days include dream material, giving the pattern view more depth when rest and reflection overlap.`
        : `${highStressDays} recent days landed in a higher-stress range, which gives the library enough contrast to notice when your system is tightening or softening.`,
    });
  }

  const aggregateSections: PatternLibrarySection[] = aggregateItems.length > 0
    ? [{ title: 'Check-In Trends', items: aggregateItems }]
    : [];
  const items = [...realInsightItems, ...aggregateItems];
  const sections = [...groupedInsightSections, ...aggregateSections];
  const hasAnalysisWithoutCrossRefs = entryCount >= 5 && groupedInsightSections.length === 0;

  return {
    statusLine: hasAnalysisWithoutCrossRefs ? 'Building deeper analysis' : 'Last updated today',
    helperText: groupedInsightSections.length > 0
      ? 'This library is built from your current pattern analysis and refreshed from your latest check-ins, reflections, and self-knowledge data.'
      : 'Your check-in trends are live, but deeper library sections need more self-knowledge inputs. Add relationship patterns, trigger logs, somatic entries, or daily reflections to unlock source-specific analysis here.',
    items,
    sections,
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