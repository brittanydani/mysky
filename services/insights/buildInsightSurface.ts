import { supabaseDb } from '../storage/supabaseDb';
import { buildDailyAggregation } from './dailyAggregates';
import type { DailyAggregate } from './types';
import {
  loadSelfKnowledgeContext,
  enrichSelfKnowledgeContext,
  type SelfKnowledgeContext,
} from './selfKnowledgeContext';
import { toLocalDateString } from '../../utils/dateUtils';
import type { DailyCheckIn } from '../patterns/types';
import type { JournalEntry, SleepEntry } from '../storage/models';
import type { ArchiveDepthCounts } from '../../utils/archiveDepth';
import type { GeneratedInsight } from './types/knowledgeEngine';
import {
  buildKnowledgeHistoryFromInsightMemory,
  mergeKnowledgeHistoryInputs,
  type KnowledgeEngineHistoryInput,
} from './insightHistory';
import type { PremiumPersonaProfile } from '../insightsV2/adapters/premiumPersonaProfile';
import type {
  PremiumPatternItem,
  PremiumPatternProfile,
  PremiumThisWeekPatternItem,
  PremiumWeeklyDeepDiveItem,
} from '../insightsV2/adapters/premiumPatterns';
import type {
  WeeklyNarrativeThread,
} from '../insightsV2/narrative/weeklyNarrative';
import type { InsightFeedbackProfile } from '../insightsV2/feedback/insightOutcomeFeedback';
import {
  previousPatternScoresFromInsightMemory,
  type InsightMemoryProfile,
} from '../insightsV2/memory/insightMemory';
import type { KnowledgeInsightModelTier, KnowledgeInsightSurface } from './aiInsightRefinement';

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
  includeDailyReflections?: boolean;
  includePremiumPatterns?: boolean;
  knowledgeAiEnabled?: boolean;
  knowledgeAiModelTier?: KnowledgeInsightModelTier;
  knowledgeAiSurface?: KnowledgeInsightSurface;
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
  includeDailyReflections = true,
  includePremiumPatterns = false,
  knowledgeAiEnabled = false,
  knowledgeAiModelTier = 'free',
  knowledgeAiSurface = 'today',
}: BuildInsightSurfaceOptions): Promise<InsightSurfaceResult> {
  const chartId = await resolveChartId(inputChartId);

  if (!chartId) {
    const emptyContext = await loadSelfKnowledgeContext({ includeDailyReflections });
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
    supabaseDb.getJournalEntriesInRange(fromDate, today),
    loadSelfKnowledgeContext({ includeDailyReflections }),
  ]);

  const recentJournalEntries = journalEntries;
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

  const insightMemory = insightsEnabled ? insightMemoryProfile : null;
  const insightDate = knowledgeInsightDate ?? `${today}T12:00:00`;
  const combinedKnowledgeHistory = mergeKnowledgeHistoryInputs(
    knowledgeHistory,
    buildKnowledgeHistoryFromInsightMemory(insightMemory, insightDate),
  );
  const previousPatternScores = previousPatternScoresFromInsightMemory(
    insightMemory,
    insightDate,
  );

  const knowledgeInsightResult = insightsEnabled && includeKnowledgeInsight
    ? await import('./knowledgeInsightRouter').then(({ runActiveKnowledgeInsights }) =>
        runActiveKnowledgeInsights({
          checkIns,
          journalEntries: recentJournalEntries,
          sleepEntries,
          selfKnowledgeContext: enrichedContext,
          date: insightDate,
          history: combinedKnowledgeHistory,
          feedbackProfile: insightFeedbackProfile,
          previousPatternScores,
          includePremiumPatterns,
          aiRefinement: {
            enabled: knowledgeAiEnabled,
            modelTier: knowledgeAiModelTier,
            surface: knowledgeAiSurface,
          },
        })
      )
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
