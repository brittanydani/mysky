import { supabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';
import type { PremiumInsightWriterOutput } from './premiumInsightWriter';
import type { PatternSelectorOutput } from './patternSelector';

export interface InsightQualityGateInput {
  draft_insight: PremiumInsightWriterOutput;
  evidence: PatternSelectorOutput['selected_pattern'];
}

export type InsightClass = 'deep_pattern' | 'emerging_pattern' | 'profile_inference' | 'archive_stat';

export interface InsightQualityGateOutput {
  approved: boolean;
  reason: string;
  scores: {
    specificity: number;
    crossDomainGrounding: number;
    emotionalAccuracy: number;
    paradoxDepth: number;
    mySkyVoice: number;
    premiumValue: number;
    phraseCleanliness: number;
    evidenceFit: number;
  };
  downgradeTo?: InsightClass;
  suggested_revision: string | null;
}

const GENERIC_CATEGORY_ANCHORS = new Set([
  'angry',
  'anxiety',
  'anxious',
  'body',
  'check ins',
  'check_in',
  'check_ins',
  'check-in',
  'drain',
  'emotion',
  'fatigue',
  'glimmer',
  'grief',
  'happy',
  'journal',
  'loneliness',
  'lonely',
  'mood',
  'negative',
  'neutral',
  'overwhelm',
  'overwhelmed',
  'positive',
  'reflection',
  'relationship',
  'rest',
  'sad',
  'shame',
  'sleep',
  'somatic',
  'stress',
  'stressed',
  'trigger',
  'tired',
]);

function hasPersonalLanguageTexture(e: PatternSelectorOutput['selected_pattern']): boolean {
  const anchors = [...(e.userLanguageAnchors ?? []), ...(e.extractedPhrases ?? [])]
    .map((anchor) => anchor.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean);

  return anchors.some((anchor) => !GENERIC_CATEGORY_ANCHORS.has(anchor));
}

export function canRenderInsight(e: PatternSelectorOutput['selected_pattern']): { allowed: boolean; downgradeTo?: InsightClass; reasons: string[] } {
  const reasons: string[] = [];

  if (e.phraseHealth === 'broken') {
    reasons.push('broken phrase hygiene');
    return { allowed: false, reasons };
  }

  if (e.confidence < 0.4) {
    reasons.push('confidence too low');
    return { allowed: false, reasons };
  }

  if (e.insightClass !== 'archive_stat') {
    const domainsUsed = e.domainsUsed ?? [];
    const crossDomainLinks = e.crossDomainLinks ?? [];
    const primarySignals = e.primarySignals ?? [];
    const supportingSignals = e.supportingSignals ?? [];
    const hasCrossDomainPattern = domainsUsed.length >= 2 || crossDomainLinks.length > 0;
    const hasSupportSignal =
      supportingSignals.length > 0 ||
      domainsUsed.some((d) => ['sleep', 'somatic', 'trigger', 'relationship', 'reflections'].includes(d));

    if (!hasPersonalLanguageTexture(e)) reasons.push('missing specific recurring user language');
    if ((e.timeWindowDays ?? 0) <= 0) reasons.push('missing temporal anchor');
    if (!primarySignals.length && !crossDomainLinks.length) {
      reasons.push('missing behavioral or emotional pattern signal');
    }
    if (!hasCrossDomainPattern || !hasSupportSignal) {
      reasons.push('missing support signal from second domain');
    }
  }

  if (e.insightClass === 'deep_pattern') {
    if ((e.domainsUsed ?? []).length < 2) reasons.push('needs cross-domain evidence');
    if (e.repeatCount < 5) reasons.push('insufficient repetition');
    if (e.confidence < 0.8) reasons.push('confidence too low for deep pattern');
    if (e.isIdentityClaim) reasons.push('identity claim not allowed in deep pattern');
    if (reasons.length) return { allowed: false, downgradeTo: 'emerging_pattern', reasons };
  }

  if (e.insightClass === 'profile_inference') {
    if (e.confidence < 0.88) reasons.push('profile inference confidence too low');
    if ((e.domainsUsed ?? []).length < 2) reasons.push('profile inference needs multiple domains');
    if (e.repeatCount < 8) reasons.push('profile inference repetition too low');
    if (reasons.length) return { allowed: false, downgradeTo: 'emerging_pattern', reasons };
  }

  if (reasons.length) {
    return { allowed: false, reasons };
  }

  return { allowed: true, reasons: [] };
}

const QUALITY_GATE_SYSTEM_PROMPT = `You are the MySky Insight Quality Gate.

Review the proposed premium insight and its source evidence object.

Score (0.0 to 1.0):
- specificity
- crossDomainGrounding
- emotionalAccuracy
- paradoxDepth
- mySkyVoice
- premiumValue
- phraseCleanliness
- evidenceFit

Thresholds by class:
- deep_pattern: specificity >= 0.80, crossDomainGrounding >= 0.75, emotionalAccuracy >= 0.80, premiumValue >= 0.80, phraseCleanliness >= 0.90, evidenceFit >= 0.85
- emerging_pattern: specificity >= 0.65, emotionalAccuracy >= 0.75, phraseCleanliness >= 0.90, evidenceFit >= 0.75
- profile_inference: specificity >= 0.75, emotionalAccuracy >= 0.80, premiumValue >= 0.78, evidenceFit >= 0.90
- archive_stat: evidenceFit >= 0.95, phraseCleanliness >= 0.95

Reject the insight (set approved to false) if:
- Scores do not meet the thresholds above for the given class.
- The evidence or copy relies on generic categories alone, such as mood/stress/emotion/tag labels, without the user's repeated wording.
- It does not include at least three user-specific anchors: a temporal anchor, a behavioral/emotional pattern signal, and a supporting second-domain signal.
- It does not write from a real intersection of signals (for example sleep + check-in + journal language, somatic region + trigger + relationship entry, or best-day vs hard-day differences).
- The insight class requires high confidence but the wording is overconfident given the evidence.
- It uses typologies, archetype names (e.g., "The Caregiver"), or clinical categories without translating them into lived, human behavior.
- It makes flat identity claims ("you are...") instead of observational claims.
- It claims negative/neutral contextual states (like "fatigue", "lonely", "grief", "overwhelm") are "restorers" or "ingredients" simply because they co-occurred near recovery.
- It relies heavily on numbers as the core insight (unless archive_stat).
- It lacks a real paradox or tension (for deep patterns).
- It could plausibly fit many users (genericness).

If the insight has a weak signal but was written with high confidence, MUST reject it or set downgradeTo to "emerging_pattern".

Output only structured JSON matching the requested contract.`;

export async function runQualityGate(
  input: InsightQualityGateInput,
  accessToken: string,
): Promise<InsightQualityGateOutput | null> {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        model: 'gemini-2.5-flash',
        systemPrompt: QUALITY_GATE_SYSTEM_PROMPT,
        userPrompt: JSON.stringify(input),
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      },
    });

    if (error) {
      logger.error('[InsightQualityGate] Edge function error:', error);
      return null;
    }

    if (!data?.text) {
      logger.error('[InsightQualityGate] No text returned from proxy');
      return null;
    }

    const jsonText = data.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(jsonText);
    return parsed as InsightQualityGateOutput;
  } catch (error) {
    logger.error('[InsightQualityGate] Failed to run quality gate:', error);
    return null;
  }
}
