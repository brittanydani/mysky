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

export interface PremiumPatternProfileSection {
  key: string;
  title: string;
  body: string;
  category: InsightCategory;
  patternKey: string;
  confidence: PatternConfidence;
}

export interface PremiumPatternProfile {
  title: string;
  subtitle: string;
  portrait: string;
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
    'This matters because it is organizing more than one part of your week. A core pattern becomes useful when you can recognize it before it decides the whole moment for you.',
  body_awareness:
    'This matters because your body gives information before your thoughts have finished explaining it. The signal is not an enemy; it is an early doorway into regulation.',
  protective_behavior:
    'This matters because protective patterns often begin as care, survival, or responsibility. Seeing the protection clearly gives you more choice about when it helps and when it starts costing too much.',
  relational_dynamic:
    'This matters because connection can change your nervous system quickly. Tone, repair, distance, and support are not small details when your body is trying to decide whether closeness is safe.',
  processing_style:
    'This matters because the way you make sense of things affects how quickly you can move. Your system needs clarity, language, or a smaller next step before action feels honest.',
  emotional_theme:
    'This matters because repeated emotion is often information, not noise. When the same feeling keeps returning, something still wants care, closure, or space.',
  recovery_pattern:
    'This matters because recovery is easier to protect when you know what actually helps you come back. Small relief becomes useful when it is recognizable and repeatable.',
  dream_archive_contrast:
    'This matters because dream material can carry emotional residue that waking life has not fully organized. It does not have to predict anything to show what your system is still processing.',
  values_pattern:
    'This matters because values often show up first as friction. The discomfort helps you protect something honest, even before the next choice is fully clear.',
  statistical_trend:
    'This matters because rhythm is data. Repeated capacity, sleep, mood, or timing patterns help you plan with your system instead of judging it from the outside.',
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
    return 'This has been louder than it was recently.';
  }
  if (score.movement === 'softening') {
    return 'This is still present, and it is softening.';
  }
  if (score.movement === 'returning') {
    return 'This is returning after being quieter.';
  }
  if (score.movement === 'repeating') {
    return 'This repeats enough to belong in the map.';
  }
  return 'This is clear enough to track now.';
}

function confidenceSentence(confidence: PatternConfidence): string {
  if (confidence === 'veryStrong') return 'The pattern is clear now.';
  if (confidence === 'strong') return 'There is enough consistency to name it.';
  if (confidence === 'moderate') return 'This is still forming, so hold it spaciously.';
  return 'This is early, so hold it lightly.';
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
    : 'Seen in recent signals';
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
    ? `It shows up around ${formatList(signalNames)}.`
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

function lowerFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function sentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function titleAsPhrase(title: string): string {
  return trimTerminalPunctuation(title)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
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

function personalReframeSentence(item: PremiumPatternItem): string {
  const raw = item.clarityReframe ?? '';
  const reframe = confidentReframeText(raw, item.confidence);
  if (!reframe) return '';

  if (/\byou\b|\byour\b|\byourself\b/i.test(reframe)) {
    return sentence(reframe);
  }

  if (/^this\b/i.test(reframe)) {
    return sentence(reframe.replace(/^this\b/i, 'For you, this'));
  }

  if (/^it\b/i.test(reframe)) {
    return sentence(reframe.replace(/^it\b/i, 'For you, it'));
  }

  return sentence(`For you, ${lowerFirst(reframe)}`);
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
    return sentence(`The old fear that ${lowerFirst(pressure)} does not have to run the whole story`);
  }

  if (/\bshould\b|\bhave to\b|\bmust\b|\bcannot\b/i.test(pressure)) {
    return sentence(`The old expectation that ${lowerFirst(pressure)} does not have to run the whole story`);
  }

  return sentence(`The old belief that ${lowerFirst(pressure)} does not get to define who you are`);
}

function evidenceAsPersonalSentence(item: PremiumPatternItem): string {
  const summary = item.evidenceSummary.trim();
  if (!summary) return '';

  const rewritten = summary
    .replace(/^Seen across\b/i, 'It has shown up across')
    .replace(/^Seen in\b/i, 'It has shown up in')
    .replace(/^Emerging:\s*/i, 'It is still emerging, but ')
    .replace(/\s+/g, ' ')
    .trim();

  return sentence(rewritten);
}

function relatedSignalSentence(item: PremiumPatternItem): string {
  const signals = unique(item.relatedSignals.map(humanizeKey)).slice(0, 3);
  if (!signals.length) return '';

  return sentence(`For you, it tends to gather around ${formatList(signals)}`);
}

function personalLeadForPattern(item: PremiumPatternItem): string {
  const title = titleAsPhrase(item.title);

  switch (item.category) {
    case 'responsibilityCare':
      return `There is a clear pattern around ${title}. You often notice what needs to be held before you notice what it is costing you.`;
    case 'relationships':
    case 'supportBelonging':
    case 'communicationVoice':
    case 'familyHome':
      return `${item.title} is active in how you read connection. Tone, repair, support, distance, and being understood carry real weight for you.`;
    case 'bodySignals':
      return `${item.title} is active in your body. Your body often joins the conversation before your mind has finished explaining what happened.`;
    case 'safetyRegulation':
      return `${item.title} is active in how your system tracks safety. Part of you notices what feels steady, what feels uncertain, and what needs more evidence before it can settle.`;
    case 'restCapacity':
    case 'timeRhythms':
      return `${item.title} is active around capacity. Rest is not simple when part of you is still tracking what needs to be handled.`;
    case 'selfWorthReceiving':
    case 'scarcityAbundance':
      return `${item.title} is active around receiving and enoughness. Support can feel meaningful and exposed at the same time when being cared for touches the part of you that learned to stay useful.`;
    case 'workAmbition':
      return `${item.title} is active around ambition. Progress, standards, and output can become ways your system tries to create safety.`;
    case 'lifeDirection':
    case 'identityGrowth':
      return `${item.title} is active around becoming. For you, the question is not only what comes next; it is who you are becoming and what kind of stability that becoming needs.`;
    case 'cognitiveStyle':
      return `${item.title} is active in how your mind organizes experience. You look for language, context, and structure so the feeling becomes less shapeless and the next step becomes honest.`;
    case 'valuesIntegrity':
    case 'spiritualMeaning':
    case 'natalChartReflection':
      return `${item.title} is active around meaning. You rely on inner truth more than surface answers when something does not feel honest or aligned.`;
    case 'emotionalWeather':
    case 'griefTransitions':
      return `${item.title} is active in your emotional world. You can hold more than one truth at once, and the slower feeling often needs room after the practical situation has already moved on.`;
    case 'dreamsSymbols':
      return `${item.title} is active in your dream life. Your dreams seem to hold material your waking life has not finished organizing.`;
    case 'creativityExpression':
      return `${item.title} is active in how your inner world moves outward. Making, naming, designing, or speaking can turn what is internal into something your system can work with.`;
    case 'pleasurePlay':
    case 'glimmersRegulation':
      return `${item.title} is active around aliveness. Joy, beauty, relief, and small glimmers are part of how your system finds its way back to itself.`;
    default:
      return `${item.title} is one of the clearer patterns here. You keep returning to it because something in it still needs protection, clarity, or care.`;
  }
}

function sectionBodyForPattern(item: PremiumPatternItem): string {
  return [
    personalLeadForPattern(item),
    personalReframeSentence(item),
    pressureReframeSentence(item),
    relatedSignalSentence(item),
    evidenceAsPersonalSentence(item),
  ].filter(Boolean).join(' ');
}

function sectionForPattern(item: PremiumPatternItem): PremiumPatternProfileSection {
  const title = patternAreaLabel(item);
  return {
    key: `profile-section-${item.patternKey}`,
    title,
    body: sectionBodyForPattern(item),
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
      'This profile is still forming. As more check-ins, journals, dreams, body signals, and relationship reflections are added, this space becomes a clearer read of the patterns that keep returning.',
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
      return 'You seem to process life by looking for the deeper shape underneath what happened.';
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
      return 'You seem to track what stays emotionally unfinished until it has enough language, support, or choice around it.';
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
    return 'This is not just worry or overthinking. It is an old form of protection: trying to prevent the moment from becoming heavier than you can carry alone.';
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
    : 'You seem to track what stays emotionally unfinished until it has enough language, support, or choice around it.';
  const actionSentence = portraitProtectiveAction(rolePatterns(roles, 'protectiveAction', selectedPatterns));
  const purposeSentence = portraitProtectivePurpose(rolePatterns(roles, 'protectivePurpose', selectedPatterns));
  const costSentence = portraitCost(rolePatterns(roles, 'cost', selectedPatterns));
  const recoverySentence = portraitRecovery(rolePatterns(roles, 'recoveryOrSoftening', selectedPatterns));
  const identitySentence = hasMultipleIngredients
    ? 'This is not a fixed identity; it is the pattern asking for the most attention right now.'
    : 'This is not a fixed identity; it is the pattern asking for support right now.';

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
    const signals = unique(recovery.relatedSignals.map(humanizeKey)).slice(0, 3);
    const signalPhrase = signals.length
      ? ` For you, softening gathers around ${formatList(signals)}.`
      : '';
    const reframe = personalReframeSentence(recovery);
    return {
      title: 'What Helps You Soften',
      body: [
        'Recovery is not about one dramatic breakthrough.',
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
      'The growth edge is choice. The pattern does not need to disappear; it needs more room around it, so you can notice when it is protecting you and when it is costing too much.',
    patternKey: growth?.patternKey,
  };
}

export function selectPremiumPatternProfile(
  premiumPatterns: PremiumPatternItem[],
): PremiumPatternProfile {
  const selectedPatterns = selectDistinctProfilePatterns(premiumPatterns);
  if (selectedPatterns.length < MIN_PROFILE_PATTERN_AREAS) {
    return lowDataPatternProfile();
  }

  const sections = selectedPatterns.map(sectionForPattern);
  const growthOrRecovery = growthOrRecoveryForProfile(premiumPatterns, selectedPatterns);
  const areaLabels = unique([
    ...sections.map(section => section.title),
    ...(growthOrRecovery ? [growthOrRecovery.title] : []),
  ]).slice(0, 4);

  return {
    title: 'Your Pattern Profile',
    subtitle: 'A deeper read of the patterns that keep returning.',
    portrait: buildProfilePortrait(selectedPatterns),
    sections,
    growthOrRecovery,
    reflectionPrompt:
      'What would change if you treated the strongest pattern as information about what needs support, not proof of who you have to be?',
    areaLabels,
    sourcePatternKeys: unique([
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
        `A light signal is forming around ${item.title.toLowerCase()}. It is not enough for a firm read yet, but it is worth holding gently as an emerging thread.`,
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
      ? 'This is not a conclusion yet. It is a possible thread to track softly until more evidence gathers around it.'
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
    preview: 'There is not enough pattern evidence for a firm weekly read yet.',
    body:
      'There is not enough repeating signal for a firm weekly read yet. Rather than forcing a pattern too early, the next few check-ins can help the pattern become clearer across moods, body signals, dreams, relationships, rest, and recovery.',
    whyItMayMatter:
      'This matters because weak evidence should stay spacious. The read is more useful when it can name a real pattern instead of turning a thin signal into a story.',
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
      'There is not enough repetition to name a weekly pattern responsibly. A thin signal can matter, but it should not be forced into a story before more evidence gathers.',
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
      ? `An early thread is forming around ${item.title.toLowerCase()}. It is not a firm read yet, but it is worth noticing gently this week.`
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
