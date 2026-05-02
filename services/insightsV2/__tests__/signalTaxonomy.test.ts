import { getSignalRoles, getSignalSentiment } from '../signalTaxonomy';
import { normalizeInsightInputsV2 } from '../normalizers';
import { PERSONA_PROFILES } from '../personaProfiles';
import { ARCHIVE_PATTERNS } from '../patternPacks';
import { DAILY_ANGLES } from '../anglePacks';
import type { SignalKey } from '../types';

function collectCatalogSignalKeys(): SignalKey[] {
  const keys = new Set<SignalKey>();

  for (const pattern of ARCHIVE_PATTERNS) {
    for (const key of pattern.requiredSignals) keys.add(key);
    for (const key of pattern.supportingSignals) keys.add(key);
    for (const key of pattern.conflictingSignals ?? []) keys.add(key);
  }

  for (const angle of DAILY_ANGLES) {
    for (const key of angle.triggerSignals) keys.add(key);
    for (const key of angle.avoidIfSignals ?? []) keys.add(key);
  }

  for (const profile of PERSONA_PROFILES) {
    for (const key of profile.triggerSignals) keys.add(key);
    for (const key of profile.supportingSignals) keys.add(key);
    for (const key of profile.avoidIfSignals ?? []) keys.add(key);
    for (const key of profile.conflictingSignals ?? []) keys.add(key);
    for (const key of profile.blockedRecoverySignals ?? []) keys.add(key);
  }

  return Array.from(keys);
}

describe('insightsV2 signal taxonomy', () => {
  it('classifies painful emotions as negative feeling states, not recovery levers', () => {
    expect(getSignalSentiment('hurt')).toBe('negative');
    expect(getSignalRoles('hurt')).toContain('feeling_state');
    expect(getSignalRoles('hurt')).not.toContain('recovery_lever');

    expect(getSignalSentiment('grief')).toBe('negative');
    expect(getSignalRoles('grief')).toContain('feeling_state');
    expect(getSignalRoles('grief')).not.toContain('recovery_lever');

    expect(getSignalSentiment('sadness')).toBe('negative');
    expect(getSignalRoles('sadness')).toContain('feeling_state');
    expect(getSignalRoles('sadness')).not.toContain('recovery_lever');

    expect(getSignalSentiment('guilt')).toBe('negative');
    expect(getSignalRoles('guilt')).toContain('feeling_state');
    expect(getSignalRoles('guilt')).not.toContain('recovery_lever');

    expect(getSignalSentiment('anger')).toBe('negative');
    expect(getSignalRoles('anger')).toContain('feeling_state');
    expect(getSignalRoles('anger')).not.toContain('recovery_lever');
  });

  it('classifies recovery conditions separately from painful emotional states', () => {
    expect(getSignalSentiment('restorative_moment')).toBe('positive');
    expect(getSignalRoles('restorative_moment')).toContain('recovery_lever');
    expect(getSignalRoles('restorative_moment')).not.toContain('feeling_state');
  });

  it('classifies expanded signals with explicit non-feeling roles', () => {
    expect(getSignalRoles('throat_tightness')).toContain('body_signal');
    expect(getSignalRoles('support_without_dependence')).toEqual(expect.arrayContaining([
      'recovery_lever',
      'relational_context',
    ]));
    expect(getSignalRoles('truth_telling')).toContain('value_theme');
    expect(getSignalRoles('meaning_making')).toContain('cognitive_process');
    expect(getSignalRoles('responsibility_weight')).toContain('resource_context');
    expect(getSignalRoles('play_glimmer')).toContain('glimmer');
    expect(getSignalRoles('structured_pleasure')).toContain('recovery_lever');
  });

  it('classifies nuanced expanded signals by role keywords', () => {
    expect(getSignalRoles('dream_loss')).toContain('cognitive_process');
    expect(getSignalRoles('dream_loss')).toContain('feeling_state');
    expect(getSignalRoles('creative_aliveness')).toContain('glimmer');
    expect(getSignalRoles('calm_bracing')).toContain('feeling_state');
    expect(getSignalRoles('calm_bracing')).toContain('body_signal');
    expect(getSignalRoles('pressure_sharpens_focus')).toContain('resource_context');
    expect(getSignalRoles('boundary_without_approval')).toContain('protective_strategy');
  });

  it('classifies body, relationship, dream, and resource signals for live slot routing', () => {
    expect(getSignalRoles('chest_pressure')).toContain('body_signal');
    expect(getSignalRoles('body_heaviness')).toContain('body_signal');
    expect(getSignalRoles('low_sleep')).toContain('body_signal');
    expect(getSignalRoles('overrides_tiredness')).toContain('body_signal');

    expect(getSignalRoles('support_need')).toEqual(expect.arrayContaining([
      'feeling_state',
      'relational_context',
      'resource_context',
    ]));
    expect(getSignalRoles('repair_need')).toContain('relational_context');
    expect(getSignalRoles('wants_to_be_seen')).toContain('relational_context');

    expect(getSignalRoles('dream_unfinished_processing')).toContain('cognitive_process');
    expect(getSignalRoles('dream_image_true_feeling')).toEqual(expect.arrayContaining([
      'cognitive_process',
      'feeling_state',
    ]));

    expect(getSignalRoles('capacity_strain')).toContain('resource_context');
    expect(getSignalRoles('schedule_over_capacity')).toContain('resource_context');
  });

  it('keeps settled safety signals positive and out of protective strategy', () => {
    const settledSafetySignals: SignalKey[] = [
      'quiet_safety',
      'familiar_calm',
      'somatic_safety',
      'unbraced_stillness',
    ];

    for (const key of settledSafetySignals) {
      expect(getSignalSentiment(key)).toBe('positive');
      expect(getSignalRoles(key)).toEqual(expect.arrayContaining(['recovery_lever', 'glimmer']));
      expect(getSignalRoles(key)).not.toContain('protective_strategy');
    }
  });

  it('separates unsafe or trapped protection from settled safety', () => {
    expect(getSignalSentiment('unsafe')).toBe('negative');
    expect(getSignalRoles('unsafe')).toContain('protective_strategy');

    expect(getSignalSentiment('trapped')).toBe('negative');
    expect(getSignalRoles('trapped')).toContain('protective_strategy');

    expect(getSignalSentiment('control_for_uncertainty')).toBe('mixed');
    expect(getSignalRoles('control_for_uncertainty')).toContain('protective_strategy');

    expect(getSignalRoles('safe')).not.toContain('protective_strategy');
    expect(getSignalSentiment('safe')).toBe('positive');
  });

  it('keeps mixed emotional states from defaulting to neutral', () => {
    expect(getSignalSentiment('vulnerability')).toBe('mixed');
    expect(getSignalSentiment('longing')).toBe('mixed');
    expect(getSignalSentiment('quiet_emotional_change')).toBe('mixed');
    expect(getSignalSentiment('boundary_guilt')).toBe('mixed');
    expect(getSignalSentiment('receiving_care_difficulty')).toBe('mixed');
    expect(getSignalSentiment('support_need')).toBe('mixed');
    expect(getSignalSentiment('fear_of_being_too_much')).toBe('mixed');
    expect(getSignalSentiment('responsibility_weight')).toBe('mixed');
    expect(getSignalSentiment('care_with_boundaries')).toBe('mixed');
    expect(getSignalSentiment('transformation_season')).toBe('mixed');
    expect(getSignalSentiment('decision_uncertainty')).toBe('mixed');
  });

  it('adds sentiment and role metadata during normalization', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: '2026-04-24',
        mood: 1,
        energy: 2,
        stress: 5,
        tags: ['rested'],
      }],
      journals: [{
        date: '2026-04-24',
        text: 'I feel hurt, guilty, and sad, but I also had a restorative moment.',
      }],
    });

    const guilt = signals.find(signal => signal.key === 'guilt');
    const hurt = signals.find(signal => signal.key === 'hurt');
    const restorative = signals.find(signal => signal.key === 'restorative_moment');

    expect(hurt?.sentiment).toBe('negative');
    expect(hurt?.roles).toContain('feeling_state');
    expect(hurt?.roles).not.toContain('recovery_lever');

    expect(guilt?.sentiment).toBe('negative');
    expect(guilt?.roles).toContain('feeling_state');
    expect(guilt?.roles).not.toContain('recovery_lever');

    expect(restorative?.sentiment).toBe('positive');
    expect(restorative?.roles).toContain('recovery_lever');
  });

  it('adds routing metadata to body, relationship, dream, and glimmer normalizer output', () => {
    const signals = normalizeInsightInputsV2({
      bodyMaps: [{
        date: '2026-04-24',
        region: 'chest',
        sensation: 'breath',
        intensity: 8,
      }],
      relationshipMirrors: [{
        date: '2026-04-24',
        note: 'There was an off tone and I wanted repair, reassurance, support, and to feel seen.',
      }],
      dreams: [{
        date: '2026-04-23',
        dreamText: 'I was searching through a childhood home after a conflict and woke with the same symbol lingering.',
        dreamMood: 'anxious',
        dreamFeelings: JSON.stringify([{ id: 'vulnerable', intensity: 8 }]),
      }],
      glimmerLogs: [{
        date: '2026-04-24',
        event: 'A quiet walk with sunlight helped me feel safe, grounded, and lighter.',
        intensity: 8,
      }],
    });

    const chest = signals.find(signal => signal.key === 'chest_pressure');
    const repair = signals.find(signal => signal.key === 'repair_need');
    const dream = signals.find(signal => signal.key === 'dream_unfinished_processing');
    const quietSafety = signals.find(signal => signal.key === 'quiet_safety');

    expect(chest?.roles).toContain('body_signal');
    expect(repair?.roles).toContain('relational_context');
    expect(dream?.roles).toContain('cognitive_process');
    expect(quietSafety?.sentiment).toBe('positive');
    expect(quietSafety?.roles).toEqual(expect.arrayContaining(['recovery_lever', 'glimmer']));
  });

  it('keeps common persona trigger and support signals roleful', () => {
    const representativePersonaSignals: SignalKey[] = [
      'responsibility_weight',
      'deep_processing',
      'tone_sensitivity',
      'calm_bracing',
      'capacity_strain',
      'chest_pressure',
      'minimizes_need',
      'boundary_guilt',
      'dream_unfinished_processing',
      'support_abundance_shift',
      'growth_edge',
      'meaning_making',
    ];

    for (const key of representativePersonaSignals) {
      expect(getSignalRoles(key).length).toBeGreaterThan(0);
    }
  });

  it('gives every catalog-referenced signal at least one taxonomy role', () => {
    const catalogSignalKeys = collectCatalogSignalKeys();
    const roleless = catalogSignalKeys.filter(key => getSignalRoles(key).length === 0);

    expect(catalogSignalKeys.length).toBeGreaterThan(850);
    expect(roleless).toEqual([]);
  });

  it('adds guardrail metadata to persona profiles', () => {
    const restCapacity = PERSONA_PROFILES.find(profile => profile.key === 'restCapacity');

    expect(restCapacity?.polarity).toBe('negative');
    expect(restCapacity?.requiredSignalRoles).toContain('feeling_state');
    expect(restCapacity?.blockedRecoverySignals).toContain('restorative_moment');
  });
});
