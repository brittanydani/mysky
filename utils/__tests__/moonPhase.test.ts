/**
 * Tests for moonPhase utility — uses astronomy-engine (JPL ephemeris).
 * We mock astronomy-engine to test our phase logic independently.
 */

jest.mock('astronomy-engine', () => ({
  MoonPhase: jest.fn(),
  EclipticGeoMoon: jest.fn(),
}));

import { getMoonPhaseInfo, getMoonPhaseName, getMoonPhaseTag, getMoonPhaseKey, getMoonSignForDate } from '../moonPhase';
import { MoonPhase as MockMoonPhase, EclipticGeoMoon as MockEclipticGeoMoon } from 'astronomy-engine';

const mockMoonPhase = MockMoonPhase as jest.Mock;
const mockEclipticGeoMoon = MockEclipticGeoMoon as jest.Mock;

describe('getMoonPhaseInfo', () => {
  it('identifies New Moon for angle < 6°', () => {
    mockMoonPhase.mockReturnValue(3);
    const result = getMoonPhaseInfo(new Date('2026-03-01'));
    expect(result.name).toBe('New Moon');
    expect(result.emoji).toBe('🌑');
    expect(result.tag).toBe('phase-new');
    expect(result.angle).toBe(3);
  });

  it('identifies Full Moon for angle ~180°', () => {
    mockMoonPhase.mockReturnValue(180);
    const result = getMoonPhaseInfo(new Date('2026-03-15'));
    expect(result.name).toBe('Full Moon');
    expect(result.tag).toBe('phase-full');
  });

  it('wraps angle > 354° to New Moon', () => {
    mockMoonPhase.mockReturnValue(358);
    const result = getMoonPhaseInfo(new Date('2026-03-01'));
    expect(result.name).toBe('New Moon');
  });

  it('identifies Waxing Crescent', () => {
    mockMoonPhase.mockReturnValue(45);
    const result = getMoonPhaseInfo();
    expect(result.name).toBe('Waxing Crescent');
  });

  it('identifies First Quarter', () => {
    mockMoonPhase.mockReturnValue(90);
    const result = getMoonPhaseInfo();
    expect(result.name).toBe('First Quarter');
  });

  it('identifies Waning Gibbous', () => {
    mockMoonPhase.mockReturnValue(220);
    const result = getMoonPhaseInfo();
    expect(result.name).toBe('Waning Gibbous');
  });

  it('identifies Last Quarter', () => {
    mockMoonPhase.mockReturnValue(270);
    const result = getMoonPhaseInfo();
    expect(result.name).toBe('Last Quarter');
  });

  it('identifies Waning Crescent', () => {
    mockMoonPhase.mockReturnValue(310);
    const result = getMoonPhaseInfo();
    expect(result.name).toBe('Waning Crescent');
  });
});

describe('getMoonPhaseName', () => {
  it('returns phase name string', () => {
    mockMoonPhase.mockReturnValue(180);
    expect(getMoonPhaseName()).toBe('Full Moon');
  });
});

describe('getMoonPhaseTag', () => {
  it('returns phase tag', () => {
    mockMoonPhase.mockReturnValue(90);
    expect(getMoonPhaseTag()).toBe('phase-first-quarter');
  });
});

describe('getMoonPhaseKey', () => {
  it('returns underscore-style key', () => {
    mockMoonPhase.mockReturnValue(270);
    expect(getMoonPhaseKey()).toBe('last_quarter');
  });

  it('returns new for New Moon', () => {
    mockMoonPhase.mockReturnValue(0);
    expect(getMoonPhaseKey()).toBe('new');
  });
});

describe('getMoonSignForDate', () => {
  it('returns Aries for lon 0-30', () => {
    mockEclipticGeoMoon.mockReturnValue({ lon: 15 });
    expect(getMoonSignForDate()).toBe('Aries');
  });

  it('returns Pisces for lon 330-360', () => {
    mockEclipticGeoMoon.mockReturnValue({ lon: 345 });
    expect(getMoonSignForDate()).toBe('Pisces');
  });

  it('handles exactly 360° (wraps to Aries)', () => {
    mockEclipticGeoMoon.mockReturnValue({ lon: 360 });
    expect(getMoonSignForDate()).toBe('Aries');
  });

  it('handles negative longitude gracefully', () => {
    mockEclipticGeoMoon.mockReturnValue({ lon: -30 });
    const result = getMoonSignForDate();
    // -30 → normalized → 330 → Pisces
    expect(result).toBe('Pisces');
  });

  it('handles lon just under 360', () => {
    mockEclipticGeoMoon.mockReturnValue({ lon: 359.9 });
    expect(getMoonSignForDate()).toBe('Pisces');
  });

  it('returns correct sign for each 30° slice', () => {
    const expected = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    for (let i = 0; i < 12; i++) {
      mockEclipticGeoMoon.mockReturnValue({ lon: i * 30 + 15 });
      expect(getMoonSignForDate()).toBe(expected[i]);
    }
  });
});
