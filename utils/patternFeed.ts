import { DeepInsight, DeepInsightBundle } from './deepInsights';
import { CrossRefInsight, InsightMetric, InsightTakeaway } from './selfKnowledgeCrossRef';

const CATEGORY_LABELS: Record<DeepInsight['category'], string> = {
  'what-keeps-happening': 'Keeps returning',
  'how-your-mind-works': 'Needs sense-making',
  'who-you-are-underneath': 'Identity is clarifying',
  'what-activates-you': 'Activates quickly',
  'how-you-protect-yourself': 'Protects under strain',
  'attachment-and-closeness': 'Closeness shifts baseline',
  'what-restores-you': 'Brings you back',
  'nervous-system': 'Capacity changes first',
  'growth-and-change': 'Change is holding',
  'inner-contradictions': 'Two needs conflict',
  'hidden-costs': 'Costs more than it shows',
  'emotional-logic': 'Has a clear logic',
  'relational-patterns': 'Connection has conditions',
  'baseline-shifts': 'Baseline is changing',
  'environmental-sensitivity': 'Environment changes capacity',
  'energy-leaks': 'Quietly drains capacity',
  'adaptive-behaviors': 'Adapts under pressure',
  'processing-style': 'Needs a clear sequence',
  'quiet-strengths': 'Strength is consistent',
  'sleep-and-rhythm': 'Sleep predicts steadiness',
  'dream-patterns': 'Dreams repeat the material',
  'somatic-signals': 'Body signals first',
  'trigger-responses': 'Trigger shifts baseline',
  'glimmers-and-elevation': 'Small signals stabilize',
  'journal-themes': 'Writing returns there',
  'daily-state': 'State is trackable',
  'focus-and-capacity': 'Capacity sets focus',
  'cognitive-style': 'Thinks through structure',
  'archetypes-and-roles': 'Role repeats under strain',
  'cosmic-context': 'Cycles are being tracked',
  'core-values': 'Values shape choices',
};

const ACCENT_MAP: Record<DeepInsight['accent'], CrossRefInsight['accentColor']> = {
  gold: 'gold',
  silverBlue: 'silverBlue',
  copper: 'copper',
  emerald: 'emerald',
  rose: 'rose',
  lavender: 'lavender',
};

const PREMIUM_TYPE_LABELS: Partial<Record<NonNullable<DeepInsight['premiumType']>, string>> = {
  'risk-forecast': 'Early Warning',
  'recovery-plan': 'Recovery Plan',
  'operating-manual': 'Personal Manual',
  'blind-spot': 'Blind Spot',
  'best-day-formula': 'Better-Day Formula',
  'hard-day-map': 'Hard-Day Map',
  trajectory: 'Trajectory',
  'next-best-action': 'Next Best Action',
  'relationship-blueprint': 'Relationship Blueprint',
  'dream-translation': 'Dream Translation',
  'somatic-signature': 'Somatic Signature',
  'trigger-map': 'Trigger Map',
  'glimmer-formula': 'Elevation Formula',
  'burnout-warning': 'Burnout Warning',
  'alignment-check': 'Alignment Check',
  'cognitive-bias': 'Cognitive Bias',
  'nervous-system-baseline': 'Nervous System Baseline',
  'coping-strategy': 'Coping Strategy',
  'core-need': 'Core Need',
  'seasonal-shift': 'Seasonal Shift',
  'identity-evolution': 'Identity Evolution',
  'hidden-toll': 'Hidden Toll',
};

function confidenceLabel(confidence: DeepInsight['confidence']): string {
  if (confidence === 'strong') return 'Consistent now';
  if (confidence === 'growing') return 'Becoming consistent';
  return 'Early signal';
}

function scopeLabel(scope: DeepInsight['scope']): string {
  if (scope === 'daily') return 'Recent';
  if (scope === 'weekly') return 'This week';
  if (scope === 'monthly') return 'This month';
  if (scope === 'seasonal') return 'This season';
  return 'Long-term truth';
}

function jobLabel(job: DeepInsight['job']): string {
  if (job === 'guide') return 'Gives next move';
  if (job === 'clarify') return 'Makes sense of it';
  if (job === 'integrate') return 'Applies what you learn';
  return 'Names the pattern';
}

function toHeroMetrics(insight: DeepInsight, bundle: DeepInsightBundle): InsightMetric[] {
  const metrics: InsightMetric[] = [];
  if (insight.premiumType && PREMIUM_TYPE_LABELS[insight.premiumType]) {
    metrics.push({
      value: PREMIUM_TYPE_LABELS[insight.premiumType] ?? 'Premium Read',
      label: 'Insight type',
      tone:
        insight.premiumType === 'risk-forecast' ||
        insight.premiumType === 'hard-day-map' ||
        insight.premiumType === 'blind-spot'
          ? 'caution'
          : insight.premiumType === 'recovery-plan' ||
              insight.premiumType === 'best-day-formula' ||
              insight.premiumType === 'next-best-action'
            ? 'positive'
            : 'default',
    });
  } else {
    metrics.push({
      value: CATEGORY_LABELS[insight.category],
      label: 'Pattern',
    });
  }
  metrics.push({
    value: `${bundle.totalDays} days`,
    label: 'Observed across',
  });
  metrics.push({
    value: confidenceLabel(insight.confidence),
    label: 'Confidence',
    tone: insight.confidence === 'strong' ? 'positive' : 'default',
  });
  metrics.push({
    value: scopeLabel(insight.scope),
    label: 'Timeframe',
  });
  if (typeof insight.valueRank === 'number' && insight.valueRank >= 80) {
    metrics.push({
      value: 'High-value read',
      label: 'Priority',
      tone: 'positive',
    });
  } else if (insight.job) {
    metrics.push({
      value: jobLabel(insight.job),
      label: 'Use',
    });
  }
  return metrics.slice(0, 5);
}

function toTakeaway(insight: DeepInsight): InsightTakeaway | undefined {
  const body = insight.nextStep ?? insight.reflectionPrompt;
  if (!body) return undefined;
  return {
    label: insight.nextStep ? 'Next best step' : insight.job === 'guide' ? 'Try this' : 'Reflection',
    body,
    icon:
      insight.premiumType === 'risk-forecast'
        ? 'warning-outline'
        : insight.premiumType === 'recovery-plan'
          ? 'leaf-outline'
          : insight.premiumType === 'best-day-formula'
            ? 'sunny-outline'
            : insight.premiumType === 'hard-day-map'
              ? 'map-outline'
              : insight.premiumType === 'next-best-action'
                ? 'arrow-forward-circle-outline'
                : 'sparkles-outline',
  };
}

function buildPremiumBody(insight: DeepInsight): string {
  const parts = [insight.body];
  if (insight.whyItMatters) {
    parts.push(`Why it matters: ${insight.whyItMatters}`);
  }
  if (insight.evidence && insight.evidence.length > 0) {
    parts.push(`Evidence: ${insight.evidence.slice(0, 3).join(' · ')}`);
  }
  return parts.join('\n\n');
}

function compareInsights(a: DeepInsight, b: DeepInsight): number {
  const aRank = a.valueRank ?? 0;
  const bRank = b.valueRank ?? 0;
  if (aRank !== bRank) return bRank - aRank;

  const confidenceScore: Record<DeepInsight['confidence'], number> = {
    strong: 3,
    growing: 2,
    emerging: 1,
  };
  const confidenceDiff = confidenceScore[b.confidence] - confidenceScore[a.confidence];
  if (confidenceDiff !== 0) return confidenceDiff;

  const jobPriority: Record<DeepInsight['job'], number> = {
    guide: 4,
    name: 3,
    clarify: 2,
    integrate: 1,
  };
  return jobPriority[b.job] - jobPriority[a.job];
}

export function buildPatternFeedInsights(bundle: DeepInsightBundle | null): CrossRefInsight[] {
  if (!bundle) return [];
  return [...bundle.insights]
    .sort(compareInsights)
    .map((insight) => ({
      id: `deep-${insight.id}`,
      title: insight.title,
      body: buildPremiumBody(insight),
      heroMetrics: toHeroMetrics(insight, bundle),
      takeaway: toTakeaway(insight),
      accentColor: ACCENT_MAP[insight.accent],
      source: 'reflection',
      isConfirmed: insight.confidence === 'strong',
      // Premium metadata preserved for richer UI cards/modals.
      premiumType: insight.premiumType,
      valueRank: insight.valueRank,
      evidence: insight.evidence,
      whyItMatters: insight.whyItMatters,
      nextStep: insight.nextStep,
      lockedPreview: insight.lockedPreview,
    }));
}
