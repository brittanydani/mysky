jest.mock('../emotionalOperatingSystem', () => ({
  EmotionalOperatingSystemGenerator: {
    generateEmotionalOS: jest.fn(() => ({
      repairStyle:     { repairNeeds: ['space to process', 'verbal reassurance'] },
      shieldStyle:     { primaryShield: 'withdrawal', description: 'steps back' },
      expressionStyle: { style: 'verbal', description: 'communicates openly' },
      needs:           { emotional: ['security'], somatic: [] },
      triggers:        [],
    })),
  },
}));

import { RelationshipInsightGenerator } from '../relationshipInsights';
import { makeTestChart } from './fixtures';

describe('RelationshipInsightGenerator', () => {
  const chart1 = makeTestChart();
  const chart2 = makeTestChart();

  describe('generateRelationshipInsight()', () => {
    it('returns a RelationshipInsight with required fields', () => {
      const result = RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2);
      expect(result).toHaveProperty('relationshipType');
      expect(result).toHaveProperty('person1');
      expect(result).toHaveProperty('person2');
      expect(result).toHaveProperty('dynamics');
    });

    it('defaults to "romantic" relationship type', () => {
      const result = RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2);
      expect(result.relationshipType).toBe('romantic');
    });

    it('respects "friendship" relationship type', () => {
      const result = RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2, 'friendship');
      expect(result.relationshipType).toBe('friendship');
    });

    it('respects "parent-child" relationship type', () => {
      const result = RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2, 'parent-child');
      expect(result.relationshipType).toBe('parent-child');
    });

    it('uses provided person names', () => {
      const result = RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2, 'romantic', 'Alice', 'Bob');
      expect(result.person1.name).toBe('Alice');
      expect(result.person2.name).toBe('Bob');
    });

    it('defaults names to "You" and "They"', () => {
      const result = RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2);
      expect(result.person1.name).toBe('You');
      expect(result.person2.name).toBe('They');
    });

    it('person1 profile includes howTheyShowLove string', () => {
      const result = RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2);
      expect(typeof result.person1.howTheyShowLove).toBe('string');
      expect(result.person1.howTheyShowLove.length).toBeGreaterThan(0);
    });

    it('person1 profile includes howTheyFeelSafe string', () => {
      const result = RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2);
      expect(typeof result.person1.howTheyFeelSafe).toBe('string');
      expect(result.person1.howTheyFeelSafe.length).toBeGreaterThan(0);
    });

    it('person1 profile includes conflictStyle string', () => {
      const result = RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2);
      expect(typeof result.person1.conflictStyle).toBe('string');
      expect(result.person1.conflictStyle.length).toBeGreaterThan(0);
    });

    it('person1 repairNeeds is an array', () => {
      const result = RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2);
      expect(Array.isArray(result.person1.repairNeeds)).toBe(true);
    });

    it('person2 profile mirrors shape of person1', () => {
      const result = RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2);
      expect(typeof result.person2.howTheyShowLove).toBe('string');
      expect(typeof result.person2.howTheyFeelSafe).toBe('string');
      expect(typeof result.person2.conflictStyle).toBe('string');
      expect(Array.isArray(result.person2.repairNeeds)).toBe(true);
    });

    it('howTheyShowLove reflects Venus sign element influence', () => {
      // Venus in Aries (Fire) in makeTestChart → love expression mentions "bold gestures"
      const result = RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2);
      expect(result.person1.howTheyShowLove).toContain('bold gestures');
    });

    it('dynamics object is defined', () => {
      const result = RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2);
      expect(result.dynamics).toBeDefined();
      expect(typeof result.dynamics).toBe('object');
    });

    it('does not throw for different relationship types', () => {
      const types = ['romantic', 'friendship', 'parent-child', 'caregiver-child'] as const;
      for (const type of types) {
        expect(() =>
          RelationshipInsightGenerator.generateRelationshipInsight(chart1, chart2, type)
        ).not.toThrow();
      }
    });
  });
});
