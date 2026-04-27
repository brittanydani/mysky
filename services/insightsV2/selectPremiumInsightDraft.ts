import { DAILY_INSIGHT_DRAFTS_PREMIUM_FINAL } from '../../generated/insights/dailyInsightDraftsPremiumFinal';

export type PremiumInsightDraft = (typeof DAILY_INSIGHT_DRAFTS_PREMIUM_FINAL)[number];

export type PremiumInsightDraftSelectionContext = {
  date?: string;
  category?: PremiumInsightDraft['category'];
  preferredAngleKeys?: string[];
  preferredPatternKeys?: string[];
  avoidDraftKeys?: string[];
  avoidPatternKeys?: string[];
  avoidAngleKeys?: string[];
  seed?: string | number;
};

export type SelectedPremiumInsightDraft = {
  id: string;
  title: string;
  body: string;
  reflectionPrompt: string;
  patternKey: string;
  angleKey: string;
  category: PremiumInsightDraft['category'];
  tone: PremiumInsightDraft['tone'];
  sourceDraft: PremiumInsightDraft;
};

const ALL_DRAFTS = [...DAILY_INSIGHT_DRAFTS_PREMIUM_FINAL];

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0).getTime();
  return Math.floor((date.getTime() - start) / 86400000);
}

function stableHash(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function scoreDraft(
  draft: PremiumInsightDraft,
  context: PremiumInsightDraftSelectionContext,
): number {
  let score = 0;

  if (context.category && draft.category === context.category) score += 40;
  if (context.preferredPatternKeys?.includes(draft.pattern_key)) score += 35;
  if (context.preferredAngleKeys?.includes(draft.angle_key)) score += 30;

  if (
    draft.angle_key === 'today_active_signal' ||
    draft.angle_key === 'shame_to_clarity' ||
    draft.angle_key === 'becoming_visible'
  ) {
    score += 12;
  }

  if (
    draft.angle_key === 'body_version' ||
    draft.angle_key === 'sleep_capacity_version' ||
    draft.angle_key === 'support_version' ||
    draft.angle_key === 'relationship_version' ||
    draft.angle_key === 'dream_version' ||
    draft.angle_key === 'glimmer_version'
  ) {
    score += 8;
  }

  return score;
}

function toSelectedDraft(draft: PremiumInsightDraft): SelectedPremiumInsightDraft {
  return {
    id: draft.key,
    title: draft.title,
    body: [draft.observation, draft.pattern, draft.reframe].join('\n\n'),
    reflectionPrompt: draft.question,
    patternKey: draft.pattern_key,
    angleKey: draft.angle_key,
    category: draft.category,
    tone: draft.tone,
    sourceDraft: draft,
  };
}

export function selectPremiumInsightDraft(
  context: PremiumInsightDraftSelectionContext = {},
): SelectedPremiumInsightDraft {
  const date = context.date ? new Date(context.date) : new Date();
  const avoidDraftKeys = new Set(context.avoidDraftKeys ?? []);
  const avoidPatternKeys = new Set(context.avoidPatternKeys ?? []);
  const avoidAngleKeys = new Set(context.avoidAngleKeys ?? []);

  const candidates = ALL_DRAFTS
    .filter(draft => !avoidDraftKeys.has(draft.key))
    .filter(draft => !avoidPatternKeys.has(draft.pattern_key))
    .filter(draft => !avoidAngleKeys.has(draft.angle_key))
    .filter(draft => !context.category || draft.category === context.category)
    .map(draft => ({
      draft,
      score: scoreDraft(draft, context),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const seed = String(context.seed ?? '');
      const aHash = stableHash(`${seed}:${a.draft.key}`);
      const bHash = stableHash(`${seed}:${b.draft.key}`);

      return aHash - bHash;
    });

  const pool = candidates.length > 0 ? candidates : ALL_DRAFTS.map(draft => ({ draft, score: 0 }));
  const seed = String(context.seed ?? '');
  const indexSeed = `${seed}:${context.category ?? 'all'}:${dayOfYear(date) * 37}`;
  const index = stableHash(indexSeed) % pool.length;

  return toSelectedDraft(pool[index].draft);
}

export function getPremiumInsightDraftCount(): number {
  return ALL_DRAFTS.length;
}

export function getPremiumInsightDraftsByCategory(
  category: PremiumInsightDraft['category'],
): PremiumInsightDraft[] {
  return ALL_DRAFTS.filter(draft => draft.category === category);
}
