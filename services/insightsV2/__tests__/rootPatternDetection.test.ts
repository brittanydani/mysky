import {
  detectRootPatternConstellations,
  rootPatternEvidenceFromInsightCandidate,
  selectRootPatternConstellation,
  type RootPatternEvidence,
} from '../rootPatterns/rootPatternDetection';
import type { InsightCandidate } from '../types';

const evidence = (overrides: Partial<RootPatternEvidence>): RootPatternEvidence => ({
  patternKey: 'relationships_toneShift',
  title: 'Tone Shift Sensitivity',
  category: 'relationships',
  majorDomain: 'attachmentConnection',
  insightSubcategory: 'toneShiftSensitivity',
  patternType: 'highTracking',
  anchors: ['tone-shift', 'repair-need'],
  signalTypes: ['tone_sensitivity', 'repair_need'],
  sources: ['relationshipMirror', 'triggerLog'],
  strength: 88,
  confidence: 'strong',
  ...overrides,
});

describe('rootPatternDetection', () => {
  it('detects a protective root pattern across several visible patterns', () => {
    const root = selectRootPatternConstellation([
      evidence({
        patternKey: 'relationships_toneShift',
        title: 'Tone Shift Sensitivity',
        category: 'relationships',
        signalTypes: ['tone_sensitivity', 'repair_need', 'connection'],
      }),
      evidence({
        patternKey: 'communicationVoice_overExplaining',
        title: 'Over-Explaining',
        category: 'communicationVoice',
        majorDomain: 'powerVoiceAgency',
        insightSubcategory: 'beingHeard',
        anchors: ['explaining-accurately', 'being-understood'],
        signalTypes: ['overexplaining', 'misunderstood', 'repair_need'],
      }),
      evidence({
        patternKey: 'bodySignals_bracing',
        title: 'Body Bracing',
        category: 'bodySignals',
        majorDomain: 'embodimentSomaticSignals',
        insightSubcategory: 'bodyBracing',
        anchors: ['body-before-words', 'chest-signal'],
        signalTypes: ['body_signal', 'bracing', 'chest_tightness'],
      }),
      evidence({
        patternKey: 'selfWorthReceiving_support',
        title: 'Receiving Support',
        category: 'selfWorthReceiving',
        majorDomain: 'conditionalWorth',
        insightSubcategory: 'receivingWithoutDebt',
        patternType: 'pushPull',
        anchors: ['support-uncertain', 'receiving-care'],
        signalTypes: ['support', 'receiving', 'care'],
      }),
    ]);

    expect(root).not.toBeNull();
    expect(root?.id).toBe('catchDisconnectionBeforeItHappens');
    expect(root?.body).toContain('trying to catch disconnection before it happens');
    expect(root?.protects).toContain('stay close');
    expect(root?.costs).toContain('neutral moments');
    expect(root?.softens).toContain('repair has a real path back');
    expect(root?.matchedPatternKeys).toEqual(expect.arrayContaining([
      'relationships_toneShift',
      'communicationVoice_overExplaining',
      'bodySignals_bracing',
    ]));
  });

  it('excludes dream evidence from root patterns for Today and Patterns surfaces', () => {
    const root = selectRootPatternConstellation([
      evidence({
        patternKey: 'relationships_toneShift',
        category: 'relationships',
      }),
      evidence({
        patternKey: 'communicationVoice_clarity',
        category: 'communicationVoice',
        signalTypes: ['overexplaining', 'misunderstood'],
      }),
      evidence({
        patternKey: 'dreamsSymbols_symbol',
        title: 'Dream Symbol',
        category: 'dreamsSymbols',
        majorDomain: 'dreamsSymbols',
        insightSubcategory: 'dreamAtmosphere',
        anchors: ['dream-residue'],
        signalTypes: ['dream_symbol', 'dream_emotion'],
        sources: ['dream'],
        strength: 99,
      }),
    ]);

    expect(root).toBeNull();
  });

  it('adapts InsightCandidate metadata into root-pattern evidence', () => {
    const candidate: InsightCandidate = {
      id: 'relationships_toneShift',
      majorDomain: 'attachmentConnection',
      theoryLens: ['attachmentTheory', 'repairRuptureTheory'],
      subcategory: 'toneShiftSensitivity',
      category: 'relationships',
      patternTypeScores: {
        highTracking: 0.84,
        lowAccess: 0.08,
        pushPull: 0.4,
        delayedActivation: 0.24,
      },
      selectedPatternType: 'highTracking',
      anchors: ['tone-shift', 'repair-need'],
      signalTypes: ['relationshipMirror', 'triggerLog', 'tone_sensitivity'],
      tags: ['relationship', 'repair'],
      strength: 0.84,
      confidence: 0.72,
      sources: ['relationshipMirror', 'triggerLog'],
      allowedSurfaces: ['today', 'patterns'],
      blockedSurfaces: ['weeklyDeepDive', 'thisWeek', 'dreamInterpretation'],
      surfaces: ['today', 'patterns'],
    };

    const adapted = rootPatternEvidenceFromInsightCandidate(candidate, {
      patternKey: 'relationships_toneShift',
      title: 'Tone Shift Sensitivity',
    });

    expect(adapted.patternKey).toBe('relationships_toneShift');
    expect(adapted.strength).toBe(0.84);
    expect(adapted.patternType).toBe('highTracking');
    expect(adapted.anchors).toContain('tone-shift');
  });

  it('keeps theory names and system language out of user-facing root copy', () => {
    const [root] = detectRootPatternConstellations([
      evidence({ patternKey: 'relationships_toneShift', category: 'relationships' }),
      evidence({
        patternKey: 'communicationVoice_overExplaining',
        category: 'communicationVoice',
        signalTypes: ['overexplaining', 'misunderstood'],
      }),
      evidence({
        patternKey: 'bodySignals_bracing',
        category: 'bodySignals',
        signalTypes: ['body_signal', 'bracing'],
        anchors: ['body-before-words'],
      }),
    ]);
    const copy = [
      root?.body,
      root?.protects,
      root?.costs,
      root?.softens,
      root?.reflectionPrompt,
    ].join(' ');

    expect(copy).not.toMatch(/attachment theory|operant conditioning|psychoanalysis|diagnos/i);
    expect(copy).not.toMatch(/the user|based on|detected in|seen across|this pattern indicates/i);
  });
});
