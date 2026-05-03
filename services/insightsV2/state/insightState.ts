import type {
  GeneratedInsightIntensity,
  GeneratedInsightParagraph,
  GeneratedInsightTone,
  GeneratedInsightWriterShape,
} from '../../insights/generatedInsightParagraphs';
import type {
  InsightCurrentState,
  InsightDepthLevel,
  UserSignal,
} from '../types';

export type InsightStateScores = Record<InsightCurrentState, number>;

export interface CurrentInsightStateProfile {
  primaryState: InsightCurrentState;
  scores: InsightStateScores;
  intensity: number;
  confidence: number;
  reasonSignals: string[];
  preferredWriterShapes: GeneratedInsightWriterShape[];
  avoidedWriterShapes: GeneratedInsightWriterShape[];
  preferredTones: GeneratedInsightTone[];
  avoidedTones: GeneratedInsightTone[];
  preferredIntensities: GeneratedInsightIntensity[];
  avoidedIntensities: GeneratedInsightIntensity[];
  preferredSentenceCounts: number[];
  maxDepthLevel: InsightDepthLevel;
  reasonCodes: string[];
}

const STATES: readonly InsightCurrentState[] = [
  'calm',
  'activated',
  'overwhelmed',
  'shutdown',
  'tired',
  'openReceptive',
];

const STATE_MATCHERS: Record<InsightCurrentState, Array<{ matcher: RegExp; weight: number }>> = {
  calm: [
    { matcher: /\b(calm|peace|grounded|safe|steady|contentment|low stress|low_stress|restorative|settled)\b/i, weight: 1.1 },
    { matcher: /\b(unusually steady|steady mood|baseline recovery|trust|rest without guilt)\b/i, weight: 0.8 },
  ],
  activated: [
    { matcher: /\b(high stress|high_stress|fear|anger|unsafe|mistrust|trapped|powerlessness|sharp emotional shift|tone_sensitivity)\b/i, weight: 1.35 },
    { matcher: /\b(trigger|bracing|preparedness|safety scan|hypervigilance|alert|threat|rupture|conflict)\b/i, weight: 1.05 },
  ],
  overwhelmed: [
    { matcher: /\b(overwhelm|ongoing high distress|ongoing_high_distress|scattered attention|scattered_attention|capacity strain|capacity_strain)\b/i, weight: 1.35 },
    { matcher: /\b(overextension|burnout risk|burnout_risk|too much|demand density|mental load|high stress|high_stress)\b/i, weight: 1.05 },
  ],
  shutdown: [
    { matcher: /\b(shutdown|numbness|numb|disconnected|indifferent|helplessness|despair|muted|withdraw|detached)\b/i, weight: 1.35 },
    { matcher: /\b(low mood|low_mood|quiet|blank|body disconnected|avoidance|avoid)\b/i, weight: 0.85 },
  ],
  tired: [
    { matcher: /\b(low energy|low_energy|low sleep|low_sleep|poor sleep|poor_sleep_quality|fatigue|depletion|recovery gap|recovery_gap)\b/i, weight: 1.35 },
    { matcher: /\b(rest resistance|rest_resistance|sleep mood link|sleep_mood_link|burnout|capacity|tired|heavy)\b/i, weight: 0.9 },
  ],
  openReceptive: [
    { matcher: /\b(joy|gratitude|curiosity|inspired|hope|confidence|trust|safe|glimmer|relief|open receiving|open_receiving)\b/i, weight: 1.2 },
    { matcher: /\b(grounded|support|connection glimmer|connection_glimmer|aliveness|pleasure|play|contentment)\b/i, weight: 0.8 },
  ],
};

const STATE_PREFERENCES: Record<InsightCurrentState, Pick<
  CurrentInsightStateProfile,
  | 'preferredWriterShapes'
  | 'avoidedWriterShapes'
  | 'preferredTones'
  | 'avoidedTones'
  | 'preferredIntensities'
  | 'avoidedIntensities'
  | 'preferredSentenceCounts'
  | 'maxDepthLevel'
>> = {
  calm: {
    preferredWriterShapes: ['patternAnalysis', 'questionLed', 'poetic'],
    avoidedWriterShapes: [],
    preferredTones: ['grounded', 'reflective', 'poetic'],
    avoidedTones: [],
    preferredIntensities: ['medium', 'high'],
    avoidedIntensities: [],
    preferredSentenceCounts: [5],
    maxDepthLevel: 3,
  },
  activated: {
    preferredWriterShapes: ['body', 'practicalCapacity', 'punch'],
    avoidedWriterShapes: ['poetic', 'questionLed'],
    preferredTones: ['grounded', 'direct', 'practical'],
    avoidedTones: ['poetic'],
    preferredIntensities: ['low', 'medium'],
    avoidedIntensities: ['high'],
    preferredSentenceCounts: [4],
    maxDepthLevel: 2,
  },
  overwhelmed: {
    preferredWriterShapes: ['tender', 'body', 'practicalCapacity'],
    avoidedWriterShapes: ['poetic', 'questionLed', 'patternAnalysis', 'contrast'],
    preferredTones: ['tender', 'grounded', 'practical'],
    avoidedTones: ['poetic', 'reflective'],
    preferredIntensities: ['low', 'medium'],
    avoidedIntensities: ['high'],
    preferredSentenceCounts: [4],
    maxDepthLevel: 1,
  },
  shutdown: {
    preferredWriterShapes: ['tender', 'body', 'practicalCapacity'],
    avoidedWriterShapes: ['contrast', 'poetic', 'questionLed'],
    preferredTones: ['tender', 'grounded'],
    avoidedTones: ['direct', 'poetic'],
    preferredIntensities: ['low'],
    avoidedIntensities: ['high'],
    preferredSentenceCounts: [4],
    maxDepthLevel: 1,
  },
  tired: {
    preferredWriterShapes: ['tender', 'practicalCapacity', 'body'],
    avoidedWriterShapes: ['poetic', 'questionLed'],
    preferredTones: ['tender', 'grounded', 'practical'],
    avoidedTones: ['poetic'],
    preferredIntensities: ['low', 'medium'],
    avoidedIntensities: ['high'],
    preferredSentenceCounts: [4],
    maxDepthLevel: 2,
  },
  openReceptive: {
    preferredWriterShapes: ['tender', 'poetic', 'questionLed', 'patternAnalysis'],
    avoidedWriterShapes: [],
    preferredTones: ['tender', 'poetic', 'reflective', 'grounded'],
    avoidedTones: [],
    preferredIntensities: ['medium', 'high'],
    avoidedIntensities: [],
    preferredSentenceCounts: [5],
    maxDepthLevel: 4,
  },
};

function emptyScores(): InsightStateScores {
  return {
    calm: 0,
    activated: 0,
    overwhelmed: 0,
    shutdown: 0,
    tired: 0,
    openReceptive: 0,
  };
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalize(value: unknown): string {
  return stringValue(value).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function safeStringArray(values: unknown): string[] {
  return Array.isArray(values)
    ? values.filter((value): value is string => typeof value === 'string')
    : [];
}

function signalText(signal: Partial<UserSignal> | null | undefined): string {
  if (!signal) return '';
  const evidence = signal.evidence && typeof signal.evidence === 'object'
    ? signal.evidence
    : null;

  return normalize([
    signal.key,
    signal.source,
    signal.sentiment,
    ...safeStringArray(signal.roles),
    evidence?.label,
    evidence?.phrase,
    evidence?.signal,
  ].filter(Boolean).join(' '));
}

function dateKey(value: unknown): string | null {
  const raw = stringValue(value);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  const parsed = new Date(raw);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null;
}

function dateWeight(signalDate: unknown, insightDate: string): number {
  const signalKey = dateKey(signalDate);
  if (!signalKey) return 0.4;
  if (signalKey === insightDate) return 1;
  const signalTime = new Date(`${signalKey}T12:00:00Z`).getTime();
  const insightTime = new Date(`${insightDate}T12:00:00Z`).getTime();
  if (!Number.isFinite(signalTime) || !Number.isFinite(insightTime)) return 0.4;
  const days = Math.abs(insightTime - signalTime) / 86_400_000;
  if (days <= 1) return 0.75;
  if (days <= 7) return 0.45;
  return 0.2;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function choosePrimaryState(scores: InsightStateScores): InsightCurrentState {
  const priority: InsightCurrentState[] = [
    'overwhelmed',
    'shutdown',
    'activated',
    'tired',
    'openReceptive',
    'calm',
  ];

  return [...STATES].sort((a, b) => {
    const delta = scores[b] - scores[a];
    if (Math.abs(delta) > 0.08) return delta;
    return priority.indexOf(a) - priority.indexOf(b);
  })[0];
}

export function detectCurrentInsightState(
  signals: readonly UserSignal[] | null | undefined,
  date: string | null | undefined,
): CurrentInsightStateProfile {
  const insightDate = dateKey(date) ?? new Date().toISOString().slice(0, 10);
  const scores = emptyScores();
  const reasonSignals: string[] = [];

  for (const signal of Array.isArray(signals) ? signals : []) {
    const text = signalText(signal);
    const recency = dateWeight(signal?.date, insightDate);
    const numericStrength = typeof signal?.strength === 'number'
      ? signal.strength
      : Number(signal?.strength);
    const strength = clamp(Number.isFinite(numericStrength) ? numericStrength : 0.5, 0.25, 1);
    const signalKey = stringValue(signal?.key);

    for (const state of STATES) {
      for (const { matcher, weight } of STATE_MATCHERS[state]) {
        if (!matcher.test(text)) continue;
        scores[state] += weight * recency * strength;
        if (signalKey) reasonSignals.push(signalKey);
      }
    }
  }

  if (Object.values(scores).every(score => score === 0)) {
    scores.calm = 0.25;
  }

  const primaryState = choosePrimaryState(scores);
  const topScore = scores[primaryState];
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const preferences = STATE_PREFERENCES[primaryState];

  return {
    primaryState,
    scores: Object.fromEntries(
      Object.entries(scores).map(([key, value]) => [key, Number(value.toFixed(4))]),
    ) as InsightStateScores,
    intensity: Number(clamp(topScore / 3.5, 0, 1).toFixed(2)),
    confidence: Number(clamp(total ? topScore / total : 0.2, 0, 1).toFixed(2)),
    reasonSignals: unique(reasonSignals).slice(0, 12),
    ...preferences,
    reasonCodes: [
      `state:${primaryState}`,
      ...unique(reasonSignals).slice(0, 5).map(signal => `signal:${signal}`),
    ],
  };
}

function sentenceCount(text: string): number {
  return text.match(/[.!?](?=\s|$)/g)?.length ?? 0;
}

export function stateAwareParagraphScore(
  paragraph: Pick<
    GeneratedInsightParagraph,
    'writerShape' | 'tone' | 'intensity' | 'body'
  >,
  stateProfile?: CurrentInsightStateProfile | null,
): number {
  if (!stateProfile) return 0;

  let score = 0;
  const preferredWriterShapes = stateProfile.preferredWriterShapes ?? [];
  const avoidedWriterShapes = stateProfile.avoidedWriterShapes ?? [];
  const preferredTones = stateProfile.preferredTones ?? [];
  const avoidedTones = stateProfile.avoidedTones ?? [];
  const preferredIntensities = stateProfile.preferredIntensities ?? [];
  const avoidedIntensities = stateProfile.avoidedIntensities ?? [];
  const preferredSentenceCounts = stateProfile.preferredSentenceCounts ?? [];

  if (preferredWriterShapes.includes(paragraph.writerShape)) score += 9;
  if (avoidedWriterShapes.includes(paragraph.writerShape)) score -= 12;
  if (preferredTones.includes(paragraph.tone)) score += 6;
  if (avoidedTones.includes(paragraph.tone)) score -= 8;
  if (preferredIntensities.includes(paragraph.intensity)) score += 6;
  if (avoidedIntensities.includes(paragraph.intensity)) score -= 10;

  const count = sentenceCount(paragraph.body);
  if (preferredSentenceCounts.includes(count)) score += 4;
  if (stateProfile.maxDepthLevel <= 1 && paragraph.writerShape === 'questionLed') score -= 6;
  if (stateProfile.maxDepthLevel <= 2 && paragraph.writerShape === 'poetic') score -= 5;
  if (stateProfile.primaryState === 'openReceptive' && paragraph.writerShape === 'poetic') score += 4;
  if (stateProfile.primaryState === 'calm' && paragraph.writerShape === 'patternAnalysis') score += 4;

  const confidence = typeof stateProfile.confidence === 'number' && Number.isFinite(stateProfile.confidence)
    ? stateProfile.confidence
    : 0.2;
  const stateWeight = 0.55 + clamp(confidence, 0, 1) * 0.45;
  return Number((score * stateWeight).toFixed(4));
}
