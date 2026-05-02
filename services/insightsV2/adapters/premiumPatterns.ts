import { ARCHIVE_PATTERNS } from '../patternPacks';
import type {
  ArchivePattern,
  ArchivePatternScore,
  EvidenceAnchor,
  InsightCategory,
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
  isV2Derived: true;
  isLowConfidenceFallback?: boolean;
  isEmptyState?: boolean;
}

interface AdaptPremiumPatternsOptions {
  includeLowConfidence?: boolean;
  maxItems?: number;
}

const MIN_PREMIUM_PATTERN_SCORE = 0.5;
const MAX_PREMIUM_PATTERN_ITEMS = 24;
const MAX_WEEKLY_PATTERN_CANDIDATES = 32;
const MIN_WEEKLY_DEEP_READS = 2;
const MAX_WEEKLY_DEEP_READS = 4;

const SOURCE_LABELS: Partial<Record<EvidenceAnchor['source'], string>> = {
  dailyCheckIn: 'daily check-ins',
  journal: 'journal entries',
  dream: 'dream material',
  sleep: 'sleep logs',
  triggerLog: 'trigger logs',
  glimmerLog: 'glimmer logs',
  bodyMap: 'body maps',
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
    'This may matter because it is organizing more than one part of your week. A core pattern becomes useful when you can recognize it before it decides the whole moment for you.',
  body_awareness:
    'This may matter because your body may be giving you information before your thoughts have finished explaining it. The signal is not an enemy; it may be an early doorway into regulation.',
  protective_behavior:
    'This may matter because protective patterns often begin as care, survival, or responsibility. Seeing the protection clearly gives you more choice about when it helps and when it starts costing too much.',
  relational_dynamic:
    'This may matter because connection can change your nervous system quickly. Tone, repair, distance, and support are not small details when your body is trying to decide whether closeness is safe.',
  processing_style:
    'This may matter because the way you make sense of things affects how quickly you can move. Your system may need clarity, language, or a smaller next step before action feels honest.',
  emotional_theme:
    'This may matter because repeated emotion is often information, not noise. When the same feeling keeps returning, it may be pointing to something that still wants care, closure, or space.',
  recovery_pattern:
    'This may matter because recovery is easier to protect when you know what actually helps you come back. Small relief becomes useful when it is recognizable and repeatable.',
  dream_archive_contrast:
    'This may matter because dream material can carry emotional residue that waking life has not fully organized. It does not have to predict anything to show what your system is still processing.',
  values_pattern:
    'This may matter because values often show up first as friction. The discomfort may be helping you protect something honest, even before the next choice is fully clear.',
  statistical_trend:
    'This may matter because rhythm is data. Repeated capacity, sleep, mood, or timing patterns can help you plan with your system instead of judging it from the outside.',
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

function movementSentence(score: ArchivePatternScore): string {
  if (score.movement === 'intensifying') {
    return 'This pattern appears louder than it has been recently.';
  }
  if (score.movement === 'softening') {
    return 'This pattern is still present, but it may be softening.';
  }
  if (score.movement === 'returning') {
    return 'This pattern appears to be returning after being quieter.';
  }
  if (score.movement === 'repeating') {
    return 'This pattern is showing up repeatedly enough to belong in the map.';
  }
  return 'This pattern has enough signal to be worth tracking now.';
}

function confidenceSentence(confidence: PatternConfidence): string {
  if (confidence === 'veryStrong') return 'The evidence is strong enough for a clear read.';
  if (confidence === 'strong') return 'The evidence is clear enough to take seriously.';
  if (confidence === 'moderate') return 'The evidence is still forming, so the read should stay spacious.';
  return 'The evidence is early, so this should stay tentative.';
}

function buildSourceCoverage(score: ArchivePatternScore): string[] {
  return unique(
    score.sources.map(source => SOURCE_LABELS[source] ?? humanizeKey(source)),
  );
}

function buildEvidenceSummary(score: ArchivePatternScore): string {
  const sources = buildSourceCoverage(score).slice(0, 3);
  const sourceText = sources.length
    ? `Seen across ${formatList(sources)}`
    : 'Seen in your recent archive';
  return `${sourceText} over roughly ${score.timeframeDays} days.`;
}

function buildBody(
  pattern: ArchivePattern,
  score: ArchivePatternScore,
): string {
  const signalNames = unique([
    ...pattern.requiredSignals,
    ...pattern.supportingSignals,
  ].map(humanizeKey)).slice(0, 3);
  const signalSentence = signalNames.length
    ? `The related signals include ${formatList(signalNames)}.`
    : '';
  const clarity = trimTerminalPunctuation(pattern.clarityReframe);
  const shame = trimTerminalPunctuation(pattern.shameLabel);

  return [
    pattern.description,
    `${movementSentence(score)} ${confidenceSentence(score.confidence)}`,
    `This does not read as ${shame}. It reads as ${clarity}.`,
    `${buildEvidenceSummary(score)}${signalSentence ? ` ${signalSentence}` : ''}`,
  ].join('\n\n');
}

function patternByKey(key: string): ArchivePattern | null {
  return ARCHIVE_PATTERNS.find(pattern => pattern.key === key) ?? null;
}

function shouldIncludeScore(
  score: ArchivePatternScore,
  options: AdaptPremiumPatternsOptions = {},
): boolean {
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
  const items = patternScores
    .filter(score => shouldIncludeScore(score, options))
    .sort((a, b) => b.score - a.score)
    .map((score): PremiumPatternItem | null => {
      const pattern = patternByKey(score.patternKey);
      if (!pattern) return null;

      const sourceCoverage = buildSourceCoverage(score);
      return {
        title: score.title,
        body: buildBody(pattern, score),
        lens: CATEGORY_LENS[score.category],
        concept: CATEGORY_CONCEPT[score.category],
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
        relatedSignals: unique([
          ...pattern.requiredSignals,
          ...pattern.supportingSignals,
        ]),
        shameLabel: pattern.shameLabel,
        clarityReframe: pattern.clarityReframe,
        librarySectionTitle: CATEGORY_DISPLAY[score.category],
        archiveSectionTitle: CATEGORY_DISPLAY[score.category],
        isV2Derived: true,
      };
    })
    .filter((item): item is PremiumPatternItem => !!item);

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

function splitBodyParts(body: string): {
  description: string;
  movement: string;
  reframe: string;
} {
  const parts = body.split(/\n{2,}/).map(part => part.trim()).filter(Boolean);
  return {
    description: parts[0] ?? body,
    movement: parts[1] ?? '',
    reframe: parts[2] ?? '',
  };
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
  avoidPatternKey?: string,
): PremiumPatternItem | null {
  const sorted = sortPatternsForWeeklySurface(candidates);
  if (!sorted.length) return null;

  if (avoidPatternKey && sorted.length > 1) {
    return sorted.find(candidate => candidate.patternKey !== avoidPatternKey) ?? sorted[0];
  }

  return sorted[0];
}

function weeklyReadForPattern(item: PremiumPatternItem): PremiumWeeklyDeepDiveItem {
  const concept = item.concept ?? CATEGORY_CONCEPT[item.category];
  const { description, movement, reframe } = splitBodyParts(item.body);
  const isLowConfidenceFallback = isLowConfidenceWeeklyCandidate(item);
  const body = isLowConfidenceFallback
    ? [
        `Your archive has a light signal around ${item.title.toLowerCase()}. It is not enough for a firm read yet, but it may be worth holding gently as an emerging thread.`,
        description,
      ].join('\n\n')
    : [description, movement].filter(Boolean).join('\n\n');

  return {
    id: `weekly-v2-${item.patternKey}`,
    patternKey: item.patternKey,
    category: item.category,
    title: item.title,
    preview: description,
    body,
    whyItMayMatter: WHY_IT_MAY_MATTER[concept],
    reframe: isLowConfidenceFallback
      ? 'This is not a conclusion yet. It is a possible thread MySky is tracking softly until more evidence gathers around it.'
      : reframe || (item.clarityReframe ?? ''),
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
    preview: 'MySky does not have enough pattern evidence for a firm weekly read yet.',
    body:
      'Your archive is still learning what repeats. Rather than forcing a pattern too early, MySky is waiting for enough evidence across moods, body signals, dreams, relationships, rest, and recovery.',
    whyItMayMatter:
      'This matters because weak evidence should stay spacious. The read is more useful when it can name a real pattern instead of turning a thin signal into a story.',
    reframe:
      'Not having a deep read yet does not mean nothing is happening. It means MySky is waiting for a pattern with enough evidence to name responsibly.',
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
): PremiumPatternItem[] {
  return adaptPremiumPatterns(patternScores, {
    includeLowConfidence: true,
    maxItems: MAX_WEEKLY_PATTERN_CANDIDATES,
  });
}

export function selectPremiumWeeklyDeepDive(
  premiumPatterns: PremiumPatternItem[],
): PremiumWeeklyDeepDiveItem[] {
  if (premiumPatterns.length === 0) return [weeklyLowDataEmptyState()];

  const sorted = [...premiumPatterns].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const archiveCorePatternKey = sorted[0]?.patternKey;
  const candidates = sorted.length >= 3
    ? sorted.filter(pattern => pattern.patternKey !== archiveCorePatternKey)
    : sorted;
  const selected: PremiumPatternItem[] = [];
  const seenPatternKeys = new Set<string>();
  const seenTitles = new Set<string>();
  const seenCategories = new Set<InsightCategory>();

  const add = (item: PremiumPatternItem, strictCategory = true) => {
    if (selected.length >= MAX_WEEKLY_DEEP_READS) return;
    const titleKey = normalizeTitle(item.title);
    if (seenPatternKeys.has(item.patternKey) || seenTitles.has(titleKey)) return;
    if (strictCategory && seenCategories.has(item.category)) return;
    selected.push(item);
    seenPatternKeys.add(item.patternKey);
    seenTitles.add(titleKey);
    seenCategories.add(item.category);
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
      'MySky is still gathering enough repetition to name a weekly pattern responsibly. A thin signal can matter, but it should not be forced into a story before the archive has more evidence.',
    reframe:
      'This is not a lack of progress. It means your pattern map is waiting for something real enough to name.',
    confidence: 'emerging',
    movement: 'new',
    evidenceSummary: 'No pattern has enough recent evidence for a responsible weekly card yet.',
    isV2Derived: true,
    isEmptyState: true,
  };
}

function thisWeekPatternForPattern(item: PremiumPatternItem): PremiumThisWeekPatternItem {
  const { description, movement, reframe } = splitBodyParts(item.body);
  const isLowConfidenceFallback = isLowConfidenceWeeklyCandidate(item);

  return {
    id: `this-week-v2-${item.patternKey}`,
    patternKey: item.patternKey,
    category: item.category,
    title: item.title,
    body: isLowConfidenceFallback
      ? `MySky is seeing an early thread around ${item.title.toLowerCase()}. It is not a firm read yet, but it may be worth noticing gently this week.`
      : [description, movement].filter(Boolean).join(' '),
    reframe: isLowConfidenceFallback
      ? 'This is an emerging signal, not a conclusion. Let it stay spacious while more evidence gathers.'
      : reframe || (item.clarityReframe ?? ''),
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
): PremiumThisWeekPatternItem {
  const weeklyTopPatternKey = premiumWeeklyDeepDive.find(read => !read.isEmptyState)?.patternKey;
  const strongCandidates = premiumPatterns.filter(pattern => pattern.confidence !== 'emerging');
  const selectedStrong = chooseWeeklySurfacePattern(strongCandidates, weeklyTopPatternKey);

  if (selectedStrong) {
    return thisWeekPatternForPattern(selectedStrong);
  }

  const lowConfidenceCandidates = adaptWeeklyPremiumPatternCandidates(patternScores);
  const selectedLowConfidence = chooseWeeklySurfacePattern(
    lowConfidenceCandidates,
    weeklyTopPatternKey,
  );

  if (selectedLowConfidence) {
    return thisWeekPatternForPattern(selectedLowConfidence);
  }

  return thisWeekLowDataEmptyState();
}
