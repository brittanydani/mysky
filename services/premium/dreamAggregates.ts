/**
 * Dream Aggregation Service
 *
 * Computes all psychological aggregates from:
 *   - The current dream's selected feelings + metadata
 *   - Recent sleep entries (feelings history, patterns)
 *   - Natal chart (personality baseline → attachment/nervous system tendencies)
 *   - Recent check-ins and journal entries (mood context)
 *
 * Output: DreamAggregates + DreamPatternData — passed to the interpretation engine.
 * All computation is local; no network calls.
 */

import { NatalChart } from '../astrology/types';
import { DailyCheckIn } from '../patterns/types';
import { JournalEntry, SleepEntry } from '../storage/models';
import {
  AttachmentStyle,
  DreamAggregates,
  DreamPatternData,
  FEELING_MAP,
  NervousSystemBranch,
  SelectedFeeling,
  ShadowTrigger,
} from './dreamTypes';

// ─── Aggregate Builder ────────────────────────────────────────────────────────

/**
 * Compute aggregates from the current dream's feelings and metadata.
 * This is the primary signal source — everything else adds context.
 */
export function computeDreamAggregates(
  feelings: SelectedFeeling[],
  chart: NatalChart | null,
): DreamAggregates {
  // ── Valence score: weighted average of feeling valences ────────────────────
  let totalWeight = 0;
  let weightedValence = 0;
  let weightedActivation = 0;

  const branchWeights: Record<NervousSystemBranch, number> = {
    ventral_safety: 0,
    fight: 0,
    flight: 0,
    freeze: 0,
    collapse: 0,
    mixed: 0,
  };

  const attachmentWeights: Record<AttachmentStyle, number> = {
    secure: 0,
    anxious: 0,
    avoidant: 0,
    disorganized: 0,
  };

  const triggerWeights: Record<ShadowTrigger, number> = {
    abandonment: 0,
    rejection: 0,
    betrayal: 0,
    shame: 0,
    exposure: 0,
    control: 0,
    power: 0,
    helplessness: 0,
    danger: 0,
    intimacy: 0,
    sexuality: 0,
    consent_violation: 0,
    worthiness: 0,
    responsibility: 0,
    failure: 0,
    grief: 0,
    identity: 0,
    belonging: 0,
    unpredictability: 0,
    punishment: 0,
    isolation: 0,
    transformation: 0,
  };

  for (const sel of feelings) {
    const def = FEELING_MAP[sel.id];
    if (!def || sel.intensity <= 0) continue;

    const w = sel.intensity; // intensity IS the weight
    totalWeight += w;
    weightedValence += def.valence * w;
    weightedActivation += def.activation * w;

    branchWeights[def.primaryBranch] += w;
    attachmentWeights[def.attachmentSignal] += w;

    for (const t of def.shadowTriggers) {
      triggerWeights[t] += w;
    }
  }

  // Apply natal chart baseline bias (subtle — adds 0.5 weight in the chart's direction)
  if (chart) {
    const chartBias = inferChartBias(chart);
    branchWeights[chartBias.nervousBranch] += 0.5;
    attachmentWeights[chartBias.attachment] += 0.5;
    totalWeight += 0.5; // account for chart bias in total
  }

  const valenceScore = totalWeight > 0 ? weightedValence / totalWeight : 0;
  const rawActivation = totalWeight > 0 ? weightedActivation / totalWeight : 0;
  const activationScore: DreamAggregates['activationScore'] =
    rawActivation > 0.65 ? 'high' : rawActivation > 0.35 ? 'moderate' : 'low';

  // Normalize distributions
  const normBranch = normalize(branchWeights);
  const normAttach = normalize(attachmentWeights);

  // Build shadow heatmap — sorted descending
  const shadowHeatmap = Object.entries(triggerWeights)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([trigger, weight]) => ({ trigger: trigger as ShadowTrigger, weight }));

  // Dominant branch + attachment
  const dominantBranch = maxKey(normBranch) as NervousSystemBranch;
  const dominantAttachment = maxKey(normAttach) as AttachmentStyle;

  // Top 2–3 feelings by intensity
  const dominantFeelings = [...feelings]
    .filter(f => f.intensity > 0)
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 3);

  return {
    valenceScore,
    activationScore,
    attachmentProfile: normAttach,
    nervousSystemProfile: normBranch,
    shadowTriggerHeatmap: shadowHeatmap,
    dominantFeelings,
    dominantBranch,
    dominantAttachment,
  };
}

// ─── Pattern Detection ────────────────────────────────────────────────────────

/**
 * Analyze recent dream history for recurring patterns.
 * Compare the current dream's feelings against the last N dreams.
 */
export function computeDreamPatterns(
  currentFeelings: SelectedFeeling[],
  recentEntries: SleepEntry[],
): DreamPatternData {
  // Extract feelings from recent entries (stored as JSON string in dreamFeelings)
  const pastFeelingLists: SelectedFeeling[][] = [];
  for (const entry of recentEntries) {
    if (entry.dreamFeelings) {
      try {
        const parsed = JSON.parse(entry.dreamFeelings) as SelectedFeeling[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          pastFeelingLists.push(parsed);
        }
      } catch {
        // Silently skip malformed data
      }
    }
  }

  const comparisonCount = pastFeelingLists.length;

  // ── Recurring feelings ────────────────────────────────────────────────────
  // A feeling is "recurring" if it appears in ≥40% of past dreams AND in current
  const currentIds = new Set(currentFeelings.filter(f => f.intensity > 0).map(f => f.id));
  const idCounts: Record<string, number> = {};
  for (const list of pastFeelingLists) {
    const seen = new Set<string>();
    for (const f of list) {
      if (f.intensity > 0 && !seen.has(f.id)) {
        idCounts[f.id] = (idCounts[f.id] ?? 0) + 1;
        seen.add(f.id);
      }
    }
  }

  const threshold = Math.max(1, Math.floor(comparisonCount * 0.4));
  const recurringFeelings = Object.entries(idCounts)
    .filter(([id, count]) => count >= threshold && currentIds.has(id))
    .map(([id]) => id);

  // ── Emotional trend direction ────────────────────────────────────────────
  // Compare current average intensity to recent average
  const currentAvgIntensity = avgIntensity(currentFeelings);
  const pastAvgIntensities = pastFeelingLists.map(avgIntensity);
  const recentPastAvg = pastAvgIntensities.length > 0
    ? pastAvgIntensities.reduce((a, b) => a + b, 0) / pastAvgIntensities.length
    : currentAvgIntensity;

  const diff = currentAvgIntensity - recentPastAvg;
  const emotionalTrendDirection: DreamPatternData['emotionalTrendDirection'] =
    diff > 0.5 ? 'increasing' : diff < -0.5 ? 'decreasing' : 'stable';

  // ── Co-occurring pairs ────────────────────────────────────────────────────
  // Find feeling pairs that appear together in ≥2 past dreams AND in current
  const pairCounts: Record<string, number> = {};
  const allLists = [...pastFeelingLists, currentFeelings];
  for (const list of allLists) {
    const ids = list.filter(f => f.intensity > 0).map(f => f.id).sort();
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = `${ids[i]}|${ids[j]}`;
        pairCounts[key] = (pairCounts[key] ?? 0) + 1;
      }
    }
  }

  const coOccurringPairs: [string, string][] = Object.entries(pairCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key.split('|') as [string, string]);

  return {
    recurringFeelings,
    emotionalTrendDirection,
    coOccurringPairs,
    comparisonCount,
  };
}

// ─── Chart Bias Inference ─────────────────────────────────────────────────────

interface ChartBias {
  nervousBranch: NervousSystemBranch;
  attachment: AttachmentStyle;
}

/**
 * Infer a subtle nervous system / attachment baseline from natal chart.
 * This is NOT deterministic diagnosis — it's a slight weighting that
 * personalizes interpretation without overriding the user's own signals.
 */
function inferChartBias(chart: NatalChart): ChartBias {
  const moonElement = chart.moonSign?.element ?? '';
  const venusSign = chart.venus?.sign?.name ?? '';
  const saturnSign = chart.saturn?.sign?.name ?? '';

  // Moon element → nervous system tendency
  let nervousBranch: NervousSystemBranch = 'ventral_safety';
  switch (moonElement) {
    case 'Fire':
      nervousBranch = 'fight'; // action-oriented emotional processing
      break;
    case 'Air':
      nervousBranch = 'flight'; // cognitive/avoidant processing
      break;
    case 'Water':
      nervousBranch = 'freeze'; // absorption/overwhelm tendency
      break;
    case 'Earth':
      nervousBranch = 'ventral_safety'; // grounding, body-based
      break;
  }

  // Venus + Saturn → attachment tendency
  let attachment: AttachmentStyle = 'secure';
  const anxiousSigns = ['Cancer', 'Pisces', 'Libra', 'Leo'];
  const avoidantSigns = ['Aquarius', 'Capricorn', 'Virgo', 'Sagittarius'];

  if (anxiousSigns.includes(venusSign)) {
    attachment = 'anxious';
  } else if (avoidantSigns.includes(venusSign)) {
    attachment = 'avoidant';
  }

  // Saturn in water/fire can push toward disorganized
  const disorganizedSigns = ['Scorpio', 'Aries', 'Pisces'];
  if (disorganizedSigns.includes(saturnSign)) {
    attachment = 'disorganized';
  }

  return { nervousBranch, attachment };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function normalize<K extends string>(weights: Record<K, number>): Record<K, number> {
  const total = Object.values<number>(weights).reduce((a, b) => a + b, 0);
  if (total === 0) {
    // Equal distribution
    const keys = Object.keys(weights) as K[];
    const equal = 1 / keys.length;
    const result = {} as Record<K, number>;
    for (const k of keys) result[k] = equal;
    return result;
  }
  const result = {} as Record<K, number>;
  for (const [k, v] of Object.entries(weights) as [K, number][]) {
    result[k] = v / total;
  }
  return result;
}

function maxKey<K extends string>(obj: Record<K, number>): K {
  let best: K = Object.keys(obj)[0] as K;
  let bestVal = -Infinity;
  for (const [k, v] of Object.entries(obj) as [K, number][]) {
    if (v > bestVal) {
      bestVal = v;
      best = k;
    }
  }
  return best;
}

function avgIntensity(feelings: SelectedFeeling[]): number {
  const active = feelings.filter(f => f.intensity > 0);
  if (active.length === 0) return 0;
  return active.reduce((sum, f) => sum + f.intensity, 0) / active.length;
}
