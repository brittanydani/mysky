import { IDENTITY_CLAIM_PATTERNS, type EligibilityResult, type InsightEvidence } from './types';

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

function containsIdentityLanguage(claim: string): boolean {
  const lowered = claim.toLowerCase();
  return IDENTITY_CLAIM_PATTERNS.some((pattern) => lowered.includes(pattern));
}

function isGenericClaim(claim: string): boolean {
  const lowered = claim.toLowerCase().trim();
  if (!lowered) return true;

  const genericStarts = [
    'you seem stressed',
    'you are healing',
    'you are growing',
    'you may be overwhelmed',
    'your data suggests a pattern',
  ];

  return genericStarts.some((x) => lowered.startsWith(x));
}

function normalizeAnchor(anchor: string): string {
  return anchor.trim().toLowerCase().replace(/\s+/g, ' ');
}

function hasPersonalLanguageTexture(evidence: InsightEvidence): boolean {
  const anchors = [...evidence.userLanguageAnchors, ...evidence.extractedPhrases]
    .map(normalizeAnchor)
    .filter(Boolean);

  return anchors.some((anchor) => !GENERIC_CATEGORY_ANCHORS.has(anchor));
}

export function evaluateEligibility(evidence: InsightEvidence): EligibilityResult {
  const reasons: string[] = [];
  const hasCrossDomainPattern = evidence.domainsUsed.length >= 2 || evidence.crossDomainLinks.length > 0;
  const hasRepeatedTheme =
    evidence.repeatCount >= 3 || evidence.userLanguageAnchors.length > 0 || evidence.extractedPhrases.length > 0;
  const hasTemporalAnchor = evidence.timeWindowDays > 0;
  const hasPatternSignal = evidence.primarySignals.length > 0 || evidence.crossDomainLinks.length > 0;
  const hasSupportSignal =
    evidence.supportingSignals.length > 0 ||
    evidence.domainsUsed.some((d) => ['sleep', 'somatic', 'trigger', 'relationship', 'reflections'].includes(d));
  const hasSecondDomainSignal = hasCrossDomainPattern && hasSupportSignal;
  const hasLanguageTexture = hasPersonalLanguageTexture(evidence);

  if (evidence.phraseHealth === 'broken') {
    return { allowed: false, reasons: ['broken phrase hygiene'] };
  }

  if (evidence.confidence < 0.4) {
    return { allowed: false, reasons: ['confidence too low'] };
  }

  if (evidence.repeatCount < 2) {
    return { allowed: false, reasons: ['insufficient repetition'] };
  }

  if (isGenericClaim(evidence.claim)) {
    return { allowed: false, reasons: ['claim too generic'] };
  }

  if (evidence.insightClass !== 'archive_stat' && !hasLanguageTexture) {
    reasons.push('missing specific recurring user language');
  }

  if (containsIdentityLanguage(evidence.claim)) {
    evidence.isIdentityClaim = true;
  }

  if (evidence.insightClass !== 'archive_stat') {
    if (!hasRepeatedTheme) reasons.push('missing repeated user-specific theme');
    if (!hasTemporalAnchor) reasons.push('missing temporal anchor');
    if (!hasPatternSignal) reasons.push('missing behavioral or emotional pattern signal');
    if (!hasSecondDomainSignal) reasons.push('missing support signal from second domain');
  }

  switch (evidence.insightClass) {
    case 'deep_pattern': {
      if (!hasCrossDomainPattern) reasons.push('needs cross-domain evidence');
      if (evidence.repeatCount < 5) reasons.push('deep pattern repeat count too low');
      if (evidence.confidence < 0.8) reasons.push('deep pattern confidence too low');
      if (evidence.stability < 0.65) reasons.push('stability too low');
      if (evidence.emotionalWeight < 0.55) reasons.push('emotional weight too low');
      if (evidence.paradoxStrength < 0.45) reasons.push('paradox not strong enough for premium depth');
      if (evidence.isIdentityClaim) reasons.push('identity claim not allowed in deep pattern');

      if (reasons.length > 0) {
        return { allowed: false, downgradeTo: 'emerging_pattern', reasons };
      }

      return { allowed: true, reasons: [] };
    }

    case 'emerging_pattern': {
      if (evidence.repeatCount < 3) reasons.push('emerging pattern repeat count too low');
      if (evidence.confidence < 0.55) reasons.push('emerging pattern confidence too low');
      if (!hasCrossDomainPattern && evidence.supportingSignals.length === 0) reasons.push('emerging pattern lacks meaningful support');
      if (evidence.isIdentityClaim) reasons.push('identity claim too strong for emerging pattern');

      if (reasons.length > 0) {
        return { allowed: false, reasons };
      }

      return { allowed: true, reasons: [] };
    }

    case 'profile_inference': {
      if (!hasCrossDomainPattern) reasons.push('profile inference needs multiple domains');
      if (evidence.repeatCount < 8) reasons.push('profile inference repeat count too low');
      if (evidence.confidence < 0.88) reasons.push('profile inference confidence too low');
      if (evidence.stability < 0.75) reasons.push('profile inference stability too low');
      if (evidence.paradoxStrength < 0.4) reasons.push('profile inference paradox too weak');

      if (reasons.length > 0) {
        return { allowed: false, downgradeTo: 'emerging_pattern', reasons };
      }

      return { allowed: true, reasons: [] };
    }

    case 'archive_stat': {
      return { allowed: true, reasons };
    }

    default:
      return { allowed: false, reasons: ['unknown insight class'] };
  }
}
