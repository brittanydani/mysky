import {
  GENERATED_INSIGHT_DOMAINS,
  GENERATED_INSIGHT_PARAGRAPHS,
  GENERATED_INSIGHT_TAXONOMY,
  GENERATED_WEEKLY_INSIGHT_PARAGRAPHS,
} from '../generated/generatedInsightParagraphs';
import { selectPatternParagraph } from '../adapters/premiumPatternParagraphLibrary';

const BLOCKED_PHRASES = [
  'This is clear enough to track now',
  'The pattern is clear now',
  'This does not read as',
  'It reads as',
  'Seen across',
  'Detected in',
  'Based on',
  'The user',
  'It tends to get loud',
  'The meaning is',
  'The clearer read is',
  'The useful move is',
  'The grounded conclusion is',
  'The practical shape matters',
  'The signal gathers',
  'The pattern appears',
  'The pattern around',
  'The shift often happens',
  'is where the signal becomes harder to ignore',
  'Some part of you may be asking',
  'pattern indicates',
  'reflects a need',
  'emotional safety',
  'nervous system seeking',
  'regulation',
  'capacity strain',
  'signalTypes',
  'detected',
  'evidence',
  'user-facing',
];

const VISIBLE_THEORY_PHRASES = [
  'attachment theory',
  'social baseline theory',
  'repair/rupture theory',
  'repair rupture theory',
  'connection safety',
  'proximity seeking',
  'attachment activation',
  'attachment deactivation',
  'attachment activation/deactivation',
  'autonomy support',
  'self efficacy',
  'self-efficacy',
  'mastery orientation',
  'belongingness theory',
  'sociometer theory',
  'threat detection',
  'predictive processing',
  'operant conditioning',
  'behavioral economics',
  'shame theory',
  'self discrepancy theory',
  'self-discrepancy theory',
  'self criticism research',
  'self-criticism research',
  'psychodynamic superego',
  'defense mechanisms',
  'adaptive defense',
  'mentalization',
  'emotion regulation',
  'affect tolerance',
  'cognitive behavioral theory',
  'cognitive-behavioral theory',
  'executive function',
  'activation energy',
  'time perception',
  'scarcity cognition',
  'social learning theory',
  'role modeling',
  'learned helplessness',
  'family systems theory',
  'schema theory',
  'moral psychology',
  'equity theory',
  'values theory',
  'self concordance',
  'self-concordance',
  'identity development',
  'self concept',
  'self-concept',
  'psychosocial development',
  'transition theory',
  'self actualization',
  'self-actualization',
  'growth mindset',
  'humanistic psychology',
  'basic needs',
  'client centered therapy',
  'client-centered therapy',
  'unconditional positive regard',
  'conditions of worth',
  'self worth theory',
  'self-worth theory',
  'big five personality',
  'trait psychology',
  'temperament research',
  'arousal theory',
  'openness to experience',
  'imagination research',
  'conscientiousness',
  'goal systems theory',
  'agreeableness',
  'differential susceptibility',
  'cognitive style',
  'information processing',
  'strengths psychology',
  'multiple intelligences',
  'temperament theory',
  'behavioral activation',
  'behavioral inhibition',
  'behavioral activation/inhibition',
  'core belief model',
  'developmental learning',
  'social identity theory',
  'belonging research',
  'empowerment theory',
  'voice behavior',
  'boundary theory',
  'exchange theory',
  'reciprocity norms',
  'reward systems',
  'recovery theory',
  'allostatic load',
  'creative process',
  'expressive therapies',
  'existential psychology',
  'hope theory',
  'big five',
  'psychoanalysis',
  'psychoanalytic',
  'self-determination theory',
  'cognitive appraisal',
  'family systems',
  'social exchange theory',
  'schema therapy',
  'trait neuroticism',
  'interoception',
  'somatic psychology',
];

const PATTERN_TYPES = ['highTracking', 'lowAccess', 'pushPull', 'delayedActivation'] as const;

const sentenceCount = (text: string): number => (
  text.match(/[.!?](?=\s|$)/g)?.length ?? 0
);

describe('generated insight paragraph library', () => {
  it('exports the psychological lens registry as metadata only', () => {
    expect(GENERATED_INSIGHT_DOMAINS).toHaveLength(50);

    for (const domain of GENERATED_INSIGHT_DOMAINS) {
      expect(domain.key).toBeTruthy();
      expect(domain.majorDomain).toBe(domain.key);
      expect(domain.domainName).toBeTruthy();
      expect(domain.theoryLens.length).toBeGreaterThan(0);
      expect(domain.subcategories).toHaveLength(8);
      expect(typeof domain.excludeFromDreamInsights).toBe('boolean');
      expect(typeof domain.includeInTodayInsights).toBe('boolean');
      expect(typeof domain.includeInPatternScreen).toBe('boolean');
      expect(new Set(domain.patternTypes)).toEqual(new Set(PATTERN_TYPES));

      for (const patternType of PATTERN_TYPES) {
        expect(domain.microMoments[patternType].length).toBeGreaterThan(0);
        expect(domain.actions[patternType].length).toBeGreaterThan(0);
        expect(domain.validationStyle[patternType].length).toBeGreaterThan(0);
        expect(domain.landings[patternType].length).toBeGreaterThan(0);
      }

      const subcategoryGuidance = domain.subcategoryGuidance as Record<
        string,
        { covers: string; patternTypes: Record<string, string> }
      >;
      for (const subcategory of domain.subcategories) {
        expect(subcategoryGuidance[subcategory].covers).toBeTruthy();
        expect(new Set(Object.keys(subcategoryGuidance[subcategory].patternTypes))).toEqual(new Set(PATTERN_TYPES));
      }
    }
  });

  it('keeps Attachment & Connection aligned to the authored Domain 1 lens', () => {
    const domain = GENERATED_INSIGHT_DOMAINS.find((item) => item.key === 'attachmentConnection');

    expect(domain).toEqual(expect.objectContaining({
      majorDomain: 'attachmentConnection',
      domainName: 'Attachment & Connection',
      theoryLens: [
        'attachmentTheory',
        'socialBaselineTheory',
        'repairRuptureTheory',
        'connectionSafety',
        'proximitySeeking',
        'attachmentActivationDeactivation',
      ],
      subcategories: [
        'toneShiftSensitivity',
        'repairSeeking',
        'closenessFear',
        'abandonmentAlarm',
        'trustTesting',
        'emotionalAvailability',
        'conflictConnectionThreat',
        'connectionWorth',
      ],
      excludeFromDreamInsights: false,
      includeInTodayInsights: true,
      includeInPatternScreen: true,
    }));

    expect(domain?.subcategoryGuidance.toneShiftSensitivity.patternTypes.highTracking)
      .toBe('When someone’s tone shifts, you notice immediately and start looking for what changed.');
    expect(domain?.subcategoryGuidance.connectionWorth.patternTypes.delayedActivation)
      .toBe('You dismiss the need in the moment, then later realize you wanted to feel more considered.');
  });

  it('keeps Domains 2-5 aligned to the authored lens maps', () => {
    const expectedDomains = [
      {
        key: 'autonomySelfDetermination',
        subcategories: [
          'pressureDetection',
          'lossOfChoice',
          'resistanceResponse',
          'internalVsExternalMotivation',
          'obligationWeight',
          'selfDirection',
          'permissionToChoose',
          'autonomyRecovery',
        ],
        spotCheckPath: ['pressureDetection', 'highTracking'],
        spotCheckValue: 'You feel the moment a request starts turning into pressure.',
      },
      {
        key: 'competenceMastery',
        subcategories: [
          'fearOfFailure',
          'performancePressure',
          'skillDoubt',
          'masteryDrive',
          'comparison',
          'avoidanceOfEvaluation',
          'competenceValidation',
          'rebuildingConfidence',
        ],
        spotCheckPath: ['avoidanceOfEvaluation', 'pushPull'],
        spotCheckValue: 'You seek feedback but feel exposed receiving it.',
      },
      {
        key: 'belongingSocialSafety',
        subcategories: [
          'fittingInScan',
          'fearOfExclusion',
          'maskingAdaptation',
          'groupEnergySensitivity',
          'socialComparison',
          'inclusionNeed',
          'rejectionProcessing',
          'socialSafetyCalibration',
        ],
        spotCheckPath: ['maskingAdaptation', 'delayedActivation'],
        spotCheckValue: 'You realize afterward how much you adjusted.',
      },
      {
        key: 'safetyThreatDetection',
        subcategories: [
          'earlyThreatDetection',
          'bodyBracing',
          'safetyChecking',
          'hypervigilance',
          'unpredictabilityResponse',
          'relaxationDifficulty',
          'safePeopleDetection',
          'safetyRecovery',
        ],
        spotCheckPath: ['safetyRecovery', 'pushPull'],
        spotCheckValue: 'You oscillate between engagement and retreat.',
      },
    ] as const;

    for (const expected of expectedDomains) {
      const domain = GENERATED_INSIGHT_DOMAINS.find((item) => item.key === expected.key);
      const [subcategory, patternType] = expected.spotCheckPath;
      const subcategoryGuidance = domain?.subcategoryGuidance as Record<
        string,
        { patternTypes: Record<string, string> }
      > | undefined;

      expect(domain?.subcategories).toEqual(expected.subcategories);
      expect(domain?.excludeFromDreamInsights).toBe(false);
      expect(domain?.includeInTodayInsights).toBe(true);
      expect(domain?.includeInPatternScreen).toBe(true);
      expect(subcategoryGuidance?.[subcategory].patternTypes[patternType]).toBe(expected.spotCheckValue);
    }
  });

  it('keeps Domains 11-20 aligned to the authored lens maps', () => {
    const expectedDomains = [
      {
        key: 'avoidanceReliefLoops',
        subcategories: [
          'avoidingTheStart',
          'reliefAfterAvoiding',
          'emotionalAvoidance',
          'decisionAvoidance',
          'conflictAvoidance',
          'avoidanceByBusyness',
          'avoidanceShame',
          'returningToTheThing',
        ],
        spotCheckPath: ['reliefAfterAvoiding', 'delayedActivation'],
        spotCheckValue: 'The cost of avoidance shows up later.',
      },
      {
        key: 'shameSelfEvaluation',
        subcategories: [
          'selfCriticismSpike',
          'embarrassmentSensitivity',
          'feelingWrong',
          'innerCriticPressure',
          'visibilityShame',
          'mistakeRecovery',
          'worthQuestioning',
          'comparisonShame',
        ],
        spotCheckPath: ['visibilityShame', 'pushPull'],
        spotCheckValue: 'You want to be seen but fear what being seen will expose.',
      },
      {
        key: 'innerCriticSuperego',
        subcategories: [
          'shouldPressure',
          'guiltMonitoring',
          'moralResponsibility',
          'harshStandards',
          'selfPunishment',
          'perfectionisticCorrection',
          'guiltAfterRest',
          'impossibleGoodness',
        ],
        spotCheckPath: ['guiltAfterRest', 'pushPull'],
        spotCheckValue: 'You want rest but feel undeserving of it.',
      },
      {
        key: 'defensePatterns',
        subcategories: [
          'intellectualizing',
          'minimizing',
          'humorAsProtection',
          'controlAsProtection',
          'distancing',
          'shutdownProtection',
          'overFunctioning',
          'deflection',
        ],
        spotCheckPath: ['deflection', 'delayedActivation'],
        spotCheckValue: 'You realize later what you avoided saying.',
      },
      {
        key: 'projectionInterpretation',
        subcategories: [
          'motiveReading',
          'rejectionExpectation',
          'ambiguityFilling',
          'assumingDisappointment',
          'interpretingDistance',
          'oldStoryOverlay',
          'trustInterpretation',
          'meaningCorrection',
        ],
        spotCheckPath: ['oldStoryOverlay', 'pushPull'],
        spotCheckValue: 'You see the overlay but still react from it.',
      },
      {
        key: 'emotionalRegulation',
        subcategories: [
          'emotionalEscalation',
          'soothingNeed',
          'containment',
          'emotionalFlooding',
          'recoveryAfterEmotion',
          'emotionalControl',
          'calmingStrategies',
          'intensityMeaning',
        ],
        spotCheckPath: ['emotionalControl', 'delayedActivation'],
        spotCheckValue: 'Emotion emerges once control drops.',
      },
      {
        key: 'cognitiveAppraisal',
        subcategories: [
          'threatAppraisal',
          'difficultyAppraisal',
          'resourceAppraisal',
          'meaningAppraisal',
          'controlAppraisal',
          'blameAppraisal',
          'opportunityAppraisal',
          'emotionalAppraisal',
        ],
        spotCheckPath: ['resourceAppraisal', 'pushPull'],
        spotCheckValue: 'You see the limit but push anyway.',
      },
      {
        key: 'executiveFunctionTaskInitiation',
        subcategories: [
          'taskInitiation',
          'sequencingSteps',
          'mentalLoad',
          'followThroughDrop',
          'planningPressure',
          'overwhelmBeforeStarting',
          'completionDifficulty',
          'attentionSwitching',
        ],
        spotCheckPath: ['attentionSwitching', 'lowAccess'],
        spotCheckValue: 'Your attention drifts before you catch it.',
      },
      {
        key: 'timePerceptionCapacity',
        subcategories: [
          'timeCompression',
          'transitionStress',
          'marginAwareness',
          'urgencyLoop',
          'pacingMismatch',
          'waitingDifficulty',
          'overcommittedTime',
          'recoverySpacing',
        ],
        spotCheckPath: ['overcommittedTime', 'highTracking'],
        spotCheckValue: 'You know the schedule is too full before it breaks.',
      },
      {
        key: 'socialLearningModeledRoles',
        subcategories: [
          'learnedCaretaking',
          'conflictScripts',
          'emotionalExpressionModeling',
          'independenceScript',
          'responsibilityRole',
          'emotionalToneLearning',
          'approvalLearning',
          'inheritedCoping',
        ],
        spotCheckPath: ['inheritedCoping', 'delayedActivation'],
        spotCheckValue: 'The inherited pattern becomes clear afterward.',
      },
    ] as const;

    for (const expected of expectedDomains) {
      const domain = GENERATED_INSIGHT_DOMAINS.find((item) => item.key === expected.key);
      const [subcategory, patternType] = expected.spotCheckPath;
      const subcategoryGuidance = domain?.subcategoryGuidance as Record<
        string,
        { patternTypes: Record<string, string> }
      > | undefined;

      expect(domain?.subcategories).toEqual(expected.subcategories);
      expect(domain?.excludeFromDreamInsights).toBe(false);
      expect(domain?.includeInTodayInsights).toBe(true);
      expect(domain?.includeInPatternScreen).toBe(true);
      expect(subcategoryGuidance?.[subcategory].patternTypes[patternType]).toBe(expected.spotCheckValue);
    }
  });

  it('keeps Domains 21-30 aligned to the authored lens maps', () => {
    const expectedDomains = [
      {
        key: 'familyRolesEarlyScripts',
        subcategories: [
          'fixerRole',
          'invisibleRole',
          'scapegoatRole',
          'peacekeeperRole',
          'parentifiedRole',
          'goldenChildPressure',
          'emotionalCaretaker',
          'oldFamilyScriptActivation',
        ],
        spotCheckPath: ['oldFamilyScriptActivation', 'pushPull'],
        spotCheckValue: 'You want to respond differently but feel pulled into the old role.',
      },
      {
        key: 'moralResponsibilityFairness',
        subcategories: [
          'fairnessSensitivity',
          'responsibilityQuestion',
          'guiltAfterChoice',
          'moralOverload',
          'repairObligation',
          'justiceAnger',
          'selfForgiveness',
          'ethicalClarity',
        ],
        spotCheckPath: ['guiltAfterChoice', 'delayedActivation'],
        spotCheckValue: 'Guilt appears after the relief wears off.',
      },
      {
        key: 'valuesIntegrity',
        subcategories: [
          'alignmentSignal',
          'innerYesNo',
          'compromiseCost',
          'truthPressure',
          'valueConflict',
          'integrityRepair',
          'authenticityRisk',
          'valuesAsDirection',
        ],
        spotCheckPath: ['innerYesNo', 'pushPull'],
        spotCheckValue: 'You hear the no but try to talk yourself into yes.',
      },
      {
        key: 'identityDevelopment',
        subcategories: [
          'oldSelfLoosening',
          'newSelfEmerging',
          'roleConfusion',
          'selfDefinition',
          'identityVisibility',
          'belongingToSelf',
          'becomingDiscomfort',
          'selfContinuity',
        ],
        spotCheckPath: ['selfContinuity', 'highTracking'],
        spotCheckValue: 'You look for the thread between who you were and who you are becoming.',
      },
      {
        key: 'psychosocialTransitions',
        subcategories: [
          'lifeStageShift',
          'roleTransition',
          'maturityPressure',
          'thresholdAnxiety',
          'oldLifeGrief',
          'newResponsibility',
          'belongingInNewPhase',
          'developmentalIntegration',
        ],
        spotCheckPath: ['oldLifeGrief', 'pushPull'],
        spotCheckValue: 'You want the new life but grieve the old one.',
      },
      {
        key: 'selfActualizationGrowth',
        subcategories: [
          'growthEdge',
          'potentialFear',
          'authenticExpansion',
          'purposeEmergence',
          'growthResistance',
          'becomingVisible',
          'innerPermissionToGrow',
          'expansionPacing',
        ],
        spotCheckPath: ['potentialFear', 'pushPull'],
        spotCheckValue: 'You want to expand but fear being responsible for what you can become.',
      },
      {
        key: 'humanisticNeeds',
        subcategories: [
          'unmetNeedRecognition',
          'dignityNeed',
          'esteemNeed',
          'belongingNeed',
          'safetyNeed',
          'growthNeed',
          'unconditionalWorth',
          'needHierarchyConflict',
        ],
        spotCheckPath: ['needHierarchyConflict', 'delayedActivation'],
        spotCheckValue: 'The conflict becomes obvious afterward.',
      },
      {
        key: 'clientCenteredSelfTrust',
        subcategories: [
          'innerKnowing',
          'selfAcceptance',
          'congruenceGap',
          'trustingExperience',
          'selfCompassionAccess',
          'internalPermission',
          'emotionalHonesty',
          'selfValidation',
        ],
        spotCheckPath: ['trustingExperience', 'pushPull'],
        spotCheckValue: 'You believe yourself, then second-guess it.',
      },
      {
        key: 'conditionalWorth',
        subcategories: [
          'earningCare',
          'usefulnessWorth',
          'performanceWorth',
          'provingEnough',
          'loveAsApproval',
          'restWithoutEarning',
          'receivingWithoutDebt',
          'beingEnough',
        ],
        spotCheckPath: ['receivingWithoutDebt', 'pushPull'],
        spotCheckValue: 'You want to receive but start calculating what you owe.',
      },
      {
        key: 'bigFiveTemperament',
        subcategories: [
          'opennessToExperience',
          'conscientiousStandards',
          'extraversionEnergy',
          'agreeablenessHarmony',
          'emotionalSensitivity',
          'flexibilityRigidity',
          'noveltyCaution',
          'temperamentFit',
        ],
        spotCheckPath: ['temperamentFit', 'delayedActivation'],
        spotCheckValue: 'The mismatch becomes clear later.',
      },
    ] as const;

    for (const expected of expectedDomains) {
      const domain = GENERATED_INSIGHT_DOMAINS.find((item) => item.key === expected.key);
      const [subcategory, patternType] = expected.spotCheckPath;
      const subcategoryGuidance = domain?.subcategoryGuidance as Record<
        string,
        { patternTypes: Record<string, string> }
      > | undefined;

      expect(domain?.subcategories).toEqual(expected.subcategories);
      expect(domain?.excludeFromDreamInsights).toBe(false);
      expect(domain?.includeInTodayInsights).toBe(true);
      expect(domain?.includeInPatternScreen).toBe(true);
      expect(subcategoryGuidance?.[subcategory].patternTypes[patternType]).toBe(expected.spotCheckValue);
    }
  });

  it('keeps Domains 31-40 aligned to the authored lens maps', () => {
    const expectedDomains = [
      {
        key: 'introversionExtraversionEnergy',
        subcategories: [
          'socialEnergyTracking',
          'solitudeNeed',
          'stimulationThreshold',
          'connectionRecharge',
          'socialWithdrawal',
          'performanceSocializing',
          'groupVsOneOnOne',
          'socialRecovery',
        ],
        spotCheckPath: ['groupVsOneOnOne', 'delayedActivation'],
        spotCheckValue: 'You realize later which setting drained or nourished you.',
      },
      {
        key: 'opennessImagination',
        subcategories: [
          'curiositySpark',
          'innerWorldDepth',
          'noveltyPull',
          'imaginativeProcessing',
          'possibilityExpansion',
          'creativeRisk',
          'wonderAccess',
          'meaningThroughImage',
        ],
        spotCheckPath: ['meaningThroughImage', 'highTracking'],
        spotCheckValue: 'You understand emotion through image, symbol, or atmosphere.',
      },
      {
        key: 'conscientiousnessStandards',
        subcategories: [
          'detailTracking',
          'dutyPressure',
          'orderNeed',
          'followThroughStandards',
          'responsibilityIdentity',
          'preparationNeed',
          'mistakePrevention',
          'completionRelief',
        ],
        spotCheckPath: ['completionRelief', 'pushPull'],
        spotCheckValue: 'You want closure but avoid the final steps.',
      },
      {
        key: 'agreeablenessHarmony',
        subcategories: [
          'harmonyTracking',
          'peoplePleasing',
          'kindnessOverextension',
          'resentmentSignal',
          'conflictSoftening',
          'cooperationNeed',
          'emotionalAccommodation',
          'sayingNoDifficulty',
        ],
        spotCheckPath: ['sayingNoDifficulty', 'delayedActivation'],
        spotCheckValue: 'The no becomes clear after the yes.',
      },
      {
        key: 'neuroticismSensitivity',
        subcategories: [
          'worryLoop',
          'moodShiftSensitivity',
          'threatSensitivity',
          'emotionalIntensity',
          'reassuranceNeed',
          'sensitivityShame',
          'emotionalForecasting',
          'intensityRecovery',
        ],
        spotCheckPath: ['sensitivityShame', 'pushPull'],
        spotCheckValue: 'You value your sensitivity but wish it were easier to carry.',
      },
      {
        key: 'cognitiveStyleProcessing',
        subcategories: [
          'analyticalProcessing',
          'verbalProcessing',
          'contextBuilding',
          'mentalOrganization',
          'processingDelay',
          'clarityPressure',
          'thoughtSpirals',
          'meaningThroughLanguage',
        ],
        spotCheckPath: ['meaningThroughLanguage', 'delayedActivation'],
        spotCheckValue: 'The right words come later.',
      },
      {
        key: 'aptitudeStrengthPatterns',
        subcategories: [
          'naturalStrengthRecognition',
          'learningStyle',
          'skillConfidence',
          'hiddenAptitude',
          'underusedStrength',
          'masteryPath',
          'feedbackIntegration',
          'strengthOwnership',
        ],
        spotCheckPath: ['strengthOwnership', 'pushPull'],
        spotCheckValue: 'You claim it, then feel uncomfortable being seen in it.',
      },
      {
        key: 'behavioralTemperament',
        subcategories: [
          'approachTendency',
          'withdrawalTendency',
          'persistenceStyle',
          'adaptability',
          'intensityStyle',
          'inhibition',
          'rhythmConsistency',
          'reactivityThreshold',
        ],
        spotCheckPath: ['reactivityThreshold', 'delayedActivation'],
        spotCheckValue: 'The reaction makes sense afterward.',
      },
      {
        key: 'coreBeliefs',
        subcategories: [
          'beliefAboutSelf',
          'beliefAboutOthers',
          'beliefAboutSafety',
          'beliefAboutWorth',
          'beliefAboutLove',
          'beliefAboutEffort',
          'beliefAboutChange',
          'beliefRevision',
        ],
        spotCheckPath: ['beliefRevision', 'pushPull'],
        spotCheckValue: 'You want the new belief but keep returning to the old one.',
      },
      {
        key: 'lifeExperiencesAdaptation',
        subcategories: [
          'pastPresentEcho',
          'adaptiveStrategy',
          'survivalSkillCost',
          'adaptationToPressure',
          'learnedSelfProtection',
          'normalizingTheHardThing',
          'resourcefulness',
          'changingOldAdaptations',
        ],
        spotCheckPath: ['changingOldAdaptations', 'delayedActivation'],
        spotCheckValue: 'Change becomes possible after repeated awareness.',
      },
    ] as const;

    for (const expected of expectedDomains) {
      const domain = GENERATED_INSIGHT_DOMAINS.find((item) => item.key === expected.key);
      const [subcategory, patternType] = expected.spotCheckPath;
      const subcategoryGuidance = domain?.subcategoryGuidance as Record<
        string,
        { patternTypes: Record<string, string> }
      > | undefined;

      expect(domain?.subcategories).toEqual(expected.subcategories);
      expect(domain?.excludeFromDreamInsights).toBe(false);
      expect(domain?.includeInTodayInsights).toBe(true);
      expect(domain?.includeInPatternScreen).toBe(true);
      expect(subcategoryGuidance?.[subcategory].patternTypes[patternType]).toBe(expected.spotCheckValue);
    }
  });

  it('keeps Domains 41-50 aligned to the authored lens maps', () => {
    const expectedDomains = [
      {
        key: 'socialIdentityBelonging',
        subcategories: [
          'groupBelonging',
          'differenceAwareness',
          'identityMembership',
          'outsiderFeeling',
          'communitySafety',
          'sharedLanguage',
          'belongingAfterExclusion',
          'chosenCommunity',
        ],
        spotCheckPath: ['sharedLanguage', 'pushPull'],
        spotCheckValue: 'You want to be understood but fear translating too much of yourself.',
      },
      {
        key: 'powerVoiceAgency',
        subcategories: [
          'speakingUp',
          'voiceSuppression',
          'agencyClaiming',
          'beingHeard',
          'powerlessness',
          'assertiveNeed',
          'influenceAwareness',
          'reclaimingVoice',
        ],
        spotCheckPath: ['reclaimingVoice', 'delayedActivation'],
        spotCheckValue: 'Reclaiming your voice feels possible later.',
      },
      {
        key: 'boundariesExchange',
        subcategories: [
          'reciprocityTracking',
          'overGiving',
          'receivingDifficulty',
          'limitRecognition',
          'unequalExchange',
          'sayingYesCost',
          'boundaryRepair',
          'energyAccounting',
        ],
        spotCheckPath: ['sayingYesCost', 'pushPull'],
        spotCheckValue: 'You say yes for peace, then feel the no underneath it.',
      },
      {
        key: 'socialExchangeReciprocity',
        subcategories: [
          'emotionalDebt',
          'effortBalance',
          'mutualCare',
          'fairnessInSupport',
          'relationalInvestment',
          'obligationAfterCare',
          'careWithoutTransaction',
          'reciprocityRepair',
        ],
        spotCheckPath: ['careWithoutTransaction', 'pushPull'],
        spotCheckValue: 'You want to trust free care but keep looking for the catch.',
      },
      {
        key: 'pleasureDesirePermission',
        subcategories: [
          'desireRecognition',
          'pleasurePermission',
          'sensualComfort',
          'wantingWithoutEarning',
          'pleasureAfterPressure',
          'shameAroundDesire',
          'joyInTheBody',
          'easeWithoutProductivity',
        ],
        spotCheckPath: ['easeWithoutProductivity', 'delayedActivation'],
        spotCheckValue: 'The need for ease arrives after depletion.',
      },
      {
        key: 'embodimentSomaticSignals',
        subcategories: [
          'chestSignal',
          'gutDrop',
          'breathChange',
          'bodyMemory',
          'embodiedKnowing',
          'tensionPattern',
          'sensationAvoidance',
          'bodyReturn',
        ],
        spotCheckPath: ['embodiedKnowing', 'pushPull'],
        spotCheckValue: 'You believe the body and question it at the same time.',
      },
      {
        key: 'restRecoveryDepletion',
        subcategories: [
          'depletionAwareness',
          'restResistance',
          'recoveryWindow',
          'sleepDebt',
          'burnoutSignals',
          'restorationNeed',
          'restWorthiness',
          'postStressCrash',
        ],
        spotCheckPath: ['sleepDebt', 'delayedActivation'],
        spotCheckValue: 'Sleep debt hits after you have already spent the day.',
      },
      {
        key: 'creativityExpression',
        subcategories: [
          'creativePressure',
          'expressionBlock',
          'unfinishedIdeas',
          'visibilityOfWork',
          'creativeIdentity',
          'makingMeaning',
          'creativeRisk',
          'voiceFinding',
        ],
        spotCheckPath: ['voiceFinding', 'delayedActivation'],
        spotCheckValue: 'Your real voice becomes clearer later.',
      },
      {
        key: 'meaningPurposeCalling',
        subcategories: [
          'purposePull',
          'meaningGap',
          'callingPressure',
          'contributionNeed',
          'existentialQuestion',
          'spiritualOrientation',
          'directionThroughMeaning',
          'purposeAndCapacity',
        ],
        spotCheckPath: ['purposeAndCapacity', 'pushPull'],
        spotCheckValue: 'You want to live purposefully but need it to stop consuming you.',
      },
      {
        key: 'hopeFuturePossibility',
        subcategories: [
          'hopeAccess',
          'futureSelf',
          'possibilityFear',
          'disappointmentProtection',
          'imaginingChange',
          'futurePlanning',
          'optimismSuspicion',
          'nextChapter',
        ],
        spotCheckPath: ['nextChapter', 'delayedActivation'],
        spotCheckValue: 'The next chapter becomes visible after repeated small steps.',
      },
    ] as const;

    for (const expected of expectedDomains) {
      const domain = GENERATED_INSIGHT_DOMAINS.find((item) => item.key === expected.key);
      const [subcategory, patternType] = expected.spotCheckPath;
      const subcategoryGuidance = domain?.subcategoryGuidance as Record<
        string,
        { patternTypes: Record<string, string> }
      > | undefined;

      expect(domain?.subcategories).toEqual(expected.subcategories);
      expect(domain?.excludeFromDreamInsights).toBe(false);
      expect(domain?.includeInTodayInsights).toBe(true);
      expect(domain?.includeInPatternScreen).toBe(true);
      expect(subcategoryGuidance?.[subcategory].patternTypes[patternType]).toBe(expected.spotCheckValue);
    }
  });

  it('contains complete 4-5 sentence card paragraphs without blocked scaffold language', () => {
    const ids = new Set<string>();
    const domainKeys = new Set(GENERATED_INSIGHT_DOMAINS.map((domain) => domain.key));
    const subcategoriesByDomain = new Map(
      GENERATED_INSIGHT_DOMAINS.map((domain) => [domain.key, new Set(domain.subcategories)]),
    );

    for (const item of GENERATED_INSIGHT_PARAGRAPHS) {
      expect(typeof item.body).toBe('string');
      expect(item.body).not.toContain('\n');
      expect([4, 5]).toContain(sentenceCount(item.body));
      expect(item.category).toBeTruthy();
      expect(item.writerShape).toBeTruthy();
      expect(item.flowName).toBeTruthy();
      expect(PATTERN_TYPES).toContain(item.patternType);
      expect(domainKeys.has(item.majorDomain)).toBe(true);
      expect(item.theoryLens.length).toBeGreaterThan(0);
      expect(subcategoriesByDomain.get(item.majorDomain)?.has(item.insightSubcategory)).toBe(true);
	      expect(item.anchors.length).toBeGreaterThan(0);
	      expect(item.signalTypes.length).toBeGreaterThan(0);
	      expect(item.tags.length).toBeGreaterThan(0);
	      expect(item.allowedSurfaces).toEqual(expect.arrayContaining(['today', 'patterns']));
	      expect(item.allowedSurfaces).not.toContain('weeklyDeepDive');
	      expect(item.allowedSurfaces).not.toContain('thisWeek');
	      expect(typeof item.isCurated).toBe('boolean');
      expect(['goldStandard', 'pythonGenerated']).toContain(item.source);
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);

      for (const phrase of BLOCKED_PHRASES) {
        if (phrase === 'Based on') {
          expect(item.body).not.toContain(phrase);
        } else {
          expect(item.body.toLowerCase()).not.toContain(phrase.toLowerCase());
        }
      }

      for (const phrase of VISIBLE_THEORY_PHRASES) {
        expect(item.body.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    }
  });

  it('exports full taxonomy and paragraph coverage for every domain subcategory pattern type', () => {
    expect(GENERATED_INSIGHT_TAXONOMY).toHaveLength(402);

    const paragraphCounts = new Map<string, number>();
    for (const item of GENERATED_INSIGHT_PARAGRAPHS) {
      const key = `${item.majorDomain}:${item.insightSubcategory}:${item.patternType}`;
      paragraphCounts.set(key, (paragraphCounts.get(key) ?? 0) + 1);
    }

    for (const entry of GENERATED_INSIGHT_TAXONOMY) {
      expect(entry.anchors.length).toBeGreaterThanOrEqual(3);
      expect(entry.signalTypes.length).toBeGreaterThanOrEqual(4);
      expect(new Set(entry.patternTypes)).toEqual(new Set(PATTERN_TYPES));

      for (const patternType of PATTERN_TYPES) {
        const key = `${entry.majorDomain}:${entry.subcategory}:${patternType}`;
        expect(paragraphCounts.get(key) ?? 0).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('keeps every paragraph category/domain/subcategory wired to taxonomy', () => {
    const allParagraphs = [
      ...GENERATED_INSIGHT_PARAGRAPHS,
      ...GENERATED_WEEKLY_INSIGHT_PARAGRAPHS,
    ];
    const taxonomyPairs = new Set(
      GENERATED_INSIGHT_TAXONOMY.map(entry =>
        `${entry.category}::${entry.majorDomain}::${entry.subcategory}`,
      ),
    );
    const paragraphPairs = new Set(
      allParagraphs.map(item =>
        `${item.category}::${item.majorDomain}::${item.insightSubcategory}`,
      ),
    );

    expect([...paragraphPairs].filter(pair => !taxonomyPairs.has(pair))).toEqual([]);
    expect([...taxonomyPairs].filter(pair => !paragraphPairs.has(pair))).toEqual([]);
  });

  it('includes high-intensity metadata for stronger charge categories', () => {
    const highIntensityParagraphs = GENERATED_INSIGHT_PARAGRAPHS.filter(item => item.intensity === 'high');
    const highIntensityCategories = new Set(highIntensityParagraphs.map(item => item.category));
    const highIntensityShapes = new Set(highIntensityParagraphs.map(item => item.writerShape));
    const highIntensityCountByCategory = highIntensityParagraphs.reduce<Record<string, number>>((counts, item) => {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
      return counts;
    }, {});

    expect(highIntensityParagraphs.length).toBeGreaterThanOrEqual(1200);
    expect(highIntensityParagraphs.length).toBeLessThanOrEqual(1600);
    expect([...highIntensityCategories]).toEqual(expect.arrayContaining([
      'bodySignals',
      'emotionalWeather',
      'familyHome',
      'griefTransitions',
      'relationships',
      'responsibilityCare',
      'safetyRegulation',
      'selfWorthReceiving',
      'supportBelonging',
    ]));
    for (const calmCategory of [
      'pleasurePlay',
      'timeRhythms',
      'creativityExpression',
      'valuesIntegrity',
      'natalChartReflection',
      'spiritualMeaning',
    ]) {
      expect(highIntensityCountByCategory[calmCategory] ?? 0).toBe(0);
    }
    expect(highIntensityCountByCategory.glimmersRegulation ?? 0).toBeLessThanOrEqual(12);
    expect(highIntensityShapes.has('poetic')).toBe(false);
    expect(highIntensityShapes.has('questionLed')).toBe(false);
  });

  it('includes curated gold-standard paragraphs exactly as authored', () => {
    expect(GENERATED_INSIGHT_PARAGRAPHS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'relationships_tone_shift_gold_001',
          flowName: 'goldStandard',
          isCurated: true,
          source: 'goldStandard',
          body: 'When someone’s tone shifts, your body notices before your mind has the full story. You start replaying what changed, measuring the distance, and wondering if you need to explain yourself differently to keep the connection safe. Somewhere in you, connection still feels like something that can disappear if you miss the signs. You are not making it up; you are trying to catch the break before it happens. That kind of bracing makes sense, but it can leave you living inside a rupture that has not actually arrived.',
        }),
      ]),
    );
  });

  it('does not include dream paragraphs in the generated insight engine', () => {
    const allParagraphs = [
      ...GENERATED_INSIGHT_PARAGRAPHS,
      ...GENERATED_WEEKLY_INSIGHT_PARAGRAPHS,
    ];

    expect(allParagraphs.some(item => String(item.category) === 'dreamsSymbols')).toBe(false);
    expect(allParagraphs.some(item => item.id.startsWith('dreamsSymbols_'))).toBe(false);
    expect(() => selectPatternParagraph({
      category: 'dreamsSymbols',
      patternKey: 'dreams_001_unfinished_processing',
    })).toThrow(/No generated insight paragraph/);
  });

  it('prioritizes curated paragraphs when category and anchors match', () => {
    const selected = selectPatternParagraph({
      category: 'relationships',
      patternKey: 'relationships_tone_shift',
      searchText: 'tone shift repair connection safety',
      signals: ['relationshipMirror', 'triggerLog'],
      tags: ['relationship', 'repair', 'connection'],
      confidence: 'strong',
    });

    expect(selected.id).toMatch(/^relationships_tone_shift_gold_00[12]$/);
    expect(selected.isCurated).toBe(true);
  });

  it('keeps weekly generated bodies as authored paragraph sets', () => {
    const domainKeys = new Set(GENERATED_INSIGHT_DOMAINS.map((domain) => domain.key));

    for (const item of GENERATED_WEEKLY_INSIGHT_PARAGRAPHS) {
      const paragraphs = item.body.split('\n\n').filter(Boolean);
      expect(item.flowName).toBe('weeklyDeepDive');
      expect(PATTERN_TYPES).toContain(item.patternType);
      expect(domainKeys.has(item.majorDomain)).toBe(true);
      expect(item.theoryLens.length).toBeGreaterThan(0);
      expect(item.insightSubcategory).toBeTruthy();
      expect(item.allowedSurfaces).toEqual(expect.arrayContaining(['weeklyDeepDive', 'thisWeek']));
      expect(item.allowedSurfaces).not.toContain('today');
      expect(item.allowedSurfaces).not.toContain('patterns');
      expect(item.isCurated).toBe(false);
      expect(item.source).toBe('pythonGenerated');
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
      expect(paragraphs.length).toBeLessThanOrEqual(4);

      for (const paragraph of paragraphs) {
        expect([4, 5]).toContain(sentenceCount(paragraph));
      }

      for (const phrase of BLOCKED_PHRASES) {
        if (phrase === 'Based on') {
          expect(item.body).not.toContain(phrase);
        } else {
          expect(item.body.toLowerCase()).not.toContain(phrase.toLowerCase());
        }
      }

      for (const phrase of VISIBLE_THEORY_PHRASES) {
        expect(item.body.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    }
  });

  it('preserves writer-shape variety within categories', () => {
    const shapesByCategory = new Map<string, Set<string>>();

    for (const item of GENERATED_INSIGHT_PARAGRAPHS) {
      const shapes = shapesByCategory.get(item.category) ?? new Set<string>();
      shapes.add(item.writerShape);
      shapesByCategory.set(item.category, shapes);
    }

    for (const shapes of shapesByCategory.values()) {
      expect(shapes.size).toBeGreaterThanOrEqual(6);
    }
  });

  it('represents every pattern type in every category', () => {
    const patternTypesByCategory = new Map<string, Set<string>>();

    for (const item of GENERATED_INSIGHT_PARAGRAPHS) {
      const patternTypes = patternTypesByCategory.get(item.category) ?? new Set<string>();
      patternTypes.add(item.patternType);
      patternTypesByCategory.set(item.category, patternTypes);
    }

    for (const patternTypes of patternTypesByCategory.values()) {
      for (const patternType of PATTERN_TYPES) {
        expect(patternTypes.has(patternType)).toBe(true);
      }
    }
  });

  it('keeps generated paragraphs grounded in a micro-moment or action', () => {
    const actionPattern = /\b(when|after|later|you replay|you measure|you look|you brace|you go quiet|you keep|you give|you move|you let|you reach|you want|you tell|you realize|you notice|you scan|you start|you try|you stay|you soften|you minimize|you think|you leave|you hold|you check)\b/i;

    for (const item of GENERATED_INSIGHT_PARAGRAPHS) {
      if (item.isCurated) continue;
      expect(item.body).toMatch(actionPattern);
    }
  });
});
