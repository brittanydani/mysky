import type {
  InsightCandidate,
  InsightClass,
  InsightQualityScores,
  QualityGateResult,
} from './types';

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
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

function hasPersonalLanguageTexture(candidate: InsightCandidate): boolean {
  const anchors = [
    ...candidate.evidence.userLanguageAnchors,
    ...candidate.evidence.extractedPhrases,
  ]
    .map((anchor) => anchor.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean);

  return anchors.some((anchor) => !GENERIC_CATEGORY_ANCHORS.has(anchor));
}

function hasTailoredIntersection(candidate: InsightCandidate): boolean {
  const hasTemporalAnchor = candidate.evidence.timeWindowDays > 0;
  const hasPatternSignal =
    candidate.evidence.primarySignals.length > 0 ||
    candidate.evidence.crossDomainLinks.length > 0;
  const hasCrossDomainSupport =
    candidate.evidence.domainsUsed.length >= 2 &&
    (candidate.evidence.supportingSignals.length > 0 ||
      candidate.evidence.crossDomainLinks.length > 0 ||
      candidate.evidence.domainsUsed.some((d) =>
        ['sleep', 'somatic', 'trigger', 'relationship', 'reflections'].includes(d),
      ));

  return hasTemporalAnchor && hasPatternSignal && hasCrossDomainSupport;
}

function scoreSpecificity(candidate: InsightCandidate): number {
  const text = `${candidate.title} ${candidate.body}`.toLowerCase();
  let score = 0.4;

  if (candidate.evidence.domainsUsed.length >= 2) score += 0.15;
  if (hasPersonalLanguageTexture(candidate)) score += 0.15;
  if (candidate.evidence.repeatCount >= 5) score += 0.1;
  if (candidate.evidence.timeWindowDays > 0) score += 0.05;
  if (candidate.evidence.primarySignals.length >= 2) score += 0.1;
  if (hasTailoredIntersection(candidate)) score += 0.05;
  if (/\b\d+\b/.test(text)) score += 0.05;

  return clamp01(score);
}

function scoreCrossDomain(candidate: InsightCandidate): number {
  let score = 0.2;
  score += Math.min(candidate.evidence.domainsUsed.length, 3) * 0.2;
  score += Math.min(candidate.evidence.crossDomainLinks.length, 3) * 0.1;
  return clamp01(score);
}

function scoreEmotionalAccuracy(candidate: InsightCandidate): number {
  const text = candidate.body.toLowerCase();
  let score = 0.6;

  if (text.includes('may be less about')) score += 0.08;
  if (text.includes('seem') || text.includes('suggests') || text.includes('appears')) score += 0.06;
  if (candidate.evidence.confidence >= 0.8) score += 0.08;
  if (!text.includes('you need to')) score += 0.08;
  if (!text.includes('everything happens for a reason')) score += 0.05;

  return clamp01(score);
}

function scoreParadox(candidate: InsightCandidate): number {
  const text = candidate.body.toLowerCase();
  let score = candidate.evidence.paradoxStrength * 0.7;

  if (text.includes('both') || text.includes('while') || text.includes('at the same time')) {
    score += 0.2;
  }

  return clamp01(score);
}

function scoreMySkyVoice(candidate: InsightCandidate): number {
  const text = `${candidate.title} ${candidate.body}`.toLowerCase();
  let score = 0.5;

  if (text.includes('what stands out')) score += 0.08;
  if (text.includes('the invitation')) score += 0.08;
  if (text.includes('may be')) score += 0.06;
  if (!text.includes('self-care')) score += 0.08;
  if (!text.includes('you are healing')) score += 0.08;
  if (!text.includes('your intelligence profile is')) score += 0.12;

  return clamp01(score);
}

function scorePremiumValue(candidate: InsightCandidate): number {
  let score = 0.35;

  if (candidate.evidence.domainsUsed.length >= 2) score += 0.15;
  if (candidate.evidence.emotionalWeight >= 0.6) score += 0.15;
  if (hasPersonalLanguageTexture(candidate)) score += 0.1;
  if (candidate.evidence.paradoxStrength >= 0.5) score += 0.1;
  if (hasTailoredIntersection(candidate)) score += 0.08;
  if (candidate.class === 'archive_stat') score -= 0.2;

  return clamp01(score);
}

function scoreEarnedInsight(candidate: InsightCandidate): number {
  let score = 0.2;

  if (candidate.evidence.repeatCount >= 3) score += 0.15;
  if (candidate.evidence.repeatCount >= 5) score += 0.1;
  if (candidate.evidence.domainsUsed.length >= 2) score += 0.15;
  if (candidate.evidence.crossDomainLinks.length > 0) score += 0.15;
  if (hasPersonalLanguageTexture(candidate)) score += 0.1;
  if (candidate.evidence.supportingSignals.length > 0) score += 0.1;
  if (candidate.evidence.paradoxStrength >= 0.45) score += 0.05;
  if (hasTailoredIntersection(candidate)) score += 0.1;

  return clamp01(score);
}

function scorePhraseCleanliness(candidate: InsightCandidate): number {
  if (candidate.evidence.phraseHealth === 'broken') return 0;
  if (candidate.evidence.phraseHealth === 'borderline') return 0.65;
  return 1;
}

function scoreEvidenceFit(candidate: InsightCandidate): number {
  let score = 0.4;

  if (candidate.class === candidate.evidence.insightClass) score += 0.2;
  if (candidate.evidence.confidence >= 0.8) score += 0.15;
  if (candidate.evidence.repeatCount >= 5) score += 0.1;
  if (candidate.evidence.primarySignals.length > 0) score += 0.05;
  if (candidate.evidence.supportingSignals.length > 0) score += 0.05;

  return clamp01(score);
}

export function computeQualityScores(candidate: InsightCandidate): InsightQualityScores {
  return {
    specificity: scoreSpecificity(candidate),
    crossDomainGrounding: scoreCrossDomain(candidate),
    emotionalAccuracy: scoreEmotionalAccuracy(candidate),
    paradoxDepth: scoreParadox(candidate),
    mySkyVoice: scoreMySkyVoice(candidate),
    premiumValue: scorePremiumValue(candidate),
    earnedInsight: scoreEarnedInsight(candidate),
    phraseCleanliness: scorePhraseCleanliness(candidate),
    evidenceFit: scoreEvidenceFit(candidate),
  };
}

function thresholdsForClass(insightClass: InsightClass) {
  switch (insightClass) {
    case 'deep_pattern':
      return {
        specificity: 0.8,
        crossDomainGrounding: 0.75,
        emotionalAccuracy: 0.8,
        paradoxDepth: 0.55,
        premiumValue: 0.8,
        earnedInsight: 0.8,
        phraseCleanliness: 0.9,
        evidenceFit: 0.85,
      };
    case 'emerging_pattern':
      return {
        specificity: 0.65,
        crossDomainGrounding: 0.4,
        emotionalAccuracy: 0.75,
        paradoxDepth: 0.2,
        premiumValue: 0.65,
        earnedInsight: 0.55,
        phraseCleanliness: 0.9,
        evidenceFit: 0.75,
      };
    case 'profile_inference':
      return {
        specificity: 0.75,
        crossDomainGrounding: 0.65,
        emotionalAccuracy: 0.8,
        paradoxDepth: 0.35,
        premiumValue: 0.78,
        earnedInsight: 0.75,
        phraseCleanliness: 0.9,
        evidenceFit: 0.9,
      };
    case 'archive_stat':
      return {
        specificity: 0.4,
        crossDomainGrounding: 0.2,
        emotionalAccuracy: 0.5,
        paradoxDepth: 0,
        premiumValue: 0.3,
        earnedInsight: 0.3,
        phraseCleanliness: 0.95,
        evidenceFit: 0.95,
      };
  }
}

export function runQualityGate(candidate: InsightCandidate): QualityGateResult {
  const scores = computeQualityScores(candidate);
  const thresholds = thresholdsForClass(candidate.class);
  const reasons: string[] = [];

  if (scores.specificity < thresholds.specificity) reasons.push('specificity too low');
  if (scores.crossDomainGrounding < thresholds.crossDomainGrounding) reasons.push('cross-domain grounding too low');
  if (scores.emotionalAccuracy < thresholds.emotionalAccuracy) reasons.push('emotional accuracy too low');
  if (scores.paradoxDepth < thresholds.paradoxDepth) reasons.push('paradox depth too low');
  if (scores.premiumValue < thresholds.premiumValue) reasons.push('premium value too low');
  if (scores.earnedInsight < thresholds.earnedInsight) reasons.push('insight does not feel earned');
  if (scores.phraseCleanliness < thresholds.phraseCleanliness) reasons.push('phrase cleanliness too low');
  if (scores.evidenceFit < thresholds.evidenceFit) reasons.push('evidence fit too low');
  if (candidate.class !== 'archive_stat' && !hasPersonalLanguageTexture(candidate)) {
    reasons.push('missing specific recurring user language');
  }
  if (candidate.class !== 'archive_stat' && !hasTailoredIntersection(candidate)) {
    reasons.push('missing tailored intersection of time, pattern, and second-domain support');
  }

  return {
    allowed: reasons.length === 0,
    scores,
    reasons,
    downgradeTo:
      !reasons.length || candidate.class === 'archive_stat'
        ? undefined
        : candidate.class === 'profile_inference' || candidate.class === 'deep_pattern'
          ? 'emerging_pattern'
          : undefined,
  };
}
