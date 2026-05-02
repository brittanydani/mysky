import { buildTodayInsights } from '../knowledgeEngineV2';

describe('Knowledge Engine V2', () => {
  const now = '2026-04-24T12:00:00Z';
  const today = '2026-04-24';

  const mockCheckIns = [
    {
      date: today,
      mood: 2,
      energy: 1,
      stress: 4,
      tags: ['rest'],
    },
  ];

  const mockJournals = [
    {
      date: today,
      text: 'I feel guilty for resting.',
    }
  ];

  it('generates a valid insight based on Phase 1 patterns', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        dailyCheckIns: mockCheckIns,
        journals: mockJournals,
      },
      history: [],
    });

    expect(result).toBeDefined();
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.insights.length).toBeGreaterThan(0);
    
    const insight = result.insights.find(i => i.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    if (insight) {
        expect(insight.patternKey).toBe('timeRhythms_lowCapacityPatterns');
        expect(insight.title).toBeDefined();
        expect(insight.body).toContain('Low-capacity states are repeating enough to notice');
        expect(insight.reframe).toBe('This may need rhythm-aware planning, not more self-criticism.');
    }
  });

  it('detects intensifying movement', async () => {
    const previousPatternScores = [
      {
        patternKey: 'timeRhythms_lowCapacityPatterns',
        score: 0.5,
        confidence: 'emerging' as const,
        movement: 'new' as const,
        timeframeDays: 90,
        sources: [],
        evidence: [],
        lastSeenAt: now,
        title: 'Low-Capacity Windows',
        category: 'timeRhythms' as const,
      }
    ];

    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        dailyCheckIns: mockCheckIns,
        journals: mockJournals,
      },
      history: [],
      previousPatternScores,
    });

    const insight = result.insights.find(i => i.slot === 'whatMySkyNoticed');
    expect(insight?.movement).toBe('intensifying');
    expect(insight?.body).toContain('appears louder than it has been recently');
  });

  it('detects cross-source match score impact', async () => {
     const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        dailyCheckIns: mockCheckIns,
        journals: mockJournals,
      },
      history: [],
    });

    const insight = result.insights.find(i => i.slot === 'whatMySkyNoticed');
    expect(insight?.angleKey).toBe('timeRhythms_repeatingLowCapacity');
  });

  it('populates multiple evidence-gated slots beyond the primary daily read', async () => {
    const result = await buildTodayInsights({
        date: now,
        rawInputs: {
          dailyCheckIns: mockCheckIns,
          journals: mockJournals,
        },
        history: [],
      });

      expect(result.insights.length).toBeGreaterThanOrEqual(2);
      const slots = result.insights.map(i => i.slot);
      expect(slots).toContain('whatMySkyNoticed');
      expect(slots.some(slot => slot !== 'whatMySkyNoticed')).toBe(true);
  });

  it('caps the live today surface while keeping expanded V2 slots evidence-gated', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        dailyCheckIns: [{
          date: today,
          moodScore: 7,
          energyLevel: 'high',
          stressLevel: 'low',
          tags: ['gratitude', 'rest'],
        }],
        journals: [{
          date: today,
          content: 'I felt grounded after a hard conversation, but my chest was tight and I wanted repair.',
        }],
        bodyMaps: [{
          date: today,
          region: 'chest',
          emotion: 'anxiety',
          sensation: 'tight',
          intensity: 4,
          cues: ['chest', 'tight'],
        }],
        relationshipMirrors: [{
          date: today,
          note: 'I wanted repair and reassurance after the tone shifted.',
          tags: ['t2'],
        }],
        glimmerLogs: [{
          timestamp: new Date(now).getTime(),
          event: 'quiet walk helped me settle',
          sensations: ['soft chest'],
          intensity: 4,
        }],
        dreams: [{
          date: today,
          dreamText: 'A dream about unfinished conversations stayed with me.',
        }],
      },
      history: [],
    });

    expect(result.insights.length).toBeLessThanOrEqual(4);
    expect(result.insights.map(insight => insight.slot)).toContain('whatMySkyNoticed');
    expect(result.insights.some(insight => insight.patternKey === 'unknown')).toBe(false);

    const whatHelped = result.insights.find(insight => insight.slot === 'whatHelped');
    expect(whatHelped?.body).toMatch(/helped your system|gave connection|gave your body/);
    expect(whatHelped?.body).not.toBe('Something today may have helped your system soften, settle, recover, or feel a little more supported.');

    const bodySignal = result.insights.find(insight => insight.slot === 'bodySignal');
    if (bodySignal) {
      expect(bodySignal.body).toContain('Your body is joining the conversation');
      expect(bodySignal.body).not.toBe('Your body may be giving you information before your mind has fully organized it.');
    }
  });

  it('uses feeling set copy for the primary daily feeling', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        journals: [{
          date: today,
          text: 'I feel hurt and unseen after that conversation.',
        }],
      },
      history: [],
    });

    expect(result.primaryFeeling?.key).toBe('hurt');

    const todaySignal = result.insights.find(i => i.slot === 'todaySignal');
    expect(todaySignal?.title).toBe("Today's Hurt");
    expect(todaySignal?.body).toBe(result.primaryFeeling?.selectedSentence);
    expect(todaySignal?.reframe).toBe(result.primaryFeeling?.reframeSentence);
    expect(todaySignal?.body).not.toMatch(/Your archive|MySky is noticing/i);
  });

  it('normalizes app model field names against the requested insight date', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        dailyCheckIns: [{
          date: today,
          moodScore: 2,
          energyLevel: 'low',
          stressLevel: 'high',
          tags: ['rest'],
        }],
        journals: [{
          date: today,
          content: 'I feel guilty for resting.',
        }],
        sleepLogs: [{
          date: today,
          durationHours: 5,
          quality: 2,
        }],
        bodyMaps: [{
          date: today,
          cues: ['chest'],
        }],
      },
      history: [],
    });

    const bodyMapIndex = result.signals.findIndex((signal) => signal.source === 'bodyMap');
    const journalIndex = result.signals.findIndex((signal) => signal.source === 'journal');
    const checkInIndex = result.signals.findIndex((signal) => signal.source === 'dailyCheckIn');
    const sleepIndex = result.signals.findIndex((signal) => signal.source === 'sleep');

    expect(bodyMapIndex).toBeGreaterThanOrEqual(0);
    expect(bodyMapIndex).toBeLessThan(journalIndex);
    expect(journalIndex).toBeLessThan(checkInIndex);
    expect(checkInIndex).toBeLessThan(sleepIndex);
    expect(result.signals.some((signal) => signal.key === 'low_energy' && signal.date === today)).toBe(true);
    expect(result.signals.some((signal) => signal.key === 'rest_guilt' && signal.source === 'journal')).toBe(true);
    expect(result.signals.some((signal) => signal.key === 'low_capacity' && signal.date === today)).toBe(true);
    expect(result.insights.length).toBeGreaterThan(0);
  });

  it('enforces freshness rules (cooldowns)', async () => {
      const history = [
          {
              id: 'prev-1',
              patternKey: 'rest_capacity_001_rest_resistance',
              angleKey: 'rest_resistance_001_rest_without_earning',
              slot: 'whatMySkyNoticed' as const,
              surface: 'today' as const,
              title: 'Rest Without Earning It',
              shownAt: now,
              copyHash: 'copy_269229870'
          }
      ];

      const result = await buildTodayInsights({
        date: now,
        rawInputs: {
          dailyCheckIns: mockCheckIns,
          journals: mockJournals,
        },
        history,
      });

      const insight = result.insights.find(i => i.slot === 'whatMySkyNoticed');
      // Cooldown should prevent showing the exact same angle again.
      // If no alternate fresh candidate is available, slot may be empty.
      expect(insight?.angleKey).not.toBe('rest_resistance_001_rest_without_earning');
  });
});
