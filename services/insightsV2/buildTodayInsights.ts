import type {
  ArchivePattern,
  ArchivePatternScore,
  BuildTodayInsightsArgs,
  BuildTodayInsightsResult,
  GeneratedInsight,
  InsightDeliveryMode,
  InsightDepthLevel,
  InsightSlot,
  PatternConfidence,
  SelectedPersonaProfile,
  SignalKey,
  SignalRole,
  UserSignal,
} from './types';
import { ARCHIVE_PATTERNS } from './patternPacks';
import { scoreArchivePattern } from './engine/scorePatterns';
import { selectFreshInsight } from './engine/selectInsight';
import { selectPrimaryFeeling } from './engine/selectPrimaryFeeling';
import { selectPrimaryPersona } from './engine/selectPrimaryPersona';
import { normalizeInsightInputsV2 } from './normalizers';
import { hasSignalRole } from './signalTaxonomy';
import { generateId } from '../storage/models';
import {
  filterSignalsForInsightSurface,
  isArchivePatternAllowedOnSurface,
} from './insightSurfacePolicy';
import { selectArchivePatternParagraph } from './engine/patternParagraphSelection';
import { archivePatternScoreToInsightCandidate } from './candidates/insightCandidates';
import type { SelectedPatternParagraph } from './adapters/premiumPatternParagraphLibrary';
import {
  detectCurrentInsightState,
  type CurrentInsightStateProfile,
} from './state/insightState';
import {
  buildInsightTimingDecision,
  type InsightTimingDecision,
} from './timing/insightTiming';

const MAX_TODAY_INSIGHTS = 4;
const SLOT_PRIORITY: Record<InsightSlot, number> = {
  whatMySkyNoticed: 0,
  primaryPersona: 1,
  whatHelped: 2,
  bodySignal: 3,
  relationshipMirror: 4,
  dreamPattern: 5,
  growthEdge: 6,
  todaySignal: 7,
  archivePattern: 8,
  dailyAffirmation: 9,
  weeklyStory: 10,
  monthlyTheme: 11,
};

function dedupeSentences(text: string): string {
  const polished = polishGeneratedRepetition(text);
  const sentences = polished.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(part => part.trim()) ?? [];
  if (sentences.length <= 1) return polished;

  const seen = new Set<string>();
  const deduped = sentences.filter((sentence) => {
    const key = sentence.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.join(' ');
}

function polishGeneratedRepetition(text: string): string {
  return text.replace(
    /Where does ([^?]{8,90}?) first become real for you\? Often, it is when the first sign of \1 appears\./gi,
    (_match, topic: string) =>
      `Where does ${topic} first become real for you? Often, it starts with a small cue your system notices early.`,
  );
}

function sentenceCount(text: string): number {
  return text.match(/[.!?](?=\s|$)/g)?.length ?? 0;
}

function paragraphMetadata(paragraph: SelectedPatternParagraph) {
  return {
    paragraphId: paragraph.id,
    category: paragraph.category,
    writerShape: paragraph.writerShape,
    patternType: paragraph.patternType,
    majorDomain: paragraph.majorDomain,
    theoryLens: paragraph.theoryLens,
    insightSubcategory: paragraph.insightSubcategory,
    paragraphTone: paragraph.tone,
    paragraphIntensity: paragraph.intensity,
    paragraphSource: paragraph.source,
    isCuratedParagraph: paragraph.isCurated,
    sentenceCount: sentenceCount(paragraph.body),
    hasPracticalPrompt: paragraph.writerShape === 'practicalCapacity' || paragraph.tone === 'practical',
  };
}

function dedupeInsights(insights: GeneratedInsight[]): GeneratedInsight[] {
  const seen = new Set<string>();

  return insights
    .map(insight => ({
      ...insight,
      body: dedupeSentences(insight.body),
      reframe: dedupeSentences(insight.reframe),
    }))
    .filter((insight) => {
      const normalizedTitle = normalizeInsightText(insight.title);
      const patternFamily = normalizePatternFamily(insight.patternKey);
      const key = [
        insight.slot,
        insight.patternKey,
        insight.angleKey ?? '',
        normalizedTitle,
        normalizeInsightText(insight.body),
      ].join('|');
      const conceptKeys = [
        `title:${normalizedTitle}`,
        `slot-pattern:${insight.slot}:${insight.patternKey}`,
        `slot-family:${insight.slot}:${patternFamily}`,
      ];

      if (seen.has(key) || conceptKeys.some(conceptKey => seen.has(conceptKey))) return false;
      seen.add(key);
      conceptKeys.forEach(conceptKey => seen.add(conceptKey));
      return true;
    });
}

function capTodayInsights(insights: GeneratedInsight[], maxInsights = MAX_TODAY_INSIGHTS): GeneratedInsight[] {
  return [...insights]
    .sort((a, b) => SLOT_PRIORITY[a.slot] - SLOT_PRIORITY[b.slot])
    .slice(0, Math.max(0, maxInsights));
}

function deliveryMetadata(
  stateProfile: CurrentInsightStateProfile,
  timingDecision: InsightTimingDecision,
  depthLevel: InsightDepthLevel,
): Pick<GeneratedInsight, 'currentState' | 'stateConfidence' | 'deliveryMode' | 'depthLevel'> {
  return {
    currentState: stateProfile.primaryState,
    stateConfidence: stateProfile.confidence,
    deliveryMode: timingDecision.deliveryMode as InsightDeliveryMode,
    depthLevel,
  };
}

function trimTerminalPunctuation(text: string): string {
  return text.trim().replace(/[.!?]+$/, '');
}

function normalizeInsightText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePatternFamily(patternKey: string): string {
  return patternKey
    .replace(/^feeling_/, 'feeling:')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .split(/[_:]/)[0]
    .toLowerCase();
}

function humanizeSignalKey(key: string): string {
  return key.replace(/_/g, ' ');
}

function capitalizeFirst(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function patternReframe(pattern: { shameLabel: string; clarityReframe: string }): string {
  return `The clearer read: ${lowerFirst(trimTerminalPunctuation(pattern.clarityReframe))}.`;
}

function lowerFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function shameForContrast(text: string): string {
  const raw = trimTerminalPunctuation(text).toLowerCase();
  if (/\boverthinking\b/.test(raw)) return 'overthinking';
  if (/\bdramatic|drama\b/.test(raw)) return 'drama';
  if (/\bweakness|weak\b/.test(raw)) return 'weakness';
  if (/\blazy|laziness\b/.test(raw)) return 'laziness';
  if (/\bfailure|failing\b/.test(raw)) return 'failure';
  if (/\bselfish|selfishness\b/.test(raw)) return 'selfishness';
  if (/\bneedy|neediness\b/.test(raw)) return 'neediness';
  if (/\btoo sensitive|overly sensitive\b/.test(raw)) return 'too much sensitivity';
  if (/\bshould\b|\bhave to\b|\bmust\b|\bcannot\b|\bif i\b/.test(raw)) return 'failure';
  return raw.replace(/^being\s+/, '');
}

function polishReframeText(text: string): string {
  const trimmed = text.trim();
  const shameMatch = trimmed.match(/this does not read as\s+(.+?)(?:\.|$)/i);
  const clarityMatch = trimmed.match(/it reads as\s+(.+?)(?:\.|$)/i);

  if (shameMatch && clarityMatch) {
    const shame = shameForContrast(shameMatch[1]);
    const clarity = trimTerminalPunctuation(clarityMatch[1]);
    return `That is not ${shame}; it is ${lowerFirst(clarity)}.`;
  }

  if (clarityMatch) {
    return `The clearer read: ${lowerFirst(trimTerminalPunctuation(clarityMatch[1]))}.`;
  }

  if (shameMatch) {
    return `That is not ${shameForContrast(shameMatch[1])}.`;
  }

  return trimmed;
}

const GENERIC_EVIDENCE_LABELS = new Set([
  'active dreaming',
  'capacity signal',
  'dorsal shutdown',
  'draining event',
  'glimmer',
  'physical cue',
  'restoring event',
  'ventral regulation',
]);

function normalizeEvidenceLabel(label: string | null | undefined): string | null {
  if (!label || !label.trim()) return null;

  const normalized = label
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  if (!normalized || normalized.length < 3) return null;
  if (/^t\d+$/i.test(normalized)) return null;
  if (GENERIC_EVIDENCE_LABELS.has(normalized.toLowerCase())) return null;

  return normalized.toLowerCase();
}

function signalCue(signal: UserSignal): string {
  return normalizeEvidenceLabel(signal.evidence?.label) ?? humanizeSignalKey(signal.key);
}

function cueSubject(cue: string, useArticle = false): string {
  const normalized = cue.trim().replace(/\s+/g, ' ');
  if (!normalized) return 'This signal';
  if (/^(a|an|the|your)\s+/i.test(normalized)) return capitalizeFirst(normalized);
  if (useArticle && !normalized.includes(' ')) return capitalizeFirst(`the ${normalized}`);
  return capitalizeFirst(normalized);
}

function bodySignalSubject(signal: UserSignal): string {
  const keyCueMap: Partial<Record<SignalKey, string>> = {
    body_knows_first: 'your body',
    chest_pressure: 'chest pressure',
    gut_signal: 'your gut',
    jaw_restraint: 'your jaw',
    shoulder_burden: 'your shoulders',
    throat_tightness: 'your throat',
    head_pressure: 'head pressure',
    breath_change: 'your breathing',
    body_heaviness: 'heaviness',
    body_lightness: 'lightness',
    tension_release: 'release',
    somatic_safety: 'settling',
    sensory_sensitivity: 'sensory sensitivity',
  };
  const keyCue = keyCueMap[signal.key];
  if (keyCue) return capitalizeFirst(keyCue);

  const cue = signalCue(signal);
  const normalized = cue.toLowerCase();
  const bodyCueMap: Record<string, string> = {
    belly: 'your belly',
    breath: 'your breathing',
    breathing: 'your breathing',
    chest: 'your chest',
    gut: 'your gut',
    head: 'your head',
    jaw: 'your jaw',
    neck: 'your neck',
    shoulder: 'your shoulders',
    shoulders: 'your shoulders',
    stomach: 'your stomach',
    throat: 'your throat',
    tight: 'tightness',
    tension: 'tension',
    heavy: 'heaviness',
    heaviness: 'heaviness',
    light: 'lightness',
    lightness: 'lightness',
    soft: 'softening',
    release: 'release',
    relaxed: 'relaxation',
    settled: 'settling',
  };

  return capitalizeFirst(bodyCueMap[normalized] ?? cue);
}

function relationshipThreadSubject(signal: UserSignal): string {
  const cue = signalCue(signal);
  const subjectByKey: Partial<Record<SignalKey, string>> = {
    asks_for_support: 'Asking for support',
    belonging_ache: 'Belonging',
    boundary_rebuilding: 'Boundaries',
    caretaking_pressure: 'Caretaking',
    closeness_uncertainty: 'Closeness',
    consistency_need: 'Consistency',
    distance_for_safety: 'Distance',
    emotional_availability_need: 'Availability',
    fear_of_being_too_much: 'Being too much',
    loneliness: 'Loneliness',
    minimizes_need: 'Minimized needs',
    mutuality_need: 'Mutuality',
    need_for_exact_words: 'Exact words',
    overexplaining: 'Explaining clearly',
    repair_need: 'Repair',
    relationship_safety_testing: 'Safety in connection',
    rupture_sensitivity: 'Rupture and repair',
    support_need: 'Support',
    support_scarcity: 'Support',
    tone_sensitivity: 'Tone',
    trust_builds_slowly: 'Trust',
    wants_to_be_seen: 'Being understood',
  };

  const mappedSubject = subjectByKey[signal.key];
  if (mappedSubject) return mappedSubject;

  const fallbackSubject = cueSubject(cue);
  if (/^(cognitive|relationship|relationships|relational|reflection|anxious|avoidant|control|secure)$/i.test(fallbackSubject)) {
    return 'This connection';
  }
  return fallbackSubject;
}

function relationshipThreadTitle(signal: UserSignal): string {
  const titleByKey: Partial<Record<SignalKey, string>> = {
    asks_for_support: 'Asking for Support',
    belonging_ache: 'Belonging Wants Care',
    boundary_rebuilding: 'A Boundary Signal',
    caretaking_pressure: 'Care Is Carrying Too Much',
    closeness_uncertainty: 'Closeness Needs Steadiness',
    consistency_need: 'Consistency Is the Cue',
    distance_for_safety: 'Distance Is Asking for Safety',
    emotional_availability_need: 'Presence Matters Here',
    fear_of_being_too_much: 'The Too-Much Fear',
    loneliness: 'A Belonging Ache',
    minimizes_need: 'A Need Got Minimized',
    mutuality_need: 'Mutuality Wants Attention',
    need_for_exact_words: 'Clarity Wants Exact Words',
    overexplaining: 'Explaining to Protect Connection',
    repair_need: 'Repair Wants a Path',
    relationship_safety_testing: 'Safety in Connection',
    rupture_sensitivity: 'A Rupture Signal',
    support_need: 'Support Is the Signal',
    support_scarcity: 'Support Feels Scarce',
    tone_sensitivity: 'A Tone Shift Landed',
    trust_builds_slowly: 'Trust Builds Through Evidence',
    wants_to_be_seen: 'Being Understood Matters',
  };

  return titleByKey[signal.key] ?? 'A Relationship Signal';
}

function signalBodyForSentiment(signal: UserSignal): string {
  const subject = cueSubject(signalCue(signal));

  if (signal.sentiment === 'positive') {
    return `${subject} brought a real point of support into the day. Small evidence of relief, steadiness, or aliveness still matters.`;
  }

  if (signal.sentiment === 'mixed') {
    return `${subject} held more than one emotional truth today. The signal is layered, not unclear.`;
  }

  if (signal.sentiment === 'negative') {
    return `${subject} asked for care, pacing, or clarity today rather than quick self-judgment.`;
  }

  return `${subject} shaped today's inner weather. It gives useful context for how the day moved through you.`;
}

function personaProtectivePurpose(persona: SelectedPersonaProfile): string {
  if (persona.polarity === 'negative') {
    return 'This part is trying to protect you through safety, care, or survival.';
  }

  if (persona.polarity === 'positive') {
    return 'This part is showing a strength your system can keep trusting.';
  }

  return 'This part helps your system stay oriented when more than one need is present.';
}

function personaBody(persona: SelectedPersonaProfile): string {
  return dedupeSentences(`${ensureSentence(persona.selectedSentence)} ${personaProtectivePurpose(persona)}`);
}

function whatHelpedBody(signal: UserSignal): string {
  const subject = cueSubject(signalCue(signal), true);

  if (signal.source === 'glimmerLog' || hasRole(signal, 'glimmer')) {
    return `${subject} helped your system soften today. That relief matters because it shows what supports regulation, not only what overwhelms it.`;
  }

  if (signal.source === 'relationshipMirror' || hasRole(signal, 'relational_context')) {
    return `${subject} gave connection a little more room today. Feeling supported, understood, or met can be part of recovery too.`;
  }

  if (hasRole(signal, 'body_signal')) {
    return `${subject} gave your body a little more room today. Recovery can begin as a small physical shift before it becomes a full emotional change.`;
  }

  return `${subject} helped your system soften, settle, or recover today. Small relief still counts.`;
}

function bodySignalBody(signal: UserSignal): string {
  const subject = bodySignalSubject(signal);
  return `${subject} is part of the signal today. Your body is joining the conversation before your mind has finished explaining what happened.`;
}

function relationshipSignalBody(signal: UserSignal): string {
  const subject = relationshipThreadSubject(signal);
  const setting = /\bconnection\b/i.test(subject) ? 'today' : 'in connection today';
  return `${subject} mattered ${setting}. Notice whether the moment asked for closeness, space, clarity, repair, support, or reassurance before deciding what it means.`;
}

function growthEdgeBody(pattern: ArchivePattern | undefined): string {
  if (pattern) {
    return `The ${pattern.title} pattern is asking for attention, not because you are doing anything wrong, but because it is becoming conscious enough to meet with more choice.`;
  }

  return 'A pattern is asking for attention, not because you are doing anything wrong, but because it is becoming conscious enough to meet with more choice.';
}

function confidenceFromSignalStrength(strength: number): PatternConfidence {
  if (strength >= 0.82) return 'veryStrong';
  if (strength >= 0.68) return 'strong';
  if (strength >= 0.5) return 'moderate';
  return 'emerging';
}

function confidenceRank(confidence: PatternConfidence): number {
  if (confidence === 'veryStrong') return 4;
  if (confidence === 'strong') return 3;
  if (confidence === 'moderate') return 2;
  return 1;
}

function isAtLeastModerate(confidence: PatternConfidence): boolean {
  return confidenceRank(confidence) >= confidenceRank('moderate');
}

function hasRole(signal: UserSignal, role: SignalRole): boolean {
  return hasSignalRole(signal, role);
}

function signalDedupeKey(signal: UserSignal): SignalKey {
  return signal.key;
}

function evidenceForSignal(signal: UserSignal) {
  return signal.evidence ? [signal.evidence] : [];
}

function strongestSignalWhere(
  signals: UserSignal[],
  predicate: (signal: UserSignal) => boolean,
  usedSignalKeys: Set<string>,
): UserSignal | null {
  return [...signals]
    .filter(signal => !usedSignalKeys.has(signalDedupeKey(signal)))
    .filter(predicate)
    .sort((a, b) => b.strength - a.strength)[0] ?? null;
}

function relatedPatternForSignal(key: SignalKey): ArchivePattern | null {
  return ARCHIVE_PATTERNS.find(pattern =>
    pattern.requiredSignals.includes(key) ||
    pattern.supportingSignals.includes(key),
  ) ?? null;
}

function patternKeyForSignal(signal: UserSignal): string {
  return relatedPatternForSignal(signal.key)?.key ?? signal.key;
}

function personaReframe(persona: SelectedPersonaProfile): string {
  if (persona.polarity === 'negative') {
    return 'This is not a flaw. It is a pattern your system learned to use for safety, care, or survival.';
  }

  if (persona.polarity === 'positive') {
    return 'This looks like a strength your system can keep building on.';
  }

  return 'This is one of the ways your system tries to stay oriented.';
}

function growthEdgeScore(
  patternScores: ArchivePatternScore[],
  usedPatternKeys: Set<string>,
  primaryPatternKey?: string,
  primaryPersona?: SelectedPersonaProfile | null,
): ArchivePatternScore | null {
  const primaryPersonaCategories = new Set([
    primaryPersona?.category,
    ...(primaryPersona?.secondaryCategories ?? []),
  ].filter(Boolean));

  return [...patternScores]
    .filter(pattern =>
      pattern.score >= 0.5 &&
      pattern.patternKey !== primaryPatternKey &&
      !usedPatternKeys.has(pattern.patternKey),
    )
    .filter(pattern => !primaryPersonaCategories.has(pattern.category))
    .sort((a, b) => b.score - a.score)[0] ?? null;
}

/**
 * Knowledge Engine V2 Main Entry Point
 */
export async function buildTodayInsights({
  date,
  rawInputs,
  history = [],
  previousPatternScores = [],
  feedbackProfile = null,
}: BuildTodayInsightsArgs): Promise<BuildTodayInsightsResult> {
  const safeHistory = Array.isArray(history) ? history : [];
  const safePreviousPatternScores = Array.isArray(previousPatternScores)
    ? previousPatternScores
    : [];
  const safeRawInputs = rawInputs ?? {};
  const requestedDate = typeof date === 'string' && date.trim()
    ? date
    : new Date().toISOString();
  const createdAtDate = new Date(requestedDate);
  const createdAt = Number.isFinite(createdAtDate.getTime())
    ? createdAtDate.toISOString()
    : new Date().toISOString();

  // 1. Normalize
  const signals = normalizeInsightInputsV2(safeRawInputs, requestedDate);
  const insightSignals = filterSignalsForInsightSurface(signals, 'today');

  // 2. Score Archive Patterns
  const patternScores = ARCHIVE_PATTERNS
    .filter(pattern => isArchivePatternAllowedOnSurface(pattern, 'today'))
    .map(pattern => {
      const prev = safePreviousPatternScores.find(p => p.patternKey === pattern.key);
      return scoreArchivePattern(pattern, insightSignals, requestedDate, prev);
    });
  const primaryPersona = selectPrimaryPersona({
    archivePatterns: patternScores,
    recentSignals: insightSignals,
  });

  // 3. Extract Today's Signals
  const todayDateStr = requestedDate.slice(0, 10);
  const todaySignals = insightSignals.filter(s => s.date === todayDateStr);
  const primaryFeeling = selectPrimaryFeeling(todaySignals.length ? todaySignals : insightSignals);
  const currentStateProfile = detectCurrentInsightState(insightSignals, requestedDate);
  const timingDecision = buildInsightTimingDecision({
    stateProfile: currentStateProfile,
    history: safeHistory,
    date: requestedDate,
  });

  // 4. Select Primary Insight
  const candidate = selectFreshInsight(
    {
      date: requestedDate,
      todaySignals,
      recentSignals: insightSignals,
      archivePatterns: patternScores,
      history: safeHistory,
    },
    'whatMySkyNoticed',
    'today',
  );

  const insights: GeneratedInsight[] = [];
  const usedSignalKeys = new Set<string>();
  const usedPatternKeys = new Set<string>();
  const recentParagraphIds: string[] = [];
  let primaryPatternKey: string | undefined;

  if (candidate) {
    const { pattern, angle, patternScore } = candidate;
    primaryPatternKey = pattern.key;
    usedPatternKeys.add(pattern.key);
    const insightCandidate = archivePatternScoreToInsightCandidate(pattern, patternScore);

    const paragraph = selectArchivePatternParagraph({
      pattern,
      score: patternScore,
      candidate: insightCandidate,
      surface: 'today',
      recentParagraphIds,
      feedbackProfile,
      stateProfile: currentStateProfile,
    });
    recentParagraphIds.push(paragraph.id);

    const reframe = polishReframeText(angle.reframe?.trim() || patternReframe(pattern));

    insights.push({
      id: generateId(),
      slot: 'whatMySkyNoticed' as const,
      surface: 'today' as const,
      title: angle.title,
      body: paragraph.body,
      ...paragraphMetadata(paragraph),
      ...deliveryMetadata(currentStateProfile, timingDecision, 2),
      reframe,
      reflectionPrompt: angle.question,
      patternKey: pattern.key,
      angleKey: angle.key,
      confidence: patternScore.confidence,
      movement: patternScore.movement,
      evidence: patternScore.evidence,
      createdAt,
    });
  }

  // Handle slot: todaySignal (The most prominent daily signal)
  const strongestTodaySignal = [...todaySignals].sort((a, b) => b.strength - a.strength)[0];
  if (strongestTodaySignal) {
    usedSignalKeys.add(signalDedupeKey(strongestTodaySignal));

    // Find a pattern related to this signal for context
    const primaryFeelingMatchesStrongest = primaryFeeling?.signalKey === strongestTodaySignal.key;
    const displaySignalKey = primaryFeelingMatchesStrongest
      ? primaryFeeling.signalKey
      : strongestTodaySignal.key;
    const todaySignalEvidence = primaryFeelingMatchesStrongest
      ? primaryFeeling.evidence
      : strongestTodaySignal.evidence;
    const relatedPattern = relatedPatternForSignal(displaySignalKey);
    if (relatedPattern) usedPatternKeys.add(relatedPattern.key);

    const title = primaryFeelingMatchesStrongest
      ? `Today's ${primaryFeeling.title}`
      : `Today's ${humanizeSignalKey(strongestTodaySignal.key)}`;
    const body = primaryFeelingMatchesStrongest
      ? primaryFeeling.selectedSentence
      : signalBodyForSentiment(strongestTodaySignal);
    const reframe = primaryFeelingMatchesStrongest
      ? primaryFeeling.reframeSentence
      : relatedPattern
        ? `This connects to your ${relatedPattern.title} pattern.`
        : '';

    insights.push({
      id: generateId(),
      slot: 'todaySignal' as const,
      surface: 'today' as const,
      title,
      body,
      ...deliveryMetadata(currentStateProfile, timingDecision, 1),
      reframe,
      reflectionPrompt: primaryFeelingMatchesStrongest
        ? `What does ${primaryFeeling.title.toLowerCase()} need from you today?`
        : undefined,
      patternKey: relatedPattern?.key || (primaryFeelingMatchesStrongest ? `feeling_${primaryFeeling.key}` : strongestTodaySignal.key),
      category: relatedPattern?.category,
      confidence: 'moderate',
      movement: 'new',
      evidence: todaySignalEvidence ? [todaySignalEvidence] : [],
      createdAt,
    });
  }

  if (primaryPersona && isAtLeastModerate(primaryPersona.confidence) && !timingDecision.suppressDeepContext) {
    insights.push({
      id: generateId(),
      slot: 'primaryPersona' as const,
      surface: 'today' as const,
      title: primaryPersona.title,
      body: personaBody(primaryPersona),
      ...deliveryMetadata(currentStateProfile, timingDecision, 2),
      reframe: personaReframe(primaryPersona),
      patternKey: primaryPersona.key,
      confidence: primaryPersona.confidence,
      movement: 'cross_source_match',
      evidence: primaryPersona.evidence,
      createdAt,
    });
  }

  const whatHelpedSignal = strongestSignalWhere(
    todaySignals,
    signal =>
      hasRole(signal, 'recovery_lever') ||
      hasRole(signal, 'glimmer') ||
      signal.sentiment === 'positive',
    usedSignalKeys,
  );
  if (whatHelpedSignal) {
    usedSignalKeys.add(signalDedupeKey(whatHelpedSignal));
    const relatedPattern = relatedPatternForSignal(whatHelpedSignal.key);
    const patternKey = relatedPattern?.key ?? whatHelpedSignal.key;
    usedPatternKeys.add(patternKey);

    insights.push({
      id: generateId(),
      slot: 'whatHelped' as const,
      surface: 'today' as const,
      title: 'What helped',
      body: whatHelpedBody(whatHelpedSignal),
      ...deliveryMetadata(currentStateProfile, timingDecision, 1),
      reframe: 'Small relief still counts. A shift does not have to be dramatic to be real.',
      reflectionPrompt: 'What helped even slightly today?',
      patternKey,
      category: relatedPattern?.category,
      confidence: confidenceFromSignalStrength(whatHelpedSignal.strength),
      movement: 'softening',
      evidence: evidenceForSignal(whatHelpedSignal),
      createdAt,
    });
  }

  const bodySignal = strongestSignalWhere(
    todaySignals,
    signal => hasRole(signal, 'body_signal'),
    usedSignalKeys,
  );
  if (bodySignal) {
    usedSignalKeys.add(signalDedupeKey(bodySignal));
    const relatedPattern = relatedPatternForSignal(bodySignal.key);
    const patternKey = relatedPattern?.key ?? bodySignal.key;
    usedPatternKeys.add(patternKey);

    insights.push({
      id: generateId(),
      slot: 'bodySignal' as const,
      surface: 'today' as const,
      title: 'What your body noticed',
      body: bodySignalBody(bodySignal),
      ...deliveryMetadata(currentStateProfile, timingDecision, 1),
      reframe: 'This does not mean your body is against you. It is trying to get your attention in the language it knows.',
      reflectionPrompt: 'What sensation felt most noticeable today, and what was it asking for?',
      patternKey,
      category: relatedPattern?.category,
      confidence: confidenceFromSignalStrength(bodySignal.strength),
      movement: 'new',
      evidence: evidenceForSignal(bodySignal),
      createdAt,
    });
  }

  const relationshipSignal = strongestSignalWhere(
    todaySignals,
    signal => signal.source === 'relationshipMirror' || hasRole(signal, 'relational_context'),
    usedSignalKeys,
  );
  if (relationshipSignal) {
    usedSignalKeys.add(signalDedupeKey(relationshipSignal));
    const relatedPattern = relatedPatternForSignal(relationshipSignal.key);
    const patternKey = relatedPattern?.key ?? relationshipSignal.key;
    usedPatternKeys.add(patternKey);

    insights.push({
      id: generateId(),
      slot: 'relationshipMirror' as const,
      surface: 'today' as const,
      title: relationshipThreadTitle(relationshipSignal),
      body: relationshipSignalBody(relationshipSignal),
      ...deliveryMetadata(currentStateProfile, timingDecision, 1),
      reframe: 'Noticing relational shifts does not mean you are too sensitive. Connection carries meaningful information for you.',
      reflectionPrompt: 'Did this relationship moment make you want closeness, distance, clarity, repair, or reassurance?',
      patternKey,
      category: relatedPattern?.category,
      confidence: confidenceFromSignalStrength(relationshipSignal.strength),
      movement: 'new',
      evidence: evidenceForSignal(relationshipSignal),
      createdAt,
    });
  }

  const growthPattern = timingDecision.suppressNovelty || timingDecision.suppressDeepContext
    ? null
    : growthEdgeScore(patternScores, usedPatternKeys, primaryPatternKey, primaryPersona);
  if (growthPattern) {
    usedPatternKeys.add(growthPattern.patternKey);
    const pattern = ARCHIVE_PATTERNS.find(item => item.key === growthPattern.patternKey);
    const paragraph = pattern
      ? selectArchivePatternParagraph({
          pattern,
          score: growthPattern,
          candidate: archivePatternScoreToInsightCandidate(pattern, growthPattern),
          surface: 'today',
          recentParagraphIds,
          feedbackProfile,
          stateProfile: currentStateProfile,
        })
      : null;
    if (paragraph) recentParagraphIds.push(paragraph.id);

    insights.push({
      id: generateId(),
      slot: 'growthEdge' as const,
      surface: 'today' as const,
      title: 'A growth edge',
      body: paragraph?.body ?? growthEdgeBody(pattern),
      ...(paragraph ? paragraphMetadata(paragraph) : { category: growthPattern.category }),
      ...deliveryMetadata(currentStateProfile, timingDecision, 2),
      reframe: pattern?.clarityReframe ?? 'This pattern is ready to meet with a little more choice.',
      reflectionPrompt: 'What would it look like to meet this pattern with a little more choice today?',
      patternKey: growthPattern.patternKey,
      confidence: growthPattern.confidence,
      movement: growthPattern.movement,
      evidence: growthPattern.evidence,
      createdAt,
    });
  }

  return {
    signals,
    patternScores,
    insights: capTodayInsights(dedupeInsights(insights), timingDecision.maxDailyInsights),
    primaryFeeling,
    primaryPersona,
    currentState: currentStateProfile.primaryState,
    deliveryMode: timingDecision.deliveryMode,
    timingReasonCodes: timingDecision.reasonCodes,
  };
}
