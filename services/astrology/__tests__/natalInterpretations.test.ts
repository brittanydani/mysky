import { generateThemedSections, getAspectInterpretation } from '../natalInterpretations';
import { makeTestChart, makeAspect } from './fixtures';

describe('natalInterpretations', () => {
  const chart = makeTestChart();

  describe('getAspectInterpretation()', () => {
    it('returns string for Sun-Moon Opposition', () => {
      const aspect = makeAspect('Sun', 'Moon', 'Opposition', 180, 3, 'Challenging');
      const interp = getAspectInterpretation(aspect);
      expect(typeof interp).toBe('string');
    });

    it('returns non-empty for known aspect', () => {
      const aspect = makeAspect('Sun', 'Mercury', 'Conjunction', 0, 2);
      const interp = getAspectInterpretation(aspect);
      expect(interp.length).toBeGreaterThan(0);
    });

    it('returns specific interpretation for nodal opposition', () => {
      const aspect = makeAspect('North Node', 'South Node', 'Opposition', 180, 0, 'Challenging');
      const interp = getAspectInterpretation(aspect);
      expect(interp).toContain('grow beyond old defaults');
    });

    it('uses more personal fallback wording for unknown pairings', () => {
      const aspect = makeAspect('Ascendant', 'Descendant', 'Square', 90, 2, 'Challenging');
      const interp = getAspectInterpretation(aspect);
      expect(interp).toContain('you may feel');
    });
  });

  describe('generateThemedSections()', () => {
    it('returns array of sections', () => {
      const sections = generateThemedSections(chart);
      expect(Array.isArray(sections)).toBe(true);
      expect(sections.length).toBeGreaterThan(0);
    });

    it('each section has id, title, icon', () => {
      const sections = generateThemedSections(chart);
      for (const s of sections) {
        expect(typeof s.id).toBe('string');
        expect(typeof s.title).toBe('string');
        expect(typeof s.icon).toBe('string');
      }
    });

    it('each section has placements array', () => {
      const sections = generateThemedSections(chart);
      for (const s of sections) {
        expect(Array.isArray(s.placements)).toBe(true);
      }
    });

    it('includes core self section', () => {
      const sections = generateThemedSections(chart);
      const coreSelf = sections.find((s: any) => s.id === 'core-self' || s.title.toLowerCase().includes('core'));
      expect(coreSelf).toBeDefined();
    });

    it('includes emotional world section', () => {
      const sections = generateThemedSections(chart);
      const emotional = sections.find((s: any) => s.id === 'emotional-world' || s.title.toLowerCase().includes('emotion'));
      expect(emotional).toBeDefined();
    });
  });
});
