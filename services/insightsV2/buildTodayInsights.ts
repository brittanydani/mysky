import type {
  ArchivePattern,
  ArchivePatternScore,
  BuildTodayInsightsArgs,
  BuildTodayInsightsResult,
  GeneratedInsight,
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
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(part => part.trim()) ?? [];
  if (sentences.length <= 1) return text;

  const seen = new Set<string>();
  const deduped = sentences.filter((sentence) => {
    const key = sentence.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.join(' ');
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

function capTodayInsights(insights: GeneratedInsight[]): GeneratedInsight[] {
  return [...insights]
    .sort((a, b) => SLOT_PRIORITY[a.slot] - SLOT_PRIORITY[b.slot])
    .slice(0, MAX_TODAY_INSIGHTS);
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

function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function patternReframe(pattern: { shameLabel: string; clarityReframe: string }): string {
  return `This does not read as ${trimTerminalPunctuation(pattern.shameLabel)}. It reads as ${trimTerminalPunctuation(pattern.clarityReframe)}.`;
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

function signalBodyForSentiment(signal: UserSignal): string {
  const label = signalCue(signal);

  if (signal.sentiment === 'positive') {
    return `${label} showed up today as support your system can use. Small evidence of relief, steadiness, or aliveness still matters.`;
  }

  if (signal.sentiment === 'mixed') {
    return `${label} carried more than one emotional truth today. It makes sense if the signal felt layered instead of simple.`;
  }

  if (signal.sentiment === 'negative') {
    return `${label} asked for care, pacing, or clarity today rather than quick self-judgment.`;
  }

  return `${label} was part of today's inner weather. It helps explain how the day moved through you.`;
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
  const cue = signalCue(signal);
  return `${cue} helped your system soften, settle, recover, or feel a little more supported today.`;
}

function bodySignalBody(signal: UserSignal): string {
  const cue = signalCue(signal);
  return `Your body is giving you information around ${cue} before your mind has fully organized it.`;
}

function relationshipSignalBody(signal: UserSignal): string {
  const cue = signalCue(signal);
  return `The relationship signal around ${cue} is standing out today: tone, closeness, distance, repair, support, or feeling understood.`;
}

function dreamSignalBody(signal: UserSignal): string {
  const cue = signalCue(signal);
  return `The dream thread around ${cue} is carrying emotional residue, symbolic meaning, or unfinished processing.`;
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
}: BuildTodayInsightsArgs): Promise<BuildTodayInsightsResult> {
  const createdAtDate = new Date(date);
  const createdAt = Number.isFinite(createdAtDate.getTime())
    ? createdAtDate.toISOString()
    : new Date().toISOString();

  // 1. Normalize
  const signals = normalizeInsightInputsV2(rawInputs, date);

  // 2. Score Archive Patterns
  const patternScores = ARCHIVE_PATTERNS.map(pattern => {
    const prev = previousPatternScores.find(p => p.patternKey === pattern.key);
    return scoreArchivePattern(pattern, signals, date, prev);
  });
  const primaryPersona = selectPrimaryPersona({
    archivePatterns: patternScores,
    recentSignals: signals,
  });

  // 3. Extract Today's Signals
  const todayDateStr = date.slice(0, 10);
  const todaySignals = signals.filter(s => s.date === todayDateStr);
  const primaryFeeling = selectPrimaryFeeling(todaySignals.length ? todaySignals : signals);

  // 4. Select Primary Insight
  const candidate = selectFreshInsight(
    {
      date,
      todaySignals,
      recentSignals: signals, // Simplified for now
      archivePatterns: patternScores,
      history,
    },
    'whatMySkyNoticed',
    'today',
  );

  const insights: GeneratedInsight[] = [];
  const usedSignalKeys = new Set<string>();
  const usedPatternKeys = new Set<string>();
  let primaryPatternKey: string | undefined;

  if (candidate) {
    const { pattern, angle, patternScore } = candidate;
    primaryPatternKey = pattern.key;
    usedPatternKeys.add(pattern.key);

    // Build movement language intro
    let bodyIntro = '';
    if (patternScore.movement === 'intensifying') {
      bodyIntro = 'This pattern appears louder than it has been recently. ';
    } else if (patternScore.movement === 'softening') {
      bodyIntro = 'This pattern is still present, but it seems to be softening. ';
    } else if (patternScore.movement === 'returning') {
      bodyIntro = 'This pattern appears to be returning. ';
    }

    const body = `${bodyIntro}${angle.observation} ${angle.pattern}`;

    const reframe = angle.reframe?.trim() || patternReframe(pattern);

    insights.push({
      id: generateId(),
      slot: 'whatMySkyNoticed' as const,
      surface: 'today' as const,
      title: angle.title,
      body,
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
      reframe,
      reflectionPrompt: primaryFeelingMatchesStrongest
        ? `What does ${primaryFeeling.title.toLowerCase()} need from you today?`
        : undefined,
      patternKey: relatedPattern?.key || (primaryFeelingMatchesStrongest ? `feeling_${primaryFeeling.key}` : strongestTodaySignal.key),
      confidence: 'moderate',
      movement: 'new',
      evidence: todaySignalEvidence ? [todaySignalEvidence] : [],
      createdAt,
    });
  }

  if (primaryPersona && isAtLeastModerate(primaryPersona.confidence)) {
    insights.push({
      id: generateId(),
      slot: 'primaryPersona' as const,
      surface: 'today' as const,
      title: primaryPersona.title,
      body: personaBody(primaryPersona),
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
    const patternKey = patternKeyForSignal(whatHelpedSignal);
    usedPatternKeys.add(patternKey);

    insights.push({
      id: generateId(),
      slot: 'whatHelped' as const,
      surface: 'today' as const,
      title: 'What helped',
      body: whatHelpedBody(whatHelpedSignal),
      reframe: 'Small relief still counts. A shift does not have to be dramatic to be real.',
      reflectionPrompt: 'What helped even slightly today?',
      patternKey,
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
    const patternKey = patternKeyForSignal(bodySignal);
    usedPatternKeys.add(patternKey);

    insights.push({
      id: generateId(),
      slot: 'bodySignal' as const,
      surface: 'today' as const,
      title: 'What your body noticed',
      body: bodySignalBody(bodySignal),
      reframe: 'This does not mean your body is against you. It is trying to get your attention in the language it knows.',
      reflectionPrompt: 'What sensation felt most noticeable today, and what was it asking for?',
      patternKey,
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
    const patternKey = patternKeyForSignal(relationshipSignal);
    usedPatternKeys.add(patternKey);

    insights.push({
      id: generateId(),
      slot: 'relationshipMirror' as const,
      surface: 'today' as const,
      title: 'A relationship thread',
      body: relationshipSignalBody(relationshipSignal),
      reframe: 'Noticing relational shifts does not mean you are too sensitive. Connection carries meaningful information for you.',
      reflectionPrompt: 'Did this relationship moment make you want closeness, distance, clarity, repair, or reassurance?',
      patternKey,
      confidence: confidenceFromSignalStrength(relationshipSignal.strength),
      movement: 'new',
      evidence: evidenceForSignal(relationshipSignal),
      createdAt,
    });
  }

  const dreamSignal = strongestSignalWhere(
    signals,
    signal => signal.source === 'dream' || signal.key.includes('dream'),
    usedSignalKeys,
  );
  if (dreamSignal) {
    usedSignalKeys.add(signalDedupeKey(dreamSignal));
    const patternKey = patternKeyForSignal(dreamSignal);
    usedPatternKeys.add(patternKey);

    insights.push({
      id: generateId(),
      slot: 'dreamPattern' as const,
      surface: 'today' as const,
      title: 'A dream thread',
      body: dreamSignalBody(dreamSignal),
      reframe: 'A dream does not have to predict anything to matter. It shows what your mind or body is still working through.',
      reflectionPrompt: 'What feeling from the dream stayed with you after waking?',
      patternKey,
      confidence: confidenceFromSignalStrength(dreamSignal.strength),
      movement: 'new',
      evidence: evidenceForSignal(dreamSignal),
      createdAt,
    });
  }

  const growthPattern = growthEdgeScore(patternScores, usedPatternKeys, primaryPatternKey, primaryPersona);
  if (growthPattern) {
    usedPatternKeys.add(growthPattern.patternKey);
    const pattern = ARCHIVE_PATTERNS.find(item => item.key === growthPattern.patternKey);

    insights.push({
      id: generateId(),
      slot: 'growthEdge' as const,
      surface: 'today' as const,
      title: 'A growth edge',
      body: growthEdgeBody(pattern),
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
    insights: capTodayInsights(dedupeInsights(insights)),
    primaryFeeling,
    primaryPersona,
  };
}
