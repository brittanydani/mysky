/**
 * Self-Knowledge Cross-Reference Engine
 *
 * Pure functions — no I/O, no side effects.
 * Takes a SelfKnowledgeContext (AsyncStorage profile data) + raw check-ins
 * (behavioral data) and returns CrossRefInsight[] — personalized observations
 * that connect what the user knows about themselves to how they actually show up.
 *
 * Updated goals:
 * - Enforce the 3-part Velvet Glass formula: Observation, Pattern, Reframe.
 * - Eliminate quiz/test-result style language.
 * - Use the premium color palette exclusively.
 * - Make copy breathtaking, observational, and deeply validating.
 * - Gracefully suppress and sanitize malformed database tags in the final copy.
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
  accentColor: 'sage' | 'taupe' | 'coral' | 'midnightSlate' | 'velvet' | 'pearl';
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

      const title = isDrain
        ? `The Cost of ${titleCase(item)}`
        : `The Anchor of ${titleCase(item)}`;

      const observation = isDrain
        ? `Your archive suggests that "${item}" actively pulls from your reserves in a measurable way.`
        : `Your archive suggests that "${item}" functions as a profound anchor for your system.`;

      const pattern = isDrain
        ? `Across ${tagged.length} recent entries where this was present, your baseline dropped by ${Math.abs(diff).toFixed(1)} points. The pattern reveals that this is not just a mild annoyance, but an active energetic hemorrhage.`
        : `Across ${tagged.length} recent entries where this was present, your baseline lifted by ${diff.toFixed(1)} points. The pattern reveals that this is not merely a preference, but a structural requirement for your peace.`;

      const reframe = isDrain
        ? `This does not read as oversensitivity. It reads as your nervous system setting an immaculate boundary around what it can no longer afford to carry.`
        : `This does not read as a temporary comfort. It reads as the exact condition your body requires to finally exhale.`;

      results.push({
        id: `trigger-${tag}-${isDrain ? 'd' : 'r'}`,
        title,
        body: `${observation}\n\n${pattern}\n\n${reframe}`,
        accentColor: isDrain ? 'coral' : 'sage',
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
  const sensationNote = topSensation ? ` The most common sensation is a feeling of ${topSensation[0].toLowerCase()}.` : '';

  return {
    id: 'somatic-dominant',
    title: 'The Silent Ledger of the Body',
    body: `Your archive indicates that your physical body is acting as the primary vessel for your emotional load.\n\nAcross recent entries, when ${topEmotion.toLowerCase()} arises, it reliably lands in your ${regionLabel} before your mind fully processes it.${sensationNote}\n\nThis does not read as physical frailty. It reads as an exquisitely attuned nervous system keeping the score so your mind doesn't have to carry the truth alone.`,
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
    accentColor: 'midnightSlate',
    source: 'somatic',
    isConfirmed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Archetype Pattern
// ─────────────────────────────────────────────────────────────────────────────

const ARCHETYPE_SHADOWS: Record<ArchetypeKey, { title: string; observation: string; pattern: string; reframe: string; takeaway: string }> = {
  hero: {
    title: 'The Cost of the Climb',
    observation: 'Your archive suggests that under strain, your instinct is to simply push harder.',
    pattern: 'Across recent entries, rising pressure triggers an urge to overcome, produce, and prove strength, rather than stepping back.',
    reframe: 'This does not read as a need to prove yourself. It reads as a deeply ingrained survival strategy that hasn\'t yet learned it is safe to rest.',
    takeaway: 'When pressure spikes, notice whether you are trying to earn safety by doing more. What would strategic recovery look like first?',
  },
  caregiver: {
    title: 'The Architecture of Protection',
    observation: 'Your archive indicates that responsibility for others often attaches to you before you can refuse it.',
    pattern: 'Across your reflections, your orientation stays fixed on tending and holding others, often resulting in profound depletion.',
    reframe: 'This does not read as poor boundaries. It reads as the heavy, quiet cost of being the one who ensures everyone else is okay before checking your own reserves.',
    takeaway: 'Before meeting someone else’s need, pause long enough to ask whether the exact same need is unspoken in you.',
  },
  seeker: {
    title: 'Movement as Medicine',
    observation: 'Your archive suggests that motion and shifting focus act as your primary escape hatches.',
    pattern: 'When pressure rises, the data shows an immediate instinct to move, leave, or change the current frame.',
    reframe: 'This does not read as a lack of commitment. It reads as a highly attuned system trying to prevent feeling trapped by staying ten steps ahead.',
    takeaway: 'Notice the urge to leave or switch tasks. What happens if you stay with the current, uncomfortable moment just a little longer?',
  },
  sage: {
    title: 'The Shield of Understanding',
    observation: 'Your archive shows that cognitive understanding is your main regulatory tool.',
    pattern: 'Under pressure, your reflections immediately lean toward analyzing and solving before the raw feeling itself has had room to register.',
    reframe: 'This does not read as emotional avoidance. It reads as a brilliant mind trying to make an experience emotionally survivable by making it understandable.',
    takeaway: 'When the mind speeds up, pause before solving. What feeling is asking to be felt before it is explained?',
  },
  rebel: {
    title: 'The Friction of Constraint',
    observation: 'Your archive indicates a profound sensitivity to anything that feels like a cage.',
    pattern: 'Across recent entries, overload instantly morphs into a resistance against expectations, rules, or what feels confining.',
    reframe: 'This does not read as mere defiance. It reads as a fierce, protective stance over your own autonomy when your capacity is already stretched thin.',
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
    body: `${shadow.observation}\n\n${shadow.pattern}\n\n${shadow.reframe}`,
    heroMetrics: [
      ...(pct > 0 ? [metric(`${pct}%`, 'High-stress days', pct >= 30 ? 'caution' : 'default')] : []),
      metric(dominantName, 'Leading pattern', 'default'),
      ...(secondaryName ? [metric(secondaryName, 'Secondary', 'default')] : []),
    ],
    takeaway: takeaway('Pattern under pressure', shadow.takeaway, 'sparkles-outline'),
    accentColor: 'pearl',
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
  if (PATTERN_TAG_LABELS[tag]) return PATTERN_TAG_LABELS[tag];
  return sanitizeThemeLabel(tag);
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

  const validTags = topTags
    .map(([tag]) => resolveTagLabel(tag))
    .filter(t => t !== 'still emerging');

  const safeThemeLabel = validTags.length > 0 
    ? validTags.join(' and ') 
    : 'still emerging';

  const secureThemeLabel = topSecureTags.length > 0 ? resolveTagLabel(topSecureTags[0][0]) : null;

  let observation = `Your archive indicates that relational dynamics dictate your internal weather.`;
  let pattern = safeThemeLabel === 'still emerging'
    ? `Across recent entries, these subtle relational dynamics repeatedly surface to the top of your reflections.`
    : `Across recent entries, themes of ${safeThemeLabel.toLowerCase()} repeatedly surface to the top of your reflections.`;
    
  let reframe = `This does not read as codependency. It reads as a profound sensitivity to the safety of your connections, calculating whether the net is strong enough to hold you.`;

  if (impact !== null && Math.abs(impact) >= 0.4) {
    if (impact > 0) {
      pattern = safeThemeLabel === 'still emerging'
        ? `Across recent entries, your emotional baseline actively lifts by ${Math.abs(impact).toFixed(1)} points when these specific dynamics appear.`
        : `Across recent entries, your emotional baseline actively lifts by ${Math.abs(impact).toFixed(1)} points when themes of ${safeThemeLabel.toLowerCase()} appear.`;
      reframe = `This does not read as mere extroversion. It reads as emotional closeness functioning as literal, vital medicine for your nervous system.`;
    } else {
      pattern = safeThemeLabel === 'still emerging'
        ? `Across recent entries, your emotional baseline drops significantly when these relational dynamics are triggered.`
        : `Across recent entries, your emotional baseline drops significantly when themes of ${safeThemeLabel.toLowerCase()} appear.`;
      reframe = `This does not read as an inability to connect. It reads as a system that is carrying the heavy, unspoken cost of trying to make a dynamic safe.`;
    }
  } else if (secureThemeLabel) {
    pattern = `While older patterns surface, the data specifically highlights your intentional reach toward ${secureThemeLabel.toLowerCase()}.`;
    reframe = `This does not read as a polished performance. It reads as the stunning, quiet labor of actively rewriting your own emotional history.`;
  }

  return {
    id: 'relationship-pattern',
    title: 'The Relational Mirror',
    body: `${observation}\n\n${pattern}\n\n${reframe}`,
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
        ? `What interaction, repair, or boundary created that ${Math.abs(impact).toFixed(1)} lift? Notice the part that worked, then fiercely protect it.`
        : impact != null && impact <= -0.4
          ? `Which kind of interaction is creating that ${Math.abs(impact).toFixed(1)} drop? Name the exact dynamic so you can stop treating all connection as the same.`
          : (safeThemeLabel === 'still emerging' 
              ? `Your reflections are pointing toward a forming relational pattern. Pick one recent interaction and trace where it showed up in real time.`
              : `Your reflections are led by ${safeThemeLabel.toLowerCase()}. Pick one recent interaction and trace where that theme showed up in real time.`),
      'heart-outline',
    ),
    accentColor: 'velvet',
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
      hardDayNote = `Across ${hardDays} recent heavy days, restriction in these exact areas appears as the primary source of friction.`;
      isConfirmed = true;
    }
  }

  const observation = `Your archive indicates that your core values act as active, load-bearing walls.`;
  const pattern = `You have consistently anchored yourself to ${topList}. ${hardDayNote}`;
  const reframe = `This does not read as being stubborn or inflexible. It reads as a fierce, necessary protective stance over your own integrity.`;

  return {
    id: 'values-pressure',
    title: 'The Weight of the Core',
    body: `${observation}\n\n${pattern}\n\n${reframe}`,
    accentColor: 'taupe',
    source: 'values',
    isConfirmed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Cognitive Style & Intelligence
// ─────────────────────────────────────────────────────────────────────────────

const COGNITIVE_NOTES: Record<string, { pattern: string; reframe: string }> = {
  'big-picture+quick-intuitive': {
    pattern: 'Across your entries, you absorb context instantly and leap to first impressions without needing granular data.',
    reframe: 'This does not read as recklessness. It reads as an immaculate synthesis speed—trust it even when the details are still incomplete.'
  },
  'big-picture+careful-deliberate': {
    pattern: 'You see the vastness of the whole picture but actively refuse to commit until you have sat with the options.',
    reframe: 'This does not read as hesitation. It reads as a profound structural patience that protects you from half-built ideas.'
  },
  'big-picture+adaptive': {
    pattern: 'You think in massive patterns and shift your strategy fluidly based on the terrain.',
    reframe: 'This does not read as scattered focus. It reads as an elegant agility, allowing you to rewrite the map while you are walking it.'
  },
  'detail-oriented+quick-intuitive': {
    pattern: 'You immediately notice the exact detail others miss and intuitively grasp its meaning in seconds.',
    reframe: 'This does not read as being overly critical. It reads as an unparalleled precision that cuts through the noise.'
  },
  'detail-oriented+careful-deliberate': {
    pattern: 'You require absolute thoroughness, meticulously gathering every variable before making a move.',
    reframe: 'This does not read as perfectionism. It reads as a deep reverence for the architecture of the truth.'
  },
  'detail-oriented+adaptive': {
    pattern: 'You blend absolute precision with the willingness to change course when new facts emerge.',
    reframe: 'This does not read as inconsistency. It reads as the brilliance of an explorer who only trusts an accurate compass.'
  },
  'balanced+quick-intuitive': {
    pattern: 'You adapt to new frameworks instantly, moving decisively through the middle ground.',
    reframe: 'This does not read as impulsivity. It reads as an instinctual trust in your own navigation system.'
  },
  'balanced+careful-deliberate': {
    pattern: 'You bring a distinctly measured, flexible approach, separating your exploration phase from your commitment.',
    reframe: 'This does not read as overthinking. It reads as a mature refusal to let urgency hijack your discernment.'
  },
  'balanced+adaptive': {
    pattern: 'Your cognitive style flexes entirely depending on the context of the room you are in.',
    reframe: 'This does not read as lacking a center. It reads as a profound adaptability that guarantees your survival in any environment.'
  },
};

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

const INTELLIGENCE_NOTES: Record<IntelligenceDimensionId, { observation: string; reframe: string }> = {
  linguistic: {
    observation: 'Language functions as your primary mechanism for making sense of raw experience.',
    reframe: 'This does not read as mere eloquence. It reads as a desperate need for absolute emotional accuracy to locate reality.'
  },
  logical: {
    observation: 'Patterns, systems, and internal coherence are the bedrock of how you process the world.',
    reframe: 'This does not read as cold logic. It reads as your mind organizing the chaos into a survivable architecture.'
  },
  musical: {
    observation: 'Rhythm, tone, and sound carry the weight of real meaning for your system.',
    reframe: 'This does not read as a simple preference. It reads as music functioning as a direct conduit to process what cannot be spoken.'
  },
  spatial: {
    observation: 'You think fundamentally in images, structural layouts, and relationships in space.',
    reframe: 'This does not read as daydreaming. It reads as the capacity to literally see the geometry of a situation before it happens.'
  },
  kinesthetic: {
    observation: 'Your physical body acts as a profoundly intelligent thinking tool.',
    reframe: 'This does not read as restlessness. It reads as movement being the exact mechanism your body requires to digest the day.'
  },
  interpersonal: {
    observation: 'You read the emotional shifts, motivations, and unsaid words in a room fluently.',
    reframe: 'This does not read as hypervigilance alone. It reads as an extraordinary attunement to the safety and humanity of others.'
  },
  intrapersonal: {
    observation: 'You have devastatingly clear access to your own interior world and its patterns.',
    reframe: 'This does not read as self-absorption. It reads as a meticulous, courageous dedication to mapping your own soul.'
  },
  naturalistic: {
    observation: 'You intuitively map the seasons, ecosystems, and natural rhythms around you.',
    reframe: 'This does not read as a simple hobby. It reads as an inherent recognition that you belong to systems much older than yourself.'
  },
  existential: {
    observation: 'Your mind is involuntarily drawn to the vast questions of mortality, purpose, and depth.',
    reframe: 'This does not read as melancholy. It reads as a spirit that simply refuses to live on the shallow surface of existence.'
  },
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

  const observation = `Your archive suggests that ${topLabel} intelligence dictates how you metabolize the world.`;
  const pattern = `Across your entries, ${topLabel} and ${secondLabel} surface as the dominant lenses through which you decode your life. ${note.observation}`;
  const reframe = note.reframe;

  return {
    id: 'intelligence-profile',
    title: 'The Lenses of Your Mind',
    body: `${observation}\n\n${pattern}\n\n${reframe}`,
    accentColor: 'pearl',
    source: 'cognitive',
    isConfirmed: false,
  };
}

function buildCognitiveInsight(scores: NonNullable<SelfKnowledgeContext['cognitiveStyle']>): CrossRefInsight {
  const scope = scores.scope <= 2 ? 'big-picture' : scores.scope >= 4 ? 'detail-oriented' : 'balanced';
  const dec  = scores.decisions <= 2 ? 'quick-intuitive' : scores.decisions >= 4 ? 'careful-deliberate' : 'adaptive';

  const key  = `${scope}+${dec}`;
  const note = COGNITIVE_NOTES[key] ?? {
    pattern: `You apply a distinctly ${scope} scope alongside a ${dec} decision-making process.`,
    reframe: 'This does not read as a mere style. It reads as the exact cognitive framework that has kept you safe and effective.'
  };

  return {
    id: 'cognitive-workflow',
    title: 'The Architecture of Your Choices',
    body: `Your archive shows that understanding is your primary regulatory tool.\n\n${note.pattern}\n\n${note.reframe}`,
    accentColor: 'midnightSlate',
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

  let pattern = `Across ${summary.totalDays} days, your mind repeatedly returns to the theme of ${dominantCategory[0].replace(/_/g, ' ').toLowerCase()}.`;
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
        pattern += ` Strikingly, on the days you perform this self-inquiry, your emotional baseline lifts by ${diff.toFixed(1)} points.`;
        isConfirmed = true;
      }
    }
  }

  const observation = `Your archive suggests that inward turning is a deeply active, regulatory practice for you.`;
  const reframe = `This does not read as self-absorption. It reads as a meticulous dedication to mapping your own interior so you no longer have to navigate it in the dark.`;

  return {
    id: 'reflection-depth',
    title: 'The Depth of the Inquiry',
    body: `${observation}\n\n${pattern}\n\n${reframe}`,
    accentColor: 'taupe',
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
  
  const observation = `Your archive indicates that your sleep is functioning as an active, heavy processing state.`;
  const pattern = `Across both your physical body logs and your dream entries, the exact same sensation of ${primary.somaticEmotion.toLowerCase()} and ${primary.dreamFeeling.replace(/_/g, ' ')} surfaces repeatedly.`;
  const reframe = `This does not read as poor rest. It reads as a unified, brilliant system trying to metabolize the exact same wound from two different angles—day and night.`;

  return {
    id: 'dream-somatic-link',
    title: 'The Unified Thread',
    body: `${observation}\n\n${pattern}\n\n${reframe}`,
    accentColor: 'midnightSlate',
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

  if (onHeavyDays.length < 2) return null;

  const overlapEmotions: Record<string, number> = {};
  for (const e of onHeavyDays) {
    overlapEmotions[e.emotion] = (overlapEmotions[e.emotion] ?? 0) + 1;
  }
  const topEmotion = Object.entries(overlapEmotions).sort((a, b) => b[1] - a[1])[0];

  const observation = `Your archive reveals that your body and your words are carrying the exact same weight.`;
  const pattern = `Across your heaviest journal entries, the precise feeling of ${topEmotion[0].toLowerCase()} is simultaneously registered in your physical body map.`;
  const reframe = `This does not read as a coincidence. It reads as an undeniable physical signature—your flesh holding the line while your mind searches for the right sentence.`;

  return {
    id: 'journal-body-pattern',
    title: 'The Physical Weight of the Words',
    body: `${observation}\n\n${pattern}\n\n${reframe}`,
    heroMetrics: [
      metric(String(onHeavyDays.length), 'Overlap days'),
      metric(String(topEmotion[1]), topEmotion[0].toLowerCase()),
    ],
    takeaway: takeaway(
      'Body signature',
      `When a day starts feeling heavy, check for ${topEmotion[0].toLowerCase()} early. Catching the body signature sooner gives you a better intervention point than waiting for the spiral.`,
      'body-outline',
    ),
    accentColor: 'coral',
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

  const observation = `Your archive suggests that your deepest archetypal traits do not pause when you close your eyes.`;
  const pattern = `As the ${archetype}, your waking life is shaped by specific instincts, and your recurring dream themes of ${themeLabel} flawlessly mirror that exact same territory.`;
  const reframe = `This does not read as random neural firing. It reads as a subconscious mind relentlessly working the material your archetype demands you understand.`;

  return {
    id: 'dream-archetype-pattern',
    title: `The Nocturnal ${archetype}`,
    body: `${observation}\n\n${pattern}\n\n${reframe}`,
    accentColor: 'pearl',
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
  
  const observation = `Your archive suggests your emotional grace is profoundly tethered to your rest.`;
  const pattern = `Across recent mornings, your mood shifts flawlessly by ${Math.abs(diff).toFixed(1)} points depending entirely on the sleep from the night before.`;
  const reframe = `This does not read as emotional instability. It reads as a nervous system that relies almost entirely on sleep to maintain its protective buffer against the world.`;

  return {
    id: 'sleep-mood-link',
    title: 'The Architecture of the Morning',
    body: `${observation}\n\n${pattern}\n\n${reframe}`,
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
    accentColor: 'sage',
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
