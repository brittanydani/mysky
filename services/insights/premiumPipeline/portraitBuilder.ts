import { supabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';

export interface PortraitBuilderInput {
  user_id: string;
  window: {
    recent_days: number;
    extended_days: number;
    lifetime_days: number;
  };
  check_ins: any[];
  journal_entries: any[];
  sleep_entries: any[];
  somatic_entries: any[];
  trigger_events: any[];
  relationship_patterns: any[];
  reflection_answers: any[];
  relationship_charts: any[];
  derived_metrics: {
    best_days: any[];
    hard_days: any[];
    cross_domain_patterns: any[];
    glimmer_patterns: any[];
    sleep_correlations: any[];
    tone_shifts: any[];
  };
}

export interface PortraitBuilderOutput {
  portrait_version: string;
  user_id: string;
  language_profile: {
    recurring_phrases: string[];
    hard_day_language: string[];
    better_day_language: string[];
    self_talk_style: string[];
    dominant_emotional_verbs: string[];
    dominant_metaphors: string[];
    tone_summary: string;
  };
  nervous_system_profile: {
    common_activation_states: string[];
    common_shutdown_states: string[];
    top_body_regions: string[];
    trigger_preconditions: string[];
    regulation_patterns: string[];
    glimmer_patterns: string[];
    sequence_patterns: string[];
    summary: string;
  };
  relational_profile: {
    most_salient_people: string[];
    regulating_dynamics: string[];
    destabilizing_dynamics: string[];
    attachment_themes: string[];
    repair_themes: string[];
    summary: string;
  };
  identity_profile: {
    core_values: string[];
    self_conflicts: string[];
    protective_adaptations: string[];
    longing_themes: string[];
    growth_edges: string[];
    summary: string;
  };
  pattern_inventory: Array<{
    id: string;
    pattern_type: 'cross_domain' | 'nervous_system' | 'relational' | 'restoration' | 'identity';
    summary: string;
    evidence: string[];
    frequency: number;
    stability: number;
    emotional_weight: number;
    novelty: number;
    confidence: number;
  }>;
  paradox_candidates: Array<{
    id: string;
    statement: string;
    evidence: string[];
    confidence: number;
  }>;
  insight_readiness: {
    premium_ready: boolean;
    reason: string;
    confidence: number;
  };
}

const PORTRAIT_BUILDER_SYSTEM_PROMPT = `You are the MySky Portrait Builder.

Your job is to build a structured psychological portrait of the user from their accumulated data.

You are not writing a user-facing insight yet.
Do not produce poetic prose.
Do not summarize vaguely.
Do not diagnose.
Do not generalize from one isolated event.

Your job is to identify:
- recurring user language
- repeated nervous-system patterns
- relational themes
- restoration/glimmer patterns
- self-conflicts and longing themes
- paradoxes the user appears to be holding
- cross-domain patterns that recur across multiple data types
- condition-based sequences, such as what tends to change after low sleep, hard mornings, specific triggers, or better days
- differences between hardest days and best days
- gaps between what the user reports directly and what body/journal/sleep patterns suggest indirectly

Use the user's actual wording whenever possible in recurring_phrases and tone summaries.
Prefer repeated patterns over one-off events.
Prefer intersections over single metrics.
Prefer emotionally meaningful patterns over trivial ones.
Do not treat generic labels like "stress", "mood", "sleep", "trigger", or "journal" as personalized language by themselves.

A pattern is stronger when it appears across multiple domains, such as:
- sleep + check-ins + journal tone
- somatic region + trigger events + relationship entries
- reflections + glimmers + better-day tone

Output only structured JSON matching the requested contract.`;

export async function buildPortrait(
  input: PortraitBuilderInput,
  accessToken: string,
  options?: { logErrors?: boolean },
): Promise<PortraitBuilderOutput | null> {
  const logErrors = options?.logErrors ?? true;
  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        model: 'gemini-2.5-flash',
        systemPrompt: PORTRAIT_BUILDER_SYSTEM_PROMPT,
        userPrompt: JSON.stringify(input),
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      },
    });

    if (error) {
      if (logErrors) logger.error('[PortraitBuilder] Edge function error:', error);
      return null;
    }

    if (!data?.text) {
      if (logErrors) logger.error('[PortraitBuilder] No text returned from proxy');
      return null;
    }

    const jsonText = data.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(jsonText);
    return parsed as PortraitBuilderOutput;
  } catch (error) {
    if (logErrors) logger.error('[PortraitBuilder] Failed to build portrait:', error);
    return null;
  }
}
