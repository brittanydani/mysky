import { adaptPremiumPersonaProfile } from '../adapters/premiumPersonaProfile';
import type { SelectedPersonaProfile } from '../types';

describe('adaptPremiumPersonaProfile', () => {
  const selectedPersona: SelectedPersonaProfile = {
    key: 'overResponsibleStabilizer',
    personNumber: 1,
    title: 'The Over-Responsible Stabilizer',
    category: 'responsibilityCare',
    secondaryCategories: ['selfWorthReceiving'],
    polarity: 'negative',
    intro: ['A part of you may move toward responsibility quickly.'],
    sentences: ['You may notice what needs care before anyone else names it.'],
    selectedSentence: 'You may notice what needs care before anyone else names it.',
    score: 0.72,
    confidence: 'strong',
    matchedSignals: ['mental_load', 'responsibility_weight'],
    matchedPatternKeys: ['responsibilityCare_invisibleLoad'],
    evidence: [
      {
        source: 'journal',
        date: '2026-04-24',
        label: 'Journal',
        phrase: 'I have to handle Naomi and the whole plan myself.',
        signal: 'mental_load',
        strength: 0.8,
      },
      {
        source: 'bodyMap',
        date: '2026-04-24',
        label: 'Body map',
        signal: 'responsibility_weight',
        strength: 0.7,
      },
    ],
  };

  it('turns a selected V2 persona into a premium-safe parts profile', () => {
    const profile = adaptPremiumPersonaProfile(selectedPersona);

    expect(profile).not.toBeNull();
    expect(profile?.label).toBe('A part of you');
    expect(profile?.title).toBe('The Over-Responsible Stabilizer');
    expect(profile?.protectivePurpose).toContain('learned to keep');
    expect(profile?.strengths.length).toBeGreaterThan(0);
    expect(profile?.growthEdge).toContain('growth edge');
    expect(profile?.whatHelps.length).toBeGreaterThan(0);
    expect(profile?.evidenceSummary).toContain('journal entries');
    expect(profile?.evidenceSummary).toContain('body maps');
    expect(profile?.evidenceSummary).not.toContain('Naomi');
    expect(profile?.evidenceSummary).not.toContain('whole plan myself');
  });

  it('does not surface an emerging persona profile as premium certainty', () => {
    expect(adaptPremiumPersonaProfile({
      ...selectedPersona,
      confidence: 'emerging',
      score: 0.46,
    })).toBeNull();
  });
});
