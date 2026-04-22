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
  IntelligenceProfile,
  IntelligenceDimensionId,
} from '../services/insights/selfKnowledgeContext';
import { DailyCheckIn } from '../services/patterns/types';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface CrossRefInsight {
  id: string;
  title: string;
  body: string;
  heroMetrics?: InsightMetric[];
  takeaway?: InsightTakeaway;
  /** Accent color key — map against your palette in the UI layer */
  accentColor: 'gold' | 'emerald' | 'silverBlue' | 'copper' | 'rose' | 'lavender';
  source: 'triggers' | 'somatic' | 'archetype' | 'values' | 'cognitive' | 'relationship' | 'reflection';
  /**
   * true  → insight is confirmed by behavioral check-in data
   * false → insight is a profile reflection (still valuable, not data-backed)
   */
  isConfirmed: boolean;
}

export interface InsightMetric {
  value: string;
  label: string;
  tone?: 'default' | 'positive' | 'caution';
}

export interface InsightTakeaway {
  label: string;
  body: string;
  icon?: string;
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

function metric(value: string, label: string, tone: InsightMetric['tone'] = 'default'): InsightMetric {
  return { value, label, tone };
}

function takeaway(label: string, body: string, icon?: string): InsightTakeaway {
  return { label, body, icon };
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

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildSomaticInsight(
  entries: SelfKnowledgeContext['somaticEntries'],
  checkIns: DailyCheckIn[],
): CrossRefInsight | null {
  if (entries.length < 3) return null;

  // Most frequent region
  const regionCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};
  const sensationCounts: Record<string, number> = {};
  for (const e of entries) {
    regionCounts[e.region] = (regionCounts[e.region] ?? 0) + 1;
    emotionCounts[e.emotion] = (emotionCounts[e.emotion] ?? 0) + 1;
    if (e.sensation) sensationCounts[e.sensation] = (sensationCounts[e.sensation] ?? 0) + 1;
  }

  const sortedRegions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);
  const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
  const sortedSensations = Object.entries(sensationCounts).sort((a, b) => b[1] - a[1]);
  if (!sortedRegions.length || !sortedEmotions.length) return null;
  const [topRegionId, topRegionCount] = sortedRegions[0];
  const [topEmotion, topEmotionCount] = sortedEmotions[0];
  const regionLabel = REGION_LABELS[topRegionId] ?? topRegionId;
  const topSensation = sortedSensations.length > 0 ? sortedSensations[0] : null;

  // Cross-ref: how many somatic entry days overlap with high-stress check-in days?
  let overlap = 0;
  let isConfirmed = false;
  if (checkIns.length >= 5) {
    const highStressDates = new Set(
      checkIns.filter(c => c.stressLevel === 'high').map(c => c.date),
    );
    const somaticDates = entries.map(e => e.date.slice(0, 10));
    overlap = somaticDates.filter(d => highStressDates.has(d)).length;
    if (overlap >= 2 && overlap / entries.length >= 0.4) {
      isConfirmed = true;
    }
  }

  const heavyLabel = overlap > 0 ? `${overlap} stress-linked` : `${entries.length} tracked`;
  const regionMetric = `${titleCase(regionLabel)} (${topRegionCount}x)`;
  const emotionalWeather = titleCase(topEmotion);
  const overlapBody = overlap >= 2
    ? ` On ${overlap} of those days, the same body signal appeared alongside high stress, which suggests your system is flagging the tension there before your thoughts fully catch up.`
    : '';

  const sensationNote = topSensation ? ` The most common sensation is ${topSensation[0].toLowerCase()}.` : '';

  return {
    id: 'somatic-dominant',
    title: 'Body Awareness Pattern',
    body: `Your physical and emotional logs are pointing to the same place. When ${topEmotion.toLowerCase()} surfaces, your body most often stores it in your ${regionLabel}.${sensationNote}${overlapBody}`,
    heroMetrics: [
      metric(heavyLabel.toUpperCase(), 'Somatic days', overlap >= 2 ? 'caution' : 'default'),
      metric(regionMetric.toUpperCase(), 'Primary signal'),
      metric(emotionalWeather.toUpperCase(), 'Top emotion'),
      ...(topSensation ? [metric(titleCase(topSensation[0]).toUpperCase(), 'Top sensation')] : []),
    ],
    takeaway: takeaway(
      'Somatic cue',
      `Before you journal or analyze tonight, place a hand on your ${topRegionId === 'gut' ? 'stomach' : regionLabel}. Breathe into that exact area first and let the sensation speak before the story does.`,
      'body-outline',
    ),
    accentColor: 'silverBlue',
    source: 'somatic',
    isConfirmed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Archetype Shadow
// ─────────────────────────────────────────────────────────────────────────────

const ARCHETYPE_SHADOWS: Record<ArchetypeKey, { title: string; body: string; takeaway: string }> = {
  hero: {
    title: 'The Hero Under Pressure',
    body: 'Your dominant pattern is The Hero — driven to overcome and prove strength. The shadow to watch: striving harder when rest is what your system actually needs. On high-load days, strategic recovery is the most courageous move.',
    takeaway: 'When pressure spikes, notice whether you are trying to earn safety by doing more. What would strategic recovery look like before you prove anything else?',
  },
  caregiver: {
    title: 'The Caregiver Under Pressure',
    body: 'Your dominant pattern is The Caregiver — moving through the world by nurturing others. The shadow to watch: over-giving until quietly depleted. On hard days, ask honestly: who is taking care of you?',
    takeaway: 'Catch the reflex to caretake before it empties you. What need are you about to meet for someone else that you have not named for yourself yet?',
  },
  seeker: {
    title: 'The Seeker Under Pressure',
    body: 'When pressure rises, your instinct is movement and escape. The data suggests your Seeker pattern is activating under stress, favoring restlessness when staying present might resolve the tension faster.',
    takeaway: 'Notice the urge to pull away today. What happens if you stay still for five more minutes instead of changing course?',
  },
  sage: {
    title: 'The Sage Under Pressure',
    body: 'Your dominant pattern is The Sage — seeking truth and understanding above all. The shadow to watch: over-analyzing when the answer lives below thought. On heavy days, feeling through it may matter more than figuring it out.',
    takeaway: 'When the mind speeds up, pause before solving. What feeling are you trying to out-think right now?',
  },
  rebel: {
    title: 'The Rebel Under Pressure',
    body: 'Your dominant pattern is The Rebel — questioning structures and catalyzing change. The shadow to watch: resistance as a stress response — fighting what feels constraining, even when it isn\'t. Discernment protects your energy better than friction does.',
    takeaway: 'Spot the moment resistance becomes reflex. Which part of today is actually misaligned, and which part only feels intolerable because you are already overloaded?',
  },
};

function buildArchetypeInsight(
  profile: NonNullable<SelfKnowledgeContext['archetypeProfile']>,
  checkIns: DailyCheckIn[],
): CrossRefInsight {
  const shadow = ARCHETYPE_SHADOWS[profile.dominant];
  let isConfirmed = false;
  let pct = 0;

  if (checkIns.length >= 7) {
    const highStressCount = checkIns.filter(c => c.stressLevel === 'high').length;
    pct = Math.round((highStressCount / checkIns.length) * 100);
    if (pct >= 30) {
      isConfirmed = true;
    }
  }

  const dominantName = `The ${profile.dominant.charAt(0).toUpperCase()}${profile.dominant.slice(1)}`;
  const secondary = Object.entries(profile.scores)
    .filter(([key]) => key !== profile.dominant)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const secondaryName = secondary ? `The ${secondary.charAt(0).toUpperCase()}${secondary.slice(1)}` : null;

  return {
    id: 'archetype-shadow',
    title: shadow.title,
    body: pct >= 30
      ? shadow.body
      : `Your dominant archetype is ${dominantName}, and that pattern is still the clearest frame for how you respond under pressure. ${shadow.body.replace(/^Your dominant pattern is [^.]+\.\s*/, '')}`,
    heroMetrics: [
      metric(`${pct}%`, 'HIGH-STRESS DAYS', pct >= 30 ? 'caution' : 'default'),
      metric(dominantName.toUpperCase(), 'DOMINANT ARCHETYPE', 'default'),
      ...(secondaryName ? [metric(secondaryName.toUpperCase(), 'BACKUP PATTERN', 'default')] : []),
    ],
    takeaway: takeaway(
      'Shadow work',
      shadow.takeaway,
      'sparkles-outline',
    ),
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
  let impact: number | null = null;
  let isConfirmed = false;
  if (checkIns.length >= 7) {
    const relDays = checkIns.filter(c => c.tags.some(t => RELATIONAL_TAGS.includes(t)));
    if (relDays.length >= 3) {
      const relMoods = relDays.map(c => c.moodScore).filter((v): v is number => v != null);
      const allMoods = checkIns.map(c => c.moodScore).filter((v): v is number => v != null);
      if (relMoods.length >= 3 && allMoods.length >= 5) {
        const relAvg = avg(relMoods);
        const overallAvg = avg(allMoods);
        impact = relAvg - overallAvg;
        if (Math.abs(impact) >= 0.4) {
          isConfirmed = true;
        }
      }
    }
  }

  const topThemeLabel = topTags.length > 0
    ? topTags.map(([tag]) => resolveTagLabel(tag)).join(', ')
    : 'Still emerging';
  const secureThemeLabel = topSecureTags.length > 0
    ? resolveTagLabel(topSecureTags[0][0])
    : null;

  let body = `Your relationship reflections keep circling ${topThemeLabel.toLowerCase()}.`;
  if (impact !== null && Math.abs(impact) >= 0.4) {
    body = impact > 0
      ? 'When relational themes appear in your check-ins, your emotional baseline tends to lift. Your data is linking connection with expansion rather than collapse.'
      : 'When relational themes appear in your check-ins, your emotional baseline tends to drop. The pattern suggests some forms of connection are still landing as stress in your system.';
  } else if (secureThemeLabel) {
    body = `Your reflections show recurring struggle themes, but they also show secure behavior through ${secureThemeLabel.toLowerCase()}. The pattern is not static; you are already recording a different way of relating.`;
  }

  return {
    id: 'relationship-pattern',
    title: 'Your Relational Mirror',
    body,
    heroMetrics: [
      metric(
        impact == null ? 'No clear lift yet' : `${impact > 0 ? '+' : '−'}${Math.abs(impact).toFixed(1)}`,
        impact == null ? 'Relational delta' : 'Mood lift',
        impact == null ? 'default' : impact > 0 ? 'positive' : 'caution',
      ),
      metric(String(entries.length), 'Reflections'),
      metric(topThemeLabel, 'Top themes'),
    ],
    takeaway: takeaway(
      'Inquiry',
      impact != null && impact >= 0.4
        ? `What interaction, repair, or boundary created that ${Math.abs(impact).toFixed(1)} lift? Notice the part that worked, then repeat it.`
        : impact != null && impact <= -0.4
          ? `Which kind of interaction is creating that ${Math.abs(impact).toFixed(1)} drop? Name the specific pattern so you can stop treating all connection as the same.`
          : `Your reflections are led by ${topThemeLabel.toLowerCase()}. Pick one recent interaction and trace where that theme showed up in real time.`,
      'heart-outline',
    ),
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

// ─────────────────────────────────────────────────────────────────────────────
// 7b. Intelligence Profile Observation
// ─────────────────────────────────────────────────────────────────────────────

const INTELLIGENCE_DIMENSION_LABELS: Record<IntelligenceDimensionId, string> = {
  linguistic: 'Linguistic',
  logical: 'Logical-Mathematical',
  musical: 'Musical',
  spatial: 'Spatial',
  kinesthetic: 'Bodily-Kinesthetic',
  interpersonal: 'Interpersonal',
  intrapersonal: 'Intrapersonal',
  naturalistic: 'Naturalistic',
  existential: 'Existential',
};

const INTELLIGENCE_NOTES: Record<IntelligenceDimensionId, string> = {
  linguistic: 'You process the world through language — writing, reading, and conversation are how you make sense of complexity. Your insights often arrive as words.',
  logical: 'Patterns, systems, and logic are your native language. You naturally deconstruct problems into solvable parts and spot inconsistencies others miss.',
  musical: 'Rhythm, tone, and sound carry meaning for you. Music isn\'t just background — it\'s a processing tool that shapes your emotional landscape.',
  spatial: 'You think in images and dimensions. Mental maps, visualizations, and spatial relationships come naturally, giving you an intuitive sense of design and navigation.',
  kinesthetic: 'Your body is a primary thinking tool. Movement, touch, and physical engagement help you learn, remember, and regulate far more than sitting still.',
  interpersonal: 'You read people fluently — motivations, emotions, and group dynamics are legible to you. Your intelligence shines brightest in connection with others.',
  intrapersonal: 'You have unusual access to your own inner world. Self-awareness, reflection, and understanding your own patterns are where your intelligence runs deepest.',
  naturalistic: 'You notice patterns in the living world — seasons, ecosystems, animal behavior, and natural systems speak to you in ways that feel intuitive.',
  existential: 'You\'re drawn to the biggest questions — meaning, purpose, mortality, and the nature of existence. Your thinking naturally gravitates toward depth.',
};

function buildIntelligenceInsight(profile: IntelligenceProfile): CrossRefInsight | null {
  const dims: IntelligenceDimensionId[] = [
    'linguistic', 'logical', 'musical', 'spatial', 'kinesthetic',
    'interpersonal', 'intrapersonal', 'naturalistic', 'existential',
  ];

  const scored = dims
    .filter(d => typeof profile[d] === 'number' && (profile[d] as number) > 0)
    .map(d => ({ id: d, score: profile[d] as number }));

  if (scored.length < 2) return null;

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  const second = scored[1];

  const topLabel = INTELLIGENCE_DIMENSION_LABELS[top.id];
  const secondLabel = INTELLIGENCE_DIMENSION_LABELS[second.id];
  const note = INTELLIGENCE_NOTES[top.id];

  const body = top.score === second.score
    ? `Your ${topLabel} and ${secondLabel} intelligences are equally strong. ${note}`
    : `${topLabel} intelligence leads your profile, with ${secondLabel} close behind. ${note}`;

  return {
    id: 'intelligence-profile',
    title: 'Your Intelligence Profile',
    body,
    accentColor: 'lavender',
    source: 'cognitive',
    isConfirmed: false,
  };
}

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
  isolated:   ['Numbness', 'Sadness', 'Loneliness'],
  exhausted:  ['Numbness', 'Restlessness'],
  restless:   ['Restlessness', 'Tension', 'Anxiety'],
  conflicted: ['Tension', 'Anxiety'],
  vulnerable: ['Vulnerability', 'Fear', 'Shame'],
  hopeful:    ['Hope', 'Excitement'],
  lonely:     ['Loneliness', 'Sadness', 'Disconnection'],
  overwhelmed:['Overwhelm', 'Anxiety', 'Tension'],
  frustrated: ['Frustration', 'Anger'],
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
      body: `Your heavier journal days are clustering around signals in your ${topRegion[0]}. The body region showing up most often is carrying part of the story your writing is processing.`,
      heroMetrics: [
        metric(String(journal.heavyDays.length), 'Heavy days'),
        metric(String(topRegion[1]), `${topRegion[0]} entries`),
      ],
      takeaway: takeaway(
        'Body check',
        `On the next heavy writing day, start with your ${topRegion[0]} before you chase the right sentence. That region is showing up often enough to count as signal.`,
        'body-outline',
      ),
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
    body: `Your heaviest journal days repeatedly land in the body as ${topEmotion[0].toLowerCase()}. The overlap is strong enough that your body and your writing are tracking the same load from different angles.`,
    heroMetrics: [
      metric(String(onHeavyDays.length), 'Overlap days'),
      metric(String(topEmotion[1]), topEmotion[0].toLowerCase()),
    ],
    takeaway: takeaway(
      'Body signature',
      `When a day starts feeling heavy, check for ${topEmotion[0].toLowerCase()} early. Catching the body signature sooner gives you a better intervention point than waiting for the spiral.`,
      'body-outline',
    ),
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
    body: `The night before is materially shaping the next day for you. Morning mood shifts enough after tracked sleep to register as a real lever rather than background noise.${qualNote}`,
    heroMetrics: [
      metric(`${dir === 'higher' ? '+' : '−'}${Math.abs(diff).toFixed(1)}`, 'Next-day mood', dir === 'higher' ? 'positive' : 'caution'),
      metric(String(nightBeforeCheckIns.length), 'Tracked mornings'),
      ...(dreamSummary.avgQuality != null ? [metric(dreamSummary.avgQuality.toFixed(1), 'Avg sleep quality')] : []),
    ],
    takeaway: takeaway(
      'Night before',
      `Your next-day mood is running ${Math.abs(diff).toFixed(1)} points ${dir} after tracked sleep. Protect the evening habit that most reliably changes that morning result.`,
      'moon-outline',
    ),
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

  // Intelligence profile (always profile-based)
  if (context.intelligenceProfile) {
    const intel = buildIntelligenceInsight(context.intelligenceProfile);
    if (intel) all.push(intel);
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
