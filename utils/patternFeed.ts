import { DeepInsight, DeepInsightBundle } from './deepInsights';
import { CrossRefInsight, InsightMetric, InsightTakeaway } from './selfKnowledgeCrossRef';

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
  'hidden-costs': 'Hidden Costs',
  'emotional-logic': 'Emotional Logic',
  'relational-patterns': 'Relational Patterns',
  'baseline-shifts': 'Baseline Shifts',
  'environmental-sensitivity': 'Environmental Sensitivity',
  'energy-leaks': 'Energy Leaks',
  'adaptive-behaviors': 'Adaptive Behaviors',
  'processing-style': 'Processing Style',
  'quiet-strengths': 'Quiet Strengths',
  'sleep-and-rhythm': 'Sleep & Rhythm',
  'dream-patterns': 'Dream Patterns',
  'somatic-signals': 'Somatic Signals',
  'trigger-responses': 'Trigger Responses',
  'glimmers-and-elevation': 'Glimmers & Elevation',
  'journal-themes': 'Journal Themes',
  'daily-state': 'Daily State',
  'focus-and-capacity': 'Focus & Capacity',
  'cognitive-style': 'Cognitive Style',
  'archetypes-and-roles': 'Archetypes & Roles',
  'cosmic-context': 'Cosmic Context',
  'core-values': 'Core Values',
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
  if (confidence === 'strong') return 'Strong signal';
  if (confidence === 'growing') return 'Growing signal';
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
  if (job === 'guide') return 'Actionable';
  if (job === 'clarify') return 'Clarifying';
  if (job === 'integrate') return 'Integrating';
  return 'Naming';
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
      label: 'MySky priority',
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
    parts.push(`Why MySky thinks this: ${insight.evidence.slice(0, 3).join(' · ')}`);
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
