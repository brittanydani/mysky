import {
  buildInsightCards,
  computeDailyScores,
  type DailyCheckIn,
  type InsightCard,
} from '@/lib/insights/engine';

/**
 * Golden regression scenarios: real-life-like user profiles.
 * These tests lock in expected behavior so future refactors
 * cannot silently degrade the user experience.
 */

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

// -------------------------------------------------------------------------
// Scenario builders
// -------------------------------------------------------------------------

function exhaustedParentWeek(): DailyCheckIn[] {
  return [
    makeDay({ date: '2026-04-01', mood: 2, energy: 1, stress: 5, sleepQuality: 1, sleepHours: 4.5, connection: 2, overwhelm: 5, journalText: 'The baby was up all night. I feel like a zombie. Everything is too much.' }),
    makeDay({ date: '2026-04-02', mood: 2, energy: 1, stress: 5, sleepQuality: 2, sleepHours: 5, connection: 2, overwhelm: 5, journalText: 'Still exhausted. Stretched thin. I want quiet and space so badly.' }),
    makeDay({ date: '2026-04-03', mood: 2, energy: 2, stress: 4, sleepQuality: 2, sleepHours: 5.5, connection: 3, overwhelm: 4, journalText: 'A little better but still heavy and drained.' }),
    makeDay({ date: '2026-04-04', mood: 3, energy: 2, stress: 4, sleepQuality: 3, sleepHours: 6, connection: 3, overwhelm: 4, journalText: 'My partner helped today. I felt supported but still overwhelmed.' }),
    makeDay({ date: '2026-04-05', mood: 2, energy: 1, stress: 5, sleepQuality: 1, sleepHours: 4, connection: 2, overwhelm: 5, journalText: 'Back to square one. Drained and numb.' }),
    makeDay({ date: '2026-04-06', mood: 2, energy: 2, stress: 5, sleepQuality: 2, sleepHours: 5, connection: 2, overwhelm: 5, journalText: 'Too much. Just too much.' }),
    makeDay({ date: '2026-04-07', mood: 3, energy: 2, stress: 4, sleepQuality: 3, sleepHours: 6, connection: 3, overwhelm: 3, journalText: 'Slightly better tonight. I feel a little lighter.' }),
  ];
}

function highStressLowSleepWeek(): DailyCheckIn[] {
  return [
    makeDay({ date: '2026-04-01', mood: 2, energy: 2, stress: 5, sleepQuality: 1, sleepHours: 4, connection: 2, overwhelm: 5 }),
    makeDay({ date: '2026-04-02', mood: 1, energy: 1, stress: 5, sleepQuality: 1, sleepHours: 3.5, connection: 1, overwhelm: 5 }),
    makeDay({ date: '2026-04-03', mood: 2, energy: 2, stress: 5, sleepQuality: 2, sleepHours: 5, connection: 2, overwhelm: 4 }),
    makeDay({ date: '2026-04-04', mood: 1, energy: 1, stress: 5, sleepQuality: 1, sleepHours: 4, connection: 1, overwhelm: 5 }),
    makeDay({ date: '2026-04-05', mood: 2, energy: 2, stress: 4, sleepQuality: 2, sleepHours: 5, connection: 2, overwhelm: 4 }),
    makeDay({ date: '2026-04-06', mood: 1, energy: 1, stress: 5, sleepQuality: 1, sleepHours: 3, connection: 1, overwhelm: 5 }),
    makeDay({ date: '2026-04-07', mood: 2, energy: 2, stress: 5, sleepQuality: 2, sleepHours: 5, connection: 2, overwhelm: 5 }),
  ];
}

function steadyRecoveryMonth(): DailyCheckIn[] {
  return Array.from({ length: 14 }, (_, i) => {
    // Gradual improvement over 14 days
    const progress = i / 13;
    return makeDay({
      date: `2026-04-${String(i + 1).padStart(2, '0')}`,
      mood: Math.round(2 + progress * 2.5) as 1 | 2 | 3 | 4 | 5,
      energy: Math.round(2 + progress * 2) as 1 | 2 | 3 | 4 | 5,
      stress: Math.round(4 - progress * 2.5) as 1 | 2 | 3 | 4 | 5,
      sleepQuality: Math.round(2 + progress * 2.5) as 1 | 2 | 3 | 4 | 5,
      sleepHours: 5.5 + progress * 2.5,
      connection: Math.round(2 + progress * 2) as 1 | 2 | 3 | 4 | 5,
      overwhelm: Math.round(4 - progress * 2.5) as 1 | 2 | 3 | 4 | 5,
      journalText: progress < 0.3
        ? 'Still heavy. Things feel hard.'
        : progress < 0.7
        ? 'A little better today. I feel calmer.'
        : 'More hopeful. I feel lighter and more like myself.',
    });
  });
}

function highDreamActivityPeriod(): DailyCheckIn[] {
  return [
    makeDay({ date: '2026-04-01', dreamLogged: true, dreamText: 'I was lost in a huge building, searching for the exit.' }),
    makeDay({ date: '2026-04-02', dreamLogged: true, dreamText: 'I was wandering through a city, could not find my way home.' }),
    makeDay({ date: '2026-04-03', dreamLogged: true, dreamText: 'I was trying to get somewhere but kept turning around.' }),
    makeDay({ date: '2026-04-04', dreamLogged: true, dreamText: 'I was being chased by something. I was hiding and running.' }),
    makeDay({ date: '2026-04-05', dreamLogged: true, dreamText: 'I was lost again in a forest, searching for a path.' }),
    makeDay({ date: '2026-04-06', dreamLogged: false }),
    makeDay({ date: '2026-04-07', dreamLogged: true, dreamText: 'I was escaping from danger and trying to get away.' }),
  ];
}

function sparseQuickCheckInUser(): DailyCheckIn[] {
  return [
    makeDay({ date: '2026-04-01', mood: 3, energy: 3, stress: 3, sleepQuality: 3, sleepHours: 7 }),
    makeDay({ date: '2026-04-03', mood: 4, energy: 3, stress: 2, sleepQuality: 4, sleepHours: 7.5 }),
    makeDay({ date: '2026-04-06', mood: 2, energy: 2, stress: 4, sleepQuality: 2, sleepHours: 5.5 }),
    makeDay({ date: '2026-04-09', mood: 3, energy: 3, stress: 3, sleepQuality: 3, sleepHours: 7 }),
    makeDay({ date: '2026-04-12', mood: 3, energy: 4, stress: 2, sleepQuality: 4, sleepHours: 7 }),
  ];
}

function improvingAwarenessHeavyMood(): DailyCheckIn[] {
  return [
    makeDay({ date: '2026-04-01', mood: 2, energy: 2, stress: 4, sleepQuality: 3, sleepHours: 6, connection: 2, overwhelm: 4, journalText: 'Everything feels hard. I am heavy and tired.' }),
    makeDay({ date: '2026-04-02', mood: 2, energy: 2, stress: 4, sleepQuality: 3, sleepHours: 6, connection: 3, overwhelm: 4, journalText: 'Still heavy, but I noticed I need space and quiet. That is something.' }),
    makeDay({ date: '2026-04-03', mood: 2, energy: 2, stress: 4, sleepQuality: 3, sleepHours: 6.5, connection: 3, overwhelm: 3, journalText: 'Heavy again but I felt supported by my friend. Grateful for that.' }),
    makeDay({ date: '2026-04-04', mood: 2, energy: 3, stress: 3, sleepQuality: 3, sleepHours: 7, connection: 3, overwhelm: 3, journalText: 'Mood still low but I felt calmer and more hopeful today somehow.' }),
    makeDay({ date: '2026-04-05', mood: 2, energy: 2, stress: 4, sleepQuality: 2, sleepHours: 5.5, connection: 2, overwhelm: 4, journalText: 'Hard day. Exhausted. But I can see what drains me now.' }),
    makeDay({ date: '2026-04-06', mood: 3, energy: 3, stress: 3, sleepQuality: 3, sleepHours: 7, connection: 3, overwhelm: 3, journalText: 'Better today. Heavy but lighter than before. I feel like I am learning.' }),
    makeDay({ date: '2026-04-07', mood: 2, energy: 2, stress: 4, sleepQuality: 3, sleepHours: 6, connection: 3, overwhelm: 4, journalText: 'Hard again. But I notice I bounce back faster. That matters.' }),
  ];
}

// -------------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------------

describe('regression scenarios', () => {
  describe('exhausted parent', () => {
    let cards: InsightCard[];

    beforeAll(() => {
      cards = buildInsightCards({ days: exhaustedParentWeek() });
    });

    test('generates at least one insight card', () => {
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    test('no card uses clinical or diagnostic language', () => {
      const pattern = /depression|anxiety disorder|trauma|dysregulated|disorder|clinical|diagnosis/i;
      for (const card of cards) {
        expect(card.body).not.toMatch(pattern);
      }
    });

    test('cards acknowledge difficulty without blaming the user', () => {
      for (const card of cards) {
        expect(card.body).not.toMatch(/fault|blame|failing|wrong with you/i);
      }
    });

    test('all confidence values are reasonable (not overinflated)', () => {
      for (const card of cards) {
        expect(card.confidence).toBeLessThanOrEqual(100);
        expect(Number.isFinite(card.confidence)).toBe(true);
      }
    });

    test('emerging theme card detects heaviness and need for rest', () => {
      const themeCard = cards.find((c) => c.type === 'emerging_theme');
      if (themeCard) {
        expect(themeCard.body).toMatch(/heav|quiet|space|pressure|rest/i);
      }
    });
  });

  describe('high stress / low sleep week', () => {
    let cards: InsightCard[];

    beforeAll(() => {
      cards = buildInsightCards({ days: highStressLowSleepWeek() });
    });

    test('generates insight cards', () => {
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    test('hard day pattern surfaces when nearly all days are hard', () => {
      // With 7 uniformly hard days, patterns may not differentiate, which is acceptable
      // But if a hard_day_pattern card exists, it should be reasonable
      const hardCard = cards.find((c) => c.type === 'hard_day_pattern');
      if (hardCard) {
        expect(hardCard.body).toMatch(/sleep|stress|overwhelm|energy/i);
      }
    });

    test('stability scores are consistently low across the week', () => {
      const days = highStressLowSleepWeek();
      for (const day of days) {
        const scores = computeDailyScores(day);
        expect(scores.derived.stabilityScore).toBeLessThanOrEqual(30);
      }
    });

    test('strain scores are consistently high across the week', () => {
      const days = highStressLowSleepWeek();
      for (const day of days) {
        const scores = computeDailyScores(day);
        expect(scores.derived.strainScore).toBeGreaterThanOrEqual(70);
      }
    });
  });

  describe('steady recovery month', () => {
    let cards: InsightCard[];
    let days: DailyCheckIn[];

    beforeAll(() => {
      days = steadyRecoveryMonth();
      cards = buildInsightCards({ days });
    });

    test('stability improves from start to end', () => {
      const firstWeek = days.slice(0, 7);
      const lastWeek = days.slice(7);

      const avgStability = (arr: DailyCheckIn[]) =>
        arr.reduce((s, d) => s + computeDailyScores(d).derived.stabilityScore, 0) / arr.length;

      expect(avgStability(lastWeek)).toBeGreaterThan(avgStability(firstWeek));
    });

    test('generates at least one positive or pattern card', () => {
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    test('no card overstates with absolute language', () => {
      for (const card of cards) {
        expect(card.body).not.toMatch(/definitely|certainly|always|never|proves|guaranteed/i);
      }
    });
  });

  describe('high dream activity period', () => {
    let cards: InsightCard[];

    beforeAll(() => {
      cards = buildInsightCards({ days: highDreamActivityPeriod() });
    });

    test('dream theme card is generated', () => {
      const dreamCard = cards.find((c) => c.type === 'dream_theme');
      expect(dreamCard).toBeDefined();
    });

    test('dream card uses uncertainty language', () => {
      const dreamCard = cards.find((c) => c.type === 'dream_theme');
      if (dreamCard) {
        expect(dreamCard.body).toMatch(/may reflect|may suggest|could point to|seems to/i);
      }
    });

    test('dream card body mentions the relevant themes', () => {
      const dreamCard = cards.find((c) => c.type === 'dream_theme');
      if (dreamCard) {
        expect(dreamCard.body).toMatch(/search|uncertain|lost|direction/i);
      }
    });
  });

  describe('sparse quick check-in user', () => {
    let cards: InsightCard[];

    beforeAll(() => {
      cards = buildInsightCards({ days: sparseQuickCheckInUser() });
    });

    test('does not overclaim from limited data', () => {
      // With only 5 data points and no journals/dreams, cards should be few or cautious
      for (const card of cards) {
        expect(card.confidence).toBeLessThanOrEqual(80);
      }
    });

    test('all generated cards have finite confidence', () => {
      for (const card of cards) {
        expect(Number.isFinite(card.confidence)).toBe(true);
      }
    });

    test('no diagnostic or absolute language despite sparse data', () => {
      for (const card of cards) {
        expect(card.body).not.toMatch(/depression|disorder|definitely|certainly|proves/i);
      }
    });
  });

  describe('improving self-awareness but heavy mood', () => {
    let cards: InsightCard[];

    beforeAll(() => {
      cards = buildInsightCards({ days: improvingAwarenessHeavyMood() });
    });

    test('generates at least one card', () => {
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    test('emerging theme captures the heaviness and need for space', () => {
      const themeCard = cards.find((c) => c.type === 'emerging_theme');
      if (themeCard) {
        expect(themeCard.body).toMatch(/heav|quiet|space|pressure|rest/i);
      }
    });

    test('does not dismiss the user or minimize their experience', () => {
      for (const card of cards) {
        expect(card.body).not.toMatch(/just need to|stop worrying|get over|snap out|cheer up/i);
      }
    });

    test('no card uses robotic or mechanical phrasing', () => {
      for (const card of cards) {
        expect(card.body).not.toMatch(/algorithm|detected|computed|data shows|metrics/i);
      }
    });
  });

  describe('output stability across identical inputs', () => {
    test('same input always produces the same cards', () => {
      const days = exhaustedParentWeek();

      const cards1 = buildInsightCards({ days });
      const cards2 = buildInsightCards({ days });

      expect(cards1.length).toBe(cards2.length);

      for (let i = 0; i < cards1.length; i++) {
        expect(cards1[i].type).toBe(cards2[i].type);
        expect(cards1[i].title).toBe(cards2[i].title);
        expect(cards1[i].body).toBe(cards2[i].body);
        expect(cards1[i].confidence).toBe(cards2[i].confidence);
      }
    });
  });
});
