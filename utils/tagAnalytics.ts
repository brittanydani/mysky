/**
 * Tag Analytics Engine
 *
 * Computes tag-based insight cards from DailyAggregate rows.
 * All functions are pure — no I/O, no side effects.
 *
 * Four main calculations:
 *  1) Restores/Drains — best vs hard day lift per tag
 *  2) Tag impact on averages — diff from baseline per tag
 *  3) Co-occurrence patterns — tag pair analysis
 *  4) Trigger/restorer classification — rule-based, data-backed
 *
 * Plus cross-system agreements:
 *  - Tag + journal keyword agreement (confidence booster)
 *  - Tag + chart baseline agreement (personalized blended insight)
 */

import { DailyAggregate, ChartProfile, Element } from '../services/insights/types';
import { regulationStyle } from '../services/insights/chartProfile';
import type { ConfidenceLevel } from './insightsEngine';
import { mean, confidence } from './stats';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const TAG_LABELS: Record<string, string> = {
  relationships: 'Relationships', confidence: 'Confidence', money: 'Money',
  family: 'Family', creativity: 'Creativity', health: 'Health',
  boundaries: 'Boundaries', career: 'Career', anxiety: 'Anxiety',
  joy: 'Joy', grief: 'Grief', clarity: 'Clarity',
  overwhelm: 'Overwhelm', loneliness: 'Loneliness', gratitude: 'Gratitude',
  sleep: 'Sleep', work: 'Work', social: 'Social', conflict: 'Conflict',
  movement: 'Movement', nature: 'Nature', routine: 'Routine',
  overstimulated: 'Overstimulated', creative: 'Creative', rest: 'Rest',
  alone_time: 'Alone time', travel: 'Travel', finances: 'Finances',
  weather: 'Weather', food: 'Food', hormones: 'Hormones',
  screens: 'Screens', kids: 'Kids', productivity: 'Productivity',
  substances: 'Substances', intimacy: 'Intimacy',
  eq_calm: 'Calm', eq_anxious: 'Anxious', eq_focused: 'Focused',
  eq_disconnected: 'Disconnected', eq_hopeful: 'Hopeful', eq_irritable: 'Irritable',
  eq_grounded: 'Grounded', eq_scattered: 'Scattered', eq_heavy: 'Heavy', eq_open: 'Open',
};

function tagLabel(tag: string): string {
  return TAG_LABELS[tag] ?? tag.replace(/_/g, ' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// 1) Best vs hard day lift (Restores / Drains)
// ─────────────────────────────────────────────────────────────────────────────

export interface TagLiftResult {
  tag: string;
  label: string;
  lift: number;
  bestRate: number;
  hardRate: number;
  totalDays: number;
}

export interface TagLiftCard {
  restores: TagLiftResult[];
  drains: TagLiftResult[];
  hasData: boolean;
  confidence: ConfidenceLevel;
  bestDayCount: number;
  hardDayCount: number;
}

/**
 * Split aggregates into best and hard day buckets.
 * Best = top 20% by moodAvg
 * Hard = top 20% by stressAvg OR bottom 20% by moodAvg (union)
 */
function splitBestHard(
  aggregates: DailyAggregate[],
): { bestDays: DailyAggregate[]; hardDays: DailyAggregate[] } | null {
  const n = aggregates.length;
  if (n < 10) return null;

  const topN = Math.max(1, Math.ceil(n * 0.2));

  const byMood = [...aggregates].sort((a, b) => b.moodAvg - a.moodAvg);
  const bestDays = byMood.slice(0, topN);

  const byStress = [...aggregates].sort((a, b) => b.stressAvg - a.stressAvg);
  const hardByStress = new Set(byStress.slice(0, topN).map(d => d.dayKey));
  const hardByMood = new Set(byMood.slice(-topN).map(d => d.dayKey));
  const hardKeys = new Set([...hardByStress, ...hardByMood]);
  const hardDays = aggregates.filter(d => hardKeys.has(d.dayKey));

  if (bestDays.length < 3 || hardDays.length < 3) return null;

  return { bestDays, hardDays };
}

/**
 * Compute per-tag lift between best and hard days.
 * Requires ≥10 days of data and ≥3 best/hard days.
 */
export function computeTagLift(aggregates: DailyAggregate[]): TagLiftCard {
  const split = splitBestHard(aggregates);
  if (!split) {
    return { restores: [], drains: [], hasData: false, confidence: 'low', bestDayCount: 0, hardDayCount: 0 };
  }

  const { bestDays, hardDays } = split;

  // Collect all tags across all days
  const allTags = new Set<string>();
  for (const d of aggregates) {
    for (const tag of d.tagsUnion) allTags.add(tag);
  }

  const items: TagLiftResult[] = [];

  for (const tag of allTags) {
    const totalDays = aggregates.filter(d => d.tagsUnion.includes(tag)).length;
    if (totalDays < 2) continue;

    const bestRate = bestDays.filter(d => d.tagsUnion.includes(tag)).length / bestDays.length;
    const hardRate = hardDays.filter(d => d.tagsUnion.includes(tag)).length / hardDays.length;
    const lift = bestRate - hardRate;

    items.push({ tag, label: tagLabel(tag), lift, bestRate, hardRate, totalDays });
  }

  const restores = items.filter(i => i.lift > 0).sort((a, b) => b.lift - a.lift).slice(0, 5);
  const drains = items.filter(i => i.lift < 0).sort((a, b) => a.lift - b.lift).slice(0, 5);

  const taggedDays = aggregates.filter(d => d.tagsUnion.length > 0).length;

  return {
    restores,
    drains,
    hasData: restores.length > 0 || drains.length > 0,
    confidence: confidence(taggedDays),
    bestDayCount: bestDays.length,
    hardDayCount: hardDays.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2) Tag impact on averages (diff from baseline)
// ─────────────────────────────────────────────────────────────────────────────

export interface TagImpactItem {
  tag: string;
  label: string;
  /** Number of days the tag was present */
  daysPresent: number;
  /** Metric diffs: positive = higher with tag, negative = lower */
  moodDiff: number;
  energyDiff: number;
  stressDiff: number;
  /** Primary insight sentence */
  insight: string;
}

export interface TagImpactCard {
  items: TagImpactItem[];
  confidence: ConfidenceLevel;
}

/**
 * For each tag that appears on ≥5 days, compute the difference in mood/energy/stress
 * between days with that tag and days without.
 * Only report items where at least one diff has |diff| ≥ 0.5.
 */
export function computeTagImpact(aggregates: DailyAggregate[]): TagImpactCard {
  const n = aggregates.length;
  if (n < 10) return { items: [], confidence: 'low' };

  const allTags = new Set<string>();
  for (const d of aggregates) {
    for (const tag of d.tagsUnion) allTags.add(tag);
  }

  // Baseline averages (all days)
  const baseMood = mean(aggregates.map(d => d.moodAvg));
  const baseEnergy = mean(aggregates.map(d => d.energyAvg));
  const baseStress = mean(aggregates.map(d => d.stressAvg));

  const items: TagImpactItem[] = [];

  for (const tag of allTags) {
    const withTag = aggregates.filter(d => d.tagsUnion.includes(tag));
    const withoutTag = aggregates.filter(d => !d.tagsUnion.includes(tag));

    if (withTag.length < 5 || withoutTag.length < 3) continue;

    const moodWith = mean(withTag.map(d => d.moodAvg));
    const moodWithout = mean(withoutTag.map(d => d.moodAvg));
    const moodDiff = parseFloat((moodWith - moodWithout).toFixed(1));

    const energyWith = mean(withTag.map(d => d.energyAvg));
    const energyWithout = mean(withoutTag.map(d => d.energyAvg));
    const energyDiff = parseFloat((energyWith - energyWithout).toFixed(1));

    const stressWith = mean(withTag.map(d => d.stressAvg));
    const stressWithout = mean(withoutTag.map(d => d.stressAvg));
    const stressDiff = parseFloat((stressWith - stressWithout).toFixed(1));

    // Only include if at least one metric has a meaningful diff
    if (Math.abs(moodDiff) < 0.5 && Math.abs(energyDiff) < 0.5 && Math.abs(stressDiff) < 0.5) {
      continue;
    }

    // Build insight string from the most significant diff
    const label = tagLabel(tag);
    let insight: string;

    const absMood = Math.abs(moodDiff);
    const absEnergy = Math.abs(energyDiff);
    const absStress = Math.abs(stressDiff);

    if (absStress >= absMood && absStress >= absEnergy) {
      insight = stressDiff > 0
        ? `${label} days average +${stressDiff} stress.`
        : `${label} days average ${stressDiff} stress.`;
    } else if (absMood >= absEnergy) {
      insight = moodDiff > 0
        ? `${label} days average +${moodDiff} mood.`
        : `${label} days average ${moodDiff} mood.`;
    } else {
      insight = energyDiff > 0
        ? `${label} days average +${energyDiff} energy.`
        : `${label} days average ${energyDiff} energy.`;
    }

    items.push({
      tag,
      label,
      daysPresent: withTag.length,
      moodDiff,
      energyDiff,
      stressDiff,
      insight,
    });
  }

  // Sort by magnitude of most significant diff
  items.sort((a, b) => {
    const magA = Math.max(Math.abs(a.moodDiff), Math.abs(a.energyDiff), Math.abs(a.stressDiff));
    const magB = Math.max(Math.abs(b.moodDiff), Math.abs(b.energyDiff), Math.abs(b.stressDiff));
    return magB - magA;
  });

  const taggedDays = aggregates.filter(d => d.tagsUnion.length > 0).length;

  return {
    items: items.slice(0, 8),
    confidence: confidence(taggedDays),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3) Co-occurrence patterns (tag pairs)
// ─────────────────────────────────────────────────────────────────────────────

export interface TagPairResult {
  tagA: string;
  tagB: string;
  labelA: string;
  labelB: string;
  /** Number of days both tags appear */
  coOccurrDays: number;
  /** Average mood on co-occurrence days */
  moodAvg: number;
  /** Average energy on co-occurrence days */
  energyAvg: number;
  /** Average stress on co-occurrence days */
  stressAvg: number;
  /** Diff from baseline mood */
  moodDiff: number;
  /** Diff from baseline stress */
  stressDiff: number;
  /** Insight sentence */
  insight: string;
}

export interface TagPairCard {
  positivePairs: TagPairResult[];
  negativePairs: TagPairResult[];
  hasData: boolean;
  confidence: ConfidenceLevel;
}

/**
 * Compute co-occurrence patterns for tag pairs that appear together on ≥4 days.
 * Compares mood/stress on pair days vs overall baseline.
 */
export function computeTagPairs(aggregates: DailyAggregate[]): TagPairCard {
  const n = aggregates.length;
  if (n < 14) return { positivePairs: [], negativePairs: [], hasData: false, confidence: 'low' };

  const baseMood = mean(aggregates.map(d => d.moodAvg));
  const baseStress = mean(aggregates.map(d => d.stressAvg));
  const baseEnergy = mean(aggregates.map(d => d.energyAvg));

  // Collect all unique tags
  const allTags: string[] = [];
  const tagSet = new Set<string>();
  for (const d of aggregates) {
    for (const tag of d.tagsUnion) {
      if (!tagSet.has(tag)) { tagSet.add(tag); allTags.push(tag); }
    }
  }

  const results: TagPairResult[] = [];

  // Check all pairs
  for (let i = 0; i < allTags.length; i++) {
    for (let j = i + 1; j < allTags.length; j++) {
      const tagA = allTags[i];
      const tagB = allTags[j];

      const pairDays = aggregates.filter(
        d => d.tagsUnion.includes(tagA) && d.tagsUnion.includes(tagB),
      );

      if (pairDays.length < 4) continue;

      const pairMood = mean(pairDays.map(d => d.moodAvg));
      const pairStress = mean(pairDays.map(d => d.stressAvg));
      const pairEnergy = mean(pairDays.map(d => d.energyAvg));

      const moodDiff = parseFloat((pairMood - baseMood).toFixed(1));
      const stressDiff = parseFloat((pairStress - baseStress).toFixed(1));

      // Only include if meaningful diff
      if (Math.abs(moodDiff) < 0.5 && Math.abs(stressDiff) < 0.5) continue;

      const labelA = tagLabel(tagA);
      const labelB = tagLabel(tagB);

      let insight: string;
      if (Math.abs(stressDiff) >= Math.abs(moodDiff)) {
        insight = stressDiff > 0
          ? `${labelA} + ${labelB} days tend to be your highest stress combination.`
          : `${labelA} + ${labelB} days correlate with lower stress.`;
      } else {
        insight = moodDiff > 0
          ? `${labelA} + ${labelB} days correlate with higher mood.`
          : `${labelA} + ${labelB} days tend to pull mood lower.`;
      }

      results.push({
        tagA, tagB, labelA, labelB,
        coOccurrDays: pairDays.length,
        moodAvg: parseFloat(pairMood.toFixed(1)),
        energyAvg: parseFloat(pairEnergy.toFixed(1)),
        stressAvg: parseFloat(pairStress.toFixed(1)),
        moodDiff,
        stressDiff,
        insight,
      });
    }
  }

  // Split into positive (mood lift or stress reduction) and negative
  const positive = results
    .filter(r => r.moodDiff > 0.3 || r.stressDiff < -0.3)
    .sort((a, b) => (b.moodDiff - b.stressDiff) - (a.moodDiff - a.stressDiff))
    .slice(0, 3);

  const negative = results
    .filter(r => r.stressDiff > 0.3 || r.moodDiff < -0.3)
    .sort((a, b) => (b.stressDiff - b.moodDiff) - (a.stressDiff - a.moodDiff))
    .slice(0, 3);

  const taggedDays = aggregates.filter(d => d.tagsUnion.length > 0).length;

  return {
    positivePairs: positive,
    negativePairs: negative,
    hasData: positive.length > 0 || negative.length > 0,
    confidence: confidence(taggedDays),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4) Trigger vs restorer classification
// ─────────────────────────────────────────────────────────────────────────────

export type TagClassification = 'restorer' | 'drainer' | 'neutral';

export interface ClassifiedTag {
  tag: string;
  label: string;
  classification: TagClassification;
  /** Lift from best/hard day analysis */
  lift: number;
  /** Mood diff from baseline */
  moodDiff: number;
  /** Stress diff from baseline */
  stressDiff: number;
  /** Energy diff from baseline */
  energyDiff: number;
  /** Days the tag appeared */
  totalDays: number;
  /** Why it was classified this way */
  reason: string;
}

export interface TagClassificationCard {
  restorers: ClassifiedTag[];
  drainers: ClassifiedTag[];
  neutral: ClassifiedTag[];
  confidence: ConfidenceLevel;
}

/**
 * Classify tags as restorer, drainer, or neutral using both
 * lift (best/hard day analysis) and impact diffs (baseline comparison).
 *
 * Restorer if: lift >= +0.2 AND (diffMood >= +0.5 OR diffStress <= -0.5)
 * Drainer if:  lift <= -0.2 AND (diffStress >= +0.5 OR diffMood <= -0.5)
 * Neutral otherwise
 */
export function classifyTags(
  aggregates: DailyAggregate[],
  liftCard: TagLiftCard,
  impactCard: TagImpactCard,
): TagClassificationCard {
  const n = aggregates.length;
  if (n < 10) return { restorers: [], drainers: [], neutral: [], confidence: 'low' };

  // Build lookup maps
  const liftMap = new Map<string, TagLiftResult>();
  for (const item of [...liftCard.restores, ...liftCard.drains]) {
    liftMap.set(item.tag, item);
  }

  const impactMap = new Map<string, TagImpactItem>();
  for (const item of impactCard.items) {
    impactMap.set(item.tag, item);
  }

  // Union of all tags that appear in either analysis
  const allTags = new Set<string>();
  for (const d of aggregates) {
    for (const tag of d.tagsUnion) allTags.add(tag);
  }

  const restorers: ClassifiedTag[] = [];
  const drainers: ClassifiedTag[] = [];
  const neutral: ClassifiedTag[] = [];

  for (const tag of allTags) {
    const totalDays = aggregates.filter(d => d.tagsUnion.includes(tag)).length;
    if (totalDays < 3) continue;

    const liftItem = liftMap.get(tag);
    const impactItem = impactMap.get(tag);

    const lift = liftItem?.lift ?? 0;
    const moodDiff = impactItem?.moodDiff ?? 0;
    const stressDiff = impactItem?.stressDiff ?? 0;
    const energyDiff = impactItem?.energyDiff ?? 0;

    const label = tagLabel(tag);

    const isRestorer = lift >= 0.2 && (moodDiff >= 0.5 || stressDiff <= -0.5);
    const isDrainer = lift <= -0.2 && (stressDiff >= 0.5 || moodDiff <= -0.5);

    let classification: TagClassification;
    let reason: string;

    if (isRestorer) {
      classification = 'restorer';
      const parts: string[] = [];
      if (moodDiff >= 0.5) parts.push(`+${moodDiff} mood`);
      if (stressDiff <= -0.5) parts.push(`${stressDiff} stress`);
      reason = `Lift ${lift > 0 ? '+' : ''}${(lift * 100).toFixed(0)}% on best days · ${parts.join(', ')}`;
    } else if (isDrainer) {
      classification = 'drainer';
      const parts: string[] = [];
      if (stressDiff >= 0.5) parts.push(`+${stressDiff} stress`);
      if (moodDiff <= -0.5) parts.push(`${moodDiff} mood`);
      reason = `Lift ${(lift * 100).toFixed(0)}% on best days · ${parts.join(', ')}`;
    } else {
      classification = 'neutral';
      reason = 'No strong one-way pattern yet';
    }

    const item: ClassifiedTag = {
      tag, label, classification, lift, moodDiff, stressDiff, energyDiff, totalDays, reason,
    };

    if (classification === 'restorer') restorers.push(item);
    else if (classification === 'drainer') drainers.push(item);
    else neutral.push(item);
  }

  // Sort by impact magnitude
  restorers.sort((a, b) => (b.moodDiff - b.stressDiff) - (a.moodDiff - a.stressDiff));
  drainers.sort((a, b) => (b.stressDiff - b.moodDiff) - (a.stressDiff - a.moodDiff));
  neutral.sort((a, b) => b.totalDays - a.totalDays);

  const taggedDays = aggregates.filter(d => d.tagsUnion.length > 0).length;

  return {
    restorers: restorers.slice(0, 5),
    drainers: drainers.slice(0, 5),
    neutral: neutral.slice(0, 5),
    confidence: confidence(taggedDays),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-system: Tag + Journal keyword agreement
// ─────────────────────────────────────────────────────────────────────────────

export interface TagJournalAgreement {
  tag: string;
  label: string;
  /** Keywords from journal that co-occur with this tag */
  matchingKeywords: string[];
  /** How many days both tag and ≥1 matching keyword appear */
  agreementDays: number;
  /** Confidence boost (true = both signals agree) */
  supported: boolean;
  insight: string;
}

/**
 * Map of tags to their relevant journal keywords.
 * If the tag is selected AND the journal keywords include matching words,
 * confidence in that signal increases.
 */
const TAG_KEYWORD_MAP: Record<string, string[]> = {
  conflict: ['argue', 'argument', 'fight', 'tense', 'tension', 'hurt', 'angry', 'disagree', 'frustrat'],
  sleep: ['sleep', 'slept', 'tired', 'rest', 'insomnia', 'nap', 'exhaust', 'fatigue'],
  work: ['work', 'job', 'office', 'meeting', 'deadline', 'project', 'boss', 'colleague', 'client'],
  social: ['friends', 'friend', 'social', 'party', 'gathering', 'hangout', 'group', 'people'],
  movement: ['walk', 'run', 'exercise', 'gym', 'yoga', 'hike', 'workout', 'swim', 'bike', 'stretch'],
  nature: ['nature', 'outside', 'outdoors', 'park', 'garden', 'trees', 'walk', 'hike', 'beach', 'forest'],
  screens: ['screen', 'phone', 'scroll', 'social media', 'doomscroll', 'netflix', 'binge', 'online'],
  finances: ['money', 'bills', 'budget', 'debt', 'spend', 'financial', 'expense', 'cost', 'pay'],
  kids: ['kids', 'child', 'children', 'parenting', 'school', 'homework', 'daycare', 'baby'],
  substances: ['drink', 'alcohol', 'weed', 'smoke', 'high', 'hangover', 'sober'],
  intimacy: ['intimacy', 'intimate', 'connect', 'close', 'love', 'partner', 'sex', 'affection'],
  relationships: ['relationship', 'partner', 'spouse', 'love', 'connect', 'together'],
  health: ['doctor', 'pain', 'sick', 'headache', 'symptom', 'meds', 'medication', 'health'],
  food: ['food', 'eat', 'meal', 'cook', 'breakfast', 'lunch', 'dinner', 'snack', 'diet'],
  alone_time: ['alone', 'solitude', 'quiet', 'space', 'myself', 'solo'],
  productivity: ['productive', 'accomplish', 'achieve', 'done', 'finish', 'complete', 'task', 'todo'],
};

/**
 * Check agreement between tags chosen and journal keywords written the same day.
 * Increases insight confidence when both signals align.
 */
export function computeTagJournalAgreement(
  aggregates: DailyAggregate[],
): TagJournalAgreement[] {
  const results: TagJournalAgreement[] = [];

  // Only look at days that have both tags and journal keywords
  const dualDays = aggregates.filter(
    d => d.tagsUnion.length > 0 && d.keywordsUnion.length > 0,
  );

  if (dualDays.length < 3) return results;

  const allTags = new Set<string>();
  for (const d of dualDays) {
    for (const tag of d.tagsUnion) allTags.add(tag);
  }

  for (const tag of allTags) {
    const relevantKeywords = TAG_KEYWORD_MAP[tag];
    if (!relevantKeywords) continue;

    const tagDaysWithKeywords = dualDays.filter(d => {
      if (!d.tagsUnion.includes(tag)) return false;
      const joined = d.keywordsUnion.join(' ').toLowerCase();
      return relevantKeywords.some(kw => joined.includes(kw));
    });

    if (tagDaysWithKeywords.length < 2) continue;

    // Which keywords actually matched?
    const foundKeywords = new Set<string>();
    for (const d of tagDaysWithKeywords) {
      const joined = d.keywordsUnion.join(' ').toLowerCase();
      for (const kw of relevantKeywords) {
        if (joined.includes(kw)) foundKeywords.add(kw);
      }
    }

    const tagTotalDays = dualDays.filter(d => d.tagsUnion.includes(tag)).length;
    const agreementRate = tagDaysWithKeywords.length / tagTotalDays;

    const label = tagLabel(tag);

    results.push({
      tag,
      label,
      matchingKeywords: [...foundKeywords].slice(0, 4),
      agreementDays: tagDaysWithKeywords.length,
      supported: agreementRate >= 0.5,
      insight: agreementRate >= 0.5
        ? `Your journal confirms ${label.toLowerCase()} — keywords like "${[...foundKeywords].slice(0, 2).join('", "')}" appear on ${tagDaysWithKeywords.length} of ${tagTotalDays} tagged days.`
        : `${label} is tagged but your writing doesn't always echo it — the tag may capture something beyond words.`,
    });
  }

  return results.sort((a, b) => b.agreementDays - a.agreementDays).slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-system: Tag + Chart agreement (blended)
// ─────────────────────────────────────────────────────────────────────────────

export interface TagChartAgreement {
  tag: string;
  label: string;
  chartConnection: string;
  insight: string;
  confidence: ConfidenceLevel;
}

/**
 * Check if tags that the user's data supports as restorers/drainers also
 * align with their natal chart profile. E.g.:
 * - "Alone time" restorer + Moon in 12th house = "Your data and chart both support solitude as restorative"
 * - "Movement" restorer + Fire dominant = "Your Fire chart and behavior both point to movement as your reset"
 */
export function computeTagChartAgreement(
  classifiedCard: TagClassificationCard,
  profile: ChartProfile | null,
): TagChartAgreement[] {
  if (!profile) return [];

  const results: TagChartAgreement[] = [];
  const conf = classifiedCard.confidence;

  // Map of tag → element/house connections
  const chartConnections: Record<string, (p: ChartProfile) => string | null> = {
    alone_time: (p) => {
      if (p.moonHouse === 12) return 'Your Moon in the 12th house needs solitude to recharge';
      if (p.has12thHouseEmphasis) return 'Your 12th house emphasis makes solitude essential';
      if (p.dominantElement === 'Water') return 'Your Water-dominant chart processes through reflection and quiet';
      return null;
    },
    movement: (p) => {
      if (p.dominantElement === 'Fire') return 'Your Fire-dominant chart resets through action and movement';
      if (p.dominantModality === 'Cardinal') return 'Your Cardinal modality thrives on initiative and motion';
      return null;
    },
    nature: (p) => {
      if (p.dominantElement === 'Earth') return 'Your Earth-dominant chart finds grounding in the physical world';
      if (p.moonHouse === 4) return 'Your 4th house Moon connects emotional safety to natural environments';
      return null;
    },
    social: (p) => {
      if (p.moonHouse === 7 || p.moonHouse === 11) return `Your Moon in the ${p.moonHouse}th house finds regulation through connection`;
      if (p.dominantElement === 'Air') return 'Your Air-dominant chart processes through dialogue and relationship';
      return null;
    },
    routine: (p) => {
      if (p.dominantElement === 'Earth') return 'Your Earth-dominant chart stabilizes through consistent structure';
      if (p.has6thHouseEmphasis) return 'Your 6th house emphasis makes daily rhythm foundational';
      return null;
    },
    rest: (p) => {
      if (p.moonHouse === 12) return 'Your 12th house Moon needs genuine downtime to function';
      if (p.has12thHouseEmphasis) return 'Your 12th house emphasis makes rest non-negotiable';
      return null;
    },
    creative: (p) => {
      if (p.moonHouse === 5) return 'Your 5th house Moon needs creative expression as emotional outlet';
      if (p.dominantElement === 'Fire') return 'Your Fire chart finds release through creative action';
      return null;
    },
    conflict: (p) => {
      if (p.dominantElement === 'Water') return 'Your Water-dominant chart absorbs conflict more deeply than most';
      if (p.moonHouse === 7) return 'Your 7th house Moon is especially affected by relational discord';
      return null;
    },
    screens: (p) => {
      if (p.has12thHouseEmphasis || p.moonHouse === 12) return 'Your 12th house emphasis is particularly sensitive to overstimulation';
      if (p.dominantElement === 'Water') return 'Your Water-dominant chart absorbs screen content more intensely';
      return null;
    },
    sleep: (p) => {
      if (p.has6thHouseEmphasis) return 'Your 6th house emphasis links health routines directly to your baseline';
      if (p.dominantElement === 'Earth') return 'Your Earth-dominant chart relies on physical rhythm and rest quality';
      return null;
    },
    work: (p) => {
      if (p.saturnHouse === 10) return 'Your Saturn in the 10th house gives career a central role in your sense of purpose';
      if (p.moonHouse === 6) return 'Your 6th house Moon ties emotional health to work satisfaction';
      return null;
    },
  };

  const allClassified = [...classifiedCard.restorers, ...classifiedCard.drainers];

  for (const classified of allClassified) {
    const connectFn = chartConnections[classified.tag];
    if (!connectFn) continue;

    const connection = connectFn(profile);
    if (!connection) continue;

    const action = classified.classification === 'restorer' ? 'restorative' : 'draining';

    results.push({
      tag: classified.tag,
      label: classified.label,
      chartConnection: connection,
      insight: `Your data and your chart both support ${classified.label.toLowerCase()} as ${action}. ${connection}.`,
      confidence: conf,
    });
  }

  return results.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// Full Tag Analytics Bundle
// ─────────────────────────────────────────────────────────────────────────────

export interface TagAnalyticsBundle {
  /** 1) Best vs hard day lift */
  tagLift: TagLiftCard;
  /** 2) Tag impact on averages */
  tagImpact: TagImpactCard;
  /** 3) Tag pair co-occurrence */
  tagPairs: TagPairCard;
  /** 4) Restorer/drainer/neutral classification */
  classification: TagClassificationCard;
  /** Cross-system: tag + journal keyword agreement */
  journalAgreement: TagJournalAgreement[];
  /** Cross-system: tag + chart synergy */
  chartAgreement: TagChartAgreement[];
  /** Overall confidence */
  confidence: ConfidenceLevel;
  /** Total days with ≥1 tag */
  taggedDays: number;
  /** Total unique tags seen */
  uniqueTags: number;
}

/**
 * Compute the full tag analytics bundle from daily aggregates.
 * Main entry point for the tag analytics engine.
 */
export function computeTagAnalytics(
  aggregates: DailyAggregate[],
  profile: ChartProfile | null,
): TagAnalyticsBundle {
  const tagLift = computeTagLift(aggregates);
  const tagImpact = computeTagImpact(aggregates);
  const tagPairs = computeTagPairs(aggregates);
  const classification = classifyTags(aggregates, tagLift, tagImpact);
  const journalAgreement = computeTagJournalAgreement(aggregates);
  const chartAgreement = computeTagChartAgreement(classification, profile);

  const taggedDays = aggregates.filter(d => d.tagsUnion.length > 0).length;
  const uniqueTags = new Set(aggregates.flatMap(d => d.tagsUnion)).size;

  return {
    tagLift,
    tagImpact,
    tagPairs,
    classification,
    journalAgreement,
    chartAgreement,
    confidence: confidence(taggedDays),
    taggedDays,
    uniqueTags,
  };
}
