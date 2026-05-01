import {
  normalizeChartOrientation,
  wheelAngleToPoint,
  zodiacLongitudeToWheelAngleDegrees,
  zodiacLongitudeToWheelPoint,
} from '../chartWheelMath';

describe('chartWheelMath', () => {
  const brittany = {
    asc: 125,
    dc: 305,
    mc: 21,
    ic: 201,
  };

  const center = 100;
  const radius = 50;

  describe('standard natal orientation', () => {
    const options = {
      orientation: 'standard-natal' as const,
      ascendantLongitude: brittany.asc,
      midheavenLongitude: brittany.mc,
    };

    it('anchors ASC left and DC right without vertical flipping', () => {
      const asc = zodiacLongitudeToWheelPoint(brittany.asc, radius, center, center, options);
      const dc = zodiacLongitudeToWheelPoint(brittany.dc, radius, center, center, options);

      expect(asc.x).toBeLessThan(center);
      expect(Math.abs(asc.y - center)).toBeLessThan(0.001);
      expect(dc.x).toBeGreaterThan(center);
      expect(Math.abs(dc.y - center)).toBeLessThan(0.001);
    });

    it('places MC top-ish and IC bottom-ish for Brittany regression data', () => {
      const mc = zodiacLongitudeToWheelPoint(brittany.mc, radius, center, center, options);
      const ic = zodiacLongitudeToWheelPoint(brittany.ic, radius, center, center, options);

      expect(mc.y).toBeLessThan(center);
      expect(ic.y).toBeGreaterThan(center);
    });
  });

  describe('midheaven-on-top orientation', () => {
    const options = {
      orientation: 'midheaven-top' as const,
      ascendantLongitude: brittany.asc,
      midheavenLongitude: brittany.mc,
    };

    it('fixes MC at the top and IC at the bottom', () => {
      expect(zodiacLongitudeToWheelAngleDegrees(brittany.mc, options)).toBeCloseTo(90, 6);
      expect(zodiacLongitudeToWheelAngleDegrees(brittany.ic, options)).toBeCloseTo(270, 6);
    });

    it('does not force ASC/DC to the horizontal axis', () => {
      expect(zodiacLongitudeToWheelAngleDegrees(brittany.asc, options)).not.toBeCloseTo(180, 1);
      expect(zodiacLongitudeToWheelAngleDegrees(brittany.dc, options)).not.toBeCloseTo(0, 1);
    });
  });

  describe('Aries-first orientation', () => {
    it('anchors Aries 0 degrees at 9 o clock and preserves zodiac order', () => {
      const aries = zodiacLongitudeToWheelPoint(0, radius, center, center, { orientation: 'aries-first' });
      const taurus = zodiacLongitudeToWheelPoint(30, radius, center, center, { orientation: 'aries-first' });

      expect(aries.x).toBeLessThan(center);
      expect(Math.abs(aries.y - center)).toBeLessThan(0.001);
      expect(taurus.x).toBeLessThan(center);
      expect(taurus.y).toBeGreaterThan(center);
    });

    it('normalizes the legacy aries-rising persisted setting', () => {
      expect(normalizeChartOrientation('aries-rising')).toBe('aries-first');
    });
  });

  it('keeps orientation stable when all sidereal longitudes shift together', () => {
    const tropicalAngle = zodiacLongitudeToWheelAngleDegrees(21.1, {
      orientation: 'standard-natal',
      ascendantLongitude: 125.3,
      midheavenLongitude: 21.1,
    });
    const siderealAngle = zodiacLongitudeToWheelAngleDegrees(357.0, {
      orientation: 'standard-natal',
      ascendantLongitude: 101.2,
      midheavenLongitude: 357.0,
    });

    expect(siderealAngle).toBeCloseTo(tropicalAngle, 1);
  });

  it('uses screen coordinates with y increasing downward', () => {
    expect(wheelAngleToPoint(Math.PI / 2, radius, center, center).y).toBeLessThan(center);
    expect(wheelAngleToPoint((3 * Math.PI) / 2, radius, center, center).y).toBeGreaterThan(center);
  });
});
