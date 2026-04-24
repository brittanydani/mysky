import { evaluatePhraseHealth } from './phraseHygiene';
import { evaluateEligibility } from './eligibility';
import { runQualityGate } from './qualityGate';
import type { InsightCandidate } from './types';

export function validateInsightCandidate(candidate: InsightCandidate) {
  const phraseChecks = candidate.evidence.extractedPhrases.map(evaluatePhraseHealth);
  const brokenPhrase = phraseChecks.find((p) => p.health === 'broken');

  if (brokenPhrase) {
    candidate.evidence.phraseHealth = 'broken';
  }

  const eligibility = evaluateEligibility(candidate.evidence);
  if (!eligibility.allowed) {
    return {
      status: 'blocked' as const,
      stage: 'eligibility' as const,
      eligibility,
    };
  }

  const quality = runQualityGate(candidate);
  if (!quality.allowed) {
    return {
      status: 'blocked' as const,
      stage: 'quality' as const,
      quality,
    };
  }

  return {
    status: 'approved' as const,
    eligibility,
    quality,
  };
}
