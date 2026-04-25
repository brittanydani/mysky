import { supabase } from '../../lib/supabase';
import { supabaseDb } from '../storage/supabaseDb';
import { runPipeline } from './pipeline';
import type { DailyAggregate } from './types';
import {
  loadSelfKnowledgeContext,
  enrichSelfKnowledgeContext,
  type SelfKnowledgeContext,
} from './selfKnowledgeContext';
import { enhancePatternInsights } from './geminiInsightsService';
import {
  runPremiumInsightPipeline,
  type PremiumInsightResult,
} from './premiumPipeline';
import type { PortraitBuilderInput } from './premiumPipeline/portraitBuilder';
import type { PatternSelectorInput } from './premiumPipeline/patternSelector';
import { buildPersonalProfile } from '../../utils/personalProfile';
import { computeDeepInsights, type DeepInsightBundle } from '../../utils/deepInsights';
import { buildPatternFeedInsights } from '../../utils/patternFeed';
import {
  computeSelfKnowledgeCrossRef,
  type CrossRefInsight,
} from '../../utils/selfKnowledgeCrossRef';
import { refineCrossRefCopy } from '../../utils/patternsHelpers';
import { toLocalDateString } from '../../utils/dateUtils';
import type { DailyCheckIn } from '../patterns/types';
import type { JournalEntry, SleepEntry } from '../storage/models';
import type { ArchiveDepthCounts } from '../../utils/archiveDepth';
import { logger } from '../../utils/logger';

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
  premiumInsight: PremiumInsightResult | null;
}

interface BuildInsightSurfaceOptions {
  chartId?: string | null;
  isPremium: boolean;
  rangeDays?: number;
  includePremiumPipeline?: boolean;
  tier?: 'daily' | 'deep';
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

async function maybeBuildPremiumInsight(
  checkIns: DailyCheckIn[],
  recentJournalEntries: JournalEntry[],
  sleepEntries: SleepEntry[],
  enrichedContext: SelfKnowledgeContext,
  includePremiumPipeline: boolean,
  tier: 'daily' | 'deep' = 'deep',
): Promise<PremiumInsightResult | null> {
  if (!includePremiumPipeline || checkIns.length < 14) return null;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token ?? null;
    if (!accessToken) return null;

    const userId = sessionData.session?.user?.id ?? 'unknown';
    const portraitInput: PortraitBuilderInput = {
      user_id: userId,
      window: {
        recent_days: 14,
        extended_days: 60,
        lifetime_days: 90,
      },
      check_ins: checkIns,
      journal_entries: recentJournalEntries,
      sleep_entries: sleepEntries,
      somatic_entries: enrichedContext.somaticEntries,
      trigger_events: enrichedContext.triggers
        ? [
            ...enrichedContext.triggers.drains.map((d) => ({ mode: 'drain' as const, event: d })),
            ...enrichedContext.triggers.restores.map((r) => ({ mode: 'nourish' as const, event: r })),
          ]
        : [],
      relationship_patterns: enrichedContext.relationshipPatterns,
      reflection_answers: enrichedContext.dailyReflections?.recentAnswers ?? [],
      relationship_charts: [],
      derived_metrics: {
        best_days: [],
        hard_days: [],
        cross_domain_patterns: [],
        glimmer_patterns: [],
        sleep_correlations: [],
        tone_shifts: [],
      },
    };

    const patternSelectorInput: Omit<PatternSelectorInput, 'portrait'> = {
      recent_context: {
        last_7_days: checkIns.slice(-7),
        last_14_days: checkIns.slice(-14),
        today_state: checkIns[checkIns.length - 1] ?? null,
        recent_changes: [],
        recent_glimmers: enrichedContext.triggers?.restores ?? [],
        recent_triggers: enrichedContext.triggers?.drains ?? [],
      },
      product_context: {
        insight_type: tier === 'daily' ? 'daily' : 'premium_deep',
        user_has_seen_recently: [],
        avoid_repetition_themes: [],
        minimum_novelty: 0.4,
      },
    };

    return await runPremiumInsightPipeline(portraitInput, patternSelectorInput, accessToken, {
      logLifecycle: false,
      logErrors: false,
      tier,
    });
  } catch (error) {
    logger.warn('[InsightSurface] Premium pipeline error (non-fatal):', error);
    return null;
  }
}

export async function buildInsightSurface({
  chartId: inputChartId,
  isPremium,
  rangeDays = 90,
  includePremiumPipeline = false,
  tier = 'deep',
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
      premiumInsight: null,
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

  const refs = computeSelfKnowledgeCrossRef(enrichedContext, checkIns);
  const enhancedRefs = refs.length
    ? await enhancePatternInsights(refs, enrichedContext, checkIns, isPremium, { logErrors: false })
    : null;
  const aiBodies = new Map(enhancedRefs?.insights.map((insight) => [insight.id, insight.body]) ?? []);
  const crossRefs = refs.map((insight) =>
    aiBodies.has(insight.id)
      ? {
          ...insight,
          body: aiBodies.get(insight.id) ?? insight.body,
        }
      : insight,
  );

  const pipelineResult = runPipeline({
    checkIns,
    journalEntries: recentJournalEntries,
    sleepEntries,
    chart: null,
    todayContext: null,
  });
  const deepInsights = pipelineResult.dailyAggregates.length
    ? computeDeepInsights(buildPersonalProfile(pipelineResult.dailyAggregates))
    : null;
  const feedInsights = [...buildPatternFeedInsights(deepInsights), ...crossRefs];

  const premiumInsight = await maybeBuildPremiumInsight(
    checkIns,
    recentJournalEntries,
    sleepEntries,
    enrichedContext,
    isPremium && includePremiumPipeline,
    tier,
  );

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
    },
    lastUpdated: checkIns.length || recentJournalEntries.length || sleepEntries.length
      ? new Date().toISOString()
      : null,
    crossRefs,
    dailyAggregates: pipelineResult.dailyAggregates,
    deepInsights,
    feedInsights,
    leadInsight: computeLeadInsight(feedInsights),
    premiumInsight,
  };
}
