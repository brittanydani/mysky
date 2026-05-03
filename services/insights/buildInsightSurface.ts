import { supabaseDb } from '../storage/supabaseDb';
import { buildDailyAggregation } from './dailyAggregates';
import type { DailyAggregate } from './types';
import {
  loadSelfKnowledgeContext,
  enrichSelfKnowledgeContext,
  type SelfKnowledgeContext,
} from './selfKnowledgeContext';
import {
  computeSelfKnowledgeCrossRef,
  type CrossRefInsight,
} from '../../utils/selfKnowledgeCrossRef';
import { toLocalDateString } from '../../utils/dateUtils';
import type { DailyCheckIn } from '../patterns/types';
import type { JournalEntry, SleepEntry } from '../storage/models';
import type { ArchiveDepthCounts } from '../../utils/archiveDepth';
import { runActiveKnowledgeInsights } from './knowledgeInsightRouter';
import type { GeneratedInsight } from './types/knowledgeEngine';
import type { KnowledgeEngineHistoryInput } from './insightHistory';
import type { PremiumPersonaProfile } from '../insightsV2/adapters/premiumPersonaProfile';
import type {
  PremiumPatternItem,
  PremiumPatternProfile,
} from './selection/selectPatternCards';
import type {
  PremiumThisWeekPatternItem,
} from './selection/selectThisWeek';
import type {
  PremiumWeeklyDeepDiveItem,
} from './selection/selectWeeklyDeepDive';
import type { WeeklyNarrativeThread } from '../insightsV2/narrative/weeklyNarrative';
import type { InsightFeedbackProfile } from '../insightsV2/feedback/insightOutcomeFeedback';
import {
  previousPatternScoresFromInsightMemory,
  type InsightMemoryProfile,
} from '../insightsV2/memory/insightMemory';

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
  knowledgeInsight: GeneratedInsight | null;
  knowledgeInsights: GeneratedInsight[];
  premiumPersonaProfile: PremiumPersonaProfile | null;
  premiumPatterns: PremiumPatternItem[];
  premiumPatternProfile: PremiumPatternProfile | null;
  thisWeeksV2Pattern: PremiumThisWeekPatternItem | null;
  premiumWeeklyDeepDive: PremiumWeeklyDeepDiveItem[];
  weeklyNarrative: WeeklyNarrativeThread | null;
  insightMemory: InsightMemoryProfile | null;
}

interface BuildInsightSurfaceOptions {
  chartId?: string | null;
  rangeDays?: number;
  insightsEnabled?: boolean;
  includeKnowledgeInsight?: boolean;
  knowledgeInsightDate?: string;
  knowledgeHistory?: KnowledgeEngineHistoryInput;
  insightFeedbackProfile?: InsightFeedbackProfile | null;
  insightMemoryProfile?: InsightMemoryProfile | null;
}

function getStressScore(checkIn: DailyCheckIn): number {
  if (checkIn.stressLevel === 'high') return 8;
  if (checkIn.stressLevel === 'low') return 2;
  return 5;
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
  insightFeedbackProfile = null,
  insightMemoryProfile = null,
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
      knowledgeInsight: null,
      knowledgeInsights: [],
      premiumPersonaProfile: null,
      premiumPatterns: [],
      premiumPatternProfile: null,
      thisWeeksV2Pattern: null,
      premiumWeeklyDeepDive: [],
      weeklyNarrative: null,
      insightMemory: null,
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

  const aggregationResult = buildDailyAggregation({
    checkIns,
    journalEntries: recentJournalEntries,
    sleepEntries,
    chart: null,
    todayContext: null,
  });

  const refs = insightsEnabled
    ? computeSelfKnowledgeCrossRef(enrichedContext, checkIns, aggregationResult.dailyAggregates)
    : [];
  const crossRefs = refs;
  const insightMemory = insightsEnabled ? insightMemoryProfile : null;
  const previousPatternScores = previousPatternScoresFromInsightMemory(
    insightMemory,
    knowledgeInsightDate ?? `${today}T12:00:00`,
  );

  const knowledgeInsightResult = insightsEnabled && includeKnowledgeInsight
    ? await runActiveKnowledgeInsights({
        checkIns,
        journalEntries: recentJournalEntries,
        sleepEntries,
        selfKnowledgeContext: enrichedContext,
        date: knowledgeInsightDate ?? `${today}T12:00:00`,
        history: knowledgeHistory,
        feedbackProfile: insightFeedbackProfile,
        previousPatternScores,
      })
    : {
        primaryInsight: null,
        dailyInsights: [],
        premiumPersonaProfile: null,
        premiumPatterns: [],
        premiumPatternProfile: null,
        thisWeeksV2Pattern: null,
        premiumWeeklyDeepDive: [],
        weeklyNarrative: null,
      };
  const premiumPersonaProfile = knowledgeInsightResult.premiumPersonaProfile;
  const premiumPatterns = knowledgeInsightResult.premiumPatterns;
  const premiumPatternProfile = knowledgeInsightResult.premiumPatternProfile;
  const thisWeeksV2Pattern = knowledgeInsightResult.thisWeeksV2Pattern;
  const premiumWeeklyDeepDive = knowledgeInsightResult.premiumWeeklyDeepDive;
  const weeklyNarrative = knowledgeInsightResult.weeklyNarrative;
  const knowledgeInsight = knowledgeInsightResult.primaryInsight;
  const knowledgeInsights = knowledgeInsightResult.dailyInsights;

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
    dailyAggregates: aggregationResult.dailyAggregates,
    knowledgeInsight,
    knowledgeInsights,
    premiumPersonaProfile,
    premiumPatterns,
    premiumPatternProfile,
    thisWeeksV2Pattern,
    premiumWeeklyDeepDive,
    weeklyNarrative,
    insightMemory,
  };
}
