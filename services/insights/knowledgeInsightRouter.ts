import type { DailyCheckIn } from '../patterns/types';
import type { JournalEntry, SleepEntry } from '../storage/models';
import { buildTodayInsights } from '../insightsV2/knowledgeEngineV2';
import type {
  EvidenceAnchor as V2EvidenceAnchor,
  GeneratedInsight as V2GeneratedInsight,
  InsightHistoryItem as V2InsightHistoryItem,
  InsightRawInputs,
  PatternMovement as V2PatternMovement,
} from '../insightsV2/types';
import type { KnowledgeEngineHistoryInput } from './insightHistory';
import { runKnowledgeEngine } from './knowledgeEngine';
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

export function adaptV2Insight(insight: V2GeneratedInsight): GeneratedInsight {
  const { observation, pattern } = splitBody(insight.body);

  return {
    id: insight.id,
    slot: insight.slot,
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

async function runV2KnowledgeInsight({
  checkIns,
  journalEntries,
  sleepEntries,
  selfKnowledgeContext,
  date,
  history,
}: RunActiveKnowledgeInsightInput): Promise<GeneratedInsight | null> {
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

  const primaryInsight = result.insights.find((insight) => insight.slot === 'whatMySkyNoticed');
  return primaryInsight ? adaptV2Insight(primaryInsight) : null;
}

export async function runActiveKnowledgeInsight(
  input: RunActiveKnowledgeInsightInput,
): Promise<GeneratedInsight | null> {
  try {
    const v2Insight = await runV2KnowledgeInsight(input);
    if (v2Insight) return v2Insight;
  } catch (error) {
    logger.warn('[KnowledgeInsightRouter] V2 insight generation failed; falling back to v1:', error);
  }

  return runKnowledgeEngine(
    input.checkIns,
    input.journalEntries,
    input.sleepEntries,
    input.selfKnowledgeContext,
    input.date,
    input.history,
  );
}
