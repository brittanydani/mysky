import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';
import type { EvidenceAnchor, GeneratedInsight } from './types/knowledgeEngine';

export type KnowledgeInsightModelTier = 'free' | 'premium';
export type KnowledgeInsightSurface = 'today' | 'patterns';

const MAX_RETRIES = 1;
const RETRY_BASE_DELAY_MS = 700;
const MAX_INSIGHTS_PER_REQUEST = 3;
const MAX_EVIDENCE_PER_INSIGHT = 4;

export interface KnowledgeInsightAiOptions {
  enabled?: boolean;
  modelTier?: KnowledgeInsightModelTier;
  surface?: KnowledgeInsightSurface;
  date?: string;
}

interface KnowledgeInsightAiPayloadItem {
  id: string;
  slot: string;
  title: string;
  observation: string;
  pattern: string;
  reframe: {
    shame: string;
    clarity: string;
  };
  prompt: string;
  patternKey: string;
  angleKey?: string;
  confidence: string;
  movement: string;
  evidence: Array<{
    source: string;
    date: string;
    label?: string;
    phrase?: string;
    signal?: string;
    intensity?: number;
  }>;
}

interface KnowledgeInsightAiResponseItem {
  id: string;
  title?: string;
  observation?: string;
  pattern?: string;
  reframe?: {
    shame?: string;
    clarity?: string;
  };
  prompt?: string;
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function retryDelay(attempt: number): number {
  return RETRY_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 200);
}

function truncate(value: string | null | undefined, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trim()}...` : trimmed;
}

function isAiInsightRefinementEnabled(): boolean {
  if (process.env.NODE_ENV === 'test') return false;
  return process.env.EXPO_PUBLIC_AI_KNOWLEDGE_INSIGHTS !== '0';
}

function compactEvidence(evidence: EvidenceAnchor[]): KnowledgeInsightAiPayloadItem['evidence'] {
  return evidence.slice(0, MAX_EVIDENCE_PER_INSIGHT).map(anchor => ({
    source: anchor.source,
    date: anchor.date,
    label: truncate(anchor.label, 90),
    phrase: truncate(anchor.phrase, 140),
    signal: truncate(anchor.signal, 90),
    intensity: anchor.intensity,
  }));
}

function toPayloadItem(insight: GeneratedInsight): KnowledgeInsightAiPayloadItem {
  return {
    id: insight.id,
    slot: insight.slot,
    title: insight.title,
    observation: insight.observation,
    pattern: insight.pattern,
    reframe: {
      shame: insight.reframe.shame,
      clarity: insight.reframe.clarity,
    },
    prompt: insight.prompt,
    patternKey: insight.patternKey,
    angleKey: insight.angleKey,
    confidence: insight.confidence,
    movement: String(insight.movement),
    evidence: compactEvidence(insight.evidence),
  };
}

function validText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

const GROUNDING_STOPWORDS = new Set([
  'about',
  'after',
  'again',
  'against',
  'already',
  'also',
  'because',
  'before',
  'being',
  'card',
  'clear',
  'could',
  'does',
  'doing',
  'enough',
  'every',
  'feel',
  'feeling',
  'feels',
  'from',
  'have',
  'into',
  'like',
  'more',
  'need',
  'needs',
  'only',
  'pattern',
  'proof',
  'read',
  'real',
  'reframe',
  'signal',
  'still',
  'system',
  'that',
  'this',
  'today',
  'what',
  'when',
  'where',
  'with',
  'without',
  'would',
  'your',
]);

const FORBIDDEN_UNSUPPORTED_AI_PATTERNS = [
  /\bchildhood\b/i,
  /\btrauma(?:tic)?\b/i,
  /\bdiagnos(?:is|e|ed|tic)\b/i,
  /\battachment wound\b/i,
  /\b(?:anxious|avoidant|disorganized) attachment\b/i,
  /\bcodependent\b/i,
  /\bptsd\b/i,
  /\badhd\b/i,
  /\bautis(?:m|tic)\b/i,
  /\bclinical\b/i,
  /\btherapy\b|\btherapist\b/i,
  /\byour (?:mother|father|parent|parents|partner|boss|family) (?:made|taught|caused)\b/i,
  /\bthis means you (?:will|always|never)\b/i,
  /\byou (?:will|always|never) (?:be|feel|need|have|struggle)\b/i,
];

function normalizeGroundingToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .replace(/ies$/, 'y')
    .replace(/s$/, '');
}

function significantTokens(text: string): Set<string> {
  const tokens = text
    .split(/[^A-Za-z0-9]+/)
    .map(normalizeGroundingToken)
    .filter(token => token.length >= 4 && !GROUNDING_STOPWORDS.has(token));

  return new Set(tokens);
}

function originalGroundingText(insight: GeneratedInsight): string {
  return [
    insight.title,
    insight.observation,
    insight.pattern,
    insight.reframe.shame,
    insight.reframe.clarity,
    insight.prompt,
    insight.patternKey,
    insight.angleKey,
    insight.category,
    insight.majorDomain,
    insight.insightSubcategory,
    ...insight.evidence.flatMap(anchor => [
      anchor.label,
      anchor.phrase,
      anchor.signal,
      anchor.source,
    ]),
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join(' ');
}

function refinedGroundingText(ai: {
  title: string;
  observation: string;
  pattern: string;
  shame: string;
  clarity: string;
  prompt: string;
}): string {
  return [
    ai.title,
    ai.observation,
    ai.pattern,
    ai.shame,
    ai.clarity,
    ai.prompt,
  ].join(' ');
}

function aiRefinementStaysGrounded(
  original: GeneratedInsight,
  ai: {
    title: string;
    observation: string;
    pattern: string;
    shame: string;
    clarity: string;
    prompt: string;
  },
): boolean {
  const refinedText = refinedGroundingText(ai);
  if (FORBIDDEN_UNSUPPORTED_AI_PATTERNS.some(pattern => pattern.test(refinedText))) {
    return false;
  }

  const groundingTokens = significantTokens(originalGroundingText(original));
  if (groundingTokens.size === 0) return false;

  const refinedTokens = significantTokens(refinedText);
  const overlap = Array.from(refinedTokens).filter(token => groundingTokens.has(token)).length;
  const requiredOverlap = groundingTokens.size >= 4 ? 2 : 1;

  return overlap >= requiredOverlap;
}

function mergeAiInsight(
  original: GeneratedInsight,
  ai: KnowledgeInsightAiResponseItem | undefined,
  generatedAt: string | undefined,
): GeneratedInsight {
  if (!ai) return original;

  const title = validText(ai.title, 80) ?? original.title;
  const observation = validText(ai.observation, 360) ?? original.observation;
  const pattern = validText(ai.pattern, 700) ?? original.pattern;
  const shame = validText(ai.reframe?.shame, 220) ?? original.reframe.shame;
  const clarity = validText(ai.reframe?.clarity, 260) ?? original.reframe.clarity;
  const prompt = validText(ai.prompt, 220) ?? original.prompt;
  const candidate = {
    title,
    observation,
    pattern,
    shame,
    clarity,
    prompt,
  };

  if (!aiRefinementStaysGrounded(original, candidate)) {
    logger.warn('[KnowledgeAI] Rejected ungrounded insight refinement; using local insight.', {
      insightId: original.id,
      patternKey: original.patternKey,
    });
    return original;
  }

  return {
    ...original,
    title: candidate.title,
    observation: candidate.observation,
    pattern: candidate.pattern,
    reframe: {
      shame: candidate.shame,
      clarity: candidate.clarity,
    },
    prompt: candidate.prompt,
    aiEnhanced: true,
    aiGeneratedAt: generatedAt,
    insightSource: 'aiRefined',
  };
}

async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch (error) {
    logger.warn('[KnowledgeAI] Failed to read Supabase session; using local insights.', error);
    return null;
  }
}

export async function enhanceKnowledgeInsightsWithAi(
  insights: GeneratedInsight[],
  options: KnowledgeInsightAiOptions = {},
): Promise<GeneratedInsight[]> {
  if (!insights.length) return insights;
  if (options.enabled === false || !isAiInsightRefinementEnabled()) return insights;

  const accessToken = await getAccessToken();
  if (!accessToken) return insights;

  const selectedInsights = insights.slice(0, MAX_INSIGHTS_PER_REQUEST);
  const passthroughInsights = insights.slice(MAX_INSIGHTS_PER_REQUEST);
  const body = {
    modelTier: options.modelTier ?? 'free',
    surface: options.surface ?? 'today',
    date: options.date ?? new Date().toISOString(),
    insights: selectedInsights.map(toPayloadItem),
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const { data, error } = await supabase.functions.invoke('knowledge-insights', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      });

      if (error) {
        const status = (error as any)?.context?.status ?? 0;
        const retriable = status === 0 || status === 408 || status === 429 || status >= 500;
        if (retriable && attempt < MAX_RETRIES) {
          await wait(retryDelay(attempt));
          continue;
        }
        logger.warn('[KnowledgeAI] Insight refinement unavailable; using local insights.', error);
        return insights;
      }

      const aiItems = Array.isArray(data?.insights)
        ? data.insights as KnowledgeInsightAiResponseItem[]
        : [];
      const generatedAt = typeof data?.generatedAt === 'string' ? data.generatedAt : undefined;
      const byId = new Map(aiItems.map(item => [item.id, item]));

      return [
        ...selectedInsights.map(insight => mergeAiInsight(insight, byId.get(insight.id), generatedAt)),
        ...passthroughInsights,
      ];
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        await wait(retryDelay(attempt));
        continue;
      }
      logger.warn('[KnowledgeAI] Insight refinement failed; using local insights.', error);
      return insights;
    }
  }

  return insights;
}
