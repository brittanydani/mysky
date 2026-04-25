/**
 * Self-Knowledge Cross-Reference Engine
 *
 * Pure functions — no I/O, no side effects.
 * Takes a SelfKnowledgeContext (AsyncStorage profile data) + raw check-ins
 * (behavioral data) and returns CrossRefInsight[] — personalized observations
 * that connect what the user knows about themselves to how they actually show up.
 *
 * Updated goals:
 *  - soften identity-heavy claims
 *  - avoid quiz/test-result style language
 *  - suppress malformed phrase output
 *  - distinguish confirmed patterns from emerging/profile observations
 *  - make copy more observational and less absolute
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
  accentColor: 'gold' | 'emerald' | 'silverBlue' | 'copper' | 'rose' | 'lavender';
  source: 'triggers' | 'somatic' | 'archetype' | 'values' | 'cognitive' | 'relationship' | 'reflection';
  isConfirmed: boolean;
  premiumType?: string;
  valueRank?: number;
  evidence?: string[];
  whyItMatters?: string;
  nextStep?: string;
  lockedPreview?: string;
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
// ─────────────────────────────────────────────────────────────────────────────

export const DRAIN_TAG_MAP: Record<string, string> = {
  conflict: 'conflict',
  'over-stimulation': 'overstimulated',
  overstimulation: 'overstimulated',
  'screens late at night': 'screens',
  screens: 'screens',
  isolation: 'alone_time',
  'people-pleasing': 'relationships',
  comparison: 'confidence',
  rushing: 'overwhelm',
  'unfinished tasks': 'productivity',
  'saying yes when i mean no': 'boundaries',
  uncertainty: 'anxiety',
  anxiety: 'anxiety',
};

export const RESTORE_TAG_MAP: Record<string, string> = {
  movement: 'movement',
  'time in nature': 'nature',
  nature: 'nature',
  'creative work': 'creative',
  creativity: 'creative',
  solitude: 'alone_time',
  'alone time': 'alone_time',
  'meaningful conversation': 'social',
  social: 'social',
  cooking: 'food',
  'setting a boundary': 'boundaries',
  'deep sleep': 'sleep',
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

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

function readableTag(tag: string): string {
  return tag.replace(/_/g, ' ');
}

function soundsBroken(text: string): boolean {
  const normalized = cleanText(text).toLowerCase();
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const shortTokenCount = tokens.filter((t) => t.length < 3).length;

  return (
    normalized.length < 12 ||
    normalized.includes('-on-an-o') ||
    normalized.includes('-asks-me-to-tru') ||
    /[a-z]+(?:-[a-z]+){3,}/.test(normalized) ||
    shortTokenCount > Math.max(4, Math.floor(tokens.length * 0.35))
  );
}

function soften(text: string): string {
  return cleanText(
    text
      .replace(/\bThis means\b/gi, 'This may mean')
      .replace(/\bThis reveals\b/gi, 'This may suggest')
      .replace(/\bYou are\b/gi, 'You may be')
      .replace(/\bYour dominant\b/gi, 'Your leading')
      .replace(/\bproves\b/gi, 'suggests')
  );
}

function sanitizeThemeLabel(label: string): string {
  const cleaned = cleanText(label);
  if (soundsBroken(cleaned)) return 'still emerging';
  if (/[a-z]-[a-z]/.test(cleaned)) return cleaned.replace(/-/g, ' ');
  return cleaned;
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

      if (isDrain && diff >= -0.4) continue;
      if (!isDrain && diff <= 0.4) continue;

      results.push({
        id: `trigger-${tag}-${isDrain ? 'd' : 'r'}`,
        title: isDrain
          ? `"${item}" looks like a real drain`
          : `"${item}" seems to be a genuine restore`,
        body: isDrain
          ? `You marked "${item}" as draining, and your check-in data points in the same direction. On the ${tagged.length} days linked with "${readableTag(tag)}", your mood averaged ${tagAvg.toFixed(1)} — ${Math.abs(diff).toFixed(1)} points lower than your ${overallAvg.toFixed(1)} baseline.`
          : `You marked "${item}" as restorative, and your check-in data points in the same direction. On the ${tagged.length} days linked with "${readableTag(tag)}", your mood averaged ${tagAvg.toFixed(1)} — ${diff.toFixed(1)} points above your ${overallAvg.toFixed(1)} baseline.`,
        accentColor: isDrain ? 'copper' : 'emerald',
        source: 'triggers',
        isConfirmed: true,
      });
    }
  };

  process(triggers.restores, RESTORE_TAG_MAP, false);
  process(triggers.drains, DRAIN_TAG_MAP, true);

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Somatic Pattern
// ─────────────────────────────────────────────────────────────────────────────

const REGION_LABELS: Record<string, string> = {
  head: 'head & mind',
  throat: 'throat & jaw',
  chest: 'chest & heart',
  gut: 'gut & belly',
  back: 'back & spine',
  limbs: 'hands & legs',
};

function buildSomaticInsight(
  entries: SelfKnowledgeContext['somaticEntries'],
  checkIns: DailyCheckIn[],
): CrossRefInsight | null {
  if (entries.length < 3) return null;

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
  const [topEmotion] = sortedEmotions[0];
  const regionLabel = REGION_LABELS[topRegionId] ?? topRegionId;
  const topSensation = sortedSensations.length > 0 ? sortedSensations[0] : null;

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
    ? ` On ${overlap} of those days, that same signal appeared alongside high stress, which suggests your body may be flagging it before your thoughts fully catch up.`
    : '';
  const sensationNote = topSensation ? ` The most common sensation is ${topSensation[0].toLowerCase()}.` : '';

  return {
    id: 'somatic-dominant',
    title: 'Your body keeps pointing to the same place',
    body: `Your physical and emotional logs keep returning to the same area. When ${topEmotion.toLowerCase()} shows up, your body most often registers it in your ${regionLabel}.${sensationNote}${overlapBody}`,
    heroMetrics: [
      metric(heavyLabel.toUpperCase(), 'Somatic days', overlap >= 2 ? 'caution' : 'default'),
      metric(regionMetric.toUpperCase(), 'Primary signal'),
      metric(emotionalWeather.toUpperCase(), 'Top emotion'),
      ...(topSensation ? [metric(titleCase(topSensation[0]).toUpperCase(), 'Top sensation')] : []),
    ],
    takeaway: takeaway(
      'Somatic cue',
      `Before analyzing tonight, place a hand on your ${topRegionId === 'gut' ? 'stomach' : regionLabel}. Let that region register first before you ask it to explain itself.`,
      'body-outline',
    ),
    accentColor: 'silverBlue',
    source: 'somatic',
    isConfirmed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Archetype Pattern
// ─────────────────────────────────────────────────────────────────────────────

const ARCHETYPE_SHADOWS: Record<ArchetypeKey, { title: string; body: string; takeaway: string }> = {
  hero: {
    title: 'A striving pattern may intensify under pressure',
    body: 'Your reflections suggest a recurring movement toward overcoming and proving strength. Under strain, that can sometimes look like doing more when recovery would help your system sooner.',
    takeaway: 'When pressure spikes, notice whether you are trying to earn safety by doing more. What would strategic recovery look like first?',
  },
  caregiver: {
    title: 'A caregiving pattern may get costly under strain',
    body: 'Your reflections often stay oriented toward tending, supporting, or holding others. Under pressure, that can become over-giving before your own depletion is fully named.',
    takeaway: 'Before meeting someone else\u2019s need, pause long enough to ask whether the same need is unspoken in you.',
  },
  seeker: {
    title: 'Movement may become the stress response',
    body: 'When pressure rises, your instinct appears to move, shift, or escape the current frame. That may be useful sometimes, but it can also make staying present with the real tension harder.',
    takeaway: 'Notice the urge to leave, switch, or move on. What happens if you stay with the current moment a little longer?',
  },
  sage: {
    title: 'Understanding may arrive before feeling',
    body: 'Your reflections lean toward truth-seeking and understanding. Under pressure, that can turn into analyzing before the feeling itself has had room to register.',
    takeaway: 'When the mind speeds up, pause before solving. What feeling is asking to be felt before it is explained?',
  },
  rebel: {
    title: 'Resistance may sharpen under overload',
    body: 'Your reflections suggest a recurring orientation toward questioning and pushing against what feels constraining. Under stress, that may turn into resistance before discernment has fully settled.',
    takeaway: 'Pause long enough to ask what is truly misaligned, and what only feels intolerable because you are already overloaded.',
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
    if (pct >= 30) isConfirmed = true;
  }

  const dominantName = `The ${profile.dominant.charAt(0).toUpperCase()}${profile.dominant.slice(1)}`;
  const secondary = Object.entries(profile.scores)
    .filter(([key]) => key !== profile.dominant)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const secondaryName = secondary ? `The ${secondary.charAt(0).toUpperCase()}${secondary.slice(1)}` : null;

  return {
    id: 'archetype-shadow',
    title: shadow.title,
    body: shadow.body,
    heroMetrics: [
      ...(pct > 0 ? [metric(`${pct}%`, 'High-stress days', pct >= 30 ? 'caution' : 'default')] : []),
      metric(dominantName, 'Leading pattern', 'default'),
      ...(secondaryName ? [metric(secondaryName, 'Secondary', 'default')] : []),
    ],
    takeaway: takeaway('Pattern under pressure', shadow.takeaway, 'sparkles-outline'),
    accentColor: 'lavender',
    source: 'archetype',
    isConfirmed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Relationship Patterns
// ─────────────────────────────────────────────────────────────────────────────

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

  const tagCounts: Record<string, number> = {};
  const secureTagCounts: Record<string, number> = {};
  const SECURE_IDS = new Set(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10']);

  for (const e of entries) {
    for (const t of e.tags) {
      if (SECURE_IDS.has(t)) secureTagCounts[t] = (secureTagCounts[t] ?? 0) + 1;
      else tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
  }

  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 2);
  const topSecureTags = Object.entries(secureTagCounts).sort((a, b) => b[1] - a[1]).slice(0, 1);

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
        if (Math.abs(impact) >= 0.4) isConfirmed = true;
      }
    }
  }

  const topThemeLabel = topTags.length > 0
    ? topTags.map(([tag]) => resolveTagLabel(tag)).join(', ')
    : 'still emerging';
  const safeThemeLabel = sanitizeThemeLabel(topThemeLabel);

  const secureThemeLabel = topSecureTags.length > 0
    ? resolveTagLabel(topSecureTags[0][0])
    : null;

  let body = `Your relationship reflections keep circling ${topThemeLabel.toLowerCase()}.`;
  if (impact !== null && Math.abs(impact) >= 0.4) {
    body = impact > 0
      ? 'When relational themes appear in your check-ins, your emotional baseline tends to lift. Your data is linking certain forms of connection with expansion rather than collapse.'
      : 'When relational themes appear in your check-ins, your emotional baseline tends to drop. The pattern suggests some forms of connection are still landing in your system as stress rather than support.';
  } else if (secureThemeLabel) {
    body = `Your reflections show recurring struggle themes, but they also show secure behavior through ${secureThemeLabel.toLowerCase()}. The pattern is not static. You are already recording a different way of relating.`;
  }

  return {
    id: 'relationship-pattern',
    title: 'Your Relational Mirror',
    body,
    heroMetrics: [
      metric(
        impact == null ? 'No clear lift yet' : `${impact > 0 ? '+' : '\u2212'}${Math.abs(impact).toFixed(1)}`,
        impact == null ? 'Relational delta' : 'Mood lift',
        impact == null ? 'default' : impact > 0 ? 'positive' : 'caution',
      ),
      metric(String(entries.length), 'Reflections'),
      ...(safeThemeLabel && safeThemeLabel !== 'still emerging' ? [metric(safeThemeLabel, 'Top themes')] : []),
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
      hardDayNote = ` You've had ${hardDays} harder days recently. These are often where a core value feels restricted \u2014 tracing back to which one can cut through the noise faster than analysis.`;
      isConfirmed = true;
    }
  }

  return {
    id: 'values-pressure',
    title: 'Your Core Values in Practice',
    body: `Your top values are ${topList}.${hardDayNote} When you feel stuck or heavy, asking which value is being constrained right now can surface the real issue faster than analysis alone.`,
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
    'You absorb context quickly and trust first impressions. Protect that initial clarity \u2014 detail-creep tends to dull your strongest instincts.',
  'big-picture+careful-deliberate':
    'You see the whole picture but commit slowly. Your best decisions come after sitting with options. Protect deliberate reflection time from being crowded out.',
  'big-picture+adaptive':
    'You think in patterns and shift strategy fluidly. Brief notes capture insights before they evaporate into the next context switch.',
  'detail-oriented+quick-intuitive':
    'You notice what others miss and often know immediately what it means. Your synthesis speed is unusual \u2014 trust it even when the details are still incomplete.',
  'detail-oriented+careful-deliberate':
    'You\u2019re thorough and precise before committing. Batch deep-focus work into protected blocks \u2014 this is where your highest-quality thinking happens.',
  'detail-oriented+adaptive':
    'You combine precision with flexibility. Breaking complex problems into phases \u2014 explore, then commit \u2014 uses your natural style fully.',
  'balanced+quick-intuitive':
    'You adapt to frameworks quickly and move decisively. Build in a brief pause between decision and action to distinguish gut-knowing from urgency.',
  'balanced+careful-deliberate':
    'You bring a measured, flexible approach to choices. Separating an explore-phase from a commit-phase lets you use this style without getting stuck.',
  'balanced+adaptive':
    'Your cognitive style flexes with context. Periodically checking whether you\u2019re acting from intuition or analysis in a given moment keeps decisions intentional.',
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
  linguistic: 'Language looks like one of your primary ways of making sense of experience. Writing, reading, and conversation may be where your clarity arrives fastest.',
  logical: 'Patterns, systems, and internal coherence appear central to how you think. You naturally break complexity into parts and notice what does not fit.',
  musical: 'Rhythm, tone, and sound seem to carry real meaning for you. Music may function less like background and more like a way your system processes feeling.',
  spatial: 'You seem to think in images, layouts, and relationships in space. Mental maps and visual structure may come to you faster than verbal explanation.',
  kinesthetic: 'Your body looks like a real thinking tool for you. Movement, touch, and physical engagement may help you learn, remember, and regulate better than stillness does.',
  interpersonal: 'You appear to read people fluently. Motivations, emotional shifts, and group dynamics may be legible to you in ways others miss.',
  intrapersonal: 'You appear to have strong access to your own inner world. Self-observation, reflection, and pattern recognition seem to be among your sharpest forms of intelligence.',
  naturalistic: 'You seem to notice patterns in the living world instinctively. Seasons, ecosystems, and natural systems may make intuitive sense to you.',
  existential: 'Your mind appears drawn to the biggest questions. Meaning, purpose, mortality, and depth do not seem optional topics for you; they seem native territory.',
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
    ? `Your data suggests two equally strong channels here: ${topLabel} and ${secondLabel}. ${note}`
    : `${topLabel} appears to lead your profile, with ${secondLabel} close behind. ${note}`;

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
    body: `A pattern in your reflection data suggests this cognitive style: ${note}`,
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

  const categoryLabel = dominantCategory[0].replace(/_/g, ' ').toLowerCase();

  return {
    id: 'reflection-depth',
    title: 'Your Reflection Practice',
    body: `You\u2019ve reflected on ${summary.totalDays} days (${pct}% of a full 365-day cycle), with ${summary.totalAnswers} total answers. So far, your reflection practice leans most toward ${categoryLabel} (${dominantCategory[1]} answers). That is less about volume than about where your mind keeps returning when it wants to understand you more deeply.${streakNote}${crossNote}`,
    accentColor: 'gold',
    source: 'reflection',
    isConfirmed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Dream × Somatic Cross-Reference
// ─────────────────────────────────────────────────────────────────────────────

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
    title: 'Your Dreams and Body Are Carrying Similar Material',
    body: `You frequently dream with a feeling of "${primary.dreamFeeling.replace(/_/g, ' ')}," and your body map shows ${primary.count} logged entries of ${primary.somaticEmotion.toLowerCase()}.${bodyLabel} Your dreams and your body may be processing the same material from different directions.`,
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

  const heavySet = new Set(journal.heavyDays);
  const onHeavyDays = somaticEntries.filter(e => heavySet.has(e.date.slice(0, 10)));

  if (onHeavyDays.length < 2) {
    const bodyRegions: Record<string, number> = {};
    for (const e of somaticEntries) {
      bodyRegions[e.region] = (bodyRegions[e.region] ?? 0) + 1;
    }
    const topRegion = Object.entries(bodyRegions).sort((a, b) => b[1] - a[1])[0];
    if (!topRegion) return null;

    return {
      id: 'journal-body-pattern',
      title: 'Your Journal and Your Body',
      body: `Your heavier journal days are clustering around signals in your ${topRegion[0]}. The region showing up most often may be carrying part of the story your writing is trying to process.`,
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

  const overlapEmotions: Record<string, number> = {};
  for (const e of onHeavyDays) {
    overlapEmotions[e.emotion] = (overlapEmotions[e.emotion] ?? 0) + 1;
  }
  const topEmotion = Object.entries(overlapEmotions).sort((a, b) => b[1] - a[1])[0];

  return {
    id: 'journal-body-pattern',
    title: 'Your Heaviest Days Have a Body Signature',
    body: `Your heaviest journal days repeatedly land in the body as ${topEmotion[0].toLowerCase()}. The overlap is strong enough to suggest your body and your writing are tracking the same load from different angles.`,
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
    body: `Your dominant archetype is The ${archetype}, and your recurring dream themes include ${themeLabel}, themes that mirror this pattern. Your dreaming mind may be working through the same territory your archetype profile points to before your waking mind fully names it.`,
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
    body: `The night before appears to shape the next day for you in a measurable way. Morning mood shifts enough after tracked sleep to register as a real lever rather than background noise.${qualNote}`,
    heroMetrics: [
      metric(`${dir === 'higher' ? '+' : '\u2212'}${Math.abs(diff).toFixed(1)}`, 'Next-day mood', dir === 'higher' ? 'positive' : 'caution'),
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

export function computeSelfKnowledgeCrossRef(
  context: SelfKnowledgeContext,
  checkIns: DailyCheckIn[],
): CrossRefInsight[] {
  const all: CrossRefInsight[] = [];

  if (context.triggers) {
    all.push(...buildTriggerInsights(context.triggers, checkIns));
  }

  if (context.somaticEntries.length >= 3) {
    const somatic = buildSomaticInsight(context.somaticEntries, checkIns);
    if (somatic) all.push(somatic);
  }

  if (context.archetypeProfile) {
    all.push(buildArchetypeInsight(context.archetypeProfile, checkIns));
  }

  if (context.relationshipPatterns.length >= 2) {
    const rel = buildRelationshipInsight(context.relationshipPatterns, checkIns);
    if (rel) all.push(rel);
  }

  if (context.coreValues) {
    const vals = buildValuesInsight(context.coreValues, checkIns);
    if (vals) all.push(vals);
  }

  if (context.cognitiveStyle) {
    all.push(buildCognitiveInsight(context.cognitiveStyle));
  }

  if (context.intelligenceProfile) {
    const intel = buildIntelligenceInsight(context.intelligenceProfile);
    if (intel) all.push(intel);
  }

  if (context.dailyReflections) {
    const refl = buildReflectionInsight(context.dailyReflections, checkIns);
    if (refl) all.push(refl);
  }

  if (context.dreamSummary && context.somaticEntries.length >= 3) {
    const dreamSomatic = buildDreamSomaticInsight(context.dreamSummary, context.somaticEntries);
    if (dreamSomatic) all.push(dreamSomatic);
  }

  if (context.journalSummary && context.somaticEntries.length >= 3) {
    const journalBody = buildJournalBodyInsight(context.journalSummary, context.somaticEntries);
    if (journalBody) all.push(journalBody);
  }

  if (context.dreamSummary && context.archetypeProfile) {
    const dreamArch = buildDreamArchetypeInsight(context.dreamSummary, context.archetypeProfile);
    if (dreamArch) all.push(dreamArch);
  }

  if (context.dreamSummary) {
    const sleepMood = buildSleepMoodInsight(context.dreamSummary, checkIns);
    if (sleepMood) all.push(sleepMood);
  }

  return [
    ...all.filter(i => i.isConfirmed),
    ...all.filter(i => !i.isConfirmed),
  ].slice(0, 8);
}
