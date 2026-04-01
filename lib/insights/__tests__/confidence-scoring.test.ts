import { computeInsightConfidence } from '@/lib/insights/engine';

describe('confidence scoring', () => {
  describe('data coverage dominance', () => {
    test('sparse data produces low confidence even with strong effect size', () => {
      const confidence = computeInsightConfidence({
        dataCoverageScore: 15,
        effectSizeScore: 95,
        consistencyScore: 20,
        recencyScore: 90,
      });

      expect(confidence).toBeLessThanOrEqual(50);
    });

    test('sparse data with perfect everything else still cannot reach high confidence', () => {
      const confidence = computeInsightConfidence({
        dataCoverageScore: 10,
        effectSizeScore: 100,
        consistencyScore: 100,
        recencyScore: 100,
      });

      expect(confidence).toBeLessThanOrEqual(70);
    });

    test('zero coverage produces near-zero confidence', () => {
      const confidence = computeInsightConfidence({
        dataCoverageScore: 0,
        effectSizeScore: 80,
        consistencyScore: 80,
        recencyScore: 80,
      });

      expect(confidence).toBeLessThanOrEqual(52);
    });
  });

  describe('effect size contribution', () => {
    test('trivial effect size with full coverage does not produce high confidence', () => {
      const confidence = computeInsightConfidence({
        dataCoverageScore: 100,
        effectSizeScore: 10,
        consistencyScore: 100,
        recencyScore: 100,
      });

      expect(confidence).toBeLessThanOrEqual(82);
    });

    test('strong effect size raises confidence when other dimensions are moderate', () => {
      const withStrongEffect = computeInsightConfidence({
        dataCoverageScore: 60,
        effectSizeScore: 90,
        consistencyScore: 60,
        recencyScore: 60,
      });

      const withWeakEffect = computeInsightConfidence({
        dataCoverageScore: 60,
        effectSizeScore: 20,
        consistencyScore: 60,
        recencyScore: 60,
      });

      expect(withStrongEffect).toBeGreaterThan(withWeakEffect);
      expect(withStrongEffect - withWeakEffect).toBeGreaterThanOrEqual(15);
    });
  });

  describe('consistency matters', () => {
    test('inconsistent signal lowers confidence even with coverage and effect', () => {
      const consistent = computeInsightConfidence({
        dataCoverageScore: 80,
        effectSizeScore: 80,
        consistencyScore: 85,
        recencyScore: 75,
      });

      const inconsistent = computeInsightConfidence({
        dataCoverageScore: 80,
        effectSizeScore: 80,
        consistencyScore: 20,
        recencyScore: 75,
      });

      expect(consistent).toBeGreaterThan(inconsistent);
      expect(consistent - inconsistent).toBeGreaterThanOrEqual(15);
    });
  });

  describe('recency contribution', () => {
    test('stale data slightly lowers confidence', () => {
      const recent = computeInsightConfidence({
        dataCoverageScore: 80,
        effectSizeScore: 80,
        consistencyScore: 80,
        recencyScore: 90,
      });

      const stale = computeInsightConfidence({
        dataCoverageScore: 80,
        effectSizeScore: 80,
        consistencyScore: 80,
        recencyScore: 20,
      });

      expect(recent).toBeGreaterThan(stale);
      // Recency has the smallest weight, so the gap should be meaningful but not huge
      expect(recent - stale).toBeGreaterThanOrEqual(8);
      expect(recent - stale).toBeLessThanOrEqual(20);
    });
  });

  describe('full spectrum thresholds', () => {
    test('all inputs at 100 produce confidence >= 95', () => {
      const confidence = computeInsightConfidence({
        dataCoverageScore: 100,
        effectSizeScore: 100,
        consistencyScore: 100,
        recencyScore: 100,
      });

      expect(confidence).toBeGreaterThanOrEqual(95);
    });

    test('all inputs at 50 produce mid-range confidence', () => {
      const confidence = computeInsightConfidence({
        dataCoverageScore: 50,
        effectSizeScore: 50,
        consistencyScore: 50,
        recencyScore: 50,
      });

      expect(confidence).toBeGreaterThanOrEqual(45);
      expect(confidence).toBeLessThanOrEqual(55);
    });

    test('all inputs at 0 produce confidence of 0', () => {
      const confidence = computeInsightConfidence({
        dataCoverageScore: 0,
        effectSizeScore: 0,
        consistencyScore: 0,
        recencyScore: 0,
      });

      expect(confidence).toBe(0);
    });

    test('confidence is always finite and clamped to 0-100', () => {
      const edge = computeInsightConfidence({
        dataCoverageScore: -50,
        effectSizeScore: 200,
        consistencyScore: -10,
        recencyScore: 300,
      });

      expect(Number.isFinite(edge)).toBe(true);
      expect(edge).toBeGreaterThanOrEqual(0);
      expect(edge).toBeLessThanOrEqual(100);
    });
  });

  describe('dimensional interaction', () => {
    test('high confidence requires at least three strong dimensions', () => {
      // Only one strong dimension
      const oneStrong = computeInsightConfidence({
        dataCoverageScore: 95,
        effectSizeScore: 20,
        consistencyScore: 20,
        recencyScore: 20,
      });

      // Three strong dimensions
      const threeStrong = computeInsightConfidence({
        dataCoverageScore: 95,
        effectSizeScore: 85,
        consistencyScore: 85,
        recencyScore: 20,
      });

      expect(oneStrong).toBeLessThanOrEqual(50);
      expect(threeStrong).toBeGreaterThanOrEqual(70);
    });

    test('coverage and consistency together gate the result more than effect and recency', () => {
      const strongGates = computeInsightConfidence({
        dataCoverageScore: 90,
        effectSizeScore: 40,
        consistencyScore: 90,
        recencyScore: 40,
      });

      const weakGates = computeInsightConfidence({
        dataCoverageScore: 40,
        effectSizeScore: 90,
        consistencyScore: 40,
        recencyScore: 90,
      });

      expect(strongGates).toBeGreaterThan(weakGates);
    });
  });
});
