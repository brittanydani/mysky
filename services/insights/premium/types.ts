export type InsightClass =
  | 'deep_pattern'
  | 'emerging_pattern'
  | 'profile_inference'
  | 'archive_stat';

export type InsightDomain =
  | 'check_ins'
  | 'journal'
  | 'sleep'
  | 'somatic'
  | 'trigger'
  | 'relationship'
  | 'reflections'
  | 'values'
  | 'archetypes'
  | 'cognitive'
  | 'intelligence';

export type ValenceClass = 'positive' | 'negative' | 'neutral' | 'mixed' | 'unknown';

export type ConditionRole = 'restorer' | 'drain' | 'context' | 'mixed';

export type PhraseHealth = 'clean' | 'borderline' | 'broken';

export type RiskTier = 'safe' | 'medium' | 'high';

export interface InsightStats {
  bestDayLift?: number;
  hardDayLift?: number;
  coOccurrenceCount?: number;
  improvementFollowCount?: number;
  worseningFollowCount?: number;
  positiveCount?: number;
  negativeCount?: number;
  neutralCount?: number;
}

export interface InsightEvidence {
  id: string;
  insightClass: InsightClass;

  claim: string;
  userFacingTopic: string;

  domainsUsed: InsightDomain[];
  timeWindowDays: number;
  repeatCount: number;

  confidence: number; // 0..1
  novelty: number; // 0..1
  emotionalWeight: number; // 0..1
  stability: number; // 0..1

  primarySignals: string[];
  supportingSignals: string[];
  crossDomainLinks: string[];

  userLanguageAnchors: string[];
  extractedPhrases: string[];
  phraseHealth: PhraseHealth;

  paradox?: string | null;
  paradoxStrength: number; // 0..1

  valenceClass: ValenceClass;
  causalStrength: number; // 0..1
  isIdentityClaim: boolean;

  stats: InsightStats;
}

export interface EligibilityResult {
  allowed: boolean;
  downgradeTo?: InsightClass;
  reasons: string[];
}

export interface InsightQualityScores {
  specificity: number;
  crossDomainGrounding: number;
  emotionalAccuracy: number;
  paradoxDepth: number;
  mySkyVoice: number;
  premiumValue: number;
  earnedInsight: number;
  phraseCleanliness: number;
  evidenceFit: number;
}

export interface QualityGateResult {
  allowed: boolean;
  scores: InsightQualityScores;
  reasons: string[];
  downgradeTo?: InsightClass;
}

export interface ValenceEvidence {
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  improvementFollowCount: number;
  worseningFollowCount: number;
}

export interface PhraseCheckResult {
  health: PhraseHealth;
  reasons: string[];
  cleaned?: string;
}

export interface InsightCandidate {
  title: string;
  body: string;
  invitation?: string;
  class: InsightClass;
  evidence: InsightEvidence;
}

export const RISK_BY_CLASS: Record<InsightClass, RiskTier> = {
  deep_pattern: 'safe',
  emerging_pattern: 'medium',
  profile_inference: 'high',
  archive_stat: 'safe',
};

export const HARD_BLOCK_POSITIVE_WORDS = new Set([
  'fatigue',
  'lonely',
  'loneliness',
  'grief',
  'overwhelm',
  'anxiety',
  'shame',
  'exhaustion',
  'conflict',
  'pressure',
]);

export const FORBIDDEN_PREMIUM_PHRASES = [
  'you need to',
  'self-care',
  'everything happens for a reason',
  'you are healing',
  'it sounds like',
  'based on your data',
];

export const IDENTITY_CLAIM_PATTERNS = [
  'your dominant pattern is',
  'you are',
  'your intelligence profile is',
  'your cognitive style is',
  'the shadow to watch is',
];
