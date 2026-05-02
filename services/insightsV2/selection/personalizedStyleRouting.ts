import type {
  GeneratedInsightParagraph,
  GeneratedInsightTone,
  GeneratedInsightWriterShape,
} from '../../insights/generatedInsightParagraphs';
import type { InsightFeedbackProfile } from '../feedback/insightOutcomeFeedback';
import type { InsightCandidateSurface, PatternType } from '../types';

export type PersonalizedInsightStyle =
  | 'directTruth'
  | 'tenderValidation'
  | 'bodyFirst'
  | 'practicalNextStep'
  | 'poeticMeaning'
  | 'reflectiveQuestion';

export type PersonalizedInsightDepth =
  | 'compact'
  | 'standard'
  | 'deeperReflective';

export interface PersonalizedInsightStyleRoute {
  styles: PersonalizedInsightStyle[];
  avoidedStyles: PersonalizedInsightStyle[];
  preferredWriterShapes: GeneratedInsightWriterShape[];
  avoidedWriterShapes: GeneratedInsightWriterShape[];
  preferredTones: GeneratedInsightTone[];
  avoidedTones: GeneratedInsightTone[];
  preferredPatternTypes: PatternType[];
  avoidedPatternTypes: PatternType[];
  preferredDepth: PersonalizedInsightDepth;
  preferredSentenceCounts: number[];
  avoidsPracticalPrompts: boolean;
  confidence: number;
  reasonCodes: string[];
}

const STYLE_WRITER_SHAPES: Record<PersonalizedInsightStyle, GeneratedInsightWriterShape[]> = {
  directTruth: ['punch', 'contrast'],
  tenderValidation: ['tender'],
  bodyFirst: ['body'],
  practicalNextStep: ['practicalCapacity'],
  poeticMeaning: ['poetic'],
  reflectiveQuestion: ['questionLed', 'patternAnalysis', 'threshold'],
};

const STYLE_TONES: Record<PersonalizedInsightStyle, GeneratedInsightTone[]> = {
  directTruth: ['direct'],
  tenderValidation: ['tender', 'grounded'],
  bodyFirst: ['grounded'],
  practicalNextStep: ['practical'],
  poeticMeaning: ['poetic'],
  reflectiveQuestion: ['reflective'],
};

function sentenceCount(text: string): number {
  return text.match(/[.!?](?=\s|$)/g)?.length ?? 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function entriesByWeight<T extends string>(
  weights: Partial<Record<T, number>> | Record<string, number>,
  direction: 'positive' | 'negative',
  threshold = 0.4,
): T[] {
  return Object.entries(weights)
    .filter(([, raw]) => {
      const weight = typeof raw === 'number' ? raw : 0;
      return direction === 'positive' ? weight > threshold : weight < -threshold;
    })
    .sort(([, a], [, b]) => (
      direction === 'positive'
        ? (b as number) - (a as number)
        : (a as number) - (b as number)
    ))
    .map(([key]) => key as T);
}

function styleWeight(
  style: PersonalizedInsightStyle,
  profile: InsightFeedbackProfile,
): number {
  const shapeWeight = STYLE_WRITER_SHAPES[style].reduce(
    (sum, shape) => sum + (profile.writerShapeWeights[shape] ?? 0),
    0,
  );
  const toneWeight = STYLE_TONES[style].reduce(
    (sum, tone) => sum + (profile.toneWeights[tone] ?? 0),
    0,
  );
  const practicalWeight = style === 'practicalNextStep' ? profile.practicalPromptWeight : 0;

  return Number((shapeWeight + toneWeight + practicalWeight).toFixed(4));
}

function unique<T extends string | number>(values: T[]): T[] {
  return Array.from(new Set(values.filter(value => value !== '' && value != null)));
}

function preferredDepthFromProfile(profile?: InsightFeedbackProfile | null): PersonalizedInsightDepth {
  if (!profile || profile.eventCount === 0) return 'standard';
  const four = profile.sentenceCountWeights['4'] ?? 0;
  const five = profile.sentenceCountWeights['5'] ?? 0;
  if (five - four > 1) return 'deeperReflective';
  if (four - five > 1) return 'compact';
  return 'standard';
}

function defaultStyleRoute(): PersonalizedInsightStyleRoute {
  return {
    styles: [],
    avoidedStyles: [],
    preferredWriterShapes: [],
    avoidedWriterShapes: [],
    preferredTones: [],
    avoidedTones: [],
    preferredPatternTypes: [],
    avoidedPatternTypes: [],
    preferredDepth: 'standard',
    preferredSentenceCounts: [],
    avoidsPracticalPrompts: false,
    confidence: 0,
    reasonCodes: [],
  };
}

export function buildPersonalizedInsightStyleRoute(
  profile?: InsightFeedbackProfile | null,
): PersonalizedInsightStyleRoute {
  if (!profile || profile.eventCount === 0) return defaultStyleRoute();

  const styleWeights = (Object.keys(STYLE_WRITER_SHAPES) as PersonalizedInsightStyle[])
    .map(style => ({ style, weight: styleWeight(style, profile) }));
  const styles = styleWeights
    .filter(item => item.weight > 0.6)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(item => item.style);
  const avoidedStyles = styleWeights
    .filter(item => item.weight < -0.6)
    .sort((a, b) => a.weight - b.weight)
    .slice(0, 3)
    .map(item => item.style);
  const preferredWriterShapes = unique([
    ...profile.preferred.writerShapes,
    ...styles.flatMap(style => STYLE_WRITER_SHAPES[style]),
  ]).slice(0, 6);
  const avoidedWriterShapes = entriesByWeight<GeneratedInsightWriterShape>(
    profile.writerShapeWeights,
    'negative',
  ).slice(0, 6);
  const preferredTones = unique([
    ...profile.preferred.tones,
    ...styles.flatMap(style => STYLE_TONES[style]),
  ]).slice(0, 5);
  const avoidedTones = entriesByWeight<GeneratedInsightTone>(
    profile.toneWeights,
    'negative',
  ).slice(0, 5);
  const preferredPatternTypes = profile.preferred.patternTypes.slice(0, 4);
  const avoidedPatternTypes = entriesByWeight<PatternType>(
    profile.patternTypeWeights,
    'negative',
  ).slice(0, 4);
  const preferredDepth = preferredDepthFromProfile(profile);
  const preferredSentenceCounts = unique([
    ...profile.preferred.sentenceCounts,
    ...(preferredDepth === 'compact' ? [4] : []),
    ...(preferredDepth === 'deeperReflective' ? [5] : []),
  ]).slice(0, 2);
  const meaningfulEvents = profile.positiveCount + profile.negativeCount;

  return {
    styles,
    avoidedStyles,
    preferredWriterShapes,
    avoidedWriterShapes,
    preferredTones,
    avoidedTones,
    preferredPatternTypes,
    avoidedPatternTypes,
    preferredDepth,
    preferredSentenceCounts,
    avoidsPracticalPrompts: profile.preferred.avoidsPracticalPrompts,
    confidence: Number(clamp(meaningfulEvents / 12, 0, 1).toFixed(2)),
    reasonCodes: [
      ...styles.map(style => `prefers:${style}`),
      ...avoidedStyles.map(style => `avoids:${style}`),
      ...preferredPatternTypes.map(patternType => `prefersPatternType:${patternType}`),
      ...avoidedPatternTypes.map(patternType => `avoidsPatternType:${patternType}`),
      ...(preferredDepth !== 'standard' ? [`prefersDepth:${preferredDepth}`] : []),
      ...(profile.preferred.avoidsPracticalPrompts ? ['avoids:practicalPrompt'] : []),
    ],
  };
}

function paragraphStyles(paragraph: Pick<GeneratedInsightParagraph, 'writerShape' | 'tone' | 'anchors' | 'category'>): PersonalizedInsightStyle[] {
  const styles: PersonalizedInsightStyle[] = [];

  for (const style of Object.keys(STYLE_WRITER_SHAPES) as PersonalizedInsightStyle[]) {
    if (
      STYLE_WRITER_SHAPES[style].includes(paragraph.writerShape) ||
      STYLE_TONES[style].includes(paragraph.tone)
    ) {
      styles.push(style);
    }
  }

  if (
    paragraph.writerShape === 'body' ||
    paragraph.category === 'bodySignals' ||
    paragraph.anchors.some(anchor => /body|chest|breath|somatic|sensation|gut|throat|jaw/.test(anchor))
  ) {
    styles.push('bodyFirst');
  }

  return unique(styles);
}

export function personalizedStyleRouteScore(
  paragraph: Pick<
    GeneratedInsightParagraph,
    | 'writerShape'
    | 'patternType'
    | 'tone'
    | 'body'
    | 'anchors'
    | 'category'
  >,
  route?: PersonalizedInsightStyleRoute | null,
  surface?: InsightCandidateSurface,
): number {
  if (!route || route.confidence <= 0) return 0;

  const styles = paragraphStyles(paragraph);
  const count = sentenceCount(paragraph.body);
  const practicalStyle = paragraph.writerShape === 'practicalCapacity' || paragraph.tone === 'practical';
  const surfaceMultiplier = surface === 'weeklyDeepDive' ? 0.8 : 1;
  const confidenceMultiplier = 0.45 + route.confidence * 0.55;

  let score = 0;
  if (route.preferredWriterShapes.includes(paragraph.writerShape)) score += 8;
  if (route.avoidedWriterShapes.includes(paragraph.writerShape)) score -= 10;
  if (route.preferredTones.includes(paragraph.tone)) score += 4;
  if (route.avoidedTones.includes(paragraph.tone)) score -= 6;
  if (route.preferredPatternTypes.includes(paragraph.patternType)) score += 9;
  if (route.avoidedPatternTypes.includes(paragraph.patternType)) score -= 12;
  score += styles.filter(style => route.styles.includes(style)).length * 6;
  score -= styles.filter(style => route.avoidedStyles.includes(style)).length * 8;
  if (route.preferredSentenceCounts.includes(count)) score += 4;
  if (route.preferredDepth === 'compact' && count === 4) score += 3;
  if (route.preferredDepth === 'deeperReflective' && count >= 5) score += 3;
  if (route.avoidsPracticalPrompts && practicalStyle) score -= 8;

  return Number((score * confidenceMultiplier * surfaceMultiplier).toFixed(4));
}
