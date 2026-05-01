import { supabaseDb } from '../storage/supabaseDb';
import { runPipeline } from './pipeline';
import type { DailyAggregate } from './types';
import {
  loadSelfKnowledgeContext,
  enrichSelfKnowledgeContext,
  type SelfKnowledgeContext,
} from './selfKnowledgeContext';
import { buildPersonalProfile } from '../../utils/personalProfile';
import { computeDeepInsights, type DeepInsightBundle } from '../../utils/deepInsights';
import { buildPatternFeedInsights } from '../../utils/patternFeed';
import {
  computeSelfKnowledgeCrossRef,
  type CrossRefInsight,
} from '../../utils/selfKnowledgeCrossRef';
import { refineCrossRefCopy, selectDistinctPatternInsights } from '../../utils/patternsHelpers';
import { dedupeExactInsights } from '../../utils/insightDedupe';
import { toLocalDateString } from '../../utils/dateUtils';
import type { DailyCheckIn } from '../patterns/types';
import type { JournalEntry, SleepEntry } from '../storage/models';
import type { ArchiveDepthCounts } from '../../utils/archiveDepth';
import { runActiveKnowledgeInsight } from './knowledgeInsightRouter';
import type { GeneratedInsight } from './types/knowledgeEngine';
import type { KnowledgeEngineHistoryInput } from './insightHistory';

export interface InsightSurfaceResult {
  chartId: string | null;
  checkIns: DailyCheckIn[];
  sleepEntries: SleepEntry[];
  journalEntries: JournalEntry[];
  recentJournalEntries: JournalEntry[];
  selfKnowledgeContext: SelfKnowledgeContext;
  snapshot: {
    avgMood: number;
    avgStress: number;
    checkInCount: number;
  };
  archiveDepthCounts: ArchiveDepthCounts;
  lastUpdated: string | null;
  crossRefs: CrossRefInsight[];
  dailyAggregates: DailyAggregate[];
  deepInsights: DeepInsightBundle | null;
  feedInsights: CrossRefInsight[];
  leadInsight: CrossRefInsight | null;
  knowledgeInsight: GeneratedInsight | null;
}

interface BuildInsightSurfaceOptions {
  chartId?: string | null;
  rangeDays?: number;
  insightsEnabled?: boolean;
  includeKnowledgeInsight?: boolean;
  knowledgeInsightDate?: string;
  knowledgeHistory?: KnowledgeEngineHistoryInput;
}

function getStressScore(checkIn: DailyCheckIn): number {
  if (checkIn.stressLevel === 'high') return 8;
  if (checkIn.stressLevel === 'low') return 2;
  return 5;
}

function computeLeadInsight(feedInsights: CrossRefInsight[]): CrossRefInsight | null {
  if (!feedInsights.length) return null;

  const localEpochDay = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60_000) / 86_400_000);
  return refineCrossRefCopy(feedInsights[localEpochDay % feedInsights.length]);
}

async function resolveChartId(inputChartId?: string | null): Promise<string | null> {
  if (inputChartId) return inputChartId;
  const charts = await supabaseDb.getCharts();
  return charts?.[0]?.id ?? null;
}

export async function buildInsightSurface({
  chartId: inputChartId,
  rangeDays = 90,
  insightsEnabled = true,
  includeKnowledgeInsight = false,
  knowledgeInsightDate,
  knowledgeHistory = { recentlyShownPatternKeys: [], recentlyShownCopyHashes: [] },
}: BuildInsightSurfaceOptions): Promise<InsightSurfaceResult> {
  const chartId = await resolveChartId(inputChartId);

  if (!chartId) {
    const emptyContext = await loadSelfKnowledgeContext();
    return {
      chartId: null,
      checkIns: [],
      sleepEntries: [],
      journalEntries: [],
      recentJournalEntries: [],
      selfKnowledgeContext: emptyContext,
      snapshot: { avgMood: 0, avgStress: 0, checkInCount: 0 },
      archiveDepthCounts: {},
      lastUpdated: null,
      crossRefs: [],
      dailyAggregates: [],
      deepInsights: null,
      feedInsights: [],
      leadInsight: null,
      knowledgeInsight: null,
    };
  }

  const today = toLocalDateString();
  const fromDate = toLocalDateString(
    new Date(new Date(`${today}T12:00:00`).getTime() - Math.max(0, rangeDays - 1) * 86_400_000),
  );

  const [checkIns, sleepEntries, journalEntries, selfKnowledgeContext] = await Promise.all([
    supabaseDb.getCheckInsInRange(chartId, fromDate, today),
    supabaseDb.getSleepEntriesInRange(chartId, fromDate, today),
    supabaseDb.getJournalEntries(),
    loadSelfKnowledgeContext(),
  ]);

  const recentJournalEntries = journalEntries.filter((entry) => entry.date >= fromDate && entry.date <= today);
  const enrichedContext = enrichSelfKnowledgeContext(selfKnowledgeContext, recentJournalEntries, sleepEntries);

  const moods = checkIns.map((c) => c.moodScore).filter((v): v is number => v != null);
  const avgMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
  const stressValues = checkIns.map(getStressScore);
  const avgStress = stressValues.length
    ? stressValues.reduce((sum, value) => sum + value, 0) / stressValues.length
    : 0;

  const pipelineResult = runPipeline({
    checkIns,
    journalEntries: recentJournalEntries,
    sleepEntries,
    chart: null,
    todayContext: null,
  });

  const refs = insightsEnabled
    ? computeSelfKnowledgeCrossRef(enrichedContext, checkIns, pipelineResult.dailyAggregates)
    : [];
  const crossRefs = refs;

  const deepInsights = insightsEnabled && pipelineResult.dailyAggregates.length
    ? computeDeepInsights(buildPersonalProfile(pipelineResult.dailyAggregates))
    : null;
  const feedInsights = dedupeExactInsights(
    selectDistinctPatternInsights([...buildPatternFeedInsights(deepInsights), ...crossRefs]),
    'buildInsightSurface:feedInsights',
  );
  const knowledgeInsight = insightsEnabled && includeKnowledgeInsight
    ? await runActiveKnowledgeInsight({
        checkIns,
        journalEntries: recentJournalEntries,
        sleepEntries,
        selfKnowledgeContext: enrichedContext,
        date: knowledgeInsightDate ?? `${today}T12:00:00`,
        history: knowledgeHistory,
      })
    : null;

  const selfKnowledgeSignalCount =
    (enrichedContext.dailyReflections?.totalAnswers ?? 0)
    + enrichedContext.somaticEntries.length
    + enrichedContext.triggerEvents.length
    + enrichedContext.relationshipPatterns.length;

  return {
    chartId,
    checkIns,
    sleepEntries,
    journalEntries,
    recentJournalEntries,
    selfKnowledgeContext: enrichedContext,
    snapshot: {
      avgMood,
      avgStress,
      checkInCount: checkIns.length,
    },
    archiveDepthCounts: {
      checkIns: checkIns.length,
      journalEntries: recentJournalEntries.length,
      sleepEntries: sleepEntries.filter((entry) => entry.quality != null || entry.durationHours != null).length,
      dreamEntries: sleepEntries.filter((entry) => !!entry.dreamText?.trim()).length,
      dailyReflections: enrichedContext.dailyReflections?.totalAnswers ?? 0,
      somaticEntries: enrichedContext.somaticEntries.length,
      triggerEvents: enrichedContext.triggerEvents.filter((event) => event.mode === 'drain').length,
      glimmerEvents: enrichedContext.triggerEvents.filter((event) => event.mode === 'nourish').length,
      relationshipPatterns: enrichedContext.relationshipPatterns.length,
      astrologyCheckIns: checkIns.filter((entry) =>
        entry.moonSign || entry.lunarPhase !== 'unknown' || (entry.transitEvents?.length ?? 0) > 0,
      ).length,
    },
    lastUpdated: checkIns.length || recentJournalEntries.length || sleepEntries.length || selfKnowledgeSignalCount
      ? new Date().toISOString()
      : null,
    crossRefs,
    dailyAggregates: pipelineResult.dailyAggregates,
    deepInsights,
    feedInsights,
    leadInsight: computeLeadInsight(feedInsights),
    knowledgeInsight,
  };
}
