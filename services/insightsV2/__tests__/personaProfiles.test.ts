import { selectPrimaryPersona } from '../engine/selectPrimaryPersona';
import { buildTodayInsights } from '../knowledgeEngineV2';
import { PERSONA_PROFILES } from '../personaProfiles';
import type { ArchivePatternScore, UserSignal } from '../types';

describe('insightsV2 persona profiles', () => {
  const now = '2026-04-24T12:00:00Z';
  const today = '2026-04-24';

  it('keeps the provided persona copy as the canonical list', () => {
    expect(PERSONA_PROFILES).toHaveLength(9);
    expect(PERSONA_PROFILES.map(profile => profile.personNumber)).toEqual([
      1,
      2,
      3,
      4,
      6,
      7,
      8,
      9,
      10,
    ]);
    expect(PERSONA_PROFILES.every(profile => profile.sentences.length === 10)).toBe(true);

    const relationalTracker = PERSONA_PROFILES.find(profile => profile.key === 'relationalTracker');
    expect(relationalTracker?.sentences[0]).toBe(
      `You may notice small changes in someone’s tone before anything is said directly. That can help you understand what is happening, but it can also keep you on alert when the other person may not even realize they shifted.`,
    );
  });

  it('selects exactly one primary persona from the canonical profiles', () => {
    const signals: UserSignal[] = [
      signal('responsibility_weight', 'journal'),
      signal('mental_load', 'journal'),
      signal('caretaking_pressure', 'triggerLog'),
      signal('overfunctioning', 'reflectionBank'),
      signal('always_on', 'journal'),
      signal('preparedness', 'dailyCheckIn'),
      signal('invisible_labor', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'responsibility_care_002_capable_one',
        title: 'The Capable One Pattern',
        category: 'responsibilityCare',
        score: 0.82,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal'],
        evidence: [],
        lastSeenAt: today,
      },
      {
        patternKey: 'rest_capacity_002_same_load_less_fuel',
        title: 'The Same Load, Less Fuel',
        category: 'restCapacity',
        score: 0.49,
        confidence: 'emerging',
        movement: 'new',
        timeframeDays: 30,
        sources: ['journal'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('overResponsibleStabilizer');
    expect(selected?.title).toBe('The Over-Responsible Stabilizer');
    expect(selected?.selectedSentence).toBe(
      `When things feel uncertain, you seem to look for the part you can control. That may help you feel less helpless, but it can also make you responsible for calming situations that were never fully yours to manage.`,
    );
  });

  it('returns the selected persona from the V2 engine without replacing the daily insight', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        dailyCheckIns: [{
          date: today,
          mood: 3,
          energy: 3,
          stress: 4,
          tags: ['work', 'planning', 'chores'],
        }],
        journals: [{
          date: today,
          text: 'I feel responsible for carrying the mental load and tracking everything. I cannot turn off, I handle everything, and I keep preparing with a checklist. The household chores and logistics feel like invisible labor.',
        }],
      },
      history: [],
    });

    expect(result.primaryPersona?.key).toBe('overResponsibleStabilizer');
    expect(result.primaryPersona?.sentences).toContain(
      `Your strength may show up as steadiness under pressure, but that does not mean pressure is harmless to you. You can be good at carrying something and still deserve to put it down.`,
    );
    expect(result.insights.some(insight => insight.slot === 'whatMySkyNoticed')).toBe(true);
  });
});

function signal(key: UserSignal['key'], source: UserSignal['source']): UserSignal {
  return {
    key,
    source,
    date: '2026-04-24',
    strength: 0.82,
    evidence: { source, date: '2026-04-24', label: key },
  };
}
