import { ARCHIVE_PATTERNS } from '../patternPacks';
import {
  hasEnoughPatternEvidence,
  patternParagraphBodyKey,
  type PatternParagraphVariant,
  type PatternParagraphIntensity,
  type PatternParagraphTone,
  type PremiumPatternType,
  type PremiumPatternWriterShape,
} from './premiumPatternParagraphLibrary';
import {
  buildPatternSearchText,
  selectArchivePatternParagraph,
  selectArchiveWeeklyPatternParagraph,
} from '../engine/patternParagraphSelection';
import {
  isArchivePatternAllowedOnSurface,
  isInsightCategoryAllowedOnSurface,
  isPatternScoreAllowedOnSurface,
  sanitizePatternScoreForSurface,
} from '../insightSurfacePolicy';
import {
  archivePatternScoreToInsightCandidate,
  isCandidateAllowedOnSurface,
} from '../candidates/insightCandidates';
import type { InsightFeedbackProfile } from '../feedback/insightOutcomeFeedback';
import {
  selectRootPatternConstellation,
  type RootPatternConstellation,
  type RootPatternEvidence,
} from '../rootPatterns/rootPatternDetection';
import {
  selectProtectiveStrategy,
  type ProtectiveStrategy,
} from '../rootPatterns/protectiveStrategyMapping';
import type {
  ArchivePattern,
  ArchivePatternScore,
  EvidenceAnchor,
  InsightCategory,
  InsightDataSource,
  PatternConfidence,
  PatternMovement,
  SignalKey,
} from '../types';

export type PremiumPatternConcept =
  | 'core_synthesis'
  | 'body_awareness'
  | 'protective_behavior'
  | 'relational_dynamic'
  | 'processing_style'
  | 'emotional_theme'
  | 'recovery_pattern'
  | 'dream_archive_contrast'
  | 'values_pattern'
  | 'statistical_trend';

export type PremiumPatternLens =
  | 'core_pattern'
  | 'body_signals'
  | 'protective_patterns'
  | 'relational_patterns'
  | 'processing_style'
  | 'reflection_themes'
  | 'checkin_trends'
  | 'recovery_patterns'
  | 'dream_archive_contrast';

export interface PremiumPatternItem {
  title: string;
  body: string;
  lens?: PremiumPatternLens;
  concept?: PremiumPatternConcept;
  writerShape?: PremiumPatternWriterShape;
  patternType?: PremiumPatternType;
  paragraphTone?: PatternParagraphTone;
  paragraphIntensity?: PatternParagraphIntensity;
  majorDomain?: string;
  theoryLens?: readonly string[];
  insightSubcategory?: string;
  isCuratedParagraph?: boolean;
  paragraphSource?: PatternParagraphVariant['source'];
  paragraphId?: string;
  weeklyParagraphId?: string;
  weeklyBody?: string;
  specificityAnchor?: string;
  matchedAnchors?: string[];
  matchedSignals?: string[];
  protectiveStrategy?: ProtectiveStrategy | null;
  activeWeeklyTheme?: string;
  narrativeThreadId?: string;
  narrativeRole?: 'patternCard' | 'supporting';
  fingerprint?: string;
  score?: number;
  patternKey: string;
  category: InsightCategory;
  confidence: PatternConfidence;
  movement: PatternMovement;
  evidenceSummary: string;
  sourceCoverage: string[];
  lastSeenAt: string;
  observedAcrossDays: number;
  relatedSignals: SignalKey[];
  shameLabel?: string;
  clarityReframe?: string;
  librarySectionTitle?: string;
  archiveSectionTitle?: string;
  isV2Derived: true;
}

export interface PremiumWeeklyDeepDiveItem {
  id: string;
  patternKey: string;
  category: InsightCategory;
  title: string;
  preview: string;
  body: string;
  whyItMayMatter: string;
  reframe: string;
  evidenceSummary: string;
  reflectionPrompt: string;
  confidence: PatternConfidence;
  movement: PatternMovement;
  activeWeeklyTheme?: string;
  narrativeThreadId?: string;
  narrativeRole?: 'weeklyDeepDive' | 'supporting';
  connectedPatternKeys?: string[];
  isV2Derived: true;
  isLowConfidenceFallback?: boolean;
  isEmptyState?: boolean;
}

export interface PremiumThisWeekPatternItem {
  id: string;
  patternKey: string;
  category: InsightCategory;
  title: string;
  body: string;
  reframe: string;
  confidence: PatternConfidence;
  movement: PatternMovement;
  evidenceSummary: string;
  activeWeeklyTheme?: string;
  narrativeThreadId?: string;
  narrativeRole?: 'thisWeek';
  narrativeForward?: string;
  narrativeQuestion?: string;
  connectedPatternKeys?: string[];
  isV2Derived: true;
  isLowConfidenceFallback?: boolean;
  isEmptyState?: boolean;
}

export interface PremiumPatternProfileSection {
  key: string;
  title: string;
  body: string;
  protectiveStrategy?: ProtectiveStrategy | null;
  category: InsightCategory;
  patternKey: string;
  confidence: PatternConfidence;
}

export interface PremiumPatternProfile {
  title: string;
  subtitle: string;
  portrait: string;
  rootPattern?: RootPatternConstellation;
  sections: PremiumPatternProfileSection[];
  growthOrRecovery?: {
    title: string;
    body: string;
    patternKey?: string;
  };
  reflectionPrompt: string;
  areaLabels: string[];
  sourcePatternKeys: string[];
  isLowData?: boolean;
}

interface AdaptPremiumPatternsOptions {
  includeLowConfidence?: boolean;
  maxItems?: number;
  surface?: 'patterns' | 'weeklyDeepDive' | 'thisWeek';
  excludeParagraphIds?: string[];
  excludeBodyKeys?: string[];
  avoidPatternKeys?: Iterable<string>;
  feedbackProfile?: InsightFeedbackProfile | null;
}

interface SelectPremiumWeeklyDeepDiveOptions {
  excludeBodyKeys?: string[];
}

interface SelectThisWeeksV2PatternOptions {
  avoidPatternKeys?: string[];
  excludeBodyKeys?: string[];
}

const MIN_PREMIUM_PATTERN_SCORE = 0.5;
const MAX_PREMIUM_PATTERN_ITEMS = 24;
const MAX_WEEKLY_PATTERN_CANDIDATES = 32;
const MIN_WEEKLY_DEEP_READS = 2;
const MAX_WEEKLY_DEEP_READS = 4;
const MIN_PROFILE_PATTERN_AREAS = 2;
const MAX_PROFILE_PATTERN_AREAS = 3;

const SOURCE_LABELS: Partial<Record<EvidenceAnchor['source'], string>> = {
  dailyCheckIn: 'daily check-ins',
  journal: 'journaling',
  dream: 'dream notes',
  sleep: 'sleep tracking',
  triggerLog: 'trigger moments',
  glimmerLog: 'glimmer notes',
  bodyMap: 'body check-ins',
  relationshipMirror: 'relationship reflections',
  natalChart: 'natal chart themes',
  reflectionBank: 'reflection answers',
};

const CATEGORY_DISPLAY: Record<InsightCategory, string> = {
  emotionalWeather: 'Emotional Weather',
  restCapacity: 'Rest & Capacity',
  bodySignals: 'Body Signals',
  supportBelonging: 'Relationships',
  relationships: 'Relationships',
  boundariesSelfTrust: 'Boundaries & Self-Trust',
  valuesIntegrity: 'Boundaries & Self-Trust',
  cognitiveStyle: 'Growth Edges',
  dreamsSymbols: 'Dreams & Symbols',
  glimmersRegulation: 'What Helps',
  creativityExpression: 'Growth Edges',
  identityGrowth: 'Growth Edges',
  familyHome: 'Relationships',
  scarcityAbundance: 'Self-Worth & Receiving',
  natalChartReflection: 'Growth Edges',
  responsibilityCare: 'Responsibility & Care',
  workAmbition: 'Growth Edges',
  griefTransitions: 'Emotional Weather',
  timeRhythms: 'Rest & Capacity',
  selfWorthReceiving: 'Self-Worth & Receiving',
  communicationVoice: 'Relationships',
  spiritualMeaning: 'Growth Edges',
  safetyRegulation: 'Safety & Regulation',
  lifeDirection: 'Growth Edges',
  pleasurePlay: 'What Helps',
};

const CATEGORY_LENS: Record<InsightCategory, PremiumPatternLens> = {
  emotionalWeather: 'reflection_themes',
  restCapacity: 'checkin_trends',
  bodySignals: 'body_signals',
  supportBelonging: 'relational_patterns',
  relationships: 'relational_patterns',
  boundariesSelfTrust: 'protective_patterns',
  valuesIntegrity: 'reflection_themes',
  cognitiveStyle: 'processing_style',
  dreamsSymbols: 'dream_archive_contrast',
  glimmersRegulation: 'recovery_patterns',
  creativityExpression: 'processing_style',
  identityGrowth: 'processing_style',
  familyHome: 'relational_patterns',
  scarcityAbundance: 'protective_patterns',
  natalChartReflection: 'reflection_themes',
  responsibilityCare: 'protective_patterns',
  workAmbition: 'protective_patterns',
  griefTransitions: 'reflection_themes',
  timeRhythms: 'checkin_trends',
  selfWorthReceiving: 'protective_patterns',
  communicationVoice: 'relational_patterns',
  spiritualMeaning: 'reflection_themes',
  safetyRegulation: 'protective_patterns',
  lifeDirection: 'processing_style',
  pleasurePlay: 'recovery_patterns',
};

const CATEGORY_CONCEPT: Record<InsightCategory, PremiumPatternConcept> = {
  emotionalWeather: 'emotional_theme',
  restCapacity: 'statistical_trend',
  bodySignals: 'body_awareness',
  supportBelonging: 'relational_dynamic',
  relationships: 'relational_dynamic',
  boundariesSelfTrust: 'protective_behavior',
  valuesIntegrity: 'values_pattern',
  cognitiveStyle: 'processing_style',
  dreamsSymbols: 'dream_archive_contrast',
  glimmersRegulation: 'recovery_pattern',
  creativityExpression: 'processing_style',
  identityGrowth: 'processing_style',
  familyHome: 'relational_dynamic',
  scarcityAbundance: 'protective_behavior',
  natalChartReflection: 'values_pattern',
  responsibilityCare: 'protective_behavior',
  workAmbition: 'protective_behavior',
  griefTransitions: 'emotional_theme',
  timeRhythms: 'statistical_trend',
  selfWorthReceiving: 'protective_behavior',
  communicationVoice: 'relational_dynamic',
  spiritualMeaning: 'values_pattern',
  safetyRegulation: 'protective_behavior',
  lifeDirection: 'processing_style',
  pleasurePlay: 'recovery_pattern',
};

const WHY_IT_MAY_MATTER: Record<PremiumPatternConcept, string> = {
  core_synthesis:
    'When one thread organizes several parts of your week, naming it earlier gives you more choice before it decides the whole moment for you.',
  body_awareness:
    'Your body often gives information before your thoughts finish explaining it. The signal is not the enemy; it is an early doorway into regulation.',
  protective_behavior:
    'Protection often begins as care, survival, or responsibility. Seeing the protection clearly gives you more choice about when it helps and when it starts costing too much.',
  relational_dynamic:
    'Connection can change your nervous system quickly. Tone, repair, distance, and support are not small details when your body is deciding whether closeness is safe.',
  processing_style:
    'The way you make sense of things affects how quickly you can move. Your system may need clarity, language, or one smaller next step before action feels honest.',
  emotional_theme:
    'A repeated feeling is usually information, not noise. When the same feeling keeps returning, something still wants care, closure, or space.',
  recovery_pattern:
    'Recovery is easier to protect when you know what actually helps you come back. Small relief becomes useful when it is recognizable and repeatable.',
  dream_archive_contrast:
    'Dream material can carry emotional residue waking life has not fully organized. It does not have to predict anything to show what your system is still processing.',
  values_pattern:
    'Values often show up first as friction. The discomfort helps you protect something honest, even before the next choice is fully clear.',
  statistical_trend:
    'Rhythm is data. Repeated capacity, sleep, mood, or timing patterns help you plan with your system instead of judging it from the outside.',
};

const REFLECTION_PROMPTS: Record<PremiumPatternConcept, string> = {
  core_synthesis: 'Where did this pattern have the most influence this week?',
  body_awareness: 'What body signal showed up early enough to be useful?',
  protective_behavior: 'What was this protective pattern trying to prevent or hold together?',
  relational_dynamic: 'What relational signal changed your sense of safety, closeness, or distance?',
  processing_style: 'What would help your mind feel clear enough to take one honest next step?',
  emotional_theme: 'What feeling kept returning because it still needed care or language?',
  recovery_pattern: 'What helped you soften, settle, recover, or feel supported this week?',
  dream_archive_contrast: 'What feeling from dream material stayed connected to waking life?',
  values_pattern: 'What value was asking not to be negotiated away?',
  statistical_trend: 'What rhythm or timing pattern would be kinder to plan around next week?',
};

function unique<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ');
}

function trimTerminalPunctuation(text: string): string {
  return text.trim().replace(/[.!?]+$/, '');
}

function formatList(values: string[]): string {
  if (values.length <= 1) return values[0] ?? '';
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
}

function lowerFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function capitalizeFirst(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function sentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function stableIndex(key: string, modulo: number): number {
  if (modulo <= 1) return 0;
  const total = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return total % modulo;
}

const USER_VERB_REPLACEMENTS: Record<string, string> = {
  is: 'are',
  has: 'have',
  does: 'do',
  appears: 'appear',
  handles: 'handle',
  notices: 'notice',
  values: 'value',
  adjusts: 'adjust',
  communicates: 'communicate',
  replays: 'replay',
  continues: 'continue',
  benefits: 'benefit',
  tries: 'try',
  wants: 'want',
  prefers: 'prefer',
  feels: 'feel',
  recognizes: 'recognize',
  shows: 'show',
  places: 'place',
  prioritizes: 'prioritize',
  becomes: 'become',
  learns: 'learn',
  uses: 'use',
  moves: 'move',
  spends: 'spend',
  relates: 'relate',
  interprets: 'interpret',
  seeks: 'seek',
  looks: 'look',
  reaches: 'reach',
};

function cleanUserFacingText(text: string): string {
  const verbPattern = Object.keys(USER_VERB_REPLACEMENTS).join('|');
  return text
    .replace(/\bthe user(?:'|’)s\b/gi, 'your')
    .replace(/\buser(?:'|’)s\b/gi, 'your')
    .replace(new RegExp(`\\bthe user (${verbPattern})\\b`, 'gi'), (_match, verb: string) => (
      `you ${USER_VERB_REPLACEMENTS[verb.toLowerCase()] ?? verb}`
    ))
    .replace(/\bthe user may\b/gi, 'you may')
    .replace(/\bthe user can\b/gi, 'you can')
    .replace(/\bthe user\b/gi, 'you')
    .replace(/\bThe archive may show\b/g, 'This may involve')
    .replace(/\bthe archive may show\b/gi, 'this may involve')
    .replace(/\bThe archive shows\b/g, 'This shows')
    .replace(/\bthe archive shows\b/gi, 'this shows')
    .replace(/\bYour archive\b/g, 'Your recent entries')
    .replace(/\byour archive\b/gi, 'your recent entries')
    .replace(/\bthe archive\b/gi, 'recent entries')
    .replace(/\s+/g, ' ')
    .trim();
}

function patternDescription(pattern: ArchivePattern): string {
  return sentence(capitalizeFirst(cleanUserFacingText(pattern.description)));
}

const LIVED_MOMENT_MATCHERS: Array<{ matcher: RegExp; moment: string }> = [
  {
    matcher: /\b(low sleep|poor sleep|sleep mood|morning|overnight|fatigue|tired|rest quality)\b/,
    moment: 'on low-sleep days or mornings when recovery did not fully land',
  },
  {
    matcher: /\b(repair|rupture|conflict|tone|misunderstood|conversation|relationship safety|sharp connection|presence|responsiveness)\b/,
    moment: 'after hard conversations, unclear tone, or repair that has not fully landed',
  },
  {
    matcher: /\b(mental load|responsibility|invisible labor|caretaking|overfunctioning|need not assignment|emotional labor)\b/,
    moment: 'when you are holding more than the visible task',
  },
  {
    matcher: /\b(rest resistance|rest guilt|capacity|depletion|overextension|burnout|pause|recovery gap|one more thing|unfinished)\b/,
    moment: 'when your body is asking to stop before everything feels handled',
  },
  {
    matcher: /\b(chest|jaw|gut|throat|shoulder|breath|head pressure|body heaviness|somatic|body knows|body signal)\b/,
    moment: 'before the feeling has found words',
  },
  {
    matcher: /\b(dream|symbol|subconscious|image|night|sleep story)\b/,
    moment: 'after dream material follows you into the day',
  },
  {
    matcher: /\b(boundary|limit|autonomy|truth telling|say no|saying no|alignment|integrity|preference)\b/,
    moment: 'when a no, limit, or honest preference is trying to form',
  },
  {
    matcher: /\b(standard|excellence|ambition|output|productivity|progress|performance|success|work)\b/,
    moment: 'when progress starts standing in for safety',
  },
  {
    matcher: /\b(support|receiving|belonging|mutuality|scarcity|enoughness|care earned|help)\b/,
    moment: 'when support is offered, missing, or hard to receive',
  },
  {
    matcher: /\b(grief|loss|ending|longing|sadness|transition|attachment)\b/,
    moment: 'when something meaningful feels unfinished',
  },
  {
    matcher: /\b(glimmer|joy|play|beauty|relief|aliveness|laughter|pleasure)\b/,
    moment: 'in the small moments where your body can unclench',
  },
  {
    matcher: /\b(meaning|faith|purpose|sacred|values|larger questions|truth)\b/,
    moment: 'when the practical answer is not enough to feel honest',
  },
  {
    matcher: /\b(language|context|analysis|deep processing|precision|clarity|overexplaining|understood)\b/,
    moment: 'when you are trying to make the feeling accurate enough to trust',
  },
];

function livedMomentFromText(searchText: string): string {
  return LIVED_MOMENT_MATCHERS.find(({ matcher }) => matcher.test(searchText))?.moment
    ?? 'when something still feels emotionally unresolved';
}

function anchorLead(anchor: string): string {
  return capitalizeFirst(anchor.replace(/\.$/, ''));
}

function anchoredObservation(
  pattern: ArchivePattern,
  score: ArchivePatternScore,
  anchor: string,
): string {
  const description = lowerFirst(trimTerminalPunctuation(patternDescription(pattern)));
  return sentence(`${anchorLead(anchor)}, ${description}`);
}

function confidentReframeText(text: string, confidence: PatternConfidence): string {
  const trimmed = trimTerminalPunctuation(text)
    .replace(/\s+/g, ' ')
    .trim();
  if (!trimmed) return '';

  if (confidence === 'moderate' || confidence === 'emerging') return trimmed;

  return trimmed
    .replace(/\bThis may not be\b/gi, 'This is not')
    .replace(/\bThis may be\b/gi, 'This is')
    .replace(/\bIt may not be\b/gi, 'It is not')
    .replace(/\bIt may be\b/gi, 'It is')
    .replace(/\bmay create\b/gi, 'can create')
    .replace(/\bmay need\b/gi, 'needs')
    .replace(/\bmay show\b/gi, 'shows')
    .replace(/\bmay help\b/gi, 'helps');
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map(part => part.trim()).filter(Boolean);
}

function positiveTruthFragment(text: string): string {
  const parts = splitSentences(text);
  if (
    parts.length > 1 &&
    /^(this|it)\s+(?:is|may be)\s+not\b/i.test(parts[0])
  ) {
    return trimTerminalPunctuation(parts.slice(1).join(' '));
  }
  return trimTerminalPunctuation(text);
}

function personalizeTruthFragment(text: string): string {
  let truth = cleanUserFacingText(text)
    .replace(/^body intelligence\b/i, 'your body')
    .replace(/\bthe body\b/gi, 'your body')
    .replace(/\ba body\b/gi, 'your body')
    .replace(/\bthe mind\b/gi, 'your mind')
    .replace(/\ba mind\b/gi, 'your mind')
    .replace(/\bthe system\b/gi, 'your system')
    .replace(/\ba system\b/gi, 'your system')
    .replace(/\bthe senses\b/gi, 'your senses')
    .replace(/\bthe inner world\b/gi, 'your inner world')
    .replace(/\s+/g, ' ')
    .trim();

  const gerund = truth.match(/^(.+?)\s+(becoming|asking|speaking|recognizing|learning|trying|holding|making|finding|protecting|showing|tracking|searching|moving|looking|giving|pressing)\b(.+)$/i);
  if (gerund) {
    const [, subject, verb, rest] = gerund;
    truth = `${capitalizeFirst(subject)} is ${verb.toLowerCase()}${rest}`;
  } else if (/^(the|a|an)\s+/i.test(truth) || /^[a-z]/.test(truth)) {
    truth = `This is ${lowerFirst(truth)}`;
  }

  return sentence(capitalizeFirst(truth));
}

function claritySentenceForPattern(
  pattern: ArchivePattern,
  score: ArchivePatternScore,
): string {
  return personalizeTruthFragment(
    positiveTruthFragment(confidentReframeText(pattern.clarityReframe, score.confidence)),
  );
}

function buildSourceCoverage(score: ArchivePatternScore): string[] {
  return unique(
    score.sources.map(source => SOURCE_LABELS[source] ?? humanizeKey(source)),
  );
}

function buildEvidenceSummary(score: ArchivePatternScore): string {
  const sources = buildSourceCoverage(score).slice(0, 3);
  const sourceText = sources.length
    ? `especially in ${formatList(sources)}`
    : 'in recent entries';
  return `It has repeated for roughly ${score.timeframeDays} days, ${sourceText}.`;
}

function evidenceDistinctDays(score: ArchivePatternScore): number {
  return new Set(
    score.evidence
      .map(evidence => evidence.date.slice(0, 10))
      .filter(Boolean),
  ).size;
}

function patternByKey(key: string): ArchivePattern | null {
  return ARCHIVE_PATTERNS.find(pattern => pattern.key === key) ?? null;
}

function shouldIncludeScore(
  score: ArchivePatternScore,
  options: AdaptPremiumPatternsOptions = {},
): boolean {
  const surface = options.surface ?? 'patterns';
  if (
    surface === 'patterns' &&
    !options.includeLowConfidence &&
    !hasEnoughPatternEvidence({
      surface: 'patterns',
      categoryScore: score.score,
      entryCount: score.evidence.length,
      distinctDays: evidenceDistinctDays(score),
    })
  ) {
    return false;
  }

  if (options.includeLowConfidence) {
    return score.score > 0 || score.evidence.length > 0 || score.sources.length > 0;
  }
  if (score.score >= MIN_PREMIUM_PATTERN_SCORE) return true;
  return score.confidence !== 'emerging' && score.evidence.length >= 2;
}

export function adaptPremiumPatterns(
  patternScores: ArchivePatternScore[],
  options: AdaptPremiumPatternsOptions = {},
): PremiumPatternItem[] {
  const sortedScores = patternScores
    .filter(score => isPatternScoreAllowedOnSurface(score, 'patternScreen'))
    .map(score => sanitizePatternScoreForSurface(score, 'patternScreen'))
    .filter(score => shouldIncludeScore(score, options))
    .sort((a, b) => b.score - a.score);
  const items: PremiumPatternItem[] = [];
  const recentParagraphIds: string[] = [];
  const recentWeeklyParagraphIds: string[] = [];
  const excludeParagraphIds = new Set(options.excludeParagraphIds ?? []);
  const excludeBodyKeys = new Set(options.excludeBodyKeys ?? []);
  const avoidPatternKeys = new Set(options.avoidPatternKeys ?? []);
  const surface = options.surface ?? 'patterns';
  const recentWriterShapes: PremiumPatternWriterShape[] = [];
  const recentPatternTypes: PremiumPatternType[] = [];

  for (const score of sortedScores) {
    if (avoidPatternKeys.has(score.patternKey)) continue;
    const pattern = patternByKey(score.patternKey);
    if (!pattern) continue;
    if (!isArchivePatternAllowedOnSurface(pattern, 'patternScreen')) continue;
    const insightCandidate = archivePatternScoreToInsightCandidate(pattern, score);
    if (!isCandidateAllowedOnSurface(insightCandidate, surface)) continue;

    const sourceCoverage = buildSourceCoverage(score);
    const searchText = buildPatternSearchText(pattern, score);
    let paragraph: ReturnType<typeof selectArchivePatternParagraph>;
    let weeklyParagraph: ReturnType<typeof selectArchiveWeeklyPatternParagraph>;
    const primaryParagraphSurface = surface === 'patterns' ? surface : 'patterns';
    try {
      paragraph = selectArchivePatternParagraph({
        pattern,
        score,
        candidate: insightCandidate,
        surface: primaryParagraphSurface,
        recentParagraphIds,
        excludeParagraphIds: Array.from(excludeParagraphIds),
        excludeBodyKeys: Array.from(excludeBodyKeys),
        avoidWriterShapes: recentWriterShapes.slice(-2),
        avoidPatternTypes: recentPatternTypes.slice(-2),
        feedbackProfile: options.feedbackProfile,
      });
      weeklyParagraph = selectArchiveWeeklyPatternParagraph({
        pattern,
        score,
        candidate: insightCandidate,
        surface: surface === 'patterns' ? 'weeklyDeepDive' : surface,
        recentParagraphIds: recentWeeklyParagraphIds,
        excludeParagraphIds: Array.from(excludeParagraphIds),
        excludeBodyKeys: Array.from(excludeBodyKeys),
        avoidWriterShapes: [paragraph.writerShape, ...recentWriterShapes.slice(-1)],
        avoidPatternTypes: [paragraph.patternType, ...recentPatternTypes.slice(-1)],
        feedbackProfile: options.feedbackProfile,
      });
    } catch {
      continue;
    }
    const relatedSignals = unique([
      ...pattern.requiredSignals,
      ...pattern.supportingSignals,
    ]);
    const protectiveStrategy = selectProtectiveStrategy({
      patternKey: score.patternKey,
      title: score.title,
      category: score.category,
      majorDomain: insightCandidate.majorDomain,
      insightSubcategory: insightCandidate.subcategory,
      patternType: insightCandidate.selectedPatternType,
      anchors: unique([
        ...insightCandidate.anchors,
        ...paragraph.anchors,
        ...paragraph.matchedAnchors,
      ]),
      signalTypes: unique([
        ...insightCandidate.signalTypes,
        ...paragraph.signalTypes,
        ...paragraph.matchedSignals,
        ...relatedSignals,
      ]),
      sources: insightCandidate.sources,
      strength: score.score,
      confidence: score.confidence,
    });

    items.push({
      title: score.title,
      body: paragraph.body,
      lens: CATEGORY_LENS[score.category],
      concept: CATEGORY_CONCEPT[score.category],
      writerShape: paragraph.writerShape,
      patternType: paragraph.patternType,
      paragraphTone: paragraph.tone,
      paragraphIntensity: paragraph.intensity,
      majorDomain: paragraph.majorDomain,
      theoryLens: paragraph.theoryLens,
      insightSubcategory: paragraph.insightSubcategory,
      isCuratedParagraph: paragraph.isCurated,
      paragraphSource: paragraph.source,
      paragraphId: paragraph.id,
      weeklyParagraphId: weeklyParagraph.id,
      weeklyBody: weeklyParagraph.body,
      specificityAnchor: paragraph.matchedAnchors[0] ?? paragraph.anchors[0] ?? livedMomentFromText(searchText),
      matchedAnchors: paragraph.matchedAnchors,
      matchedSignals: paragraph.matchedSignals,
      protectiveStrategy,
      fingerprint: `v2:${score.patternKey}`,
      score: Math.round(score.score * 100),
      patternKey: score.patternKey,
      category: score.category,
      confidence: score.confidence,
      movement: score.movement,
      evidenceSummary: buildEvidenceSummary(score),
      sourceCoverage,
      lastSeenAt: score.lastSeenAt,
      observedAcrossDays: score.timeframeDays,
      relatedSignals,
      shameLabel: pattern.shameLabel,
      clarityReframe: claritySentenceForPattern(pattern, score),
      librarySectionTitle: CATEGORY_DISPLAY[score.category],
      archiveSectionTitle: CATEGORY_DISPLAY[score.category],
      isV2Derived: true,
    });

    recentParagraphIds.push(paragraph.id);
    recentWeeklyParagraphIds.push(weeklyParagraph.id);
    excludeParagraphIds.add(paragraph.id);
    excludeParagraphIds.add(weeklyParagraph.id);
    excludeBodyKeys.add(patternParagraphBodyKey(paragraph.body));
    excludeBodyKeys.add(patternParagraphBodyKey(weeklyParagraph.body));
    recentWriterShapes.push(paragraph.writerShape);
    recentPatternTypes.push(paragraph.patternType);
  }

  const seen = new Set<string>();
  return items
    .filter((item) => {
      const titleKey = item.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const familyKey = `${item.category}:${titleKey}`;
      if (seen.has(item.patternKey) || seen.has(familyKey)) return false;
      seen.add(item.patternKey);
      seen.add(familyKey);
      return true;
    })
    .slice(0, options.maxItems ?? MAX_PREMIUM_PATTERN_ITEMS);
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function isRecoveryOrHelpfulPattern(item: PremiumPatternItem): boolean {
  return (
    item.concept === 'recovery_pattern' ||
    item.category === 'glimmersRegulation' ||
    item.category === 'pleasurePlay' ||
    item.category === 'restCapacity' ||
    item.category === 'timeRhythms'
  );
}

function confidenceRank(confidence: PatternConfidence): number {
  if (confidence === 'veryStrong') return 4;
  if (confidence === 'strong') return 3;
  if (confidence === 'moderate') return 2;
  return 1;
}

function patternAreaLabel(item: PremiumPatternItem): string {
  return item.archiveSectionTitle ?? item.librarySectionTitle ?? CATEGORY_DISPLAY[item.category];
}

function patternAreaKey(item: PremiumPatternItem): string {
  return patternAreaLabel(item).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function isProfileCandidate(item: PremiumPatternItem): boolean {
  return item.confidence !== 'emerging' && (item.score ?? 0) >= 50;
}

function sortPatternsForProfile(patterns: PremiumPatternItem[]): PremiumPatternItem[] {
  return [...patterns].sort((a, b) => {
    const confidenceDelta = confidenceRank(b.confidence) - confidenceRank(a.confidence);
    if (confidenceDelta !== 0) return confidenceDelta;
    const scoreDelta = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDelta !== 0) return scoreDelta;
    return timestamp(b.lastSeenAt) - timestamp(a.lastSeenAt);
  });
}

function selectDistinctProfilePatterns(
  premiumPatterns: PremiumPatternItem[],
): PremiumPatternItem[] {
  const selected: PremiumPatternItem[] = [];
  const seenAreaKeys = new Set<string>();
  const seenPatternKeys = new Set<string>();
  const candidates = sortPatternsForProfile(premiumPatterns.filter(isProfileCandidate));

  for (const candidate of candidates) {
    const areaKey = patternAreaKey(candidate);
    if (seenAreaKeys.has(areaKey) || seenPatternKeys.has(candidate.patternKey)) continue;
    selected.push(candidate);
    seenAreaKeys.add(areaKey);
    seenPatternKeys.add(candidate.patternKey);
    if (selected.length >= MAX_PROFILE_PATTERN_AREAS) break;
  }

  return selected;
}

function rootPatternSourcesFromItem(item: PremiumPatternItem): InsightDataSource[] {
  const text = [
    ...item.sourceCoverage,
    ...item.relatedSignals,
    item.evidenceSummary,
    item.patternKey,
    item.category,
  ].join(' ').toLowerCase();
  const sources: InsightDataSource[] = [];

  if (/\bdream\b/.test(text)) sources.push('dream');
  if (/\bjournal\b|\bentry\b|\bentries\b/.test(text)) sources.push('journal');
  if (/\bbody\b|\bsomatic\b|\bchest\b|\bbreath\b|\btension\b/.test(text)) sources.push('bodyMap');
  if (/\btrigger\b|\bdrain\b|\bconflict\b|\bstress\b/.test(text)) sources.push('triggerLog');
  if (/\brelationship\b|\btone\b|\brepair\b|\bconnection\b/.test(text)) sources.push('relationshipMirror');
  if (/\breflection\b|\banswer\b|\bself knowledge\b/.test(text)) sources.push('reflectionBank');
  if (/\bsleep\b|\bfatigue\b|\brest\b|\brecovery\b/.test(text)) sources.push('sleep');
  if (/\bcheck.?in\b|\bmood\b|\bstress\b|\benergy\b/.test(text)) sources.push('dailyCheckIn');
  if (/\bglimmer\b|\bjoy\b|\brelief\b|\bplay\b/.test(text)) sources.push('glimmerLog');
  if (/\bnatal\b|\bchart\b|\bastrology\b/.test(text)) sources.push('natalChart');

  return unique(sources) as InsightDataSource[];
}

function rootPatternEvidenceFromPremiumItem(item: PremiumPatternItem): RootPatternEvidence {
  return {
    patternKey: item.patternKey,
    title: item.title,
    category: item.category,
    majorDomain: item.majorDomain,
    insightSubcategory: item.insightSubcategory,
    patternType: item.patternType,
    anchors: unique([
      ...(item.matchedAnchors ?? []),
      ...(item.specificityAnchor ? [item.specificityAnchor] : []),
      ...item.relatedSignals,
    ]),
    signalTypes: unique([
      ...item.relatedSignals,
      ...(item.matchedSignals ?? []),
      item.protectiveStrategy?.key ?? '',
      item.protectiveStrategy?.name ?? '',
      item.protectiveStrategy?.protectiveMove ?? '',
      item.protectiveStrategy?.protects ?? '',
      item.protectiveStrategy?.costs ?? '',
      item.protectiveStrategy?.softens ?? '',
      item.clarityReframe ?? '',
      item.shameLabel ?? '',
      item.evidenceSummary,
    ]),
    sources: rootPatternSourcesFromItem(item),
    strength: item.score ?? confidenceRank(item.confidence) * 20,
    confidence: item.confidence,
    protectiveStrategy: item.protectiveStrategy,
  };
}

function titleAsPhrase(title: string): string {
  return trimTerminalPunctuation(title)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function personalReframeSentence(item: PremiumPatternItem): string {
  const raw = item.clarityReframe ?? '';
  const reframe = confidentReframeText(raw, item.confidence);
  if (!reframe) return '';
  return sentence(reframe);
}

function secondPersonPressure(text: string): string {
  return trimTerminalPunctuation(text)
    .replace(/\bI should not\b/gi, 'you should not')
    .replace(/\bI should\b/gi, 'you should')
    .replace(/\bI have to\b/gi, 'you have to')
    .replace(/\bI need to\b/gi, 'you need to')
    .replace(/\bI must\b/gi, 'you must')
    .replace(/\bI cannot\b/gi, 'you cannot')
    .replace(/\bI can\b/gi, 'you can')
    .replace(/\bI am not\b/gi, 'you are not')
    .replace(/\bI am\b/gi, 'you are')
    .replace(/\bIf I\b/gi, 'if you')
    .replace(/\bmy\b/gi, 'your')
    .replace(/\bme\b/gi, 'you')
    .replace(/\bmyself\b/gi, 'yourself')
    .replace(/\s+/g, ' ')
    .trim();
}

function pressureReframeSentence(item: PremiumPatternItem): string {
  if (!item.shameLabel) return '';
  const pressure = secondPersonPressure(item.shameLabel);
  if (!pressure) return '';

  if (/^if you\b/i.test(pressure)) {
    return sentence(`When that pressure says ${lowerFirst(pressure)}, it is asking for attention, not obedience`);
  }

  if (/\bshould\b|\bhave to\b|\bmust\b|\bcannot\b/i.test(pressure)) {
    return sentence(`The pressure to believe ${lowerFirst(pressure)} can be loud without being true`);
  }

  return sentence(`Let ${lowerFirst(pressure)} be a signal, not a verdict`);
}

function relatedSignalSentence(item: PremiumPatternItem): string {
  const moment = livedMomentFromText(patternSearchText(item));
  return sentence(`Watch for it ${moment}`);
}

function personalLeadForPattern(item: PremiumPatternItem): string {
  const title = titleAsPhrase(item.title);

  switch (item.category) {
    case 'responsibilityCare':
      return `With ${title}, you often notice what needs to be held before you notice what it is costing you.`;
    case 'relationships':
    case 'supportBelonging':
    case 'communicationVoice':
    case 'familyHome':
      return 'Tone, repair, support, distance, and being understood are not background details for you.';
    case 'bodySignals':
      return 'Your body enters early, often before your mind has finished explaining what happened.';
    case 'safetyRegulation':
      return 'Your system keeps score of what feels steady, what feels uncertain, and what still needs proof.';
    case 'restCapacity':
    case 'timeRhythms':
      return 'Rest is not simple when part of you is still tracking what needs to be handled.';
    case 'selfWorthReceiving':
    case 'scarcityAbundance':
      return 'Support can feel meaningful and exposed at the same time, especially where being cared for touches the part of you that learned to stay useful.';
    case 'workAmbition':
      return 'Progress, standards, and output can become ways your system tries to create safety.';
    case 'lifeDirection':
    case 'identityGrowth':
      return 'The question is not only what comes next; it is who you are becoming and what kind of stability that becoming needs.';
    case 'cognitiveStyle':
      return 'You look for language, context, and structure so the feeling becomes less shapeless and the next step becomes honest.';
    case 'valuesIntegrity':
    case 'spiritualMeaning':
    case 'natalChartReflection':
      return 'You rely on inner truth more than surface answers when something does not feel honest or aligned.';
    case 'emotionalWeather':
    case 'griefTransitions':
      return 'You can hold more than one truth at once, and the slower feeling often needs room after the practical situation has already moved on.';
    case 'dreamsSymbols':
      return 'Your dreams seem to hold material your waking life has not finished organizing.';
    case 'creativityExpression':
      return 'Making, naming, designing, or speaking can turn what is internal into something your system can work with.';
    case 'pleasurePlay':
    case 'glimmersRegulation':
      return 'Joy, beauty, relief, and small glimmers are part of how your system finds its way back to itself.';
    default:
      return `${item.title} keeps returning because something in it still needs protection, clarity, or care.`;
  }
}

function sectionBodyForPattern(item: PremiumPatternItem): string {
  const pressure = stableIndex(item.patternKey, 3) === 0
    ? pressureReframeSentence(item)
    : '';
  const strategy = item.protectiveStrategy
    ? [
        `Underneath it, the move may be ${item.protectiveStrategy.protectiveMove}.`,
        `The protective move here is ${item.protectiveStrategy.protectiveMove}.`,
        `At its core, this may be about ${item.protectiveStrategy.protectiveMove}.`,
      ][stableIndex(item.patternKey, 3)]
    : '';

  return [
    personalLeadForPattern(item),
    strategy,
    personalReframeSentence(item),
    relatedSignalSentence(item),
    pressure,
  ].filter(Boolean).join(' ');
}

function sectionForPattern(item: PremiumPatternItem): PremiumPatternProfileSection {
  const title = patternAreaLabel(item);
  return {
    key: `profile-section-${item.patternKey}`,
    title,
    body: sectionBodyForPattern(item),
    protectiveStrategy: item.protectiveStrategy,
    category: item.category,
    patternKey: item.patternKey,
    confidence: item.confidence,
  };
}

function lowDataPatternProfile(): PremiumPatternProfile {
  return {
    title: 'Pattern Profile Is Still Forming',
    subtitle: 'A deeper read will appear when enough distinct patterns repeat.',
    portrait:
      'This profile is still forming. As more check-ins, journals, body signals, and relationship reflections are added, this space becomes a clearer read of the patterns that keep returning.',
    sections: [],
    reflectionPrompt:
      'What has repeated lately, even if it only feels like a small signal right now?',
    areaLabels: [],
    sourcePatternKeys: [],
    isLowData: true,
  };
}

function portraitLeadForPattern(item: PremiumPatternItem): string {
  switch (item.category) {
    case 'dreamsSymbols':
      return 'You look for the deeper shape underneath what happened.';
    case 'responsibilityCare':
      return 'You often sense the weight of a situation before other people realize there is anything to hold.';
    case 'relationships':
    case 'supportBelonging':
    case 'communicationVoice':
    case 'familyHome':
      return 'Connection carries real weight for you.';
    case 'bodySignals':
      return 'Your body often joins the conversation early.';
    case 'restCapacity':
    case 'timeRhythms':
      return 'Rest and capacity are closely tied to safety for you.';
    case 'valuesIntegrity':
    case 'spiritualMeaning':
    case 'natalChartReflection':
      return 'Meaning matters because it helps you stay oriented when the obvious answer is not the honest one.';
    default:
      return 'You track what stays emotionally unfinished until it has enough language, support, or choice around it.';
  }
}

function portraitSearchText(patterns: PremiumPatternItem[]): string {
  return patterns
    .flatMap(item => [
      item.patternKey,
      item.title,
      item.category,
      item.clarityReframe,
      item.shameLabel,
      item.evidenceSummary,
      ...item.relatedSignals.map(humanizeKey),
    ])
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
}

function hasPortraitSignal(patterns: PremiumPatternItem[], matcher: RegExp): boolean {
  return matcher.test(portraitSearchText(patterns));
}

type ProfilePortraitRole =
  | 'recurringPattern'
  | 'protectiveAction'
  | 'protectivePurpose'
  | 'cost'
  | 'recoveryOrSoftening'
  | 'growthEdge';

type ProfilePortraitRoles = Record<ProfilePortraitRole, PremiumPatternItem[]>;

function emptyProfilePortraitRoles(): ProfilePortraitRoles {
  return {
    recurringPattern: [],
    protectiveAction: [],
    protectivePurpose: [],
    cost: [],
    recoveryOrSoftening: [],
    growthEdge: [],
  };
}

function patternSearchText(item: PremiumPatternItem): string {
  return [
    item.patternKey,
    item.title,
    item.category,
    item.clarityReframe,
    item.shameLabel,
    item.evidenceSummary,
    ...item.relatedSignals.map(humanizeKey),
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
}

function patternMatches(item: PremiumPatternItem, matcher: RegExp): boolean {
  return matcher.test(patternSearchText(item));
}

function classifyProfilePortraitRoles(patterns: PremiumPatternItem[]): ProfilePortraitRoles {
  const roles = emptyProfilePortraitRoles();

  for (const pattern of patterns) {
    const isRecovery = isRecoveryOrHelpfulPattern(pattern) || patternMatches(pattern, /\bglimmer\b|\bjoy\b|\bplay\b|\brelief\b|\bsupport\b|\bsoften\b|\bsettle\b|\brestorative\b/);
    const isBurden = patternMatches(pattern, /\binvisible\b|\bmental load\b|\bresponsibility\b|\bcarrying\b|\bcapacity\b|\brest\b|\bdream\b|\bunfinished\b|\bgrief\b|\blonging\b/);
    const isProtective = patternMatches(pattern, /\bbracing\b|\bprepared\b|\balways on\b|\bboundary\b|\blimit\b|\bprotect\b|\brepair\b|\brupture\b|\bsafety\b|\btruth\b|\balignment\b/);

    if (isBurden || roles.recurringPattern.length === 0) roles.recurringPattern.push(pattern);
    if (isProtective || pattern.concept === 'protective_behavior') {
      roles.protectiveAction.push(pattern);
      roles.protectivePurpose.push(pattern);
      roles.cost.push(pattern);
    }
    if (isRecovery) roles.recoveryOrSoftening.push(pattern);
    if (!isRecovery && !isBurden && !isProtective) roles.growthEdge.push(pattern);
  }

  return roles;
}

function rolePatterns(
  roles: ProfilePortraitRoles,
  role: ProfilePortraitRole,
  fallback: PremiumPatternItem[],
): PremiumPatternItem[] {
  return roles[role].length ? roles[role] : fallback;
}

function portraitProtectiveAction(patterns: PremiumPatternItem[]): string {
  if (hasPortraitSignal(patterns, /\brepair\b|\brupture\b|\bbracing\b|\bprepared\b|\balways on\b|\binvisible\b|\bmental load\b|\bresponsibility\b|\bcarrying\b/)) {
    return 'When something feels unfinished, tense, or uncertain, your system moves into readiness.';
  }

  if (hasPortraitSignal(patterns, /\bdream\b|\bsymbol\b|\bmeaning\b|\bunfinished\b|\bemotional residue\b/)) {
    return 'Part of you keeps looking for the deeper shape underneath what happened, especially when the feeling is too layered to name directly.';
  }

  if (hasPortraitSignal(patterns, /\bbody\b|\bsensation\b|\bchest\b|\bjaw\b|\bgut\b|\bthroat\b|\bbreath\b|\bsomatic\b/)) {
    return 'Your body tends to register strain early, before the story has fully organized itself in words.';
  }

  if (hasPortraitSignal(patterns, /\bboundary\b|\blimit\b|\btruth\b|\balignment\b|\bintegrity\b|\bsay no\b|\bsaying no\b/)) {
    return 'Part of you keeps checking whether the shape of things still lines up with what is true for you.';
  }

  if (hasPortraitSignal(patterns, /\brest\b|\bcapacity\b|\bsleep\b|\bpause\b|\blow energy\b|\blow capacity\b/)) {
    return 'Part of you keeps measuring whether there is enough safety and capacity to actually stop.';
  }

  return 'Part of you keeps tracking what still needs language, support, or a little more choice.';
}

function portraitProtectivePurpose(patterns: PremiumPatternItem[]): string {
  if (hasPortraitSignal(patterns, /\brepair\b|\brupture\b|\bbracing\b|\bprepared\b|\balways on\b|\binvisible\b|\bmental load\b|\bresponsibility\b|\bcarrying\b/)) {
    return 'The protection is old and practical: trying to prevent the moment from becoming heavier than you can carry alone.';
  }

  if (hasPortraitSignal(patterns, /\bdream\b|\bsymbol\b|\bmeaning\b|\bunfinished\b|\bemotional residue\b/)) {
    return 'That search for meaning helps your system hold what waking life has not finished organizing yet.';
  }

  if (hasPortraitSignal(patterns, /\bbody\b|\bsensation\b|\bchest\b|\bjaw\b|\bgut\b|\bthroat\b|\bbreath\b|\bsomatic\b/)) {
    return 'That early body signal helps your system ask for pacing, support, or protection before everything becomes too much.';
  }

  if (hasPortraitSignal(patterns, /\bboundary\b|\blimit\b|\btruth\b|\balignment\b|\bintegrity\b|\bsay no\b|\bsaying no\b/)) {
    return 'That checking protects your integrity, even when it makes simple answers harder to accept.';
  }

  return 'That tracking helps you stay close to what matters, even when it keeps your system working harder than it should have to.';
}

function portraitCost(patterns: PremiumPatternItem[]): string {
  if (hasPortraitSignal(patterns, /\brepair\b|\brupture\b|\bbracing\b|\bprepared\b|\balways on\b|\binvisible\b|\bmental load\b|\bresponsibility\b|\bcarrying\b/)) {
    return 'The cost is that you may stay prepared for weight that should not have to fall on you.';
  }

  if (hasPortraitSignal(patterns, /\bdream\b|\bsymbol\b|\bmeaning\b|\bunfinished\b|\bemotional residue\b/)) {
    return 'The cost is that your mind can keep working on the feeling long after the day has moved on.';
  }

  if (hasPortraitSignal(patterns, /\brest\b|\bcapacity\b|\bsleep\b|\bpause\b|\blow energy\b|\blow capacity\b/)) {
    return 'The cost is that rest can start to feel like another task your system has to earn.';
  }

  if (hasPortraitSignal(patterns, /\bboundary\b|\blimit\b|\btruth\b|\balignment\b|\bintegrity\b|\bsay no\b|\bsaying no\b/)) {
    return 'The cost is that protecting what is true can make you carry extra tension before you feel allowed to stand by it.';
  }

  return 'The cost is that your system can stay busy managing the pattern before you have had a chance to choose what you need.';
}

function portraitRecovery(patterns: PremiumPatternItem[]): string {
  if (hasPortraitSignal(patterns, /\brepair\b|\bsupport\b|\bunderstood\b|\bnot alone\b|\bbracing\b|\bcarrying\b|\bresponsibility\b/)) {
    return 'What helps you soften is not being told to let it go, but feeling that repair is possible, support is real, and the heaviness is not yours to carry alone.';
  }

  if (hasPortraitSignal(patterns, /\brest\b|\bcapacity\b|\bsleep\b|\bpause\b|\blow energy\b|\blow capacity\b/)) {
    return 'What helps is rest that feels chosen and protected, not collapse after carrying too much for too long.';
  }

  if (hasPortraitSignal(patterns, /\bdream\b|\bsymbol\b|\bmeaning\b|\bunfinished\b|\bemotional residue\b/)) {
    return 'What helps is enough quiet for the feeling to become language instead of staying trapped as residue.';
  }

  if (hasPortraitSignal(patterns, /\bjoy\b|\bplay\b|\bglimmer\b|\baliveness\b|\bbeauty\b|\blaughter\b|\brelief\b/)) {
    return 'What helps is letting small moments of aliveness count before everything is fixed.';
  }

  return 'What helps is support, language, and enough room to choose a response instead of only managing the pattern.';
}

function buildProfilePortrait(selectedPatterns: PremiumPatternItem[]): string {
  const roles = classifyProfilePortraitRoles(selectedPatterns);
  const [primary] = rolePatterns(roles, 'recurringPattern', selectedPatterns);
  const hasMultipleIngredients = selectedPatterns.length > 1;
  const primaryLead = primary
    ? portraitLeadForPattern(primary)
    : 'You track what stays emotionally unfinished until it has enough language, support, or choice around it.';
  const actionSentence = portraitProtectiveAction(rolePatterns(roles, 'protectiveAction', selectedPatterns));
  const purposeSentence = portraitProtectivePurpose(rolePatterns(roles, 'protectivePurpose', selectedPatterns));
  const costSentence = portraitCost(rolePatterns(roles, 'cost', selectedPatterns));
  const recoverySentence = portraitRecovery(rolePatterns(roles, 'recoveryOrSoftening', selectedPatterns));
  const identitySentence = hasMultipleIngredients
    ? 'Right now, this deserves support, not a permanent label.'
    : 'Right now, this is asking for support, not a permanent label.';

  return [
    primaryLead,
    actionSentence,
    purposeSentence,
    costSentence,
    recoverySentence,
    identitySentence,
  ].filter(Boolean).join(' ');
}

function growthOrRecoveryForProfile(
  premiumPatterns: PremiumPatternItem[],
  selectedPatterns: PremiumPatternItem[],
): PremiumPatternProfile['growthOrRecovery'] {
  const selectedKeys = new Set(selectedPatterns.map(item => item.patternKey));
  const candidates = sortPatternsForProfile(premiumPatterns.filter(isProfileCandidate));
  const recovery = candidates.find(item => !selectedKeys.has(item.patternKey) && isRecoveryOrHelpfulPattern(item));

  if (recovery) {
    const signalPhrase = ` It tends to arrive ${livedMomentFromText(patternSearchText(recovery))}.`;
    const reframe = personalReframeSentence(recovery);
    return {
      title: 'What Helps You Soften',
      body: [
        `${recovery.title} shows what lowers the pressure without asking you to abandon what you care about.${signalPhrase}`,
        reframe,
      ].filter(Boolean).join(' '),
      patternKey: recovery.patternKey,
    };
  }

  const growth = candidates.find(item => !selectedKeys.has(item.patternKey));
  return {
    title: 'Growth Edge',
    body:
      'The growth edge is choice. Give the pattern more room around it, so you can notice when it is protecting you and when it is costing too much.',
    patternKey: growth?.patternKey,
  };
}

export function selectPremiumPatternProfile(
  premiumPatterns: PremiumPatternItem[],
): PremiumPatternProfile {
  const eligiblePatterns = premiumPatterns.filter(item =>
    isInsightCategoryAllowedOnSurface(item.category, 'patternScreen'),
  );
  const selectedPatterns = selectDistinctProfilePatterns(eligiblePatterns);
  if (selectedPatterns.length < MIN_PROFILE_PATTERN_AREAS) {
    return lowDataPatternProfile();
  }

  const rootPattern = selectRootPatternConstellation(
    eligiblePatterns.map(rootPatternEvidenceFromPremiumItem),
  );
  const sections = selectedPatterns.map(sectionForPattern);
  const growthOrRecovery = growthOrRecoveryForProfile(eligiblePatterns, selectedPatterns);
  const areaLabels = unique([
    ...(rootPattern ? [rootPattern.name] : []),
    ...sections.map(section => section.title),
    ...(growthOrRecovery ? [growthOrRecovery.title] : []),
  ]).slice(0, 4);

  return {
    title: 'Your Pattern Profile',
    subtitle: rootPattern
      ? 'A deeper read of the protective move underneath several patterns.'
      : 'A deeper read of the patterns that keep returning.',
    portrait: rootPattern?.body ?? buildProfilePortrait(selectedPatterns),
    rootPattern: rootPattern ?? undefined,
    sections,
    growthOrRecovery,
    reflectionPrompt:
      rootPattern?.reflectionPrompt ??
      'What would change if you treated the strongest pattern as information about what needs support, not proof of who you have to be?',
    areaLabels,
    sourcePatternKeys: unique([
      ...(rootPattern?.matchedPatternKeys ?? []),
      ...sections.map(section => section.patternKey),
      ...(growthOrRecovery?.patternKey ? [growthOrRecovery.patternKey] : []),
    ]),
  };
}

function isLowConfidenceWeeklyCandidate(item: PremiumPatternItem): boolean {
  return item.confidence === 'emerging' || (item.score ?? 0) < 50;
}

function timestamp(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortPatternsForWeeklySurface(
  patterns: PremiumPatternItem[],
): PremiumPatternItem[] {
  return [...patterns].sort((a, b) => {
    const scoreDelta = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDelta !== 0) return scoreDelta;
    return timestamp(b.lastSeenAt) - timestamp(a.lastSeenAt);
  });
}

function chooseWeeklySurfacePattern(
  candidates: PremiumPatternItem[],
  avoidPatternKeys: Iterable<string> = [],
  excludeBodyKeys: Iterable<string> = [],
): PremiumPatternItem | null {
  const sorted = sortPatternsForWeeklySurface(candidates);
  if (!sorted.length) return null;
  const avoided = new Set(avoidPatternKeys);
  const excludedBodies = new Set(excludeBodyKeys);

  const preferred = sorted.find(candidate =>
    !avoided.has(candidate.patternKey) &&
    !!thisWeekBodyForPattern(candidate, excludedBodies),
  );
  if (preferred) return preferred;

  return sorted.find(candidate => !!thisWeekBodyForPattern(candidate, excludedBodies)) ?? null;
}

function firstSentence(text: string): string {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/)?.[0]?.trim() ?? text.trim();
}

function firstParagraph(text: string | undefined): string | null {
  const paragraph = text?.split('\n\n').find(part => part.trim().length > 0)?.trim();
  return paragraph || null;
}

function displayBodyKey(text: string | undefined): string {
  return patternParagraphBodyKey(text ?? '');
}

function weeklyReadBodyForPattern(item: PremiumPatternItem): string {
  return item.weeklyBody ?? item.body;
}

function weeklyReadForPattern(item: PremiumPatternItem): PremiumWeeklyDeepDiveItem {
  const concept = item.concept ?? CATEGORY_CONCEPT[item.category];
  const isLowConfidenceFallback = isLowConfidenceWeeklyCandidate(item);
  const preview = firstSentence(item.body);
  const body = weeklyReadBodyForPattern(item);

  return {
    id: `weekly-v2-${item.patternKey}`,
    patternKey: item.patternKey,
    category: item.category,
    title: item.title,
    preview,
    body,
    whyItMayMatter: WHY_IT_MAY_MATTER[concept],
    reframe: isLowConfidenceFallback
      ? 'Keep it as a possible thread, not a verdict.'
      : item.clarityReframe ?? '',
    evidenceSummary: isLowConfidenceFallback
      ? `Emerging: ${item.evidenceSummary}`
      : item.evidenceSummary,
    reflectionPrompt: REFLECTION_PROMPTS[concept],
    confidence: item.confidence,
    movement: item.movement,
    isV2Derived: true,
    isLowConfidenceFallback,
  };
}

function weeklyLowDataEmptyState(): PremiumWeeklyDeepDiveItem {
  return {
    id: 'weekly-v2-low-data',
    patternKey: 'weeklyDeepDive_lowData',
    category: 'emotionalWeather',
    title: 'Weekly Deep Dive Is Still Gathering Signal',
    preview: 'There is not enough pattern evidence for a firm weekly read yet.',
    body:
      'There is not enough repeating signal for a firm weekly read yet. Rather than forcing a pattern too early, the next few check-ins can help the pattern become clearer across moods, body signals, relationships, rest, and recovery.',
    whyItMayMatter:
      'Weak evidence should stay spacious. The read is more useful when it can name a real pattern instead of turning a thin signal into a story.',
    reframe:
      'Not having a deep read yet does not mean nothing is happening. It means the pattern needs more evidence before it can be named responsibly.',
    evidenceSummary: 'No pattern has enough recent evidence for a responsible weekly read yet.',
    reflectionPrompt: 'What felt most worth noting this week, even if it only happened once?',
    confidence: 'emerging',
    movement: 'new',
    isV2Derived: true,
    isEmptyState: true,
  };
}

export function adaptWeeklyPremiumPatternCandidates(
  patternScores: ArchivePatternScore[],
  options: Omit<AdaptPremiumPatternsOptions, 'includeLowConfidence' | 'maxItems'> = {},
): PremiumPatternItem[] {
  return adaptPremiumPatterns(patternScores, {
    ...options,
    surface: options.surface ?? 'weeklyDeepDive',
    includeLowConfidence: true,
    maxItems: MAX_WEEKLY_PATTERN_CANDIDATES,
  });
}

export function selectPremiumWeeklyDeepDive(
  premiumPatterns: PremiumPatternItem[],
  options: SelectPremiumWeeklyDeepDiveOptions = {},
): PremiumWeeklyDeepDiveItem[] {
  const eligiblePatterns = premiumPatterns.filter(item =>
    isInsightCategoryAllowedOnSurface(item.category, 'patternScreen'),
  );
  if (eligiblePatterns.length === 0) return [weeklyLowDataEmptyState()];

  const sorted = [...eligiblePatterns].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const archiveCorePatternKey = sorted[0]?.patternKey;
  const candidates = sorted.length >= 3
    ? sorted.filter(pattern => pattern.patternKey !== archiveCorePatternKey)
    : sorted;
  const selected: PremiumPatternItem[] = [];
  const seenPatternKeys = new Set<string>();
  const seenTitles = new Set<string>();
  const seenCategories = new Set<InsightCategory>();
  const seenBodyKeys = new Set(options.excludeBodyKeys ?? []);

  const add = (item: PremiumPatternItem, strictCategory = true) => {
    if (selected.length >= MAX_WEEKLY_DEEP_READS) return;
    const titleKey = normalizeTitle(item.title);
    const bodyKey = displayBodyKey(weeklyReadBodyForPattern(item));
    if (seenPatternKeys.has(item.patternKey) || seenTitles.has(titleKey)) return;
    if (strictCategory && seenCategories.has(item.category)) return;
    if (seenBodyKeys.has(bodyKey)) return;
    selected.push(item);
    seenPatternKeys.add(item.patternKey);
    seenTitles.add(titleKey);
    seenCategories.add(item.category);
    seenBodyKeys.add(bodyKey);
  };

  const recoveryPattern = candidates.find(isRecoveryOrHelpfulPattern);
  if (recoveryPattern) add(recoveryPattern);

  for (const candidate of candidates) {
    add(candidate);
  }

  if (selected.length < MIN_WEEKLY_DEEP_READS) {
    for (const candidate of sorted) {
      add(candidate, false);
      if (selected.length >= MIN_WEEKLY_DEEP_READS) break;
    }
  }

  const reads = selected.slice(0, MAX_WEEKLY_DEEP_READS).map(weeklyReadForPattern);
  if (reads.length < MIN_WEEKLY_DEEP_READS) {
    return [...reads, weeklyLowDataEmptyState()].slice(0, MIN_WEEKLY_DEEP_READS);
  }

  return reads;
}

function thisWeekLowDataEmptyState(): PremiumThisWeekPatternItem {
  return {
    id: 'this-week-v2-low-data',
    patternKey: 'thisWeek_lowData',
    category: 'emotionalWeather',
    title: 'Your Weekly Pattern Is Still Forming',
    body:
      'There is not enough repetition to name a weekly pattern responsibly. A thin signal can matter, but it should not be forced into a story before more evidence gathers.',
    reframe:
      'Your pattern map is waiting for something real enough to name.',
    confidence: 'emerging',
    movement: 'new',
    evidenceSummary: 'No pattern has enough recent evidence for a responsible weekly card yet.',
    isV2Derived: true,
    isEmptyState: true,
  };
}

function thisWeekBodyForPattern(
  item: PremiumPatternItem,
  excludeBodyKeys: Iterable<string> = [],
): string | null {
  const excluded = new Set(excludeBodyKeys);
  const candidates = [
    firstParagraph(item.weeklyBody),
    item.body,
  ].filter((body): body is string => !!body && body.trim().length > 0);

  return candidates.find(body => !excluded.has(displayBodyKey(body))) ?? null;
}

function thisWeekPatternForPattern(
  item: PremiumPatternItem,
  excludeBodyKeys: Iterable<string> = [],
): PremiumThisWeekPatternItem | null {
  const isLowConfidenceFallback = isLowConfidenceWeeklyCandidate(item);
  const body = thisWeekBodyForPattern(item, excludeBodyKeys);
  if (!body) return null;

  return {
    id: `this-week-v2-${item.patternKey}`,
    patternKey: item.patternKey,
    category: item.category,
    title: item.title,
    body,
    reframe: isLowConfidenceFallback
      ? 'Let it stay spacious while more evidence gathers.'
      : item.clarityReframe ?? '',
    confidence: item.confidence,
    movement: item.movement,
    evidenceSummary: isLowConfidenceFallback
      ? `Emerging: ${item.evidenceSummary}`
      : item.evidenceSummary,
    isV2Derived: true,
    isLowConfidenceFallback,
  };
}

export function selectThisWeeksV2Pattern(
  patternScores: ArchivePatternScore[],
  premiumPatterns: PremiumPatternItem[],
  premiumWeeklyDeepDive: PremiumWeeklyDeepDiveItem[],
  options: SelectThisWeeksV2PatternOptions = {},
): PremiumThisWeekPatternItem {
  const eligiblePremiumPatterns = premiumPatterns.filter(item =>
    isInsightCategoryAllowedOnSurface(item.category, 'patternScreen'),
  );
  const eligibleWeeklyDeepDive = premiumWeeklyDeepDive.filter(item =>
    isInsightCategoryAllowedOnSurface(item.category, 'patternScreen'),
  );
  const avoidPatternKeys = new Set([
    ...eligibleWeeklyDeepDive
      .filter(read => !read.isEmptyState)
      .map(read => read.patternKey),
    ...(options.avoidPatternKeys ?? []),
  ]);
  const excludeBodyKeys = new Set([
    ...(options.excludeBodyKeys ?? []),
    ...eligibleWeeklyDeepDive
      .filter(read => !read.isEmptyState)
      .map(read => displayBodyKey(read.body)),
  ]);
  const strongCandidates = eligiblePremiumPatterns.filter(pattern => pattern.confidence !== 'emerging');
  const selectedStrong = chooseWeeklySurfacePattern(strongCandidates, avoidPatternKeys, excludeBodyKeys);

  if (selectedStrong) {
    const selected = thisWeekPatternForPattern(selectedStrong, excludeBodyKeys);
    if (selected) return selected;
  }

  const lowConfidenceCandidates = adaptWeeklyPremiumPatternCandidates(patternScores, {
    surface: 'thisWeek',
    excludeBodyKeys: Array.from(excludeBodyKeys),
  });
  const selectedLowConfidence = chooseWeeklySurfacePattern(
    lowConfidenceCandidates,
    avoidPatternKeys,
    excludeBodyKeys,
  );

  if (selectedLowConfidence) {
    const selected = thisWeekPatternForPattern(selectedLowConfidence, excludeBodyKeys);
    if (selected) return selected;
  }

  return thisWeekLowDataEmptyState();
}
