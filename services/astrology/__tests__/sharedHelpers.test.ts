import {
  normalize360,
  degreeInSign,
  degMinFromAbs,
  angularDifference,
  signNameFromLongitude,
  signFromLongitude,
  extractAbsDegree,
  computeHouseForLongitude,
  extractSignName,
  extractSignElement,
  ZODIAC_SIGN_NAMES,
  SIGN_TO_ELEMENT,
  SIGN_TO_MODALITY,
} from '../sharedHelpers';

describe('sharedHelpers', () => {
  describe('ZODIAC_SIGN_NAMES', () => {
    it('has 12 signs', () => expect(ZODIAC_SIGN_NAMES).toHaveLength(12));
    it('starts with Aries', () => expect(ZODIAC_SIGN_NAMES[0]).toBe('Aries'));
    it('ends with Pisces', () => expect(ZODIAC_SIGN_NAMES[11]).toBe('Pisces'));
  });

  describe('SIGN_TO_ELEMENT', () => {
    it('maps Aries to Fire', () => expect(SIGN_TO_ELEMENT['Aries']).toBe('Fire'));
    it('maps Taurus to Earth', () => expect(SIGN_TO_ELEMENT['Taurus']).toBe('Earth'));
    it('maps Gemini to Air', () => expect(SIGN_TO_ELEMENT['Gemini']).toBe('Air'));
    it('maps Cancer to Water', () => expect(SIGN_TO_ELEMENT['Cancer']).toBe('Water'));
  });

  describe('SIGN_TO_MODALITY', () => {
    it('maps Aries to Cardinal', () => expect(SIGN_TO_MODALITY['Aries']).toBe('Cardinal'));
    it('maps Taurus to Fixed', () => expect(SIGN_TO_MODALITY['Taurus']).toBe('Fixed'));
    it('maps Gemini to Mutable', () => expect(SIGN_TO_MODALITY['Gemini']).toBe('Mutable'));
  });

  describe('normalize360()', () => {
    it('returns 0 for 0', () => expect(normalize360(0)).toBe(0));
    it('returns 359 for 359', () => expect(normalize360(359)).toBe(359));
    it('wraps 360 to 0', () => expect(normalize360(360)).toBe(0));
    it('wraps 720 to 0', () => expect(normalize360(720)).toBe(0));
    it('handles negative -90 → 270', () => expect(normalize360(-90)).toBe(270));
    it('handles negative -360 → 0', () => expect(normalize360(-360)).toBe(-0));
    it('handles 450 → 90', () => expect(normalize360(450)).toBe(90));
  });

  describe('degreeInSign()', () => {
    it('0° → 0', () => expect(degreeInSign(0)).toBe(0));
    it('30° → 0 (start of Taurus)', () => expect(degreeInSign(30)).toBe(0));
    it('45° → 15', () => expect(degreeInSign(45)).toBe(15));
    it('359.5° → 29.5', () => expect(degreeInSign(359.5)).toBe(29.5));
  });

  describe('degMinFromAbs()', () => {
    it('returns degree and minute for 45.5°', () => {
      const r = degMinFromAbs(45.5);
      expect(r.degree).toBe(15);
      expect(r.minute).toBe(30);
    });
    it('returns 0/0 for 0°', () => {
      const r = degMinFromAbs(0);
      expect(r.degree).toBe(0);
      expect(r.minute).toBe(0);
    });
  });

  describe('angularDifference()', () => {
    it('returns 0 for same angle', () => expect(angularDifference(100, 100)).toBe(0));
    it('returns 90 for 0 and 90', () => expect(angularDifference(0, 90)).toBe(90));
    it('returns 180 for 0 and 180', () => expect(angularDifference(0, 180)).toBe(180));
    it('handles wrap-around: 350 and 10 → 20', () => expect(angularDifference(350, 10)).toBe(20));
    it('is symmetric', () => expect(angularDifference(10, 350)).toBe(angularDifference(350, 10)));
  });

  describe('signNameFromLongitude()', () => {
    it('0° → Aries', () => expect(signNameFromLongitude(0)).toBe('Aries'));
    it('30° → Taurus', () => expect(signNameFromLongitude(30)).toBe('Taurus'));
    it('60° → Gemini', () => expect(signNameFromLongitude(60)).toBe('Gemini'));
    it('120° → Leo', () => expect(signNameFromLongitude(120)).toBe('Leo'));
    it('359° → Pisces', () => expect(signNameFromLongitude(359)).toBe('Pisces'));
  });

  describe('signFromLongitude()', () => {
    it('returns AstrologySign with correct fields', () => {
      const sign = signFromLongitude(0);
      expect(sign.name).toBe('Aries');
      expect(sign.element).toBe('Fire');
      expect(sign.quality).toBe('Cardinal');
      expect(sign.rulingPlanet).toBeTruthy();
      expect(sign.dates).toBeTruthy();
    });
    it('maps 150° to Virgo', () => {
      expect(signFromLongitude(150).name).toBe('Virgo');
    });
  });

  describe('extractAbsDegree()', () => {
    it('extracts from ChartPosition.Ecliptic.DecimalDegrees', () => {
      expect(extractAbsDegree({ ChartPosition: { Ecliptic: { DecimalDegrees: 45 } } })).toBe(45);
    });
    it('extracts from longitude', () => {
      expect(extractAbsDegree({ longitude: 180 })).toBe(180);
    });
    it('returns null for empty object', () => {
      expect(extractAbsDegree({})).toBeNull();
    });
    it('returns null for null', () => {
      expect(extractAbsDegree(null)).toBeNull();
    });
    it('normalizes values > 360', () => {
      expect(extractAbsDegree({ longitude: 400 })).toBe(40);
    });
  });

  describe('computeHouseForLongitude()', () => {
    const cusps = Array.from({ length: 12 }, (_, i) => i * 30); // equal 30° houses
    it('places 0° in house 1', () => expect(computeHouseForLongitude(0, cusps)).toBe(1));
    it('places 29° in house 1', () => expect(computeHouseForLongitude(29, cusps)).toBe(1));
    it('places 30° in house 2', () => expect(computeHouseForLongitude(30, cusps)).toBe(2));
    it('places 350° in house 12', () => expect(computeHouseForLongitude(350, cusps)).toBe(12));
    it('returns null for invalid cusps', () => expect(computeHouseForLongitude(0, [])).toBeNull());
    it('returns null for non-array', () => expect(computeHouseForLongitude(0, null as any)).toBeNull());
  });

  describe('extractSignName()', () => {
    it('returns name from string', () => expect(extractSignName('Aries')).toBe('Aries'));
    it('returns name from object', () => expect(extractSignName({ name: 'Leo' })).toBe('Leo'));
    it('returns empty for null', () => expect(extractSignName(null)).toBe(''));
    it('returns empty for undefined', () => expect(extractSignName(undefined)).toBe(''));
  });

  describe('extractSignElement()', () => {
    it('returns element for sign string', () => expect(extractSignElement('Aries')).toBe('Fire'));
    it('returns element from object with element', () => expect(extractSignElement({ element: 'Water' })).toBe('Water'));
    it('returns element from object with name', () => expect(extractSignElement({ name: 'Cancer' })).toBe('Water'));
    it('returns empty for null', () => expect(extractSignElement(null)).toBe(''));
  });
});
