import { computeDeepInsights } from '../deepInsights';

function makeProfile(overrides: Record<string, unknown> = {}) {
  const scoredDays = Array.from({ length: 16 }, (_, index) => ({
    aggregate: {
      sleepQuality: index % 2 === 0 ? 5 : 2,
      tagsUnion: index % 4 === 0 ? ['tension', 'glimmer'] : index % 5 === 0 ? ['conflict', 'triggered'] : [],
      hasDream: index % 3 === 0,
    },
    scores: {
      stability: index < 8 ? 45 : 65,
      strain: index < 8 ? 72 : 48,
      restoration: index < 8 ? 35 : 60,
      emotionalIntensity: index < 8 ? 74 : 55,
      connection: index < 8 ? 30 : 58,
    },
  }));

  return {
    maturity: 'deep',
    totalDays: 120,
    traits: [
      { id: 'sleep-sensitive', description: 'Sleep changes your stability quickly.', strength: 78, domain: 'sensitivity', firstDetectedDays: 20 },
      { id: 'connection-sensitive', description: 'Connection regulates you.', strength: 70, domain: 'sensitivity', firstDetectedDays: 25 },
      { id: 'deep-feeler', description: 'You feel deeply.', strength: 68, domain: 'identity', firstDetectedDays: 30 },
    ],
    recoveryStyle: {
      mode: 'structure',
      avgRecoveryDays: 2.2,
      recoveryIngredients: ['good sleep', 'nature', 'restoration'],
      confidence: 82,
    },
    stressPattern: {
      buildupStyle: 'gradual',
      avgBuildupDays: 3.4,
      primaryDrains: ['conflict', 'screens'],
      responseStyle: 'withdraw',
      confidence: 76,
    },
    sleepSensitivity: 76,
    connectionSensitivity: 70,
    emotionalRange: 24,
    baselineStability: 61,
    bestDayIngredients: ['good sleep', 'restoration', 'nature'],
    innerThemes: [
      { theme: 'safety', frequency: 8, domain: 'emotional', strength: 82 },
      { theme: 'connection', frequency: 6, domain: 'relational', strength: 70 },
    ],
    personalTruths: ['Sleep is one of your most reliable emotional levers.'],
    patternProfile: {
      scoredDays,
      correlations: [
        { metricA: 'sleep', metricB: 'stability', strength: 0.62 },
      ],
      trends: {
        stability: 'improving',
        strain: 'softening',
        restoration: 'improving',
      },
      bestDayProfile: {
        dayCount: 6,
      },
      overallAvg: {
        stability: 55,
        strain: 60,
        restoration: 44,
        emotionalIntensity: 64,
        connection: 42,
      },
    },
    todayContext: { type: 'pattern', description: 'This resembles a familiar stretch.', streakDays: 4 },
    isLowCapacity: false,
    strengths: [
      { id: 'pattern-recognition', description: 'You notice patterns before they become crises.', strength: 72 },
    ],
    anticipations: [
      { id: 'strain-building', body: 'Strain has been rising over the last few days.', urgency: 'notable', confidence: 74 },
    ],
    progressMarkers: [
      { id: 'protecting-energy', description: 'You are protecting your energy earlier.', type: 'protecting', strength: 68 },
    ],
    ...overrides,
  } as any;
}

describe('deepInsights', () => {
  it('generates a full bundle for deep maturity profiles', () => {
    const bundle = computeDeepInsights(makeProfile());

    expect(bundle.maturity).toBe('deep');
    expect(bundle.insights.length).toBeGreaterThan(5);
    expect(bundle.personalTruths[0]).toContain('Sleep');
    expect(bundle.whatToRemember.length).toBeGreaterThan(0);
    expect(bundle.memory.persistentTruths.length).toBeGreaterThan(0);
  });

  it('applies restraint mode when the profile is low-capacity', () => {
    const bundle = computeDeepInsights(makeProfile({ maturity: 'established', isLowCapacity: true }));

    expect(bundle.insights.length).toBeLessThanOrEqual(5);
    expect(bundle.insights.every((insight) => ['name', 'guide', 'clarify', 'integrate'].includes(insight.job))).toBe(true);
  });

  it('returns empty narrative memory for early profiles', () => {
    const bundle = computeDeepInsights(makeProfile({ maturity: 'early', totalDays: 7 }));

    expect(bundle.memory).toEqual({
      fadingPatterns: [],
      emergingPatterns: [],
      previousStruggles: [],
      persistentTruths: [],
    });
  });

  it('replaces old generic premium copy with seeded, specific narratives', () => {
    const bundle = computeDeepInsights(makeProfile());
    const hardDayBundle = computeDeepInsights(makeProfile({
      patternProfile: {
        ...makeProfile().patternProfile,
        overallAvg: {
          ...makeProfile().patternProfile.overallAvg,
          stability: 80,
          strain: 35,
          restoration: 75,
        },
      },
    }));
    const progressReceipt = bundle.insights.find((insight) => insight.id === 'premium-progress-receipt');
    const hardDayMap = hardDayBundle.insights.find((insight) => insight.id === 'premium-hard-day-map');

    expect(progressReceipt?.body).toBeDefined();
    expect(progressReceipt?.body).not.toContain('Your archive is showing movement over time.');
    expect(progressReceipt?.body).toMatch(/Monthly|progress marker|trajectory/i);

    expect(hardDayMap?.body).toBeDefined();
    expect(hardDayMap?.body).not.toContain('The warning pattern is not one single feeling');
  });

  it('produces multiple premium progress receipt variants across different archive states', () => {
    const bodies = new Set(
      Array.from({ length: 12 }, (_, index) => {
        const bundle = computeDeepInsights(
          makeProfile({
            totalDays: 120 + index * 11,
            progressMarkers: Array.from({ length: (index % 4) + 1 }, (_, markerIndex) => ({
              id: `marker-${index}-${markerIndex}`,
              description: `Marker ${markerIndex}`,
              type: 'protecting',
              strength: 60 + markerIndex,
            })),
            patternProfile: {
              ...makeProfile().patternProfile,
              overallAvg: {
                ...makeProfile().patternProfile.overallAvg,
                stability: 48 + index,
                strain: 66 - index,
              },
            },
          }),
        );
        return bundle.insights.find((insight) => insight.id === 'premium-progress-receipt')?.body;
      }).filter(Boolean),
    );

    expect(bodies.size).toBeGreaterThan(3);
  });
});
