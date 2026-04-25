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
        expect(insight.patternKey).toBe('rest_capacity_001_rest_resistance');
        expect(insight.title).toBeDefined();
        expect(insight.body).toContain('rest may still feel easier to accept');
        expect(insight.reframe).toContain('This does not read as laziness');
    }
  });

  it('detects intensifying movement', async () => {
    const previousPatternScores = [
      {
        patternKey: 'rest_capacity_001_rest_resistance',
        score: 0.5,
        confidence: 'emerging' as const,
        movement: 'new' as const,
        timeframeDays: 90,
        sources: [],
        evidence: [],
        lastSeenAt: now,
        title: 'Title',
        category: 'restCapacity' as const,
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
    expect(insight?.angleKey).toBe('rest_resistance_001_rest_without_earning');
  });

  it('populates multiple slots (whatMySkyNoticed and todaySignal)', async () => {
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
      expect(slots).toContain('todaySignal');
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
