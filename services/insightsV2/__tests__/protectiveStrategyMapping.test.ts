import {
  protectiveStrategyInputFromInsightCandidate,
  selectProtectiveStrategy,
} from '../rootPatterns/protectiveStrategyMapping';
import type { InsightCandidate } from '../types';

describe('protectiveStrategyMapping', () => {
  it('maps over-explaining to protecting the truth from being misunderstood', () => {
    const strategy = selectProtectiveStrategy({
      patternKey: 'communicationVoice_overExplaining',
      title: 'Over-Explaining',
      category: 'communicationVoice',
      majorDomain: 'powerVoiceAgency',
      insightSubcategory: 'beingHeard',
      patternType: 'highTracking',
      anchors: ['explaining-accurately', 'being-understood'],
      signalTypes: ['overexplaining', 'misunderstood', 'clarity_need'],
      sources: ['journal', 'relationshipMirror'],
      strength: 0.86,
    });

    expect(strategy?.key).toBe('protectTruthFromMisunderstanding');
    expect(strategy?.protectiveMove).toBe('protecting the truth from being misunderstood');
    expect(strategy?.insightLine).toContain('one protective move');
    expect(strategy?.protects).toContain('real meaning');
    expect(strategy?.whatHelps[0]).toContain('sentence');
  });

  it('maps bracing to catching danger before it lands', () => {
    const strategy = selectProtectiveStrategy({
      patternKey: 'safetyRegulation_bodyBracing',
      title: 'Body Bracing',
      category: 'safetyRegulation',
      majorDomain: 'safetyThreatDetection',
      insightSubcategory: 'bodyBracing',
      patternType: 'highTracking',
      anchors: ['body-before-words', 'safety-scan'],
      signalTypes: ['calm_bracing', 'body_signal_interpretation', 'chest_pressure'],
      sources: ['bodyMap', 'triggerLog'],
      strength: 92,
    });

    expect(strategy?.key).toBe('catchDangerBeforeItLands');
    expect(strategy?.protectiveMove).toBe('catching danger before it lands');
    expect(strategy?.costs).toContain('preparing for impact');
  });

  it('maps avoidance to short-term relief from something too heavy', () => {
    const strategy = selectProtectiveStrategy({
      patternKey: 'avoidanceRelief_avoidingTheStart',
      title: 'Avoiding the Start',
      category: 'timeRhythms',
      majorDomain: 'avoidanceReliefLoops',
      insightSubcategory: 'avoidingTheStart',
      patternType: 'lowAccess',
      anchors: ['unresolved', 'too-heavy'],
      signalTypes: ['avoidance', 'procrastination', 'unfinished_task'],
      sources: ['journal', 'dailyCheckIn'],
      strength: 74,
    });

    expect(strategy?.key).toBe('shortTermReliefFromTooHeavy');
    expect(strategy?.protects).toContain('full weight');
    expect(strategy?.softens).toContain('smaller entry point');
  });

  it('does not map dream-only inputs into Today or Patterns protective strategy copy', () => {
    const strategy = selectProtectiveStrategy({
      patternKey: 'dreamsSymbols_stormImage',
      title: 'Storm Image',
      category: 'dreamsSymbols',
      majorDomain: 'dreamsSymbols',
      insightSubcategory: 'dreamAtmosphere',
      patternType: 'highTracking',
      anchors: ['dream-residue'],
      signalTypes: ['dream_symbol', 'dream_emotion'],
      sources: ['dream'],
      strength: 98,
    });

    expect(strategy).toBeNull();
  });

  it('adapts InsightCandidate metadata into a protective strategy input', () => {
    const candidate: InsightCandidate = {
      id: 'relationships_toneShift',
      majorDomain: 'attachmentConnection',
      theoryLens: ['attachmentTheory', 'repairRuptureTheory'],
      subcategory: 'toneShiftSensitivity',
      category: 'relationships',
      patternTypeScores: {
        highTracking: 0.82,
        lowAccess: 0.1,
        pushPull: 0.32,
        delayedActivation: 0.24,
      },
      selectedPatternType: 'highTracking',
      anchors: ['tone-shift', 'repair-need'],
      signalTypes: ['tone_sensitivity', 'repair_need'],
      tags: ['relationship', 'repair'],
      strength: 0.82,
      confidence: 0.74,
      sources: ['relationshipMirror', 'triggerLog'],
      allowedSurfaces: ['today', 'patterns'],
      blockedSurfaces: ['weeklyDeepDive', 'thisWeek', 'dreamInterpretation'],
      surfaces: ['today', 'patterns'],
    };
    const input = protectiveStrategyInputFromInsightCandidate(candidate, {
      patternKey: 'relationships_toneShift',
      title: 'Tone Shift Sensitivity',
    });
    const strategy = selectProtectiveStrategy(input);

    expect(input.patternKey).toBe('relationships_toneShift');
    expect(strategy?.key).toBe('preventDisconnectionBeforeItHappens');
  });

  it('keeps clinical theory and system language out of strategy copy', () => {
    const strategy = selectProtectiveStrategy({
      patternKey: 'communicationVoice_overExplaining',
      title: 'Over-Explaining',
      category: 'communicationVoice',
      majorDomain: 'powerVoiceAgency',
      insightSubcategory: 'beingHeard',
      patternType: 'highTracking',
      anchors: ['explaining-accurately'],
      signalTypes: ['overexplaining', 'misunderstood'],
      sources: ['journal'],
      strength: 90,
    });
    const copy = [
      strategy?.insightLine,
      strategy?.protects,
      strategy?.costs,
      strategy?.softens,
      ...(strategy?.whatHelps ?? []),
      strategy?.reflectionPrompt,
    ].join(' ');

    expect(copy).not.toMatch(/attachment theory|operant conditioning|psychoanalysis|diagnos/i);
    expect(copy).not.toMatch(/the user|based on|detected in|seen across|this pattern indicates/i);
  });
});
