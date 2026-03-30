import { computeLearningUpdate, applyModelMultipliers, applyThemeMultipliers } from '../adaptiveLearning';
import type { ShadowTrigger } from '../dreamTypes';

function makeModel() {
  return {
    engine_weights: { feelings: 0.6, text: 0.2, checkIn: 0.1, history: 0.07, personality: 0.03 },
    trigger_multipliers: {} as Record<string, number>,
    theme_multipliers: {} as Record<string, number>,
    feedback_count: 0,
  };
}

function makeCtx(overrides: Partial<any> = {}) {
  return {
    themeId: 'test-theme',
    matchedTriggers: [],
    textCoverage: 0.5,
    feelingsStrength: 0.5,
    checkInCompleteness: 0.5,
    historyCompleteness: 0.5,
    ...overrides,
  };
}

describe('adaptiveLearning', () => {
  describe('computeLearningUpdate()', () => {
    it('returns nextModel and delta for positive rating', () => {
      const result = computeLearningUpdate({
        model: makeModel(),
        rating: 1,
        ctx: makeCtx(),
      });
      expect(result.nextModel).toBeDefined();
      expect(result.delta).toBeDefined();
      expect(result.nextModel.feedback_count).toBe(1);
    });

    it('returns nextModel for negative rating', () => {
      const result = computeLearningUpdate({
        model: makeModel(),
        rating: -1,
        ctx: makeCtx(),
      });
      expect(result.nextModel.feedback_count).toBe(1);
    });

    it('returns nextModel for neutral rating', () => {
      const result = computeLearningUpdate({
        model: makeModel(),
        rating: 0,
        ctx: makeCtx(),
      });
      expect(result.nextModel).toBeDefined();
    });

    it('increments feedback_count', () => {
      const model = makeModel();
      model.feedback_count = 5;
      const result = computeLearningUpdate({ model, rating: 1, ctx: makeCtx() });
      expect(result.nextModel.feedback_count).toBe(6);
    });
  });

  describe('applyModelMultipliers()', () => {
    it('returns scores unchanged when no multipliers', () => {
      const scores = [{ trigger: 'exposure' as ShadowTrigger, score: 0.5 }];
      const result = applyModelMultipliers(scores, makeModel());
      expect(result[0].score).toBeCloseTo(0.5, 1);
    });

    it('applies trigger multiplier', () => {
      const model = makeModel();
      model.trigger_multipliers = { exposure: 2.0 };
      const scores = [{ trigger: 'exposure' as ShadowTrigger, score: 0.5 }];
      const result = applyModelMultipliers(scores, model);
      expect(result[0].score).toBeGreaterThan(0.5);
    });

    it('returns empty array for empty input', () => {
      expect(applyModelMultipliers([], makeModel())).toHaveLength(0);
    });
  });

  describe('applyThemeMultipliers()', () => {
    it('returns cards unchanged when no multipliers', () => {
      const cards = [{ id: 'theme-a', score: 0.5 }];
      const result = applyThemeMultipliers(cards, makeModel());
      expect(result[0].score).toBeCloseTo(0.5, 1);
    });

    it('applies theme multiplier', () => {
      const model = makeModel();
      model.theme_multipliers = { 'theme-a': 2.0 };
      const cards = [{ id: 'theme-a', score: 0.5 }];
      const result = applyThemeMultipliers(cards, model);
      expect(result[0].score).toBeGreaterThan(0.5);
    });
  });
});
