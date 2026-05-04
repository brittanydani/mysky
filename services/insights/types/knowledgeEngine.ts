/**
 * Knowledge Engine Types
 *
 * Core models for the signal-to-pattern pipeline.
 */

export type DataSource =
  | 'dailyCheckIn'
  | 'journal'
  | 'dream'
  | 'sleep'
  | 'triggerLog'
  | 'glimmerLog'
  | 'bodyMap'
  | 'relationshipMirror'
  | 'astrology'
  | 'natalChart'
  | 'reflectionBank';

export type SignalKey = string; // Will be typed strictly in signalDefinitions.ts

export interface EvidenceAnchor {
  source: DataSource;
  date: string;
  label?: string;
  phrase?: string;
  signal?: string;
  intensity?: number;
}

export interface UserSignal {
  key: SignalKey;
  source: DataSource;
  date: string;
  strength: number; // 0–1
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
  evidence?: EvidenceAnchor;
}

export type PatternCategory =
  | 'rest'
  | 'relationships'
  | 'body'
  | 'dreams'
  | 'values'
  | 'growth'
  | 'creativity'
  | 'boundaries'
  | 'support'
  | 'selfTrust'
  | 'emotionalWeather'
  | 'identity';

export interface DailyInsightAngle {
  key: string;
  triggerSignals: SignalKey[];
  title: string;
  shameFrame: string; // "This does not read as..."
  clarityFrame: string; // "It reads as..."
  observationOverride?: string;
  patternOverride?: string;
  prompt: string;
}

export interface ArchivePattern {
  key: string;
  title: string;
  category: PatternCategory;
  requiredSignals: SignalKey[];
  supportingSignals: SignalKey[];
  conflictingSignals?: SignalKey[];
  minConfidence: number;
  minEvidenceCount: number;
  lookbackDays: 7 | 14 | 30 | 60 | 90 | 365;
  copyFrame: {
    observation: string;
    pattern: string;
    reframe: {
      shame: string;
      clarity: string;
    };
  };
  dailyAngles: DailyInsightAngle[];
}

export type ConfidenceLevel = 'emerging' | 'moderate' | 'strong' | 'veryStrong';

export type PatternMovement =
  | 'new'
  | 'repeating'
  | 'intensifying'
  | 'softening'
  | 'shifting'
  | 'quieting';

export type DailyMovement =
  | 'higher_than_usual'
  | 'lower_than_usual'
  | 'returning'
  | 'softening'
  | 'intensifying'
  | 'unusually_steady'
  | 'new_signal'
  | 'cross_source_match';

export interface ArchivePatternScore {
  patternKey: string;
  title: string;
  category: PatternCategory;
  score: number;
  confidence: ConfidenceLevel;
  movement: PatternMovement;
  timeframeDays: number;
  sources: DataSource[];
  evidence: EvidenceAnchor[];
  lastSeenAt: string;
}

export interface GeneratedInsight {
  id: string;
  slot: string;
  slotLabel?: string;
  title: string;
  observation: string;
  pattern: string;
  paragraphId?: string;
  category?: string;
  writerShape?: string;
  patternType?: string;
  majorDomain?: string;
  theoryLens?: readonly string[];
  insightSubcategory?: string;
  paragraphTone?: string;
  paragraphIntensity?: string;
  paragraphSource?: string;
  isCuratedParagraph?: boolean;
  sentenceCount?: number;
  hasPracticalPrompt?: boolean;
  currentState?: string;
  stateConfidence?: number;
  deliveryMode?: string;
  depthLevel?: number;
  activeWeeklyTheme?: string;
  narrativeThreadId?: string;
  narrativeRole?: string;
  reframe: {
    shame: string;
    clarity: string;
  };
  prompt: string;
  patternKey: string;
  angleKey?: string;
  confidence: ConfidenceLevel;
  movement: PatternMovement | DailyMovement;
  evidence: EvidenceAnchor[];
  createdAt: string;
  aiEnhanced?: boolean;
  aiGeneratedAt?: string;
  insightSource?: 'local' | 'aiRefined';
}

export interface InsightHistoryEntry {
  insightId: string;
  patternKey: string;
  angleKey?: string;
  slot?: string;
  surface?: string;
  title: string;
  shownAt: string;
  sourceSignals: SignalKey[];
  evidenceHash: string;
  copyHash: string;
}

export interface DailyInsightContext {
  date: string;
  todaySignals: UserSignal[];
  recentSignals: UserSignal[];
  archivePatterns: ArchivePatternScore[];
  strongestTodaySignal: UserSignal | null;
  strongestArchivePattern: ArchivePatternScore | null;
  crossSourceMatches: SignalKey[];
  movement: DailyMovement[];
  unusedAngles: string[];
  recentlyShownPatternKeys: string[];
  recentlyShownCopyHashes: string[];
}
