import { ZODIAC_SIGNS, PLANETS, ASPECT_TYPES } from '../constants';

describe('astrology constants', () => {
  describe('ZODIAC_SIGNS', () => {
    it('has 12 signs', () => {
      expect(ZODIAC_SIGNS).toHaveLength(12);
    });

    it('each sign has required fields', () => {
      ZODIAC_SIGNS.forEach((sign) => {
        expect(typeof sign.symbol).toBe('string');
        expect(['Fire', 'Earth', 'Air', 'Water']).toContain(sign.element);
        expect(['Cardinal', 'Fixed', 'Mutable']).toContain(sign.modality);
        expect(typeof sign.ruler).toBeDefined();
      });
    });

    it('starts with Aries', () => {
      expect(ZODIAC_SIGNS[0].symbol).toBeDefined();
    });
  });

  describe('PLANETS', () => {
    it('includes luminaries and outer planets', () => {
      expect(PLANETS).toHaveProperty('sun');
      expect(PLANETS).toHaveProperty('moon');
      expect(PLANETS).toHaveProperty('saturn');
      expect(PLANETS).toHaveProperty('pluto');
    });

    it('each planet has name, symbol, type', () => {
      Object.values(PLANETS).forEach((p) => {
        expect(typeof p.name).toBe('string');
        expect(typeof p.symbol).toBe('string');
        expect(typeof p.type).toBe('string');
      });
    });
  });

  describe('ASPECT_TYPES', () => {
    it('includes major aspects', () => {
      const names = ASPECT_TYPES.map((a) => a.name.toLowerCase());
      expect(names).toContain('conjunction');
      expect(names).toContain('opposition');
      expect(names).toContain('trine');
      expect(names).toContain('square');
      expect(names).toContain('sextile');
    });
  });
});
