import type {
  InsightCandidate,
  InsightCategory,
  InsightDataSource,
  PatternConfidence,
  PatternType,
} from '../types';
import { isDreamInsightCategory } from '../taxonomy/insightTaxonomy';

export type ProtectiveStrategyKey =
  | 'protectTruthFromMisunderstanding'
  | 'catchDangerBeforeItLands'
  | 'shortTermReliefFromTooHeavy'
  | 'preserveConnectionByReducingFriction'
  | 'keepFeelingFromTooMuch'
  | 'preventExposureCriticismControlLoss'
  | 'preventDisconnectionBeforeItHappens'
  | 'carryBeforeItFallsApart'
  | 'protectChoiceFromPressure'
  | 'earnSafetyThroughUsefulness'
  | 'makeUncertaintyTrackable'
  | 'keepMeaningFromBeingLost';

export interface ProtectiveStrategyInput {
  patternKey: string;
  title: string;
  category: InsightCategory;
  majorDomain?: string;
  insightSubcategory?: string;
  patternType?: PatternType;
  anchors: string[];
  signalTypes: string[];
  sources: InsightDataSource[];
  strength?: number;
  confidence?: PatternConfidence;
}
export interface ProtectiveStrategy {
  key: ProtectiveStrategyKey;
  name: string;
  protectiveMove: string;
  insightLine: string;
  protects: string;
  costs: string;
  softens: string;
  whatHelps: string[];
  reflectionPrompt: string;
  score: number;
  confidence: PatternConfidence;
}

interface ProtectiveStrategyDefinition {
  key: ProtectiveStrategyKey;
  name: string;
  protectiveMove: string;
  insightLine: string;
  protects: string;
  costs: string;
  softens: string;
  whatHelps: string[];
  reflectionPrompt: string;
  categoryWeights: Partial<Record<InsightCategory, number>>;
  patternTypeWeights?: Partial<Record<PatternType, number>>;
  titleMatchers: RegExp[];
  domainMatchers: RegExp[];
  subcategoryMatchers: RegExp[];
  anchorMatchers: RegExp[];
  signalMatchers: RegExp[];
}

const PROTECTIVE_STRATEGY_DEFINITIONS: readonly ProtectiveStrategyDefinition[] = [
  {
    key: 'protectTruthFromMisunderstanding',
    name: 'Protecting the truth from being misunderstood',
    protectiveMove: 'protecting the truth from being misunderstood',
    insightLine:
      'This pattern is not random. It seems organized around one protective move: protecting the truth from being misunderstood.',
    protects:
      'It protects the part of you that needs the real meaning to land, not a distorted version of it.',
    costs:
      'It can make you responsible for every possible interpretation before the other person has even responded.',
    softens:
      'It softens when one clear sentence is allowed to be enough before you add more proof.',
    whatHelps: [
      'Start with the sentence that feels most true.',
      'Check whether more context is actually needed before offering it.',
      'Let the other person carry some responsibility for understanding.',
    ],
    reflectionPrompt:
      'Where did you add more words because being misread felt too costly?',
    categoryWeights: {
      communicationVoice: 38,
      cognitiveStyle: 24,
      relationships: 20,
      safetyRegulation: 10,
    },
    patternTypeWeights: {
      highTracking: 8,
      pushPull: 5,
      delayedActivation: 4,
    },
    titleMatchers: [/over.?explain/i, /clarity/i, /communication/i, /being heard/i, /misunder/i],
    domainMatchers: [/voice/i, /cognitive/i, /communication/i, /power/i],
    subcategoryMatchers: [/voice/i, /heard/i, /clarity/i, /context/i, /language/i, /misunder/i],
    anchorMatchers: [/explain/i, /clarity/i, /understood/i, /tone/i],
    signalMatchers: [/over.?explain/i, /misunder/i, /clarity/i, /context/i, /being heard/i, /distortion/i, /language/i],
  },
  {
    key: 'catchDangerBeforeItLands',
    name: 'Catching danger before it lands',
    protectiveMove: 'catching danger before it lands',
    insightLine:
      'This pattern is not random. It seems organized around one protective move: catching danger before it lands.',
    protects:
      'It protects your ability to respond early instead of being surprised by something that feels unsafe.',
    costs:
      'It can keep your body preparing for impact even when the moment has not actually become dangerous.',
    softens:
      'It softens when the body gets concrete proof of safety, not just a command to calm down.',
    whatHelps: [
      'Name the first body cue without arguing with it.',
      'Look for one real cue of safety in the room you are in.',
      'Give the body a slower transition before asking it to trust the moment.',
    ],
    reflectionPrompt:
      'Where did your body start preparing before the danger was fully clear?',
    categoryWeights: {
      safetyRegulation: 38,
      bodySignals: 34,
      relationships: 16,
      restCapacity: 10,
      emotionalWeather: 8,
    },
    patternTypeWeights: {
      highTracking: 8,
      delayedActivation: 5,
      pushPull: 3,
    },
    titleMatchers: [/bracing/i, /safety/i, /body/i, /threat/i, /danger/i, /alert/i],
    domainMatchers: [/safety/i, /threat/i, /embodiment/i, /somatic/i],
    subcategoryMatchers: [/bracing/i, /threat/i, /safety/i, /body/i, /chest/i, /breath/i, /tension/i],
    anchorMatchers: [/body/i, /safety/i, /chest/i, /breath/i, /tension/i],
    signalMatchers: [/bracing/i, /body/i, /somatic/i, /chest/i, /breath/i, /tension/i, /unsafe/i, /threat/i, /alert/i],
  },
  {
    key: 'shortTermReliefFromTooHeavy',
    name: 'Getting relief from something too heavy',
    protectiveMove: 'getting short-term relief from something that feels too heavy',
    insightLine:
      'This pattern is not random. It seems organized around one protective move: getting short-term relief from something that feels too heavy.',
    protects:
      'It protects you from having to enter the full weight of the task, feeling, or conversation all at once.',
    costs:
      'It can leave the heavy thing waiting, and the relief can start teaching the pattern to return.',
    softens:
      'It softens when there is a smaller entry point that does not require you to face the whole thing at once.',
    whatHelps: [
      'Shrink the first step until beginning does not feel like a full commitment.',
      'Name the relief without treating it as the final answer.',
      'Return before pressure becomes the only thing strong enough to move you.',
    ],
    reflectionPrompt:
      'What felt easier to avoid because starting would have made the weight real?',
    categoryWeights: {
      emotionalWeather: 20,
      restCapacity: 18,
      timeRhythms: 18,
      boundariesSelfTrust: 16,
      safetyRegulation: 16,
      griefTransitions: 14,
      workAmbition: 12,
    },
    patternTypeWeights: {
      lowAccess: 10,
      delayedActivation: 8,
      pushPull: 4,
    },
    titleMatchers: [/avoid/i, /procrastinat/i, /delay/i, /drift/i, /low motivation/i],
    domainMatchers: [/avoidance/i, /relief/i, /executive/i, /coping/i],
    subcategoryMatchers: [/avoid/i, /start/i, /delay/i, /decision/i, /conflict/i, /task/i],
    anchorMatchers: [/unresolved/i, /too much/i, /heavy/i, /delayed/i],
    signalMatchers: [/avoid/i, /procrastinat/i, /drift/i, /delay/i, /low motivation/i, /unfinished/i, /relief/i],
  },
  {
    key: 'preserveConnectionByReducingFriction',
    name: 'Preserving connection by reducing friction',
    protectiveMove: 'preserving connection by reducing friction',
    insightLine:
      'This pattern is not random. It seems organized around one protective move: preserving connection by reducing friction.',
    protects:
      'It protects closeness by making the room easier to stay in, even when something true needs space.',
    costs:
      'It can make your own limit, preference, or frustration disappear before anyone else has to notice it.',
    softens:
      'It softens when honesty has a way to enter without immediately threatening connection.',
    whatHelps: [
      'Let one honest preference stay visible.',
      'Separate kindness from automatic agreement.',
      'Notice resentment as information, not failure.',
    ],
    reflectionPrompt:
      'Where did you smooth the moment before checking what the smoothness cost you?',
    categoryWeights: {
      relationships: 28,
      supportBelonging: 22,
      boundariesSelfTrust: 22,
      responsibilityCare: 18,
      communicationVoice: 16,
      familyHome: 14,
      selfWorthReceiving: 12,
    },
    patternTypeWeights: {
      highTracking: 6,
      pushPull: 8,
      delayedActivation: 4,
    },
    titleMatchers: [/people.?pleas/i, /harmony/i, /conflict/i, /peace/i, /accommodat/i],
    domainMatchers: [/belonging/i, /harmony/i, /connection/i, /family/i, /boundar/i],
    subcategoryMatchers: [/harmony/i, /pleasing/i, /conflict/i, /peace/i, /accommodat/i, /approval/i],
    anchorMatchers: [/tone/i, /conflict/i, /care/i, /support/i, /boundary/i],
    signalMatchers: [/harmony/i, /people.?pleas/i, /conflict/i, /smooth/i, /approval/i, /resent/i, /accommodat/i],
  },
  {
    key: 'keepFeelingFromTooMuch',
    name: 'Keeping feeling from becoming too much at once',
    protectiveMove: 'keeping you from feeling too much at once',
    insightLine:
      'This pattern is not random. It seems organized around one protective move: keeping you from feeling too much at once.',
    protects:
      'It protects functioning when the feeling may be too big, too fast, or too exposed for the moment you are in.',
    costs:
      'It can mute the feeling so effectively that you only meet it later, after it has been waiting alone.',
    softens:
      'It softens when the feeling can arrive in smaller pieces instead of demanding full access all at once.',
    whatHelps: [
      'Name the edge of the feeling, not the whole thing.',
      'Let a quiet reaction count as a reaction.',
      'Come back to the feeling when there is enough room to meet it.',
    ],
    reflectionPrompt:
      'What might have gone quiet because feeling it all at once would have been too much?',
    categoryWeights: {
      emotionalWeather: 30,
      safetyRegulation: 24,
      bodySignals: 22,
      restCapacity: 16,
      griefTransitions: 16,
      relationships: 12,
    },
    patternTypeWeights: {
      lowAccess: 10,
      delayedActivation: 8,
      pushPull: 4,
    },
    titleMatchers: [/shutdown/i, /numb/i, /muted/i, /disconnect/i, /quiet/i],
    domainMatchers: [/regulation/i, /emotional/i, /defense/i, /somatic/i],
    subcategoryMatchers: [/shutdown/i, /numb/i, /disconnect/i, /contain/i, /flood/i, /delay/i],
    anchorMatchers: [/quiet/i, /body/i, /unresolved/i, /delayed/i],
    signalMatchers: [/shutdown/i, /numb/i, /disconnect/i, /muted/i, /quiet/i, /delayed/i, /contain/i, /overwhelm/i],
  },
  {
    key: 'preventExposureCriticismControlLoss',
    name: 'Preventing exposure, criticism, or loss of control',
    protectiveMove: 'preventing exposure, criticism, or loss of control',
    insightLine:
      'This pattern is not random. It seems organized around one protective move: preventing exposure, criticism, or loss of control.',
    protects:
      'It protects you from the vulnerability of being seen before something feels ready, correct, or defensible.',
    costs:
      'It can turn care, skill, or effort into a test you have to pass before you are allowed to move.',
    softens:
      'It softens when good enough is allowed to become contact with reality instead of proof of your worth.',
    whatHelps: [
      'Define what finished means before the standard keeps moving.',
      'Let feedback be information, not a verdict.',
      'Practice one visible step before the whole thing feels perfect.',
    ],
    reflectionPrompt:
      'Where did getting it right start to matter more than staying connected to the work?',
    categoryWeights: {
      workAmbition: 30,
      cognitiveStyle: 22,
      valuesIntegrity: 16,
      selfWorthReceiving: 18,
      responsibilityCare: 14,
      lifeDirection: 12,
    },
    patternTypeWeights: {
      highTracking: 8,
      pushPull: 5,
      delayedActivation: 4,
    },
    titleMatchers: [/perfect/i, /performance/i, /standards/i, /failure/i, /evaluation/i, /criticism/i],
    domainMatchers: [/competence/i, /standards/i, /conscientious/i, /worth/i, /performance/i],
    subcategoryMatchers: [/failure/i, /performance/i, /skill/i, /evaluation/i, /standard/i, /mistake/i, /visibility/i],
    anchorMatchers: [/pressure/i, /output/i, /visibility/i, /accuracy/i],
    signalMatchers: [/perfect/i, /performance/i, /standard/i, /failure/i, /criticism/i, /evaluation/i, /mistake/i, /output/i],
  },
  {
    key: 'preventDisconnectionBeforeItHappens',
    name: 'Preventing disconnection before it happens',
    protectiveMove: 'preventing disconnection before it happens',
    insightLine:
      'This pattern is not random. It seems organized around one protective move: preventing disconnection before it happens.',
    protects:
      'It protects the bond by trying to notice distance before it becomes a break.',
    costs:
      'It can put you inside repair mode before the other person has actually left.',
    softens:
      'It softens when distance can be checked directly and repair has a believable way back.',
    whatHelps: [
      'Ask for one clear cue instead of reading every small shift.',
      'Notice whether the bond is actually broken or only uncertain.',
      'Let repair be shared instead of privately managed.',
    ],
    reflectionPrompt:
      'Where did you begin repairing before you knew whether repair was needed?',
    categoryWeights: {
      relationships: 38,
      supportBelonging: 24,
      communicationVoice: 22,
      selfWorthReceiving: 18,
      safetyRegulation: 14,
    },
    patternTypeWeights: {
      highTracking: 9,
      pushPull: 8,
      delayedActivation: 5,
    },
    titleMatchers: [/tone/i, /repair/i, /connection/i, /abandon/i, /trust/i],
    domainMatchers: [/attachment/i, /connection/i, /belonging/i],
    subcategoryMatchers: [/tone/i, /repair/i, /closeness/i, /abandon/i, /trust/i, /availability/i, /conflict/i, /worth/i],
    anchorMatchers: [/tone/i, /repair/i, /connection/i, /support/i],
    signalMatchers: [/tone/i, /repair/i, /connection/i, /rupture/i, /abandon/i, /distance/i, /support/i],
  },
  {
    key: 'carryBeforeItFallsApart',
    name: 'Carrying before it falls apart',
    protectiveMove: 'carrying the loose end before it falls apart',
    insightLine:
      'This pattern is not random. It seems organized around one protective move: carrying the loose end before it falls apart.',
    protects:
      'It protects stability by making sure something important does not drop while everyone else is still noticing.',
    costs:
      'It can make noticing feel the same as owning, even when the responsibility was never fully yours.',
    softens:
      'It softens when support, limits, and shared ownership enter before you pick the whole thing up.',
    whatHelps: [
      'Pause between noticing and taking over.',
      'Ask who else can hold part of the loose end.',
      'Treat capacity as part of care, not an obstacle to it.',
    ],
    reflectionPrompt:
      'Where did you become responsible because you noticed first?',
    categoryWeights: {
      responsibilityCare: 40,
      boundariesSelfTrust: 26,
      familyHome: 24,
      supportBelonging: 16,
      timeRhythms: 14,
      restCapacity: 12,
    },
    patternTypeWeights: {
      highTracking: 9,
      pushPull: 6,
      delayedActivation: 4,
    },
    titleMatchers: [/responsib/i, /load/i, /caretaking/i, /fixer/i, /over.?function/i],
    domainMatchers: [/responsibility/i, /family/i, /care/i, /exchange/i],
    subcategoryMatchers: [/caretaking/i, /responsibility/i, /fixer/i, /parentified/i, /role/i, /over.?giving/i],
    anchorMatchers: [/care/i, /responsib/i, /load/i, /support/i, /capacity/i],
    signalMatchers: [/responsib/i, /mental load/i, /caretaking/i, /invisible/i, /overextension/i, /support/i, /capacity/i],
  },
  {
    key: 'protectChoiceFromPressure',
    name: 'Protecting choice from pressure',
    protectiveMove: 'protecting your choice from being swallowed by pressure',
    insightLine:
      'This pattern is not random. It seems organized around one protective move: protecting your choice from being swallowed by pressure.',
    protects:
      'It protects the part of you that needs room to decide, not just comply quickly.',
    costs:
      'It can make requests feel charged before you know whether you want to say yes, no, or not yet.',
    softens:
      'It softens when a pause is allowed to be a real answer while choice catches up.',
    whatHelps: [
      'Separate the request from the pressure surrounding it.',
      'Let a pause count as an honest response.',
      'Check whether your yes still belongs to you.',
    ],
    reflectionPrompt:
      'Where did pressure arrive before choice had enough room?',
    categoryWeights: {
      boundariesSelfTrust: 34,
      valuesIntegrity: 28,
      responsibilityCare: 22,
      timeRhythms: 18,
      workAmbition: 16,
      lifeDirection: 14,
    },
    patternTypeWeights: {
      highTracking: 6,
      pushPull: 8,
      delayedActivation: 5,
    },
    titleMatchers: [/pressure/i, /choice/i, /boundary/i, /autonomy/i, /resistance/i, /obligation/i],
    domainMatchers: [/autonomy/i, /agency/i, /boundar/i, /integrity/i, /self-determination/i],
    subcategoryMatchers: [/pressure/i, /choice/i, /resistance/i, /obligation/i, /permission/i, /autonomy/i, /yes/i, /no/i],
    anchorMatchers: [/pressure/i, /boundary/i, /choice/i, /capacity/i],
    signalMatchers: [/pressure/i, /boundary/i, /choice/i, /resistance/i, /obligation/i, /resent/i, /alignment/i],
  },
  {
    key: 'earnSafetyThroughUsefulness',
    name: 'Earning safety through usefulness',
    protectiveMove: 'earning safety through usefulness',
    insightLine:
      'This pattern is not random. It seems organized around one protective move: earning safety through usefulness.',
    protects:
      'It protects belonging by making care, approval, or support feel less likely to disappear.',
    costs:
      'It can make rest and receiving feel undeserved unless you have paid for them with effort first.',
    softens:
      'It softens when care can arrive without becoming debt and usefulness stops being the price of belonging.',
    whatHelps: [
      'Receive one useful thing without immediately balancing the scale.',
      'Notice when usefulness becomes proof of worth.',
      'Let rest happen before every loose end is handled.',
    ],
    reflectionPrompt:
      'Where did you try to become useful before letting yourself receive?',
    categoryWeights: {
      selfWorthReceiving: 36,
      responsibilityCare: 26,
      supportBelonging: 24,
      workAmbition: 22,
      restCapacity: 16,
      pleasurePlay: 12,
    },
    patternTypeWeights: {
      highTracking: 5,
      pushPull: 8,
      delayedActivation: 4,
    },
    titleMatchers: [/worth/i, /receiv/i, /support/i, /useful/i, /earn/i, /performance/i],
    domainMatchers: [/worth/i, /conditional/i, /support/i, /competence/i, /rest/i],
    subcategoryMatchers: [/earn/i, /useful/i, /worth/i, /receiv/i, /support/i, /approval/i, /rest/i],
    anchorMatchers: [/receiv/i, /support/i, /deserving/i, /rest/i, /care/i],
    signalMatchers: [/worth/i, /earn/i, /useful/i, /receiv/i, /support/i, /approval/i, /rest guilt/i, /performance/i],
  },
  {
    key: 'makeUncertaintyTrackable',
    name: 'Making uncertainty trackable',
    protectiveMove: 'making uncertainty trackable before it gets too big',
    insightLine:
      'This pattern is not random. It seems organized around one protective move: making uncertainty trackable before it gets too big.',
    protects:
      'It protects steadiness by turning ambiguity into language, plans, timing, or a next visible step.',
    costs:
      'It can keep your attention working past the point where more tracking is actually helping.',
    softens:
      'It softens when one honest next step is allowed to be enough without solving the whole unknown.',
    whatHelps: [
      'Choose the next smallest honest step.',
      'Name what is known and what is still unknown.',
      'Stop once tracking has given you enough to move safely.',
    ],
    reflectionPrompt:
      'Where did you keep tracking because uncertainty felt too open?',
    categoryWeights: {
      cognitiveStyle: 32,
      timeRhythms: 24,
      safetyRegulation: 22,
      communicationVoice: 20,
      lifeDirection: 18,
      workAmbition: 16,
      scarcityAbundance: 14,
    },
    patternTypeWeights: {
      highTracking: 9,
      delayedActivation: 5,
      pushPull: 4,
    },
    titleMatchers: [/uncertain/i, /track/i, /clarity/i, /time/i, /planning/i, /control/i],
    domainMatchers: [/cognitive/i, /appraisal/i, /time/i, /safety/i, /future/i],
    subcategoryMatchers: [/clarity/i, /planning/i, /risk/i, /control/i, /time/i, /future/i, /resource/i],
    anchorMatchers: [/clarity/i, /time/i, /future/i, /safety/i, /pressure/i],
    signalMatchers: [/uncertain/i, /clarity/i, /planning/i, /control/i, /analysis/i, /time/i, /future/i, /pressure/i],
  },
  {
    key: 'keepMeaningFromBeingLost',
    name: 'Keeping meaning from being lost',
    protectiveMove: 'keeping meaning from being lost in the practical answer',
    insightLine:
      'This pattern is not random. It seems organized around one protective move: keeping meaning from being lost in the practical answer.',
    protects:
      'It protects the deeper value, grief, identity, or purpose that would be easy to skip over if the moment became only practical.',
    costs:
      'It can make movement harder when the meaning is still unfinished.',
    softens:
      'It softens when one grounded value can guide the next step before the whole story is complete.',
    whatHelps: [
      'Ask what value is trying to stay included.',
      'Let the next step be guided by one truth, not the whole meaning.',
      'Give the unfinished part a place to land without making it stop the day.',
    ],
    reflectionPrompt:
      'What meaning are you trying not to lose inside the practical answer?',
    categoryWeights: {
      valuesIntegrity: 30,
      spiritualMeaning: 28,
      griefTransitions: 24,
      identityGrowth: 22,
      lifeDirection: 18,
      creativityExpression: 14,
      natalChartReflection: 12,
    },
    patternTypeWeights: {
      highTracking: 5,
      pushPull: 6,
      delayedActivation: 5,
    },
    titleMatchers: [/meaning/i, /purpose/i, /identity/i, /grief/i, /alignment/i, /truth/i],
    domainMatchers: [/meaning/i, /identity/i, /values/i, /purpose/i, /growth/i],
    subcategoryMatchers: [/meaning/i, /truth/i, /alignment/i, /identity/i, /purpose/i, /change/i, /grief/i],
    anchorMatchers: [/meaning/i, /alignment/i, /identity/i, /future/i, /truth/i],
    signalMatchers: [/meaning/i, /purpose/i, /identity/i, /alignment/i, /truth/i, /grief/i, /change/i, /value/i],
  },
];

function unique<T extends string>(values: Array<T | string | undefined | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function confidenceForScore(score: number): PatternConfidence {
  if (score >= 88) return 'veryStrong';
  if (score >= 70) return 'strong';
  if (score >= 52) return 'moderate';
  return 'emerging';
}

function matcherScore(matchers: RegExp[], text: string, weight: number): number {
  return matchers.reduce((sum, matcher) => sum + (matcher.test(text) ? weight : 0), 0);
}

function inputText(input: ProtectiveStrategyInput): string {
  return normalize([
    input.patternKey,
    input.title,
    input.category,
    input.majorDomain,
    input.insightSubcategory,
    input.patternType,
    ...input.anchors,
    ...input.signalTypes,
    ...input.sources,
  ].filter(Boolean).join(' '));
}

function isDreamInput(input: ProtectiveStrategyInput): boolean {
  const text = inputText(input);
  return (
    isDreamInsightCategory(input.category) ||
    input.sources.includes('dream') ||
    /\bdream\b|\bdreams\b|\bdream journal\b|\bdream symbol\b/.test(text)
  );
}

function scoreDefinition(
  definition: ProtectiveStrategyDefinition,
  input: ProtectiveStrategyInput,
): number {
  const text = inputText(input);
  let score = definition.categoryWeights[input.category] ?? 0;

  score += matcherScore(definition.titleMatchers, normalize(input.title), 12);
  score += matcherScore(definition.domainMatchers, normalize(input.majorDomain ?? ''), 8);
  score += matcherScore(definition.subcategoryMatchers, normalize(input.insightSubcategory ?? ''), 10);
  score += matcherScore(definition.anchorMatchers, normalize(input.anchors.join(' ')), 6);
  score += matcherScore(definition.signalMatchers, normalize(input.signalTypes.join(' ')), 5);
  score += matcherScore(definition.signalMatchers, text, 2);
  if (input.patternType && definition.patternTypeWeights?.[input.patternType]) {
    score += definition.patternTypeWeights[input.patternType] ?? 0;
  }
  if (typeof input.strength === 'number') {
    const normalizedStrength = input.strength <= 1 ? input.strength * 100 : input.strength;
    score += clamp(normalizedStrength, 0, 100) / 14;
  }

  return Math.round(clamp(score, 0, 100));
}

function toStrategy(
  definition: ProtectiveStrategyDefinition,
  score: number,
): ProtectiveStrategy {
  return {
    key: definition.key,
    name: definition.name,
    protectiveMove: definition.protectiveMove,
    insightLine: definition.insightLine,
    protects: definition.protects,
    costs: definition.costs,
    softens: definition.softens,
    whatHelps: [...definition.whatHelps],
    reflectionPrompt: definition.reflectionPrompt,
    score,
    confidence: confidenceForScore(score),
  };
}

export function mapProtectiveStrategies(
  input: ProtectiveStrategyInput,
  limit = 3,
): ProtectiveStrategy[] {
  if (isDreamInput(input)) return [];

  return PROTECTIVE_STRATEGY_DEFINITIONS
    .map(definition => toStrategy(definition, scoreDefinition(definition, input)))
    .filter(strategy => strategy.score >= 42)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function selectProtectiveStrategy(
  input: ProtectiveStrategyInput,
): ProtectiveStrategy | null {
  return mapProtectiveStrategies(input, 1)[0] ?? null;
}

export function protectiveStrategyInputFromInsightCandidate(
  candidate: InsightCandidate,
  options: {
    patternKey?: string;
    title?: string;
  } = {},
): ProtectiveStrategyInput {
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
  };
}
