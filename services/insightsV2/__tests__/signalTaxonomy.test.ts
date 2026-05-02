import { getSignalRoles, getSignalSentiment } from '../signalTaxonomy';
import { normalizeInsightInputsV2 } from '../normalizers';
import { PERSONA_PROFILES } from '../personaProfiles';

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

  it('keeps mixed emotional states from defaulting to neutral', () => {
    expect(getSignalSentiment('vulnerability')).toBe('mixed');
    expect(getSignalSentiment('longing')).toBe('mixed');
    expect(getSignalSentiment('quiet_emotional_change')).toBe('mixed');
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

  it('adds guardrail metadata to persona profiles', () => {
    const restCapacity = PERSONA_PROFILES.find(profile => profile.key === 'restCapacity');

    expect(restCapacity?.polarity).toBe('negative');
    expect(restCapacity?.requiredSignalRoles).toContain('feeling_state');
    expect(restCapacity?.blockedRecoverySignals).toContain('restorative_moment');
  });
});
