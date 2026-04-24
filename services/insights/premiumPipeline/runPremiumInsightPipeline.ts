/**
 * runPremiumInsightPipeline
 *
 * Sequences the full premium insight generation flow:
 *
 *   1. buildPortrait      — Gemini builds a structured psychological portrait
 *   2. selectPattern      — Gemini selects the strongest pattern + evidence object
 *   3. classifyInsight    — local: assigns InsightClass from evidence signals
 *   4. validateInsightCandidate — local: eligibility + quality gate (pre-write)
 *   5. writePremiumInsight — Gemini writes the user-facing insight copy
 *   6. canRenderInsight   — local: final eligibility check on the written output
 *   7. downgradeInsight   — local: softens identity/causal language if needed
 *   8. runQualityGate     — Gemini: final AI quality review + approval
 *
 * Returns a fully validated, render-ready InsightCandidate, or null if any
 * hard-block gate fires and no safe downgrade is possible.
 *
 * Privacy: no raw journal text or PII is sent to Gemini — only aggregated
 * pattern data and the structured portrait/evidence objects.
 */

import { logger } from '../../../utils/logger';
import { buildPortrait, type PortraitBuilderInput } from './portraitBuilder';
import { selectPattern, type PatternSelectorInput } from './patternSelector';
import { writePremiumInsight, type PremiumInsightWriterInput } from './premiumInsightWriter';
import { canRenderInsight, runQualityGate, type InsightQualityGateInput } from './insightQualityGate';
import { classifyInsight, buildEvidenceForClassification } from '../premium/classifier';
import { validateInsightCandidate } from '../premium/orchestrator';
import { downgradeInsight } from '../premium/downgrade';
import type { InsightCandidate, InsightEvidence } from '../premium/types';

// ─── Public output type ───────────────────────────────────────────────────────

export interface PremiumInsightResult {
  /** The validated, render-ready insight */
  candidate: InsightCandidate;
  /** Final class after any downgrades */
  finalClass: InsightCandidate['class'];
  /** Whether the AI quality gate approved the output */
  aiApproved: boolean;
  /** Scores from the AI quality gate (null if gate was skipped due to error) */
  qualityScores: Record<string, number> | null;
}

// ─── Style guide (passed to the writer) ──────────────────────────────────────

const STYLE_GUIDE: PremiumInsightWriterInput['style_guide'] = {
  brand: 'MySky',
  tone: [
    'observant',
    'intimate',
    'humble',
    'restrained',
    'quietly beautiful',
    'psychologically precise',
  ],
  forbidden_phrases: [
    'you need to',
    'self-care',
    'everything happens for a reason',
    'you are healing',
    'it sounds like',
    'based on your data',
    'your dominant pattern is',
    'your intelligence profile is',
    'your cognitive style is',
  ],
  required_structure: [
    'one unique pattern intersection, not a single metric',
    'one temporal anchor',
    'one concrete repeated pattern using the user’s real language',
    'one supporting second-domain signal',
    'one emotional meaning',
    'one paradox or tension (for deep_pattern)',
    'one gentle invitation',
  ],
  anchor_requirements: [
    'actual recurring user language',
    'actual timing or sequence',
    'actual cross-domain combination',
    'best-day versus hard-day difference when available',
    'explicit versus indirect signal gap when available',
  ],
};

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function runPremiumInsightPipeline(
  portraitInput: PortraitBuilderInput,
  patternSelectorInput: Omit<PatternSelectorInput, 'portrait'>,
  accessToken: string,
  options?: { logLifecycle?: boolean; logErrors?: boolean },
): Promise<PremiumInsightResult | null> {
  const logLifecycle = options?.logLifecycle ?? true;
  const logErrors = options?.logErrors ?? true;
  const info = (...args: any[]) => { if (logLifecycle) logger.info(...args); };
  const warn = (...args: any[]) => { if (logErrors || logLifecycle) logger.warn(...args); };
  // ── Step 1: Build portrait ──────────────────────────────────────────────────
  info('[PremiumPipeline] Step 1: Building portrait...');
  const portrait = await buildPortrait(portraitInput, accessToken, { logErrors });
  if (!portrait) {
    warn('[PremiumPipeline] Portrait build failed — aborting.');
    return null;
  }

  if (!portrait.insight_readiness.premium_ready) {
    info('[PremiumPipeline] Portrait not premium-ready:', portrait.insight_readiness.reason);
    return null;
  }

  // ── Step 2: Select pattern ──────────────────────────────────────────────────
  info('[PremiumPipeline] Step 2: Selecting pattern...');
  const patternResult = await selectPattern(
    { ...patternSelectorInput, portrait },
    accessToken,
  );
  if (!patternResult) {
    warn('[PremiumPipeline] Pattern selection failed — aborting.');
    return null;
  }

  const sp = patternResult.selected_pattern;

  // ── Step 3: Local classification ────────────────────────────────────────────
  info('[PremiumPipeline] Step 3: Classifying insight locally...');
  const classification = classifyInsight({
    claim: sp.claim,
    userFacingTopic: sp.userFacingTopic,
    domainsUsed: sp.domainsUsed as InsightEvidence['domainsUsed'],
    timeWindowDays: sp.timeWindowDays,
    repeatCount: sp.repeatCount,
    confidence: sp.confidence,
    novelty: sp.novelty,
    emotionalWeight: sp.emotionalWeight,
    stability: sp.stability,
    primarySignals: sp.primarySignals,
    supportingSignals: sp.supportingSignals,
    crossDomainLinks: sp.crossDomainLinks,
    userLanguageAnchors: sp.userLanguageAnchors,
    extractedPhrases: sp.extractedPhrases,
    phraseHealth: sp.phraseHealth,
    paradox: sp.paradox,
    paradoxStrength: sp.paradoxStrength,
    isIdentityClaim: sp.isIdentityClaim,
  });

  if (classification.warnings.length > 0) {
    info('[PremiumPipeline] Classifier warnings:', classification.warnings);
  }

  // Build the full evidence object with the locally-assigned class
  const evidence = buildEvidenceForClassification({
    id: sp.id,
    claim: sp.claim,
    userFacingTopic: sp.userFacingTopic,
    domainsUsed: sp.domainsUsed as InsightEvidence['domainsUsed'],
    timeWindowDays: sp.timeWindowDays,
    repeatCount: sp.repeatCount,
    confidence: sp.confidence,
    novelty: sp.novelty,
    emotionalWeight: sp.emotionalWeight,
    stability: sp.stability,
    primarySignals: sp.primarySignals,
    supportingSignals: sp.supportingSignals,
    crossDomainLinks: sp.crossDomainLinks,
    userLanguageAnchors: sp.userLanguageAnchors,
    extractedPhrases: sp.extractedPhrases,
    phraseHealth: sp.phraseHealth,
    paradox: sp.paradox ?? null,
    paradoxStrength: sp.paradoxStrength,
    valenceClass: sp.valenceClass,
    causalStrength: sp.causalStrength,
    isIdentityClaim: sp.isIdentityClaim,
    stats: sp.stats,
  });

  // ── Step 4: Local pre-write validation ──────────────────────────────────────
  info('[PremiumPipeline] Step 4: Running local pre-write validation...');

  // Build a minimal candidate for the orchestrator (body/title not yet written)
  const preWriteCandidate: InsightCandidate = {
    title: sp.userFacingTopic,
    body: sp.claim,
    class: evidence.insightClass,
    evidence,
  };

  const preValidation = validateInsightCandidate(preWriteCandidate);
  if (preValidation.status === 'blocked') {
    const stage = preValidation.stage;
    const reasons =
      stage === 'eligibility'
        ? preValidation.eligibility.reasons
        : preValidation.quality?.reasons ?? [];

    info(`[PremiumPipeline] Pre-write validation blocked at ${stage}:`, reasons);

    // If there's a downgrade suggestion, adjust the class and continue
    const downgradeTo =
      stage === 'eligibility'
        ? preValidation.eligibility.downgradeTo
        : preValidation.quality?.downgradeTo;

    if (!downgradeTo) {
      warn('[PremiumPipeline] No downgrade path — aborting.');
      return null;
    }

    info(`[PremiumPipeline] Downgrading to ${downgradeTo} and continuing.`);
    evidence.insightClass = downgradeTo;
    preWriteCandidate.class = downgradeTo;
  }

  // ── Step 5: Write premium insight ───────────────────────────────────────────
  info('[PremiumPipeline] Step 5: Writing premium insight...');
  const writerInput: PremiumInsightWriterInput = {
    portrait,
    selected_pattern: {
      ...sp,
      insightClass: evidence.insightClass,
    },
    writing_constraints: patternResult.writing_constraints,
    style_guide: STYLE_GUIDE,
  };

  const written = await writePremiumInsight(writerInput, accessToken);
  if (!written) {
    warn('[PremiumPipeline] Insight writing failed — aborting.');
    return null;
  }

  // ── Step 6: Local render eligibility check ──────────────────────────────────
  info('[PremiumPipeline] Step 6: Running local render eligibility check...');
  const renderCheck = canRenderInsight({
    ...sp,
    insightClass: evidence.insightClass,
  });

  let finalClass = evidence.insightClass;

  if (!renderCheck.allowed) {
    info('[PremiumPipeline] Render check blocked:', renderCheck.reasons);
    if (renderCheck.downgradeTo) {
      info(`[PremiumPipeline] Downgrading to ${renderCheck.downgradeTo}.`);
      finalClass = renderCheck.downgradeTo;
    } else {
      warn('[PremiumPipeline] No render downgrade path — aborting.');
      return null;
    }
  }

  // ── Step 7: Local downgrade pass ────────────────────────────────────────────
  info('[PremiumPipeline] Step 7: Running local downgrade pass...');
  let candidate: InsightCandidate = {
    title: written.title,
    body: written.body,
    invitation: written.invitation,
    class: finalClass,
    evidence: { ...evidence, insightClass: finalClass },
  };

  candidate = downgradeInsight(candidate);
  finalClass = candidate.class;

  // ── Step 8: AI quality gate ─────────────────────────────────────────────────
  info('[PremiumPipeline] Step 8: Running AI quality gate...');
  const qualityGateInput: InsightQualityGateInput = {
    draft_insight: {
      title: candidate.title,
      body: candidate.body,
      invitation: candidate.invitation ?? '',
      quality_checks: {
        specificity_score: written.quality_checks.specificity_score,
        cross_domain_grounding_score: written.quality_checks.cross_domain_grounding_score,
        emotional_accuracy_score: written.quality_checks.emotional_accuracy_score,
        paradox_score: written.quality_checks.paradox_score,
        mySky_voice_score: written.quality_checks.mySky_voice_score,
        premium_score: written.quality_checks.premium_score,
      },
    },
    evidence: {
      ...sp,
      insightClass: finalClass,
    },
  };

  const gateResult = await runQualityGate(qualityGateInput, accessToken);

  if (gateResult && !gateResult.approved) {
    info('[PremiumPipeline] AI quality gate rejected:', gateResult.reason);

    if (gateResult.downgradeTo) {
      info(`[PremiumPipeline] AI gate downgrading to ${gateResult.downgradeTo}.`);
      finalClass = gateResult.downgradeTo;
      candidate = downgradeInsight({ ...candidate, class: finalClass });
    } else {
      // Hard reject — suppress the insight
      warn('[PremiumPipeline] AI gate hard-rejected insight — suppressing.');
      return null;
    }
  }

  info('[PremiumPipeline] Pipeline complete. Final class:', finalClass);

  return {
    candidate,
    finalClass,
    aiApproved: gateResult?.approved ?? false,
    qualityScores: gateResult?.scores ?? null,
  };
}
