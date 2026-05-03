import type {
  InsightCandidate,
  InsightCategory,
  InsightDataSource,
  PatternConfidence,
  PatternType,
} from '../types';
import { isDreamInsightCategory } from '../taxonomy/insightTaxonomy';
import {
  protectiveStrategyInputFromInsightCandidate,
  selectProtectiveStrategy,
  type ProtectiveStrategy,
} from './protectiveStrategyMapping';

export interface RootPatternEvidence {
  patternKey: string;
  title: string;
  category: InsightCategory;
  majorDomain?: string;
  insightSubcategory?: string;
  patternType?: PatternType;
  anchors: string[];
  signalTypes: string[];
  sources: InsightDataSource[];
  strength: number;
  confidence?: PatternConfidence;
  protectiveStrategy?: ProtectiveStrategy | null;
}

export interface RootPatternConstellation {
  id: string;
  title: string;
  name: string;
  protectiveMove: string;
  body: string;
  protects: string;
  costs: string;
  softens: string;
  reflectionPrompt: string;
  matchedPatternKeys: string[];
  matchedPatternTitles: string[];
  matchedCategories: InsightCategory[];
  matchedDomains: string[];
  matchedSubcategories: string[];
  matchedPatternTypes: PatternType[];
  matchedProtectiveStrategies: string[];
  anchors: string[];
  signalTypes: string[];
  sources: InsightDataSource[];
  strength: number;
  confidence: PatternConfidence;
  evidenceCount: number;
  isV2Derived: true;
}

interface RootPatternDefinition {
  id: string;
  title: string;
  name: string;
  protectiveMove: string;
  body: string;
  protects: string;
  costs: string;
  softens: string;
  reflectionPrompt: string;
  categoryWeights: Partial<Record<InsightCategory, number>>;
  domainMatchers: RegExp[];
  subcategoryMatchers: RegExp[];
  anchorMatchers: RegExp[];
  signalMatchers: RegExp[];
  patternTypeWeights?: Partial<Record<PatternType, number>>;
  minimumEvidenceCount: number;
}

const ROOT_PATTERN_DEFINITIONS: readonly RootPatternDefinition[] = [
  {
    id: 'catchDisconnectionBeforeItHappens',
    title: 'Root Pattern',
    name: 'Catching disconnection before it happens',
    protectiveMove: 'trying to catch disconnection before it happens',
    body:
      'Several patterns seem to gather around the same protective move: trying to catch disconnection before it happens. It can appear as tracking tone, choosing words with extra care, bracing in your body, or hesitating when support arrives. The move protects connection, clarity, and the chance to repair before distance gets too far away. It can also leave you living inside a break that has not actually happened. What helps is repair that becomes real, support that shares the weight, and a pause before you take responsibility for the whole connection.',
    protects:
      'It protects the chance to stay close without being misunderstood, dropped, or left alone with the repair.',
    costs:
      'It can make neutral moments feel urgent, as if the connection needs immediate management before anyone has actually stepped away.',
    softens:
      'It softens when repair has a real path back and support arrives early enough that you do not have to prevent every rupture alone.',
    reflectionPrompt:
      'Where did you try to prevent disconnection before you knew whether disconnection was actually happening?',
    categoryWeights: {
      relationships: 32,
      communicationVoice: 30,
      supportBelonging: 24,
      selfWorthReceiving: 22,
      safetyRegulation: 20,
      bodySignals: 18,
      responsibilityCare: 14,
      familyHome: 12,
      cognitiveStyle: 10,
    },
    domainMatchers: [/attachment/i, /connection/i, /belonging/i, /voice/i, /social/i],
    subcategoryMatchers: [/tone/i, /repair/i, /closeness/i, /abandon/i, /trust/i, /availability/i, /conflict/i, /heard/i, /receiv/i],
    anchorMatchers: [/tone/i, /repair/i, /support/i, /receiv/i, /understood/i, /body-before-words/i, /safety/i, /connection/i],
    signalMatchers: [/tone/i, /repair/i, /rupture/i, /misunder/i, /explain/i, /support/i, /receiv/i, /bracing/i, /body/i, /connection/i],
    patternTypeWeights: {
      highTracking: 8,
      pushPull: 7,
      delayedActivation: 4,
    },
    minimumEvidenceCount: 3,
  },
  {
    id: 'carryingBeforeChoiceHasRoom',
    title: 'Root Pattern',
    name: 'Carrying before choice has room',
    protectiveMove: 'stepping in before you have checked whether the weight is yours',
    body:
      'Several patterns seem to gather around the same protective move: stepping in before you have checked whether the weight is yours. It can appear as noticing what is unfinished, tracking what could fall through, saying yes before your limit has language, or taking over because waiting feels risky. The move protects stability, care, and the people or situations you do not want to see collapse. It can also leave you responsible for weight that never got shared. What helps is letting capacity, consent, and support enter before the loose end lands fully in your hands.',
    protects:
      'It protects stability and care by making sure important things do not fall apart while everyone else is still catching up.',
    costs:
      'It can turn awareness into assignment, leaving you with responsibility you never clearly chose.',
    softens:
      'It softens when noticing something does not automatically mean owning it, and when shared support becomes part of the moment early.',
    reflectionPrompt:
      'What did you pick up because you saw it first, not because it was clearly yours?',
    categoryWeights: {
      responsibilityCare: 34,
      boundariesSelfTrust: 28,
      familyHome: 24,
      supportBelonging: 18,
      timeRhythms: 16,
      restCapacity: 14,
      workAmbition: 14,
      selfWorthReceiving: 12,
      valuesIntegrity: 10,
    },
    domainMatchers: [/responsibility/i, /family/i, /boundar/i, /exchange/i, /fairness/i, /care/i],
    subcategoryMatchers: [/caretaking/i, /responsibility/i, /overgiving/i, /obligation/i, /limit/i, /role/i, /fairness/i],
    anchorMatchers: [/care/i, /responsib/i, /shared/i, /load/i, /boundary/i, /capacity/i, /support/i],
    signalMatchers: [/mental load/i, /responsib/i, /caretaking/i, /overextension/i, /boundary/i, /obligation/i, /support/i, /capacity/i],
    patternTypeWeights: {
      highTracking: 8,
      pushPull: 6,
      delayedActivation: 3,
    },
    minimumEvidenceCount: 3,
  },
  {
    id: 'makingUncertaintyTrackable',
    title: 'Root Pattern',
    name: 'Making uncertainty trackable',
    protectiveMove: 'turning uncertainty into something you can track, explain, or organize',
    body:
      'Several patterns seem to gather around the same protective move: turning uncertainty into something you can track, explain, or organize. It can appear as planning ahead, searching for the exact words, watching for risk, or trying to make the next step feel fully knowable before you move. The move protects steadiness when the situation has not given you enough solid ground. It can also keep your attention working long after the present moment has offered all it can. What helps is one honest next step, enough information to move safely, and permission to leave some of the future unfinalized.',
    protects:
      'It protects steadiness by giving shape to ambiguity before ambiguity has a chance to swallow the room.',
    costs:
      'It can make clarity feel like a requirement for safety, even when a smaller next step would be enough.',
    softens:
      'It softens when the next move can be honest without being total, and when uncertainty is allowed to stay partly unfinished.',
    reflectionPrompt:
      'Where are you trying to make the whole future clear before taking the next true step?',
    categoryWeights: {
      cognitiveStyle: 32,
      communicationVoice: 26,
      safetyRegulation: 24,
      timeRhythms: 22,
      workAmbition: 20,
      lifeDirection: 18,
      scarcityAbundance: 16,
      valuesIntegrity: 14,
    },
    domainMatchers: [/cognitive/i, /appraisal/i, /safety/i, /time/i, /agency/i, /future/i, /competence/i],
    subcategoryMatchers: [/clarity/i, /planning/i, /risk/i, /control/i, /uncertain/i, /future/i, /meaning/i, /choice/i],
    anchorMatchers: [/clarity/i, /future/i, /safety/i, /pressure/i, /rushed/i, /demand/i, /choice/i],
    signalMatchers: [/clarity/i, /explain/i, /analysis/i, /control/i, /uncertain/i, /future/i, /pressure/i, /planning/i, /risk/i],
    patternTypeWeights: {
      highTracking: 8,
      delayedActivation: 4,
      pushPull: 4,
    },
    minimumEvidenceCount: 3,
  },
  {
    id: 'distanceToStayFunctional',
    title: 'Root Pattern',
    name: 'Creating distance to stay functional',
    protectiveMove: 'creating distance so the moment stays manageable',
    body:
      'Several patterns seem to gather around the same protective move: creating distance so the moment stays manageable. It can appear as going quiet, staying surface-level, minimizing the impact, delaying the feeling, or letting something drift because naming it would ask too much. The move protects your ability to keep functioning when closeness, conflict, sensation, or emotion feels too loaded. It can also leave important things unresolved until they return later with more weight. What helps is a slower doorway back in, where you can name one true piece without forcing the whole feeling open at once.',
    protects:
      'It protects functioning by lowering the emotional volume before the moment becomes too much to carry.',
    costs:
      'It can leave the real feeling waiting in the background, where it may grow heavier because it never got contact.',
    softens:
      'It softens when there is a low-pressure way to come back to the feeling without being flooded by it.',
    reflectionPrompt:
      'Where did distance help you get through the moment, and what might still need a little contact?',
    categoryWeights: {
      emotionalWeather: 28,
      relationships: 22,
      bodySignals: 22,
      restCapacity: 20,
      griefTransitions: 18,
      supportBelonging: 16,
      boundariesSelfTrust: 16,
      safetyRegulation: 16,
    },
    domainMatchers: [/avoidance/i, /defense/i, /regulation/i, /emotional/i, /rest/i, /withdraw/i],
    subcategoryMatchers: [/avoid/i, /numb/i, /disconnect/i, /delay/i, /minimiz/i, /shutdown/i, /distance/i],
    anchorMatchers: [/unresolved/i, /surface/i, /quiet/i, /delayed/i, /distance/i, /numb/i],
    signalMatchers: [/avoid/i, /numb/i, /disconnect/i, /quiet/i, /withdraw/i, /shutdown/i, /minimiz/i, /delayed/i, /drift/i],
    patternTypeWeights: {
      lowAccess: 10,
      delayedActivation: 8,
      pushPull: 4,
    },
    minimumEvidenceCount: 3,
  },
  {
    id: 'protectingChoiceFromPressure',
    title: 'Root Pattern',
    name: 'Protecting choice from pressure',
    protectiveMove: 'protecting choice when pressure starts taking up too much space',
    body:
      'Several patterns seem to gather around the same protective move: protecting choice when pressure starts taking up too much space. It can appear as resistance, hesitation, resentment after yes, a sharper need for boundaries, or the feeling that a practical request has started to claim more of you than it should. The move protects autonomy, integrity, and the part of you that needs room to decide honestly. It can also make simple requests feel charged before you know what you actually want. What helps is separating the request from the pressure around it, then letting your real yes or no arrive without being rushed.',
    protects:
      'It protects autonomy and integrity by keeping your choice from disappearing inside someone else’s urgency.',
    costs:
      'It can make pressure feel like danger even before you have checked whether there is still room to choose.',
    softens:
      'It softens when your yes, no, or pause can exist without having to defend its right to be there.',
    reflectionPrompt:
      'Where did the pressure around a request become louder than your actual choice?',
    categoryWeights: {
      boundariesSelfTrust: 32,
      valuesIntegrity: 28,
      responsibilityCare: 22,
      timeRhythms: 18,
      workAmbition: 18,
      lifeDirection: 16,
      familyHome: 14,
    },
    domainMatchers: [/autonomy/i, /self-determination/i, /agency/i, /boundar/i, /integrity/i, /values/i],
    subcategoryMatchers: [/choice/i, /pressure/i, /resistance/i, /obligation/i, /yes/i, /no/i, /autonomy/i, /alignment/i],
    anchorMatchers: [/boundary/i, /choice/i, /pressure/i, /capacity/i, /responsib/i, /alignment/i],
    signalMatchers: [/pressure/i, /choice/i, /boundary/i, /resent/i, /obligation/i, /resistance/i, /alignment/i, /integrity/i],
    patternTypeWeights: {
      highTracking: 6,
      pushPull: 8,
      delayedActivation: 5,
    },
    minimumEvidenceCount: 3,
  },
  {
    id: 'earningSafetyThroughUsefulness',
    title: 'Root Pattern',
    name: 'Earning safety through usefulness',
    protectiveMove: 'trying to feel safe by being useful, prepared, or easy to value',
    body:
      'Several patterns seem to gather around the same protective move: trying to feel safe by being useful, prepared, or easy to value. It can appear as measuring what care might cost, pushing output past recovery, taking responsibility quickly, or feeling uneasy when support arrives without a task attached. The move protects belonging by making sure you have a reason to be kept close. It can also make rest, receiving, and ordinary care feel less available than they really are. What helps is letting care land before it becomes a transaction, and letting usefulness stop being the only proof that you belong.',
    protects:
      'It protects belonging by giving care, approval, or support a reason that feels easier to trust.',
    costs:
      'It can make care feel conditional, as if you have to keep producing value before you are allowed to receive anything real.',
    softens:
      'It softens when support can arrive without debt and when rest is treated as part of being alive, not a reward for being useful.',
    reflectionPrompt:
      'Where did you try to become easier to value instead of letting care arrive as it was?',
    categoryWeights: {
      selfWorthReceiving: 34,
      responsibilityCare: 26,
      workAmbition: 24,
      supportBelonging: 22,
      restCapacity: 18,
      scarcityAbundance: 14,
      pleasurePlay: 12,
    },
    domainMatchers: [/conditional worth/i, /self-worth/i, /support/i, /competence/i, /work/i, /rest/i],
    subcategoryMatchers: [/earn/i, /useful/i, /worth/i, /receiv/i, /support/i, /performance/i, /rest/i, /approval/i],
    anchorMatchers: [/receiv/i, /support/i, /rest/i, /deserving/i, /enough/i, /care/i],
    signalMatchers: [/worth/i, /earn/i, /useful/i, /support/i, /receiv/i, /performance/i, /output/i, /approval/i, /rest guilt/i],
    patternTypeWeights: {
      highTracking: 5,
      pushPull: 8,
      delayedActivation: 4,
    },
    minimumEvidenceCount: 3,
  },
  {
    id: 'bodyCarriesWhatIsUnspoken',
    title: 'Root Pattern',
    name: 'The body carrying what is still unspoken',
    protectiveMove: 'letting the body hold the warning before the words arrive',
    body:
      'Several patterns seem to gather around the same protective move: letting the body hold the warning before the words arrive. It can appear as chest tightness, breath changes, a quick brace, tiredness after the pressure lifts, or a sensation that stays after the conversation has moved on. The move protects you by making hidden weight visible before it becomes impossible to ignore. It can also leave you trying to function while your body is still carrying a story the mind has not caught up to. What helps is acknowledging the signal early, giving the body room to settle, and letting sensation become information instead of a private alarm.',
    protects:
      'It protects you by making hidden pressure visible before it has to become louder to be believed.',
    costs:
      'It can leave the body doing emotional labor in silence while the rest of the day keeps asking you to continue.',
    softens:
      'It softens when sensation gets attention early, before discomfort has to become the only way the truth can reach you.',
    reflectionPrompt:
      'Where did your body know something before your words did?',
    categoryWeights: {
      bodySignals: 34,
      safetyRegulation: 28,
      emotionalWeather: 22,
      relationships: 18,
      restCapacity: 18,
      griefTransitions: 14,
      responsibilityCare: 12,
    },
    domainMatchers: [/embodiment/i, /somatic/i, /safety/i, /emotional/i, /rest/i],
    subcategoryMatchers: [/body/i, /chest/i, /breath/i, /tension/i, /sensation/i, /bracing/i, /depletion/i],
    anchorMatchers: [/body/i, /chest/i, /breath/i, /tension/i, /sensation/i, /body-before-words/i],
    signalMatchers: [/body/i, /somatic/i, /chest/i, /breath/i, /jaw/i, /gut/i, /throat/i, /tension/i, /sensation/i, /bracing/i],
    patternTypeWeights: {
      highTracking: 6,
      delayedActivation: 6,
      pushPull: 3,
    },
    minimumEvidenceCount: 3,
  },
  {
    id: 'meaningBeforeMovement',
    title: 'Root Pattern',
    name: 'Needing meaning before movement',
    protectiveMove: 'looking for meaning before you let the next step become real',
    body:
      'Several patterns seem to gather around the same protective move: looking for meaning before you let the next step become real. It can appear as checking alignment, returning to a change that has not fully landed, trying to name what the moment means, or hesitating when the practical answer does not feel honest enough. The move protects continuity, identity, and the deeper value you do not want to negotiate away. It can also make movement feel harder when the meaning is still unfinished. What helps is letting one grounded value guide the next step, even if the whole story is still becoming clear.',
    protects:
      'It protects continuity and integrity by making sure the next step does not ask you to abandon what still matters.',
    costs:
      'It can keep you waiting for complete meaning before allowing a small, honest movement.',
    softens:
      'It softens when one real value is enough to orient the next step without requiring the whole story to be settled.',
    reflectionPrompt:
      'What value is already clear enough to guide one step, even if the full meaning is still forming?',
    categoryWeights: {
      valuesIntegrity: 28,
      spiritualMeaning: 26,
      griefTransitions: 22,
      identityGrowth: 22,
      lifeDirection: 20,
      creativityExpression: 16,
      natalChartReflection: 12,
    },
    domainMatchers: [/meaning/i, /identity/i, /values/i, /integrity/i, /growth/i, /future/i, /purpose/i],
    subcategoryMatchers: [/meaning/i, /identity/i, /truth/i, /alignment/i, /purpose/i, /change/i, /future/i, /integrity/i],
    anchorMatchers: [/meaning/i, /alignment/i, /future/i, /identity/i, /change/i, /truth/i],
    signalMatchers: [/meaning/i, /purpose/i, /identity/i, /alignment/i, /truth/i, /future/i, /change/i, /integrity/i, /value/i],
    patternTypeWeights: {
      highTracking: 5,
      pushPull: 6,
      delayedActivation: 5,
    },
    minimumEvidenceCount: 3,
  },
];

const DATA_SOURCE_VALUES = new Set<InsightDataSource>([
  'dailyCheckIn',
  'journal',
  'dream',
  'sleep',
  'triggerLog',
  'glimmerLog',
  'bodyMap',
  'relationshipMirror',
  'natalChart',
  'reflectionBank',
]);

function unique<T extends string>(values: Array<T | string | undefined | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeStrength(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value <= 1 ? clamp(value * 100, 0, 100) : clamp(value, 0, 100);
}

function confidenceForStrength(strength: number): PatternConfidence {
  if (strength >= 86) return 'veryStrong';
  if (strength >= 70) return 'strong';
  if (strength >= 56) return 'moderate';
  return 'emerging';
}

function safeSources(values: string[]): InsightDataSource[] {
  return unique(values)
    .filter((value): value is InsightDataSource => DATA_SOURCE_VALUES.has(value as InsightDataSource));
}

function evidenceText(evidence: RootPatternEvidence): string {
  return normalize([
    evidence.patternKey,
    evidence.title,
    evidence.category,
    evidence.majorDomain,
    evidence.insightSubcategory,
    evidence.patternType,
    ...evidence.anchors,
    ...evidence.signalTypes,
    ...evidence.sources,
    evidence.protectiveStrategy?.key,
    evidence.protectiveStrategy?.name,
    evidence.protectiveStrategy?.protectiveMove,
    evidence.protectiveStrategy?.protects,
    evidence.protectiveStrategy?.costs,
    evidence.protectiveStrategy?.softens,
  ].filter(Boolean).join(' '));
}

function isDreamEvidence(evidence: RootPatternEvidence): boolean {
  const text = evidenceText(evidence);
  return (
    isDreamInsightCategory(evidence.category) ||
    evidence.sources.includes('dream') ||
    /\bdream\b|\bdreams\b|\bdream journal\b|\bdream symbol\b/.test(text)
  );
}

function matcherScore(matchers: RegExp[], text: string, weight: number): number {
  return matchers.reduce((score, matcher) => score + (matcher.test(text) ? weight : 0), 0);
}

function evidenceMatchScore(
  definition: RootPatternDefinition,
  evidence: RootPatternEvidence,
): number {
  const text = evidenceText(evidence);
  let score = definition.categoryWeights[evidence.category] ?? 0;

  score += matcherScore(definition.domainMatchers, normalize(evidence.majorDomain ?? ''), 8);
  score += matcherScore(definition.subcategoryMatchers, normalize(evidence.insightSubcategory ?? ''), 10);
  score += matcherScore(definition.anchorMatchers, normalize(evidence.anchors.join(' ')), 5);
  score += matcherScore(definition.signalMatchers, normalize(evidence.signalTypes.join(' ')), 4);
  score += matcherScore(definition.signalMatchers, text, 2);
  if (evidence.patternType && definition.patternTypeWeights?.[evidence.patternType]) {
    score += definition.patternTypeWeights[evidence.patternType] ?? 0;
  }

  return score;
}

function rootPatternStrength(
  scoredEvidence: Array<{ evidence: RootPatternEvidence; matchScore: number }>,
): number {
  const strongest = scoredEvidence
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8);
  const weightedAverage = strongest.reduce((sum, item) => {
    const evidenceStrength = normalizeStrength(item.evidence.strength);
    return sum + item.matchScore * (0.65 + evidenceStrength / 285);
  }, 0) / Math.max(1, strongest.length);
  const categoryCount = new Set(strongest.map(item => item.evidence.category)).size;
  const domainCount = new Set(strongest.map(item => item.evidence.majorDomain).filter(Boolean)).size;
  const typeCount = new Set(strongest.map(item => item.evidence.patternType).filter(Boolean)).size;
  const diversityBonus = categoryCount * 6 + domainCount * 4 + typeCount * 3;
  const countBonus = Math.min(18, strongest.length * 4);

  return Math.round(clamp(weightedAverage + diversityBonus + countBonus, 0, 100));
}

function toConstellation(
  definition: RootPatternDefinition,
  scoredEvidence: Array<{ evidence: RootPatternEvidence; matchScore: number }>,
): RootPatternConstellation {
  const evidence = scoredEvidence
    .sort((a, b) => b.matchScore - a.matchScore)
    .map(item => item.evidence);
  const strength = rootPatternStrength(scoredEvidence);

  return {
    id: definition.id,
    title: definition.title,
    name: definition.name,
    protectiveMove: definition.protectiveMove,
    body: definition.body,
    protects: definition.protects,
    costs: definition.costs,
    softens: definition.softens,
    reflectionPrompt: definition.reflectionPrompt,
    matchedPatternKeys: unique(evidence.map(item => item.patternKey)),
    matchedPatternTitles: unique(evidence.map(item => item.title)),
    matchedCategories: unique(evidence.map(item => item.category)) as InsightCategory[],
    matchedDomains: unique(evidence.map(item => item.majorDomain)),
    matchedSubcategories: unique(evidence.map(item => item.insightSubcategory)),
    matchedPatternTypes: unique(evidence.map(item => item.patternType)) as PatternType[],
    matchedProtectiveStrategies: unique(evidence.map(item => item.protectiveStrategy?.key)),
    anchors: unique(evidence.flatMap(item => item.anchors)).slice(0, 16),
    signalTypes: unique(evidence.flatMap(item => item.signalTypes)).slice(0, 24),
    sources: safeSources(evidence.flatMap(item => item.sources)),
    strength,
    confidence: confidenceForStrength(strength),
    evidenceCount: evidence.length,
    isV2Derived: true,
  };
}

export function rootPatternEvidenceFromInsightCandidate(
  candidate: InsightCandidate,
  options: {
    patternKey?: string;
    title?: string;
  } = {},
): RootPatternEvidence {
  const protectiveStrategy = selectProtectiveStrategy(
    protectiveStrategyInputFromInsightCandidate(candidate, options),
  );

  return {
    patternKey: options.patternKey ?? `${candidate.majorDomain}:${candidate.subcategory}`,
    title: options.title ?? candidate.subcategory,
    category: candidate.category,
    majorDomain: candidate.majorDomain,
    insightSubcategory: candidate.subcategory,
    patternType: candidate.selectedPatternType,
    anchors: candidate.anchors,
    signalTypes: candidate.signalTypes,
    sources: candidate.sources,
    strength: candidate.strength,
    confidence: confidenceForStrength(normalizeStrength(candidate.strength)),
    protectiveStrategy,
  };
}

export function detectRootPatternConstellations(
  evidenceItems: readonly RootPatternEvidence[],
): RootPatternConstellation[] {
  const eligibleEvidence = evidenceItems.filter(evidence => !isDreamEvidence(evidence));
  const constellations: RootPatternConstellation[] = [];

  for (const definition of ROOT_PATTERN_DEFINITIONS) {
    const scoredEvidence = eligibleEvidence
      .map(evidence => ({ evidence, matchScore: evidenceMatchScore(definition, evidence) }))
      .filter(item => item.matchScore >= 18);
    const distinctPatternKeys = new Set(scoredEvidence.map(item => item.evidence.patternKey));
    const distinctCategories = new Set(scoredEvidence.map(item => item.evidence.category));

    if (
      distinctPatternKeys.size < definition.minimumEvidenceCount ||
      distinctCategories.size < 2
    ) {
      continue;
    }

    const constellation = toConstellation(definition, scoredEvidence);
    if (constellation.strength >= 56) {
      constellations.push(constellation);
    }
  }

  return constellations.sort((a, b) =>
    b.strength - a.strength ||
    b.evidenceCount - a.evidenceCount ||
    a.name.localeCompare(b.name),
  );
}

export function selectRootPatternConstellation(
  evidenceItems: readonly RootPatternEvidence[],
): RootPatternConstellation | null {
  return detectRootPatternConstellations(evidenceItems)[0] ?? null;
}
