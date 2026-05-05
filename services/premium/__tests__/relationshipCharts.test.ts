import {
  FREE_RELATIONSHIP_CHART_LIMIT,
  PREMIUM_RELATIONSHIP_CHART_LIMIT,
  PremiumRelationshipService,
} from '../relationshipCharts';

describe('PremiumRelationshipService.canAddChart', () => {
  it('allows premium users until they reach the premium chart limit', () => {
    expect(PremiumRelationshipService.canAddChart(0, true)).toBe(true);
    expect(PremiumRelationshipService.canAddChart(PREMIUM_RELATIONSHIP_CHART_LIMIT - 1, true)).toBe(true);
    expect(PremiumRelationshipService.canAddChart(PREMIUM_RELATIONSHIP_CHART_LIMIT, true)).toBe(false);
  });

  it('returns true for free users when they have 0 charts', () => {
    expect(PremiumRelationshipService.canAddChart(0, false)).toBe(true);
  });

  it('returns false for free users when they already have 1+ charts', () => {
    expect(PremiumRelationshipService.canAddChart(1, false)).toBe(false);
    expect(PremiumRelationshipService.canAddChart(3, false)).toBe(false);
  });
});

describe('PremiumRelationshipService.getChartsAllowed', () => {
  it('returns the premium chart limit for premium users', () => {
    expect(PremiumRelationshipService.getChartsAllowed(true)).toBe(PREMIUM_RELATIONSHIP_CHART_LIMIT);
  });

  it('returns the free chart limit for free users', () => {
    expect(PremiumRelationshipService.getChartsAllowed(false)).toBe(FREE_RELATIONSHIP_CHART_LIMIT);
  });
});

describe('PremiumRelationshipService.generateComparison', () => {
  const makeChart = (sunSign: string) =>
    ({ sunSign: { name: sunSign }, moonSign: { name: 'Pisces' }, risingSign: { name: 'Leo' }, name: '' } as any);

  it('returns null for non-premium users', () => {
    const result = PremiumRelationshipService.generateComparison(
      makeChart('Aries'),
      makeChart('Leo'),
      'partner',
      false,
    );
    expect(result).toBeNull();
  });

  it('returns a RelationshipComparison for premium users', () => {
    const result = PremiumRelationshipService.generateComparison(
      makeChart('Aries'),
      makeChart('Leo'),
      'partner',
      true,
    );
    expect(result).not.toBeNull();
    expect(result!.relationshipType).toBe('partner');
    expect(result!.connectionStrengths).toBeDefined();
    expect(result!.growthAreas).toBeDefined();
  });

  it('includes person names from chart.name when provided', () => {
    const userChart = { ...makeChart('Taurus'), name: 'Alex' };
    const otherChart = { ...makeChart('Virgo'), name: 'Jordan' };
    const result = PremiumRelationshipService.generateComparison(userChart, otherChart, 'friend', true);
    expect(result!.person1Name).toBe('Alex');
    expect(result!.person2Name).toBe('Jordan');
  });
});
