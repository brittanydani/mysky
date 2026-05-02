import type { DailyCheckIn } from '../patterns/types';
import type { JournalEntry, SleepEntry } from '../storage/models';
import { buildTodayInsights } from '../insightsV2/knowledgeEngineV2';
import {
  adaptPremiumPersonaProfile,
  type PremiumPersonaProfile,
} from '../insightsV2/adapters/premiumPersonaProfile';
import {
  adaptWeeklyPremiumPatternCandidates,
  adaptPremiumPatterns,
  selectThisWeeksV2Pattern,
  selectPremiumWeeklyDeepDive,
  type PremiumPatternItem,
  type PremiumThisWeekPatternItem,
  type PremiumWeeklyDeepDiveItem,
} from '../insightsV2/adapters/premiumPatterns';
import type {
  EvidenceAnchor as V2EvidenceAnchor,
  GeneratedInsight as V2GeneratedInsight,
  InsightHistoryItem as V2InsightHistoryItem,
  InsightRawInputs,
  PatternMovement as V2PatternMovement,
} from '../insightsV2/types';
import type { KnowledgeEngineHistoryInput } from './insightHistory';
import type {
  EvidenceAnchor,
  GeneratedInsight,
} from './types/knowledgeEngine';
import type { SelfKnowledgeContext, SomaticEntry } from './selfKnowledgeContext';
import { logger } from '../../utils/logger';

interface RunActiveKnowledgeInsightInput {
  checkIns: DailyCheckIn[];
  journalEntries: JournalEntry[];
  sleepEntries: SleepEntry[];
  selfKnowledgeContext: SelfKnowledgeContext | null;
  date: string;
  history: KnowledgeEngineHistoryInput;
}

export interface ActiveKnowledgeInsightResult {
  primaryInsight: GeneratedInsight | null;
  dailyInsights: GeneratedInsight[];
  premiumPersonaProfile: PremiumPersonaProfile | null;
  premiumPatterns: PremiumPatternItem[];
  thisWeeksV2Pattern: PremiumThisWeekPatternItem | null;
  premiumWeeklyDeepDive: PremiumWeeklyDeepDiveItem[];
}

const MAX_DAILY_INSIGHT_CARDS = 2;

const DAILY_INSIGHT_SLOT_LABELS: Record<string, string> = {
  whatMySkyNoticed: 'What MySky Noticed',
  primaryPersona: 'A Part of You',
  whatHelped: 'What Helped',
  bodySignal: 'Body Signal',
  relationshipMirror: 'Relationship Thread',
  dreamPattern: 'Dream Thread',
  growthEdge: 'Growth Edge',
  todaySignal: "Today's Signal",
};

const DAILY_INSIGHT_SLOT_ORDER: Record<string, number> = {
  whatMySkyNoticed: 0,
  primaryPersona: 1,
  whatHelped: 2,
  bodySignal: 3,
  relationshipMirror: 4,
  dreamPattern: 5,
  growthEdge: 6,
  todaySignal: 7,
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeCue(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function buildBodyMapCues(entry: SomaticEntry): string[] {
  const normalizedRegion = normalizeCue(entry.region);
  const normalizedSensation = normalizeCue(entry.sensation);
  const normalizedEmotion = normalizeCue(entry.emotion);
  const aliases: Record<string, string[]> = {
    back: ['shoulders'],
    chest: ['chest'],
    heart: ['chest'],
    throat: ['jaw'],
    jaw: ['jaw'],
    stomach: ['stomach'],
    gut: ['stomach'],
    belly: ['stomach'],
    solar_plexus: ['stomach'],
  };

  return unique([
    ...(normalizedRegion ? [normalizedRegion, ...(aliases[normalizedRegion] ?? [])] : []),
    ...(normalizedSensation ? [normalizedSensation] : []),
    ...(normalizedEmotion ? [normalizedEmotion] : []),
  ]);
}

export function buildV2RawInputs({
  checkIns,
  journalEntries,
  sleepEntries,
  selfKnowledgeContext,
}: Omit<RunActiveKnowledgeInsightInput, 'date' | 'history'>): InsightRawInputs {
  return {
    dailyCheckIns: checkIns,
    journals: journalEntries,
    sleepLogs: sleepEntries,
    dreams: sleepEntries.filter((entry) => !!entry.dreamText?.trim()),
    bodyMaps: selfKnowledgeContext?.somaticEntries.map((entry) => ({
      ...entry,
      cues: buildBodyMapCues(entry),
    })) ?? [],
    triggerLogs: selfKnowledgeContext?.triggerEvents.filter((event) => event.mode === 'drain') ?? [],
    glimmerLogs: selfKnowledgeContext?.triggerEvents.filter((event) => event.mode === 'nourish') ?? [],
    relationshipMirrors: selfKnowledgeContext?.relationshipPatterns ?? [],
    reflectionAnswers: selfKnowledgeContext?.dailyReflections?.recentAnswers ?? [],
    natalChartThemes: [],
  };
}

function buildV2History(
  history: KnowledgeEngineHistoryInput,
  date: string,
): V2InsightHistoryItem[] {
  const now = new Date(date);
  const shownAt = Number.isFinite(now.getTime())
    ? new Date(now.getTime() - 86_400_000).toISOString()
    : new Date(Date.now() - 86_400_000).toISOString();

  const patternItems = history.recentlyShownPatternKeys.map((patternKey, index) => ({
    id: `recent-pattern-${index}`,
    patternKey,
    slot: 'whatMySkyNoticed' as const,
    surface: 'today' as const,
    title: 'Recently shown insight',
    shownAt,
    copyHash: `pattern-${patternKey}`,
  }));

  const copyItems = history.recentlyShownCopyHashes.map((copyHash, index) => ({
    id: `recent-copy-${index}`,
    patternKey: `recent-copy-${index}`,
    slot: 'whatMySkyNoticed' as const,
    surface: 'today' as const,
    title: 'Recently shown copy',
    shownAt,
    copyHash,
  }));

  return [...patternItems, ...copyItems];
}

function splitBody(body: string): { observation: string; pattern: string } {
  const trimmed = body.trim();
  if (!trimmed) return { observation: '', pattern: '' };

  const sentences = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((part) => part.trim()) ?? [trimmed];
  if (sentences.length <= 1) return { observation: trimmed, pattern: '' };

  return {
    observation: sentences[0],
    pattern: sentences.slice(1).join(' '),
  };
}

function adaptReframe(reframe: string): GeneratedInsight['reframe'] {
  const trimmed = reframe.trim();
  const shameMatch = trimmed.match(/this does not read as\s+(.+?)(?:\.|$)/i);
  const clarityMatch = trimmed.match(/it reads as\s+(.+?)(?:\.|$)/i);

  if (shameMatch || clarityMatch) {
    return {
      shame: shameMatch ? `This does not read as ${shameMatch[1].trim()}.` : '',
      clarity: clarityMatch ? `It reads as ${clarityMatch[1].trim()}.` : '',
    };
  }

  return /^this does not read as\b/i.test(trimmed)
    ? { shame: trimmed, clarity: '' }
    : { shame: '', clarity: trimmed };
}

function adaptMovement(movement: V2PatternMovement): GeneratedInsight['movement'] {
  if (movement === 'emerging') return 'new';
  return movement as GeneratedInsight['movement'];
}

function adaptEvidence(evidence: V2EvidenceAnchor): EvidenceAnchor {
  return {
    source: evidence.source as EvidenceAnchor['source'],
    date: evidence.date,
    label: evidence.label,
    phrase: evidence.phrase,
    signal: evidence.signal,
    intensity: typeof evidence.value === 'number' ? evidence.value : evidence.strength,
  };
}

function normalizeInsightText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function v2InsightConceptKeys(insight: V2GeneratedInsight): string[] {
  return [
    `slot:${insight.slot}`,
    `pattern:${insight.patternKey}`,
    `title:${normalizeInsightText(insight.title)}`,
  ];
}

function selectDailyV2Insights(insights: V2GeneratedInsight[]): V2GeneratedInsight[] {
  const sorted = [...insights].sort(
    (a, b) =>
      (DAILY_INSIGHT_SLOT_ORDER[a.slot] ?? 99) - (DAILY_INSIGHT_SLOT_ORDER[b.slot] ?? 99),
  );
  const primary = sorted.find((insight) => insight.slot === 'whatMySkyNoticed') ?? null;
  const selected: V2GeneratedInsight[] = [];
  const seenConcepts = new Set<string>();

  const addIfDistinct = (insight: V2GeneratedInsight) => {
    if (selected.length >= MAX_DAILY_INSIGHT_CARDS) return;

    const conceptKeys = v2InsightConceptKeys(insight);
    if (conceptKeys.some((key) => seenConcepts.has(key))) return;

    selected.push(insight);
    conceptKeys.forEach((key) => seenConcepts.add(key));
  };

  if (primary) {
    addIfDistinct(primary);
  }

  for (const insight of sorted) {
    if (primary && insight.id === primary.id) continue;
    addIfDistinct(insight);
  }

  return selected;
}

function selectPrimaryV2Insight(insights: V2GeneratedInsight[]): V2GeneratedInsight | null {
  return insights.find((insight) => insight.slot === 'whatMySkyNoticed') ?? insights[0] ?? null;
}

function patternScoreKeySet(patternScores: { patternKey: string }[]): Set<string> {
  return new Set(patternScores.map(score => score.patternKey));
}

function selectedArchivePatternKeys(
  insights: V2GeneratedInsight[],
  patternScores: { patternKey: string }[],
): Set<string> {
  const archiveKeys = patternScoreKeySet(patternScores);
  return new Set(
    insights
      .map(insight => insight.patternKey)
      .filter(patternKey => archiveKeys.has(patternKey)),
  );
}

export function adaptV2Insight(insight: V2GeneratedInsight): GeneratedInsight {
  const { observation, pattern } = splitBody(insight.body);

  return {
    id: insight.id,
    slot: insight.slot,
    slotLabel: DAILY_INSIGHT_SLOT_LABELS[insight.slot],
    title: insight.title,
    observation,
    pattern,
    reframe: adaptReframe(insight.reframe),
    prompt: insight.reflectionPrompt ?? 'What feels most useful to notice about this pattern today?',
    patternKey: insight.patternKey,
    confidence: insight.confidence,
    movement: adaptMovement(insight.movement),
    evidence: insight.evidence.map(adaptEvidence),
    createdAt: insight.createdAt,
  };
}

async function runV2KnowledgeInsights({
  checkIns,
  journalEntries,
  sleepEntries,
  selfKnowledgeContext,
  date,
  history,
}: RunActiveKnowledgeInsightInput): Promise<ActiveKnowledgeInsightResult> {
  const result = await buildTodayInsights({
    date,
    rawInputs: buildV2RawInputs({
      checkIns,
      journalEntries,
      sleepEntries,
      selfKnowledgeContext,
    }),
    history: buildV2History(history, date),
  });

  const selectedDailyV2Insights = selectDailyV2Insights(result.insights);
  const dailyPatternKeys = selectedArchivePatternKeys(selectedDailyV2Insights, result.patternScores);
  const premiumPatternScores = result.patternScores.filter(
    score => !dailyPatternKeys.has(score.patternKey),
  );
  const dailyInsights = selectedDailyV2Insights.map(adaptV2Insight);
  const fallbackPrimary = selectPrimaryV2Insight(result.insights);
  const primaryInsight = dailyInsights[0] ?? (fallbackPrimary ? adaptV2Insight(fallbackPrimary) : null);
  const dailyShowsPrimaryPersona = selectedDailyV2Insights.some(insight => insight.slot === 'primaryPersona');
  const premiumPersonaProfile = dailyShowsPrimaryPersona
    ? null
    : adaptPremiumPersonaProfile(result.primaryPersona);
  const premiumPatterns = adaptPremiumPatterns(premiumPatternScores);
  const premiumWeeklyDeepDive = selectPremiumWeeklyDeepDive(
    adaptWeeklyPremiumPatternCandidates(premiumPatternScores),
  );
  const thisWeeksV2Pattern = selectThisWeeksV2Pattern(
    premiumPatternScores,
    premiumPatterns,
    premiumWeeklyDeepDive,
  );

  return {
    primaryInsight,
    dailyInsights,
    premiumPersonaProfile,
    premiumPatterns,
    thisWeeksV2Pattern,
    premiumWeeklyDeepDive,
  };
}

export async function runActiveKnowledgeInsights(
  input: RunActiveKnowledgeInsightInput,
): Promise<ActiveKnowledgeInsightResult> {
  try {
    return await runV2KnowledgeInsights(input);
  } catch (error) {
    logger.warn('[KnowledgeInsightRouter] V2 insight generation failed:', error);
    return {
      primaryInsight: null,
      dailyInsights: [],
      premiumPersonaProfile: null,
      premiumPatterns: [],
      thisWeeksV2Pattern: null,
      premiumWeeklyDeepDive: [],
    };
  }
}

export async function runActiveKnowledgeInsight(
  input: RunActiveKnowledgeInsightInput,
): Promise<GeneratedInsight | null> {
  const result = await runActiveKnowledgeInsights(input);
  return result.primaryInsight;
}
