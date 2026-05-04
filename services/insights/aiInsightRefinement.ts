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

  return {
    ...original,
    title,
    observation,
    pattern,
    reframe: {
      shame,
      clarity,
    },
    prompt,
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
