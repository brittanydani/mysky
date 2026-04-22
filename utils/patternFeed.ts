import type { DeepInsight, DeepInsightBundle } from './deepInsights';
import type { CrossRefInsight, InsightMetric, InsightTakeaway } from './selfKnowledgeCrossRef';

const CATEGORY_LABELS: Record<DeepInsight['category'], string> = {
  'what-keeps-happening': 'What Keeps Happening',
  'how-your-mind-works': 'How Your Mind Works',
  'who-you-are-underneath': 'Who You Are Underneath',
  'what-activates-you': 'What Activates You',
  'how-you-protect-yourself': 'How You Protect Yourself',
  'attachment-and-closeness': 'Attachment & Closeness',
  'what-restores-you': 'What Restores You',
  'nervous-system': 'Nervous System',
  'growth-and-change': 'Growth & Change',
  'inner-contradictions': 'Inner Contradictions',
};

const ACCENT_MAP: Record<DeepInsight['accent'], CrossRefInsight['accentColor']> = {
  gold: 'gold',
  silverBlue: 'silverBlue',
  copper: 'copper',
  emerald: 'emerald',
  rose: 'rose',
  lavender: 'lavender',
};

function toHeroMetrics(insight: DeepInsight, bundle: DeepInsightBundle): InsightMetric[] {
  return [
    { value: CATEGORY_LABELS[insight.category].toUpperCase(), label: 'Category' },
    { value: `${bundle.totalDays} DAYS`, label: 'Observed' },
    { value: insight.confidence.toUpperCase(), label: 'Confidence' },
  ];
}

function toTakeaway(insight: DeepInsight): InsightTakeaway | undefined {
  if (!insight.reflectionPrompt) return undefined;

  return {
    label: insight.job === 'guide' ? 'Try this' : 'Reflection',
    body: insight.reflectionPrompt,
    icon: 'sparkles-outline',
  };
}

export function buildPatternFeedInsights(bundle: DeepInsightBundle | null): CrossRefInsight[] {
  if (!bundle) return [];

  return bundle.insights.map((insight) => ({
    id: `deep-${insight.id}`,
    title: insight.title,
    body: insight.body,
    heroMetrics: toHeroMetrics(insight, bundle),
    takeaway: toTakeaway(insight),
    accentColor: ACCENT_MAP[insight.accent],
    source: 'reflection',
    isConfirmed: insight.confidence === 'strong',
  }));
}