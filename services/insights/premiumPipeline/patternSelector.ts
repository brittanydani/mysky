import { supabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';
import type { PortraitBuilderOutput } from './portraitBuilder';

export interface PatternSelectorInput {
  portrait: PortraitBuilderOutput;
  recent_context: {
    last_7_days: any;
    last_14_days: any;
    today_state: any;
    recent_changes: any[];
    recent_glimmers: any[];
    recent_triggers: any[];
  };
  product_context: {
    insight_type: 'daily' | 'premium_deep';
    user_has_seen_recently: string[];
    avoid_repetition_themes: string[];
    minimum_novelty: number;
  };
}

export interface PatternSelectorOutput {
  selected_pattern: {
    id: string;
    insightClass: 'deep_pattern' | 'emerging_pattern' | 'profile_inference' | 'archive_stat';
    claim: string;
    userFacingTopic: string;
    domainsUsed: string[];
    timeWindowDays: number;
    repeatCount: number;
    confidence: number;
    novelty: number;
    emotionalWeight: number;
    stability: number;
    primarySignals: string[];
    supportingSignals: string[];
    crossDomainLinks: string[];
    userLanguageAnchors: string[];
    extractedPhrases: string[];
    phraseHealth: 'clean' | 'borderline' | 'broken';
    paradox: string | null;
    paradoxStrength: number;
    valenceClass: 'positive' | 'negative' | 'neutral' | 'mixed' | 'unknown';
    causalStrength: number;
    isIdentityClaim: boolean;
    stats: {
      bestDayLift?: number;
      hardDayLift?: number;
      coOccurrenceCount?: number;
      improvementFollowCount?: number;
      worseningFollowCount?: number;
      positiveCount?: number;
      negativeCount?: number;
      neutralCount?: number;
    };
  };
  writing_constraints: {
    must_include: string[];
    must_avoid: string[];
    tone_target: string;
    word_count_target: number;
  };
}

const PATTERN_SELECTOR_SYSTEM_PROMPT = `You are the MySky Pattern Selector.

Your job is to choose the single most meaningful pattern to surface right now, by outputting a structured evidence object.

Card Taxonomy & Eligibility Gates:
1. "deep_pattern"
   - Use for high-confidence, repeated, cross-domain insights.
   - Requirements: confidence >= 0.80, domainsUsed.length >= 2, repeatCount >= 5, stability >= 0.65, emotionalWeight >= 0.55, phraseHealth !== 'broken', isIdentityClaim === false.
2. "emerging_pattern"
   - Use for promising but not fully stable signals.
   - Requirements: confidence >= 0.55, domainsUsed.length >= 1, repeatCount >= 3, phraseHealth !== 'broken'.
3. "profile_inference" (e.g. Archetypes, Cognitive Style)
   - Use for higher-risk abstractions.
   - Requirements: confidence >= 0.88, domainsUsed.length >= 2, repeatCount >= 8, stability >= 0.75, phraseHealth === 'clean'.
4. "archive_stat"
   - Use for descriptive support only. Numbers only, no emotional claims.

Valence Classification Rules:
For each item, classify its valenceClass:
- "restorer" / "positive": Require either positiveCount >= 3 (and > negative * 2) OR improvementFollowCount >= 3 (and > worsening * 2).
- "drain" / "negative": Require either negativeCount >= 3 (and > positive * 2) OR worseningFollowCount >= 3 (and > improvement * 2).
- "context" / "mixed": Use if mostly neutral, frequent but not directionally helpful, or conflicting. 
- Hard block: fatigue, loneliness, grief, overwhelm, anxiety, shame, exhaustion, conflict, pressure MUST NOT be treated as positive restorers unless explicitly validated by the rules above.

Phrase Hygiene (CRITICAL):
Set phraseHealth:
- "clean": Natural language.
- "borderline": Readable but slightly awkward.
- "broken": Fragmented, >2 hyphens, slugified text ("the-situation-asks"), mid-fragment start/end.

Identity Claims:
Set isIdentityClaim = true if asserting "your dominant pattern is...", "you are...", "your intelligence profile is...". 
If true, only allowed in profile_inference with confidence >= 0.92, domains >= 2, repeatCount >= 10. Otherwise rewrite to observational language.

Do not write the final insight yet. Just output the structured evidence object matching the contract.`;

export async function selectPattern(
  input: PatternSelectorInput,
  accessToken: string,
): Promise<PatternSelectorOutput | null> {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        model: 'gemini-2.5-flash',
        systemPrompt: PATTERN_SELECTOR_SYSTEM_PROMPT,
        userPrompt: JSON.stringify(input),
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      },
    });

    if (error) {
      logger.error('[PatternSelector] Edge function error:', error);
      return null;
    }

    if (!data?.text) {
      logger.error('[PatternSelector] No text returned from proxy');
      return null;
    }

    const jsonText = data.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(jsonText);
    return parsed as PatternSelectorOutput;
  } catch (error) {
    logger.error('[PatternSelector] Failed to select pattern:', error);
    return null;
  }
}
