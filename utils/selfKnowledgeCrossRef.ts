/**
 * Self-Knowledge Cross-Reference Engine
 *
 * Pure functions — no I/O, no side effects.
 * Takes a SelfKnowledgeContext (AsyncStorage profile data) + raw check-ins
 * (behavioral data) and returns CrossRefInsight[] — personalized observations
 * that connect what the user knows about themselves to how they actually show up.
 *
 * Cross-references computed:
 *  1. Trigger drains × check-in tag lift  (data-confirmed when ≥3 tagged days)
 *  2. Trigger restores × check-in tag lift (data-confirmed when ≥3 tagged days)
 *  3. Most frequent somatic region + emotion  (cross-ref with high-stress days)
 *  4. Archetype shadow reminder  (personalized by high-stress day percentage)
 *  5. Relationship patterns × relational check-in tag impact
 *  6. Core values reflection  (personalized if hard days exist)
 *  7. Cognitive style workflow note  (profile observation, always shown)
 *
 * Minimum data requirements:
 *  - Tag cross-refs: ≥5 total check-ins, ≥3 days with the matched tag
 *  - Somatic: ≥3 entries
 *  - Pattern cross-refs: ≥7 check-ins for percentage qualifications
 *  - Profile observations: no check-in minimum (always shown if profile exists)
 */

import {
  SelfKnowledgeContext,
  ArchetypeKey,
  DailyReflectionSummary,
  JournalSummary,
  DreamSummary,
} from '../services/insights/selfKnowledgeContext';
import { DailyCheckIn } from '../services/patterns/types';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface CrossRefInsight {
  id: string;
  title: string;
  body: string;
  /** Accent color key — map against your palette in the UI layer */
  accentColor: 'gold' | 'emerald' | 'silverBlue' | 'copper' | 'rose' | 'lavender';
  source: 'triggers' | 'somatic' | 'archetype' | 'values' | 'cognitive' | 'relationship' | 'reflection';
  /**
   * true  → insight is confirmed by behavioral check-in data
   * false → insight is a profile reflection (still valuable, not data-backed)
   */
  isConfirmed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag mapping tables
// Maps user-typed trigger strings (canonical suggestions + common variants)
// to check-in ThemeTag values.  Lookup is case-insensitive (keys are lowercase).
// ─────────────────────────────────────────────────────────────────────────────

export const DRAIN_TAG_MAP: Record<string, string> = {
  'conflict':                      'conflict',
  'over-stimulation':              'overstimulated',
  'overstimulation':               'overstimulated',
  'screens late at night':         'screens',
  'screens':                       'screens',
  'isolation':                     'alone_time',
  'people-pleasing':               'relationships',
  'comparison':                    'confidence',
  'rushing':                       'overwhelm',
  'unfinished tasks':              'productivity',
  'saying yes when i mean no':     'boundaries',
  'uncertainty':                   'anxiety',
  'anxiety':                       'anxiety',
};

export const RESTORE_TAG_MAP: Record<string, string> = {
  'movement':                      'movement',
  'time in nature':                'nature',
  'nature':                        'nature',
  'creative work':                 'creative',
  'creativity':                    'creative',
  'solitude':                      'alone_time',
  'alone time':                    'alone_time',
  'meaningful conversation':       'social',
  'social':                        'social',
  'cooking':                       'food',
  'setting a boundary':            'boundaries',
  'deep sleep':                    'sleep',
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function resolveTag(text: string, map: Record<string, string>): string | null {
  return map[text.toLowerCase()] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1 & 2. Trigger × Tag Cross-Reference
// ─────────────────────────────────────────────────────────────────────────────

function buildTriggerInsights(
  triggers: NonNullable<SelfKnowledgeContext['triggers']>,
  checkIns: DailyCheckIn[],
): CrossRefInsight[] {
  if (checkIns.length < 5) return [];

  const allMoods = checkIns.map(c => c.moodScore).filter((v): v is number => v != null);
  if (!allMoods.length) return [];
  const overallAvg = avg(allMoods);

  const results: CrossRefInsight[] = [];

  const process = (items: string[], map: Record<string, string>, isDrain: boolean) => {
    for (const item of items) {
      if (results.length >= 3) break;

      const tag = resolveTag(item, map);
      if (!tag) continue;

      const tagged = checkIns.filter(
        c => c.tags.includes(tag as string & {}) && c.moodScore != null,
      );
      if (tagged.length < 3) continue;

      const tagAvg = avg(tagged.map(c => c.moodScore as number));
      const diff = tagAvg - overallAvg;

      // Drains should lower mood (diff ≤ −0.4); restores should raise it (diff ≥ +0.4)
      if (isDrain && diff >= -0.4) continue;
      if (!isDrain && diff <= 0.4) continue;

      results.push({
        id: `trigger-${tag}-${isDrain ? 'd' : 'r'}`,
        title: isDrain ? `"${item}" Confirmed as a Drain` : `"${item}" Confirmed as a Restore`,
        body: isDrain
          ? `You listed this as a drain. On the ${tagged.length} check-in days associated with "${tag.replace(/_/g, ' ')}", your mood averaged ${tagAvg.toFixed(1)} — ${Math.abs(diff).toFixed(1)} points lower than your ${overallAvg.toFixed(1)} baseline. Your self-knowledge and your data agree.`
          : `You listed this as a restore. On the ${tagged.length} check-in days associated with "${tag.replace(/_/g, ' ')}", your mood averaged ${tagAvg.toFixed(1)} — ${diff.toFixed(1)} points above your ${overallAvg.toFixed(1)} baseline. Your self-knowledge and your data agree.`,
        accentColor: isDrain ? 'copper' : 'emerald',
        source: 'triggers',
        isConfirmed: true,
      });
    }
  };

  // Restores first (positive framing leads)
  process(triggers.restores, RESTORE_TAG_MAP, false);
  process(triggers.drains, DRAIN_TAG_MAP, true);

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Somatic Pattern
// ─────────────────────────────────────────────────────────────────────────────

const REGION_LABELS: Record<string, string> = {
  head:   'head & mind',
  throat: 'throat & jaw',
  chest:  'chest & heart',
  gut:    'gut & belly',
  back:   'back & spine',
  limbs:  'hands & legs',
};

function buildSomaticInsight(
  entries: SelfKnowledgeContext['somaticEntries'],
  checkIns: DailyCheckIn[],
): CrossRefInsight | null {
  if (entries.length < 3) return null;

  // Most frequent region
  const regionCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};
  for (const e of entries) {
    regionCounts[e.region] = (regionCounts[e.region] ?? 0) + 1;
    emotionCounts[e.emotion] = (emotionCounts[e.emotion] ?? 0) + 1;
  }

  const sortedRegions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);
  const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
  if (!sortedRegions.length || !sortedEmotions.length) return null;
  const [topRegionId, topRegionCount] = sortedRegions[0];
  const [topEmotion, topEmotionCount] = sortedEmotions[0];
  const regionLabel = REGION_LABELS[topRegionId] ?? topRegionId;

  // Cross-ref: how many somatic entry days overlap with high-stress check-in days?
  let crossNote = '';
  let isConfirmed = false;
  if (checkIns.length >= 5) {
    const highStressDates = new Set(
      checkIns.filter(c => c.stressLevel === 'high').map(c => c.date),
    );
    const somaticDates = entries.map(e => e.date.slice(0, 10));
    const overlap = somaticDates.filter(d => highStressDates.has(d)).length;
    if (overlap >= 2 && overlap / entries.length >= 0.4) {
      crossNote = ` ${overlap} of these entries coincided with high-stress days in your check-in data.`;
      isConfirmed = true;
    }
  }

  return {
    id: 'somatic-dominant',
    title: 'Body Awareness Pattern',
    body: `You've logged ${entries.length} somatic sensations. ${topEmotion} appears most often (${topEmotionCount}×), primarily in your ${regionLabel} (${topRegionCount}×).${crossNote} Mapping where emotion lives in your body builds the capacity to work with it — not just think about it.`,
    accentColor: 'silverBlue',
    source: 'somatic',
    isConfirmed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Archetype Shadow
// ─────────────────────────────────────────────────────────────────────────────

const ARCHETYPE_SHADOWS: Record<ArchetypeKey, { title: string; body: string }> = {
  hero: {
    title: 'The Hero Under Pressure',
    body: 'Your dominant pattern is The Hero — driven to overcome and prove strength. The shadow to watch: striving harder when rest is what your system actually needs. On high-load days, strategic recovery is the most courageous move.',
  },
  caregiver: {
    title: 'The Caregiver Under Pressure',
    body: 'Your dominant pattern is The Caregiver — moving through the world by nurturing others. The shadow to watch: over-giving until quietly depleted. On hard days, ask honestly: who is taking care of you?',
  },
  seeker: {
    title: 'The Seeker Under Pressure',
    body: 'Your dominant pattern is The Seeker — craving discovery, freedom, and new horizons. The shadow to watch: seeking movement or escape when presence might matter most. Restlessness can delay what stillness would reveal.',
  },
  sage: {
    title: 'The Sage Under Pressure',
    body: 'Your dominant pattern is The Sage — seeking truth and understanding above all. The shadow to watch: over-analyzing when the answer lives below thought. On heavy days, feeling through it may matter more than figuring it out.',
  },
  rebel: {
    title: 'The Rebel Under Pressure',
    body: 'Your dominant pattern is The Rebel — questioning structures and catalyzing change. The shadow to watch: resistance as a stress response — fighting what feels constraining, even when it isn\'t. Discernment protects your energy better than friction does.',
  },
};

function buildArchetypeInsight(
  profile: NonNullable<SelfKnowledgeContext['archetypeProfile']>,
  checkIns: DailyCheckIn[],
): CrossRefInsight {
  const shadow = ARCHETYPE_SHADOWS[profile.dominant];
  let contextNote = '';
  let isConfirmed = false;

  if (checkIns.length >= 7) {
    const highStressCount = checkIns.filter(c => c.stressLevel === 'high').length;
    const pct = Math.round((highStressCount / checkIns.length) * 100);
    if (pct >= 30) {
      contextNote = ` Your recent check-ins show ${pct}% high-stress days — a useful moment to notice how this pattern tends to activate.`;
      isConfirmed = true;
    }
  }

  return {
    id: 'archetype-shadow',
    title: shadow.title,
    body: shadow.body + contextNote,
    accentColor: 'lavender',
    source: 'archetype',
    isConfirmed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Relational Mirror × Relational Check-In Tag Impact
// ─────────────────────────────────────────────────────────────────────────────

// Maps tag IDs (new format) to human-readable labels.
// Falls through to raw string for backward-compat with legacy label-based entries.
const PATTERN_TAG_LABELS: Record<string, string> = {
  t1: 'People-pleasing',
  t2: 'Fear of abandonment',
  t3: 'Rushing intimacy',
  t4: 'Caretaking others',
  t5: 'Over-explaining',
  t6: 'Avoidant when close',
  t7: 'Emotional withdrawal',
  t8: 'Hyper-independence',
  t9: 'Shutting down',
  t10: 'Fear of enmeshment',
  t11: 'Need for control',
  t12: 'Difficulty with boundaries',
  t13: 'Testing the relationship',
  t14: 'Perfectionism in love',
  s1: 'Asking for reassurance directly',
  s2: 'Expressing needs clearly',
  s3: 'Letting myself be seen',
  s4: 'Staying present in connection',
  s5: 'Receiving care without deflecting',
  s6: 'Holding boundaries calmly',
  s7: 'Repairing after disconnection',
  s8: 'Self-soothing instead of spiraling',
  s9: 'Tolerating uncertainty',
  s10: 'Staying open instead of shutting down',
};

function resolveTagLabel(tag: string): string {
  return PATTERN_TAG_LABELS[tag] ?? tag;
}

const RELATIONAL_TAGS = ['relationships', 'conflict', 'anxiety', 'loneliness', 'social', 'intimacy', 'boundaries'];

function buildRelationshipInsight(
  entries: SelfKnowledgeContext['relationshipPatterns'],
  checkIns: DailyCheckIn[],
): CrossRefInsight | null {
  if (entries.length < 2) return null;

  // Frequency of each pattern tag — separate secure (s*) from struggle (t*)
  const tagCounts: Record<string, number> = {};
  const secureTagCounts: Record<string, number> = {};
  const SECURE_IDS = new Set(['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10']);
  for (const e of entries) {
    for (const t of e.tags) {
      if (SECURE_IDS.has(t)) secureTagCounts[t] = (secureTagCounts[t] ?? 0) + 1;
      else tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  const topSecureTags = Object.entries(secureTagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1);

  // Cross-ref: mood on days with relational check-in tags vs overall
  let checkInNote = '';
  let isConfirmed = false;
  if (checkIns.length >= 7) {
    const relDays = checkIns.filter(c => c.tags.some(t => RELATIONAL_TAGS.includes(t)));
    if (relDays.length >= 3) {
      const relMoods = relDays.map(c => c.moodScore).filter((v): v is number => v != null);
      const allMoods = checkIns.map(c => c.moodScore).filter((v): v is number => v != null);
      if (relMoods.length >= 3 && allMoods.length >= 5) {
        const relAvg = avg(relMoods);
        const overallAvg = avg(allMoods);
        const impact = relAvg - overallAvg;
        if (Math.abs(impact) >= 0.4) {
          const dir = impact < 0 ? 'lower' : 'higher';
          checkInNote = ` On days your check-ins include relational themes, your mood runs ${Math.abs(impact).toFixed(1)} points ${dir} than your baseline — worth exploring what drives that.`;
          isConfirmed = true;
        }
      }
    }
  }

  const topLabel = topTags.length > 0
    ? ` Your most recurring ${topTags.length > 1 ? 'patterns are' : 'pattern is'} ${topTags.map(([t]) => `"${resolveTagLabel(t)}"`).join(' and ')}.`
    : '';
  const secureLabel = topSecureTags.length > 0
    ? ` You are also logging secure behavior — "${resolveTagLabel(topSecureTags[0][0])}" — evidence of real integration.`
    : '';

  return {
    id: 'relationship-pattern',
    title: 'Your Relational Mirror',
    body: `You've logged ${entries.length} reflections on how you show up in connection.${topLabel}${secureLabel}${checkInNote} Recognizing your own patterns is what makes conscious choice possible.`,
    accentColor: 'rose',
    source: 'relationship',
    isConfirmed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Core Values Under Pressure
// ─────────────────────────────────────────────────────────────────────────────

function buildValuesInsight(
  values: NonNullable<SelfKnowledgeContext['coreValues']>,
  checkIns: DailyCheckIn[],
): CrossRefInsight | null {
  if (values.topFive.length < 2) return null;

  const topList = values.topFive.slice(0, 3).join(', ');
  let hardDayNote = '';
  let isConfirmed = false;

  if (checkIns.length >= 7) {
    const allMoods = checkIns.map(c => c.moodScore).filter((v): v is number => v != null);
    const overallAvg = avg(allMoods);
    const hardDays = allMoods.filter(m => m < overallAvg - 1).length;
    if (hardDays >= 2) {
      hardDayNote = ` You've had ${hardDays} harder days recently. These are often where a core value feels restricted — tracing back to which one can cut through the noise faster than analysis.`;
      isConfirmed = true;
    }
  }

  return {
    id: 'values-pressure',
    title: 'Your Core Values in Practice',
    body: `Your top values are ${topList}.${hardDayNote} When you feel stuck or heavy, asking "which value is being constrained right now?" often surfaces the real issue.`,
    accentColor: 'gold',
    source: 'values',
    isConfirmed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Cognitive Style Workflow Note
// ─────────────────────────────────────────────────────────────────────────────

const COGNITIVE_NOTES: Record<string, string> = {
  'big-picture+quick-intuitive':
    'You absorb context quickly and trust first impressions. Protect that initial clarity — detail-creep tends to dull your strongest instincts.',
  'big-picture+careful-deliberate':
    'You see the whole picture but commit slowly. Your best decisions come after sitting with options. Protect deliberate reflection time from being crowded out.',
  'big-picture+adaptive':
    'You think in patterns and shift strategy fluidly. Brief notes capture insights before they evaporate into the next context switch.',
  'detail-oriented+quick-intuitive':
    'You notice what others miss and often know immediately what it means. Your synthesis speed is unusual — trust it even when the details are still incomplete.',
  'detail-oriented+careful-deliberate':
    'You\'re thorough and precise before committing. Batch deep-focus work into protected blocks — this is where your highest-quality thinking happens.',
  'detail-oriented+adaptive':
    'You combine precision with flexibility. Breaking complex problems into phases — explore, then commit — uses your natural style fully.',
  'balanced+quick-intuitive':
    'You adapt to frameworks quickly and move decisively. Build in a brief pause between decision and action to distinguish gut-knowing from urgency.',
  'balanced+careful-deliberate':
    'You bring a measured, flexible approach to choices. Separating an explore-phase from a commit-phase lets you use this style without getting stuck.',
  'balanced+adaptive':
    'Your cognitive style flexes with context. Periodically checking whether you\'re acting from intuition or analysis in a given moment keeps decisions intentional.',
};

function buildCognitiveInsight(scores: NonNullable<SelfKnowledgeContext['cognitiveStyle']>): CrossRefInsight {
  const scope = scores.scope <= 2 ? 'big-picture' : scores.scope >= 4 ? 'detail-oriented' : 'balanced';
  const dec  = scores.decisions <= 2 ? 'quick-intuitive' : scores.decisions >= 4 ? 'careful-deliberate' : 'adaptive';

  const key  = `${scope}+${dec}`;
  const note = COGNITIVE_NOTES[key]
    ?? `Your ${scope} thinking style combined with a ${dec} decision approach shapes where your best work happens. Design your environment around it.`;

  return {
    id: 'cognitive-workflow',
    title: 'Your Cognitive Style in Practice',
    body: note,
    accentColor: 'silverBlue',
    source: 'cognitive',
    isConfirmed: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Daily Reflection Depth
// ─────────────────────────────────────────────────────────────────────────────

function buildReflectionInsight(
  summary: DailyReflectionSummary,
  checkIns: DailyCheckIn[],
): CrossRefInsight | null {
  if (summary.totalDays < 3) return null;

  const pct = Math.round((summary.totalDays / 365) * 100);
  const dominantCategory = (
    Object.entries(summary.byCategory) as [string, number][]
  ).sort((a, b) => b[1] - a[1])[0];

  let crossNote = '';
  let isConfirmed = false;

  // Cross-ref: compare mood on reflection days vs non-reflection days
  // Uses ALL reflection dates (not just recent answers) for accurate comparison
  if (checkIns.length >= 7 && summary.reflectionDates.length >= 5) {
    const reflectionDates = new Set(summary.reflectionDates);
    const reflectionDayMoods = checkIns
      .filter(c => reflectionDates.has(c.date) && c.moodScore != null)
      .map(c => c.moodScore as number);
    const nonReflectionMoods = checkIns
      .filter(c => !reflectionDates.has(c.date) && c.moodScore != null)
      .map(c => c.moodScore as number);

    if (reflectionDayMoods.length >= 3 && nonReflectionMoods.length >= 3) {
      const reflAvg = avg(reflectionDayMoods);
      const nonReflAvg = avg(nonReflectionMoods);
      const diff = reflAvg - nonReflAvg;
      if (diff >= 0.3) {
        crossNote = ` On days you reflect, your mood averages ${diff.toFixed(1)} points higher than on days you don\u2019t. Self-inquiry appears to have a measurable effect on your wellbeing.`;
        isConfirmed = true;
      }
    }
  }

  const streakNote = summary.streak >= 7
    ? ` Your ${summary.streak}-day streak shows real commitment to self-knowledge.`
    : '';

  return {
    id: 'reflection-depth',
    title: 'Your Reflection Practice',
    body: `You\u2019ve reflected on ${summary.totalDays} days (${pct}% of a full 365-day cycle), with ${summary.totalAnswers} total answers. Your deepest exploration is in ${dominantCategory[0]} (${dominantCategory[1]} answers).${streakNote}${crossNote}`,
    accentColor: 'gold',
    source: 'reflection',
    isConfirmed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Dream × Somatic Cross-Reference
// ─────────────────────────────────────────────────────────────────────────────

// Map dream feeling IDs to overlapping somatic emotions (case-insensitive match)
const DREAM_TO_SOMATIC_EMOTION: Record<string, string[]> = {
  anxious:    ['Anxiety', 'Fear', 'Tension'],
  panicked:   ['Anxiety', 'Fear'],
  terrified:  ['Fear', 'Anxiety'],
  scared:     ['Fear', 'Anxiety'],
  chased:     ['Fear', 'Anxiety', 'Stress'],
  powerless:  ['Numbness', 'Overwhelm', 'Grief'],
  numb:       ['Numbness'],
  heavy:      ['Grief', 'Sadness', 'Numbness'],
  betrayed:   ['Anger', 'Grief'],
  angry:      ['Anger', 'Frustration'],
  trapped:    ['Tension', 'Anxiety'],
  grieving:   ['Grief', 'Sadness'],
  isolated:   ['Numbness', 'Sadness'],
  exhausted:  ['Numbness', 'Restlessness'],
  restless:   ['Restlessness', 'Tension', 'Anxiety'],
  conflicted: ['Tension', 'Anxiety'],
};

function buildDreamSomaticInsight(
  dreamSummary: DreamSummary,
  somaticEntries: SelfKnowledgeContext['somaticEntries'],
): CrossRefInsight | null {
  if (dreamSummary.totalWithDreams < 3 || somaticEntries.length < 3) return null;

  // Find dream feelings that map to frequently logged somatic emotions
  const somaticEmotionCounts: Record<string, number> = {};
  for (const e of somaticEntries) {
    somaticEmotionCounts[e.emotion] = (somaticEmotionCounts[e.emotion] ?? 0) + 1;
  }

  const matches: Array<{ dreamFeeling: string; somaticEmotion: string; count: number }> = [];
  for (const feelingId of dreamSummary.topFeelingIds) {
    const mapped = DREAM_TO_SOMATIC_EMOTION[feelingId] ?? [];
    for (const somaticLabel of mapped) {
      const count = somaticEmotionCounts[somaticLabel];
      if (count && count >= 2) {
        matches.push({ dreamFeeling: feelingId, somaticEmotion: somaticLabel, count });
        break;
      }
    }
    if (matches.length >= 2) break;
  }

  if (matches.length === 0) return null;

  const primary = matches[0];
  const secondary = matches[1];
  const bodyLabel = secondary
    ? ` "${secondary.dreamFeeling.replace(/_/g, ' ')}" also echoes your logged ${secondary.somaticEmotion.toLowerCase()} sensations.`
    : '';

  return {
    id: 'dream-somatic-link',
    title: 'Your Dreams Echo Your Body',
    body: `You frequently dream with a feeling of "${primary.dreamFeeling.replace(/_/g, ' ')}" — and your body map shows ${primary.count} logged entries of ${primary.somaticEmotion.toLowerCase()}.${bodyLabel} Your dreams and your body may be processing the same material. What one holds, the other speaks.`,
    accentColor: 'silverBlue',
    source: 'somatic',
    isConfirmed: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Journal Mood × Body Pattern
// ─────────────────────────────────────────────────────────────────────────────

function buildJournalBodyInsight(
  journal: JournalSummary,
  somaticEntries: SelfKnowledgeContext['somaticEntries'],
): CrossRefInsight | null {
  if (journal.heavyDays.length < 2 || somaticEntries.length < 3) return null;

  // Find somatic entries logged on the same days as heavy journal entries
  const heavySet = new Set(journal.heavyDays);
  const onHeavyDays = somaticEntries.filter(e => heavySet.has(e.date.slice(0, 10)));

  if (onHeavyDays.length < 2) {
    // No same-day overlap — still surface pattern if body logging and heavy days both exist
    const bodyRegions: Record<string, number> = {};
    for (const e of somaticEntries) {
      bodyRegions[e.region] = (bodyRegions[e.region] ?? 0) + 1;
    }
    const topRegion = Object.entries(bodyRegions).sort((a, b) => b[1] - a[1])[0];
    if (!topRegion) return null;

    return {
      id: 'journal-body-pattern',
      title: 'Your Journal and Your Body',
      body: `You've had ${journal.heavyDays.length} heavy or stormy journal days. Your body map most often signals in your ${topRegion[0]} (${topRegion[1]}×). Checking in with that region on difficult writing days may help name what the words haven't reached yet.`,
      accentColor: 'copper',
      source: 'somatic',
      isConfirmed: false,
    };
  }

  // Confirmed overlap
  const overlapEmotions: Record<string, number> = {};
  for (const e of onHeavyDays) {
    overlapEmotions[e.emotion] = (overlapEmotions[e.emotion] ?? 0) + 1;
  }
  const topEmotion = Object.entries(overlapEmotions).sort((a, b) => b[1] - a[1])[0];

  return {
    id: 'journal-body-pattern',
    title: 'Your Heaviest Days Have a Body Signature',
    body: `On ${onHeavyDays.length} of your heavy journal days, you also logged somatic sensations — most often ${topEmotion[0].toLowerCase()} (${topEmotion[1]}×). Your body and your words are writing the same story from different angles. Both are worth listening to.`,
    accentColor: 'copper',
    source: 'somatic',
    isConfirmed: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Dream Themes × Archetype Pattern
// ─────────────────────────────────────────────────────────────────────────────

const ARCHETYPE_DREAM_THEMES: Record<ArchetypeKey, string[]> = {
  hero:      ['conflict', 'survival', 'adventure'],
  caregiver: ['connection', 'loss'],
  seeker:    ['adventure', 'discovery', 'transformation', 'mystery'],
  sage:      ['mystery', 'transformation', 'discovery'],
  rebel:     ['conflict', 'transformation', 'survival'],
};

function buildDreamArchetypeInsight(
  dreamSummary: DreamSummary,
  archetypeProfile: NonNullable<SelfKnowledgeContext['archetypeProfile']>,
): CrossRefInsight | null {
  if (dreamSummary.totalWithDreams < 3) return null;

  const archetypeThemes = ARCHETYPE_DREAM_THEMES[archetypeProfile.dominant] ?? [];
  const matchedThemes = dreamSummary.topThemes.filter(t => archetypeThemes.includes(t));
  if (matchedThemes.length === 0) return null;

  const themeLabel = matchedThemes.slice(0, 2).join(' and ');
  const archetype = archetypeProfile.dominant.charAt(0).toUpperCase() + archetypeProfile.dominant.slice(1);

  return {
    id: 'dream-archetype-pattern',
    title: `Your Dreams Reflect The ${archetype}`,
    body: `Your dominant archetype is The ${archetype}, and your most recurring dream themes include ${themeLabel} — themes that mirror this pattern. Your unconscious mind may be actively working through the same psychological territory your archetype profile points to. Dreams are often where integration begins before the waking mind catches up.`,
    accentColor: 'lavender',
    source: 'archetype',
    isConfirmed: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Check-in × Dream Quality Correlation
// ─────────────────────────────────────────────────────────────────────────────

function buildSleepMoodInsight(
  dreamSummary: DreamSummary,
  checkIns: DailyCheckIn[],
): CrossRefInsight | null {
  if (dreamSummary.allDates.length < 5 || checkIns.length < 7) return null;

  const sleepDateSet = new Set(dreamSummary.allDates);
  const nightBeforeCheckIns = checkIns.filter(c => {
    // Look for check-ins on the day AFTER a sleep entry (morning after).
    // Use local date constructor to avoid UTC-parsing offset bugs.
    const [y, m, d] = c.date.split('-').map(Number);
    const prevDay = new Date(y, m - 1, d - 1);
    const prevDayKey = `${prevDay.getFullYear()}-${String(prevDay.getMonth() + 1).padStart(2, '0')}-${String(prevDay.getDate()).padStart(2, '0')}`;
    return sleepDateSet.has(prevDayKey);
  });

  if (nightBeforeCheckIns.length < 3) return null;

  const trackedMoods = nightBeforeCheckIns
    .map(c => c.moodScore)
    .filter((m): m is number => m != null);
  const allMoods = checkIns
    .map(c => c.moodScore)
    .filter((m): m is number => m != null);

  if (!trackedMoods.length || !allMoods.length) return null;

  const trackedAvg = trackedMoods.reduce((a, b) => a + b, 0) / trackedMoods.length;
  const overallAvg = allMoods.reduce((a, b) => a + b, 0) / allMoods.length;
  const diff = trackedAvg - overallAvg;

  if (Math.abs(diff) < 0.35) return null;

  const dir = diff > 0 ? 'higher' : 'lower';
  const qualNote = dreamSummary.avgQuality != null
    ? ` Your average sleep quality across those nights is ${dreamSummary.avgQuality.toFixed(1)}/5.`
    : '';

  return {
    id: 'sleep-mood-link',
    title: 'Sleep Shapes Your Days',
    body: `On mornings after tracked sleep entries, your mood averages ${Math.abs(diff).toFixed(1)} points ${dir} than your overall baseline.${qualNote} The night before appears to meaningfully influence how you show up the next day.`,
    accentColor: 'emerald',
    source: 'reflection',
    isConfirmed: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate all self-knowledge cross-reference insights.
 *
 * Returns up to 8 insights, sorted so data-confirmed ones lead.
 * Safe to call with empty checkIns — profile-based insights are always returned.
 * Pass a context enriched with enrichSelfKnowledgeContext() to include
 * journal mood × body and dream × archetype cross-references.
 */
export function computeSelfKnowledgeCrossRef(
  context: SelfKnowledgeContext,
  checkIns: DailyCheckIn[],
): CrossRefInsight[] {
  const all: CrossRefInsight[] = [];

  // Trigger × tag (data-backed when present)
  if (context.triggers) {
    all.push(...buildTriggerInsights(context.triggers, checkIns));
  }

  // Somatic pattern (data-backed when overlaps with high-stress days)
  if (context.somaticEntries.length >= 3) {
    const somatic = buildSomaticInsight(context.somaticEntries, checkIns);
    if (somatic) all.push(somatic);
  }

  // Archetype shadow (data-backed when high-stress % is notable)
  if (context.archetypeProfile) {
    all.push(buildArchetypeInsight(context.archetypeProfile, checkIns));
  }

  // Relationship patterns (data-backed when relational tags show mood impact)
  if (context.relationshipPatterns.length >= 2) {
    const rel = buildRelationshipInsight(context.relationshipPatterns, checkIns);
    if (rel) all.push(rel);
  }

  // Core values (data-backed when hard days are present)
  if (context.coreValues) {
    const vals = buildValuesInsight(context.coreValues, checkIns);
    if (vals) all.push(vals);
  }

  // Cognitive style (always profile-based)
  if (context.cognitiveStyle) {
    all.push(buildCognitiveInsight(context.cognitiveStyle));
  }

  // Daily reflection depth (data-backed when mood correlation exists)
  if (context.dailyReflections) {
    const refl = buildReflectionInsight(context.dailyReflections, checkIns);
    if (refl) all.push(refl);
  }

  // ── SQLite-enriched cross-references (populated by enrichSelfKnowledgeContext) ──

  // Dream feelings × somatic body map
  if (context.dreamSummary && context.somaticEntries.length >= 3) {
    const dreamSomatic = buildDreamSomaticInsight(context.dreamSummary, context.somaticEntries);
    if (dreamSomatic) all.push(dreamSomatic);
  }

  // Journal heavy days × somatic body map
  if (context.journalSummary && context.somaticEntries.length >= 3) {
    const journalBody = buildJournalBodyInsight(context.journalSummary, context.somaticEntries);
    if (journalBody) all.push(journalBody);
  }

  // Dream themes × archetype pattern
  if (context.dreamSummary && context.archetypeProfile) {
    const dreamArch = buildDreamArchetypeInsight(context.dreamSummary, context.archetypeProfile);
    if (dreamArch) all.push(dreamArch);
  }

  // Sleep quality × next-day mood
  if (context.dreamSummary) {
    const sleepMood = buildSleepMoodInsight(context.dreamSummary, checkIns);
    if (sleepMood) all.push(sleepMood);
  }

  // Confirmed insights lead; cap at 8 total
  return [
    ...all.filter(i => i.isConfirmed),
    ...all.filter(i => !i.isConfirmed),
  ].slice(0, 8);
}
