import { getChakraInfo, getChakraForHouse, getChakraForPlanet, CHAKRAS, HOUSE_TO_CHAKRA, PLANET_TO_CHAKRA } from '../chakraSystem';

describe('chakraSystem', () => {
  describe('CHAKRAS', () => {
    it('has 7 chakra entries', () => {
      expect(Object.keys(CHAKRAS).length).toBe(7);
    });

    it('each chakra has name and color', () => {
      for (const info of Object.values(CHAKRAS)) {
        expect(typeof info.name).toBe('string');
        expect(typeof info.color).toBe('string');
      }
    });
  });

  describe('HOUSE_TO_CHAKRA', () => {
    it('maps all 12 houses', () => {
      for (let h = 1; h <= 12; h++) {
        expect(HOUSE_TO_CHAKRA[h]).toBeDefined();
      }
    });
  });

  describe('PLANET_TO_CHAKRA', () => {
    it('maps Sun', () => expect(PLANET_TO_CHAKRA['Sun']).toBeDefined());
    it('maps Moon', () => expect(PLANET_TO_CHAKRA['Moon']).toBeDefined());
  });

  describe('getChakraInfo()', () => {
    it('returns info for root chakra', () => {
      const info = getChakraInfo('root' as any);
      expect(info.name).toBeTruthy();
      expect(info.color).toBeTruthy();
    });

    it('returns info for crown chakra', () => {
      const info = getChakraInfo('crown' as any);
      expect(info.name).toBeTruthy();
    });
  });

  describe('getChakraForHouse()', () => {
    it('returns chakra tag for house 1', () => {
      const tag = getChakraForHouse(1);
      expect(typeof tag).toBe('string');
    });

    it('returns chakra for each house 1-12', () => {
      for (let h = 1; h <= 12; h++) {
        expect(getChakraForHouse(h)).toBeTruthy();
      }
    });
  });

  describe('getChakraForPlanet()', () => {
    it('returns chakra for Sun', () => {
      expect(typeof getChakraForPlanet('Sun')).toBe('string');
    });

    it('returns chakra for Moon', () => {
      expect(typeof getChakraForPlanet('Moon')).toBe('string');
    });
  });
});
