import type {
  InsightClass,
  InsightDomain,
  InsightEvidence,
  RiskTier,
} from './types';
import { RISK_BY_CLASS } from './types';

export interface ClassifierInput {
  claim: string;
  userFacingTopic: string;

  domainsUsed: InsightDomain[];
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
  phraseHealth: InsightEvidence['phraseHealth'];

  paradox?: string | null;
  paradoxStrength: number;

  isIdentityClaim?: boolean;
  isMostlyNumeric?: boolean;
  isPrimarilyDescriptive?: boolean;
  hasStrongBehavioralGrounding?: boolean;
}

export interface ClassificationResult {
  assignedClass: InsightClass;
  riskTier: RiskTier;
  reasons: string[];
  warnings: string[];
}

function normalize(input: string): string {
  return input.trim().toLowerCase();
}

function containsAny(text: string, patterns: string[]): boolean {
  const normalized = normalize(text);
  return patterns.some((p) => normalized.includes(normalize(p)));
}

const PROFILE_KEYWORDS = [
  'cognitive style',
  'intelligence profile',
  'archetype',
  'dominant pattern',
  'caregiver',
  'orphan',
  'shadow',
  'attachment style',
  'your intelligence',
  'your cognitive',
];

const STAT_KEYWORDS = [
  'days observed',
  'total answers',
  'reflections',
  'logged days',
  'top values',
  'top category',
  'observed across',
  'insight',
];

const DEEP_PATTERN_KEYWORDS = [
  'keeps returning',
  'points to the same place',
  'what restores you',
  'recovery pattern',
  'recurring theme',
  'relational mirror',
  'body',
  'stress-linked',
  'harder days',
  'repair',
  'bracing',
  'glimmer',
  'trigger',
];

function inferIdentityClaim(claim: string, topic: string): boolean {
  const combined = `${claim} ${topic}`;
  return containsAny(combined, [
    'you are',
    'your dominant pattern is',
    'your intelligence profile',
    'your cognitive style',
    'the shadow to watch',
    'your archetype',
    'dominant archetype',
  ]);
}

function inferMostlyNumeric(input: ClassifierInput): boolean {
  const combined = `${input.claim} ${input.userFacingTopic}`;
  const numericSignals =
    (combined.match(/\b\d+\b/g) ?? []).length +
    input.primarySignals.filter((s) => /\b\d+\b/.test(s)).length +
    input.supportingSignals.filter((s) => /\b\d+\b/.test(s)).length;

  return (
    numericSignals >= 3 ||
    (input.primarySignals.length > 0 &&
      input.primarySignals.every((s) => /\b\d+\b/.test(s)))
  );
}

function inferPrimarilyDescriptive(input: ClassifierInput): boolean {
  const combined = `${input.claim} ${input.userFacingTopic}`;

  return (
    containsAny(combined, STAT_KEYWORDS) &&
    input.paradoxStrength < 0.2 &&
    input.crossDomainLinks.length === 0 &&
    input.emotionalWeight < 0.45
  );
}

function inferStrongBehavioralGrounding(input: ClassifierInput): boolean {
  return (
    input.domainsUsed.length >= 2 ||
    input.crossDomainLinks.length >= 2 ||
    (input.primarySignals.length >= 2 && input.repeatCount >= 5)
  );
}

function qualifiesAsDeepPattern(input: ClassifierInput): boolean {
  return (
    input.domainsUsed.length >= 2 &&
    input.repeatCount >= 5 &&
    input.confidence >= 0.8 &&
    input.stability >= 0.65 &&
    input.emotionalWeight >= 0.55 &&
    input.paradoxStrength >= 0.35 &&
    !input.isMostlyNumeric &&
    !input.isIdentityClaim &&
    input.phraseHealth !== 'broken'
  );
}

function qualifiesAsProfileInference(input: ClassifierInput): boolean {
  const combined = `${input.claim} ${input.userFacingTopic}`;

  return (
    (input.isIdentityClaim || containsAny(combined, PROFILE_KEYWORDS)) &&
    input.domainsUsed.length >= 2 &&
    input.repeatCount >= 8 &&
    input.confidence >= 0.88 &&
    input.stability >= 0.75 &&
    input.phraseHealth === 'clean'
  );
}

function qualifiesAsArchiveStat(input: ClassifierInput): boolean {
  const combined = `${input.claim} ${input.userFacingTopic}`;

  return (
    input.isMostlyNumeric ||
    input.isPrimarilyDescriptive ||
    (containsAny(combined, STAT_KEYWORDS) &&
      input.crossDomainLinks.length === 0 &&
      input.paradoxStrength < 0.2)
  );
}

function qualifiesAsEmergingPattern(input: ClassifierInput): boolean {
  return (
    input.repeatCount >= 3 &&
    input.confidence >= 0.55 &&
    input.phraseHealth !== 'broken'
  );
}

export function classifyInsight(input: ClassifierInput): ClassificationResult {
  const reasons: string[] = [];
  const warnings: string[] = [];

  const enriched: ClassifierInput = {
    ...input,
    isIdentityClaim:
      input.isIdentityClaim ?? inferIdentityClaim(input.claim, input.userFacingTopic),
    isMostlyNumeric: input.isMostlyNumeric ?? inferMostlyNumeric(input),
    isPrimarilyDescriptive:
      input.isPrimarilyDescriptive ?? inferPrimarilyDescriptive(input),
    hasStrongBehavioralGrounding:
      input.hasStrongBehavioralGrounding ?? inferStrongBehavioralGrounding(input),
  };

  const combined = `${enriched.claim} ${enriched.userFacingTopic}`;

  if (enriched.phraseHealth === 'broken') {
    warnings.push('phrase hygiene is broken');
  }

  if (enriched.isIdentityClaim && enriched.confidence < 0.92) {
    warnings.push('identity-level framing may be too strong for current confidence');
  }

  if (enriched.isMostlyNumeric) {
    warnings.push('candidate is mostly numeric');
  }

  if (
    containsAny(combined, DEEP_PATTERN_KEYWORDS) &&
    enriched.domainsUsed.length < 2
  ) {
    warnings.push('pattern-like framing without enough cross-domain grounding');
  }

  if (qualifiesAsDeepPattern(enriched)) {
    reasons.push('meets deep pattern thresholds');
    reasons.push('cross-domain and emotionally meaningful');
    return {
      assignedClass: 'deep_pattern',
      riskTier: RISK_BY_CLASS.deep_pattern,
      reasons,
      warnings,
    };
  }

  if (qualifiesAsProfileInference(enriched)) {
    reasons.push('matches profile inference framing');
    reasons.push('meets high-confidence thresholds');
    return {
      assignedClass: 'profile_inference',
      riskTier: RISK_BY_CLASS.profile_inference,
      reasons,
      warnings,
    };
  }

  if (qualifiesAsArchiveStat(enriched)) {
    reasons.push('candidate is primarily descriptive/statistical');
    return {
      assignedClass: 'archive_stat',
      riskTier: RISK_BY_CLASS.archive_stat,
      reasons,
      warnings,
    };
  }

  if (qualifiesAsEmergingPattern(enriched)) {
    reasons.push('signal exists but does not yet earn deep-pattern authority');
    if (enriched.isIdentityClaim) {
      warnings.push('rewrite with observational wording');
    }
    return {
      assignedClass: 'emerging_pattern',
      riskTier: RISK_BY_CLASS.emerging_pattern,
      reasons,
      warnings,
    };
  }

  reasons.push('insufficient evidence for premium classification');
  warnings.push('candidate should likely be suppressed');
  return {
    assignedClass: 'archive_stat',
    riskTier: RISK_BY_CLASS.archive_stat,
    reasons,
    warnings,
  };
}

export function buildEvidenceForClassification(
  partial: Omit<InsightEvidence, 'insightClass'>
): InsightEvidence {
  const result = classifyInsight({
    claim: partial.claim,
    userFacingTopic: partial.userFacingTopic,
    domainsUsed: partial.domainsUsed,
    timeWindowDays: partial.timeWindowDays,
    repeatCount: partial.repeatCount,
    confidence: partial.confidence,
    novelty: partial.novelty,
    emotionalWeight: partial.emotionalWeight,
    stability: partial.stability,
    primarySignals: partial.primarySignals,
    supportingSignals: partial.supportingSignals,
    crossDomainLinks: partial.crossDomainLinks,
    userLanguageAnchors: partial.userLanguageAnchors,
    extractedPhrases: partial.extractedPhrases,
    phraseHealth: partial.phraseHealth,
    paradox: partial.paradox,
    paradoxStrength: partial.paradoxStrength,
    isIdentityClaim: partial.isIdentityClaim,
  });

  return {
    ...partial,
    insightClass: result.assignedClass,
  };
}
