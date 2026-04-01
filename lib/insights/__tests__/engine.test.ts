import {
  scaleTo100,
  inverseScaleTo100,
  computeDailyScores,
  computeStabilityScore,
  computeRestorationScore,
  computeStrainScore,
  computeTrendDirection,
  computeVolatility,
  analyzeSleepMoodRelationship,
  detectBestDayPatterns,
  detectHardDayPatterns,
  buildInsightCards,
  computeInsightConfidence,
  extractJournalSignals,
  analyzeDreamThemes,
  type DailyCheckIn,
  type DailyDerivedScores,
} from '@/lib/insights/engine';

describe('MySky insight engine contract', () => {
  describe('normalization helpers', () => {
    test('scaleTo100 maps lower bound to 0', () => {
      expect(scaleTo100(1, 1, 5)).toBe(0);
    });

    test('scaleTo100 maps upper bound to 100', () => {
      expect(scaleTo100(5, 1, 5)).toBe(100);
    });

    test('scaleTo100 maps midpoint correctly', () => {
      expect(scaleTo100(3, 1, 5)).toBe(50);
    });

    test('inverseScaleTo100 reverses the scale', () => {
      expect(inverseScaleTo100(1, 1, 5)).toBe(100);
      expect(inverseScaleTo100(5, 1, 5)).toBe(0);
      expect(inverseScaleTo100(3, 1, 5)).toBe(50);
    });

    test('helpers clamp out-of-range values instead of producing negatives or values above 100', () => {
      expect(scaleTo100(-10, 1, 5)).toBe(0);
      expect(scaleTo100(10, 1, 5)).toBe(100);
      expect(inverseScaleTo100(-10, 1, 5)).toBe(100);
      expect(inverseScaleTo100(10, 1, 5)).toBe(0);
    });
  });

  describe('daily derived score calculations', () => {
    const baseline: DailyCheckIn = {
      date: '2026-04-01',
      mood: 3,
      energy: 3,
      stress: 3,
      sleepQuality: 3,
      sleepHours: 7,
      connection: 3,
      overwhelm: 3,
      emotions: ['okay'],
      tags: [],
      journalText: 'A fairly average day.',
      dreamLogged: false,
      dreamText: '',
    };

    test('computeDailyScores returns normalized and derived values in 0-100 range', () => {
      const result = computeDailyScores(baseline);

      const allValues = [
        ...Object.values(result.normalized),
        ...Object.values(result.derived),
      ];

      for (const value of allValues) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    });

    test('balanced day produces roughly mid-range stability/restoration and moderate strain', () => {
      const result = computeDailyScores(baseline);

      expect(result.derived.stabilityScore).toBeGreaterThanOrEqual(45);
      expect(result.derived.stabilityScore).toBeLessThanOrEqual(60);

      expect(result.derived.restorationScore).toBeGreaterThanOrEqual(45);
      expect(result.derived.restorationScore).toBeLessThanOrEqual(65);

      expect(result.derived.strainScore).toBeGreaterThanOrEqual(40);
      expect(result.derived.strainScore).toBeLessThanOrEqual(60);
    });

    test('high sleep, low stress, high mood day produces high stability and restoration with low strain', () => {
      const input: DailyCheckIn = {
        ...baseline,
        mood: 5,
        energy: 5,
        stress: 1,
        sleepQuality: 5,
        sleepHours: 8.5,
        connection: 4,
        overwhelm: 1,
      };

      const result = computeDailyScores(input);

      expect(result.derived.stabilityScore).toBeGreaterThanOrEqual(80);
      expect(result.derived.restorationScore).toBeGreaterThanOrEqual(80);
      expect(result.derived.strainScore).toBeLessThanOrEqual(25);
    });

    test('poor sleep, high stress, low energy day produces low stability and restoration with high strain', () => {
      const input: DailyCheckIn = {
        ...baseline,
        mood: 1,
        energy: 1,
        stress: 5,
        sleepQuality: 1,
        sleepHours: 4.5,
        connection: 1,
        overwhelm: 5,
      };

      const result = computeDailyScores(input);

      expect(result.derived.stabilityScore).toBeLessThanOrEqual(25);
      expect(result.derived.restorationScore).toBeLessThanOrEqual(30);
      expect(result.derived.strainScore).toBeGreaterThanOrEqual(75);
    });

    test('stability score weights mood more than overwhelm', () => {
      const stableLowMood = computeStabilityScore({
        moodScore: 25,
        energyScore: 75,
        sleepQualityScore: 75,
        inverseStressScore: 75,
        inverseOverwhelmScore: 75,
      });

      const stableLowOverwhelm = computeStabilityScore({
        moodScore: 75,
        energyScore: 75,
        sleepQualityScore: 75,
        inverseStressScore: 75,
        inverseOverwhelmScore: 25,
      });

      expect(stableLowMood).toBeLessThan(stableLowOverwhelm);
    });

    test('restoration score responds more strongly to sleep quality than connection', () => {
      const lowSleep = computeRestorationScore({
        sleepQualityScore: 25,
        sleepHoursScore: 75,
        energyScore: 75,
        inverseStressScore: 75,
        connectionScore: 75,
      });

      const lowConnection = computeRestorationScore({
        sleepQualityScore: 75,
        sleepHoursScore: 75,
        energyScore: 75,
        inverseStressScore: 75,
        connectionScore: 25,
      });

      expect(lowSleep).toBeLessThan(lowConnection);
    });

    test('strain score increases when energy and sleep collapse even if stress stays the same', () => {
      const lowerStrain = computeStrainScore({
        stressScore: 75,
        overwhelmScore: 75,
        energyScore: 75,
        sleepQualityScore: 75,
      });

      const higherStrain = computeStrainScore({
        stressScore: 75,
        overwhelmScore: 75,
        energyScore: 25,
        sleepQualityScore: 25,
      });

      expect(higherStrain).toBeGreaterThan(lowerStrain);
    });
  });

  describe('trend and volatility logic', () => {
    test('computeTrendDirection returns improving for meaningful positive change', () => {
      expect(computeTrendDirection(72, 58)).toBe('improving');
    });

    test('computeTrendDirection returns declining for meaningful negative change', () => {
      expect(computeTrendDirection(48, 62)).toBe('declining');
    });

    test('computeTrendDirection returns steady for small changes', () => {
      expect(computeTrendDirection(61, 58)).toBe('steady');
      expect(computeTrendDirection(55, 60)).toBe('steady');
    });

    test('computeVolatility is low for steady sequences', () => {
      const volatility = computeVolatility([60, 61, 59, 60, 60, 61, 59]);
      expect(volatility).toBeLessThanOrEqual(3);
    });

    test('computeVolatility is high for swingy sequences', () => {
      const volatility = computeVolatility([20, 80, 25, 75, 30, 85, 20]);
      expect(volatility).toBeGreaterThanOrEqual(35);
    });
  });

  describe('journal signal extraction', () => {
    test('extractJournalSignals detects heaviness, stress, and need-for-space language', () => {
      const signals = extractJournalSignals(
        'I felt heavy, overwhelmed, stretched thin, and I just wanted quiet and space.'
      );

      expect(signals.heaviness).toBeGreaterThan(0);
      expect(signals.overwhelm).toBeGreaterThan(0);
      expect(signals.restorationNeed).toBeGreaterThan(0);
    });

    test('extractJournalSignals detects hope and connection when language is warm', () => {
      const signals = extractJournalSignals(
        'I felt supported, close, loved, calmer, and more hopeful by the end of the day.'
      );

      expect(signals.connection).toBeGreaterThan(0);
      expect(signals.hope).toBeGreaterThan(0);
      expect(signals.heaviness).toBeLessThan(signals.connection);
    });

    test('extractJournalSignals does not invent strong signals from neutral text', () => {
      const signals = extractJournalSignals('Today was ordinary. I did some errands and made dinner.');

      expect(signals.heaviness).toBeLessThanOrEqual(0.15);
      expect(signals.overwhelm).toBeLessThanOrEqual(0.15);
      expect(signals.connection).toBeLessThanOrEqual(0.15);
    });
  });

  describe('dream theme analysis', () => {
    test('analyzeDreamThemes detects searching/lost themes', () => {
      const result = analyzeDreamThemes(
        'I was trying to get somewhere but kept getting lost and could not find the way.'
      );

      expect(result.themes.lost).toBeGreaterThan(0.5);
      expect(result.undercurrent).toMatch(/uncertainty|searching|disorientation/i);
    });

    test('analyzeDreamThemes detects pursuit/conflict themes', () => {
      const result = analyzeDreamThemes(
        'Someone was chasing me and I was running, hiding, and trying to escape.'
      );

      expect(result.themes.pursuit).toBeGreaterThan(0.5);
      expect(result.intensity).toBeGreaterThan(0.4);
    });
  });

  describe('relationship analysis: sleep and mood', () => {
    test('analyzeSleepMoodRelationship reports strong relationship when effect size is large and enough data exists', () => {
      const days = makeDays([
        { sleepQuality: 5, mood: 5 },
        { sleepQuality: 5, mood: 4 },
        { sleepQuality: 5, mood: 5 },
        { sleepQuality: 4, mood: 4 },
        { sleepQuality: 4, mood: 4 },
        { sleepQuality: 1, mood: 1 },
        { sleepQuality: 1, mood: 2 },
        { sleepQuality: 2, mood: 2 },
        { sleepQuality: 2, mood: 1 },
        { sleepQuality: 1, mood: 1 },
      ]);

      const result = analyzeSleepMoodRelationship(days);

      expect(result.hasEnoughData).toBe(true);
      expect(result.effectSize).toBeGreaterThanOrEqual(20);
      expect(result.relationship).toBe('positive');
      expect(result.strength).toMatch(/moderate|strong/i);
    });

    test('analyzeSleepMoodRelationship refuses to overclaim on sparse data', () => {
      const days = makeDays([
        { sleepQuality: 5, mood: 5 },
        { sleepQuality: 1, mood: 1 },
        { sleepQuality: 4, mood: 4 },
      ]);

      const result = analyzeSleepMoodRelationship(days);

      expect(result.hasEnoughData).toBe(false);
      expect(result.strength).toBe('insufficient_data');
    });
  });

  describe('best-day and hard-day pattern detection', () => {
    test('detectBestDayPatterns finds recurring ingredients on strong days', () => {
      const days = makeScenarioDays({
        best: 6,
        hard: 4,
      });

      const result = detectBestDayPatterns(days);

      expect(result.hasEnoughData).toBe(true);
      expect(result.commonFactors.sleepQualityHigher).toBe(true);
      expect(result.commonFactors.stressLower).toBe(true);
      expect(result.commonFactors.connectionHigher).toBe(true);
    });

    test('detectHardDayPatterns finds recurring ingredients on difficult days', () => {
      const days = makeScenarioDays({
        best: 5,
        hard: 6,
      });

      const result = detectHardDayPatterns(days);

      expect(result.hasEnoughData).toBe(true);
      expect(result.commonFactors.lowSleep).toBe(true);
      expect(result.commonFactors.highStress).toBe(true);
      expect(result.commonFactors.lowEnergy).toBe(true);
    });
  });

  describe('confidence scoring', () => {
    test('confidence is high when coverage, effect size, consistency, and recency are high', () => {
      const confidence = computeInsightConfidence({
        dataCoverageScore: 90,
        effectSizeScore: 88,
        consistencyScore: 85,
        recencyScore: 80,
      });

      expect(confidence).toBeGreaterThanOrEqual(84);
    });

    test('confidence is low when data is sparse even if effect size looks large', () => {
      const confidence = computeInsightConfidence({
        dataCoverageScore: 20,
        effectSizeScore: 85,
        consistencyScore: 30,
        recencyScore: 90,
      });

      expect(confidence).toBeLessThanOrEqual(50);
    });
  });

  describe('insight card generation', () => {
    test('buildInsightCards generates reflective sleep insight when evidence is strong', () => {
      const cards = buildInsightCards({
        days: makeDays([
          { sleepQuality: 5, mood: 5, energy: 5, stress: 1, overwhelm: 1, connection: 4 },
          { sleepQuality: 5, mood: 4, energy: 4, stress: 2, overwhelm: 2, connection: 4 },
          { sleepQuality: 4, mood: 4, energy: 4, stress: 2, overwhelm: 2, connection: 4 },
          { sleepQuality: 4, mood: 4, energy: 4, stress: 2, overwhelm: 2, connection: 4 },
          { sleepQuality: 1, mood: 1, energy: 1, stress: 5, overwhelm: 5, connection: 2 },
          { sleepQuality: 1, mood: 2, energy: 2, stress: 5, overwhelm: 4, connection: 2 },
          { sleepQuality: 2, mood: 2, energy: 2, stress: 4, overwhelm: 4, connection: 2 },
          { sleepQuality: 2, mood: 1, energy: 1, stress: 5, overwhelm: 5, connection: 1 },
        ]),
      });

      const sleepCard = cards.find((card) => card.type === 'sleep_connection');

      expect(sleepCard).toBeDefined();
      expect(sleepCard?.title).toMatch(/sleep/i);
      expect(sleepCard?.body).toMatch(/better sleep|restful sleep|sleep quality/i);
      expect(sleepCard?.body).not.toMatch(/algorithm|detected|statistically/i);
      expect(sleepCard?.confidence).toBeGreaterThanOrEqual(70);
    });

    test('buildInsightCards uses softer language for medium confidence', () => {
      const cards = buildInsightCards({
        days: makeDays([
          { sleepQuality: 4, mood: 4 },
          { sleepQuality: 4, mood: 3 },
          { sleepQuality: 3, mood: 3 },
          { sleepQuality: 2, mood: 2 },
          { sleepQuality: 2, mood: 3 },
          { sleepQuality: 3, mood: 2 },
          { sleepQuality: 4, mood: 4 },
        ]),
      });

      const sleepCard = cards.find((card) => card.type === 'sleep_connection');

      expect(sleepCard).toBeDefined();
      expect(sleepCard?.body).toMatch(/seems to|may be|appears to/i);
    });

    test('buildInsightCards avoids strong claims when confidence is low', () => {
      const cards = buildInsightCards({
        days: makeDays([
          { sleepQuality: 5, mood: 2 },
          { sleepQuality: 1, mood: 4 },
          { sleepQuality: 3, mood: 3 },
          { sleepQuality: 4, mood: 2 },
        ]),
      });

      const sleepCard = cards.find((card) => card.type === 'sleep_connection');

      expect(sleepCard).toBeUndefined();
    });

    test('buildInsightCards can generate a best-day insight', () => {
      const cards = buildInsightCards({
        days: makeScenarioDays({ best: 7, hard: 5 }),
      });

      const bestDayCard = cards.find((card) => card.type === 'best_day_pattern');

      expect(bestDayCard).toBeDefined();
      expect(bestDayCard?.body).toMatch(/strongest days|best days|steadier days/i);
      expect(bestDayCard?.body).toMatch(/sleep|stress|connection|overwhelm/i);
    });

    test('buildInsightCards can generate a hard-day insight', () => {
      const cards = buildInsightCards({
        days: makeScenarioDays({ best: 5, hard: 7 }),
      });

      const hardDayCard = cards.find((card) => card.type === 'hard_day_pattern');

      expect(hardDayCard).toBeDefined();
      expect(hardDayCard?.body).toMatch(/harder days|most difficult days|difficult stretches/i);
      expect(hardDayCard?.body).toMatch(/low energy|poor sleep|stress|overwhelm/i);
    });

    test('buildInsightCards can generate an emerging theme insight from journals', () => {
      const days = Array.from({ length: 8 }, (_, index) =>
        makeDay({
          date: `2026-04-${String(index + 1).padStart(2, '0')}`,
          journalText:
            'I feel stretched thin and heavy. I want quiet, space, and relief from all the pressure.',
        })
      );

      const cards = buildInsightCards({ days });
      const themeCard = cards.find((card) => card.type === 'emerging_theme');

      expect(themeCard).toBeDefined();
      expect(themeCard?.body).toMatch(/theme|recurring|pattern/i);
      expect(themeCard?.body).toMatch(/quiet|space|pressure|heaviness|relief/i);
    });

    test('buildInsightCards can generate a dream theme insight when dream content repeats', () => {
      const days = [
        makeDay({ dreamLogged: true, dreamText: 'I was lost and could not find where I was going.' }),
        makeDay({ dreamLogged: true, dreamText: 'I kept searching for my way home but got turned around.' }),
        makeDay({ dreamLogged: true, dreamText: 'I was wandering, trying to get somewhere, but nothing made sense.' }),
        makeDay({ dreamLogged: true, dreamText: 'I was lost again and trying to find the right path.' }),
        makeDay({ dreamLogged: false }),
        makeDay({ dreamLogged: false }),
      ];

      const cards = buildInsightCards({ days });
      const dreamCard = cards.find((card) => card.type === 'dream_theme');

      expect(dreamCard).toBeDefined();
      expect(dreamCard?.body).toMatch(/dreams?/i);
      expect(dreamCard?.body).toMatch(/searching|uncertainty|lost|direction/i);
    });

    test('buildInsightCards caps duplicate insight types and avoids spam', () => {
      const cards = buildInsightCards({
        days: makeScenarioDays({ best: 8, hard: 8 }),
      });

      const types = cards.map((card) => card.type);
      const duplicates = types.filter((type, index) => types.indexOf(type) !== index);

      expect(duplicates).toHaveLength(0);
      expect(cards.length).toBeLessThanOrEqual(6);
    });
  });

  describe('edge cases and trust protections', () => {
    test('engine handles missing optional fields gracefully', () => {
      const result = computeDailyScores({
        date: '2026-04-01',
        mood: 3,
        energy: 3,
        stress: 3,
        sleepQuality: 3,
        sleepHours: 7,
        connection: 3,
        overwhelm: 3,
        emotions: [],
        tags: [],
        journalText: '',
        dreamLogged: false,
      } as DailyCheckIn);

      expect(result).toBeDefined();
      expect(result.derived.stabilityScore).toBeGreaterThanOrEqual(0);
    });

    test('engine handles all-identical weeks without dividing by zero or producing NaN', () => {
      const days = Array.from({ length: 7 }, (_, index) =>
        makeDay({
          date: `2026-04-${String(index + 1).padStart(2, '0')}`,
          mood: 3,
          energy: 3,
          stress: 3,
          sleepQuality: 3,
          sleepHours: 7,
          connection: 3,
          overwhelm: 3,
        })
      );

      const cards = buildInsightCards({ days });

      expect(cards.every((card) => Number.isFinite(card.confidence))).toBe(true);
    });

    test('engine does not generate diagnostic language', () => {
      const cards = buildInsightCards({
        days: makeScenarioDays({ best: 5, hard: 7 }),
      });

      for (const card of cards) {
        expect(card.body).not.toMatch(/depression|anxiety disorder|trauma response|dysregulated|diagnosis/i);
      }
    });

    test('engine does not overstate dream interpretations as facts', () => {
      const cards = buildInsightCards({
        days: [
          makeDay({ dreamLogged: true, dreamText: 'I was being chased and trying to hide.' }),
          makeDay({ dreamLogged: true, dreamText: 'I kept running from someone.' }),
          makeDay({ dreamLogged: true, dreamText: 'I was hiding and trying to get away.' }),
          makeDay({ dreamLogged: true, dreamText: 'I was escaping from danger.' }),
        ],
      });

      const dreamCard = cards.find((card) => card.type === 'dream_theme');

      expect(dreamCard).toBeDefined();
      expect(dreamCard?.body).toMatch(/may reflect|may suggest|could point to|seems to/i);
      expect(dreamCard?.body).not.toMatch(/means|proves|definitely/i);
    });
  });
});

function makeDay(overrides: Partial<DailyCheckIn> = {}): DailyCheckIn {
  return {
    date: overrides.date ?? '2026-04-01',
    mood: overrides.mood ?? 3,
    energy: overrides.energy ?? 3,
    stress: overrides.stress ?? 3,
    sleepQuality: overrides.sleepQuality ?? 3,
    sleepHours: overrides.sleepHours ?? 7,
    connection: overrides.connection ?? 3,
    overwhelm: overrides.overwhelm ?? 3,
    emotions: overrides.emotions ?? [],
    tags: overrides.tags ?? [],
    journalText: overrides.journalText ?? '',
    dreamLogged: overrides.dreamLogged ?? false,
    dreamText: overrides.dreamText ?? '',
  };
}

function makeDays(
  rows: Array<Partial<DailyCheckIn>>
): DailyCheckIn[] {
  return rows.map((row, index) =>
    makeDay({
      date: `2026-04-${String(index + 1).padStart(2, '0')}`,
      ...row,
    })
  );
}

function makeScenarioDays({ best, hard }: { best: number; hard: number }): DailyCheckIn[] {
  const bestDays = Array.from({ length: best }, (_, index) =>
    makeDay({
      date: `2026-04-${String(index + 1).padStart(2, '0')}`,
      mood: 5,
      energy: 4,
      stress: 1,
      sleepQuality: 5,
      sleepHours: 8,
      connection: 4,
      overwhelm: 1,
      journalText: 'I felt steadier, calmer, and more like myself today.',
    })
  );

  const hardDays = Array.from({ length: hard }, (_, index) =>
    makeDay({
      date: `2026-04-${String(best + index + 1).padStart(2, '0')}`,
      mood: 1,
      energy: 1,
      stress: 5,
      sleepQuality: 1,
      sleepHours: 4.5,
      connection: 1,
      overwhelm: 5,
      journalText: 'Everything felt heavy, pressured, and too much. I wanted quiet and relief.',
    })
  );

  return [...bestDays, ...hardDays];
}
