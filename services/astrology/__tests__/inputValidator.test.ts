/**
 * InputValidator — unit tests
 *
 * Covers validateBirthData and normalizeTime.
 * Pure static methods — no I/O, no mocking required.
 */

import { InputValidator } from '../inputValidator';
import type { BirthData } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function validBirthData(overrides: Partial<BirthData> = {}): BirthData {
  return {
    place: 'New York, USA',
    date: '1992-08-01',
    time: '14:30',
    hasUnknownTime: false,
    latitude: 40.7128,
    longitude: -74.006,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// validateBirthData — valid inputs
// ═══════════════════════════════════════════════════════════════════════════════

describe('InputValidator.validateBirthData — valid', () => {
  it('accepts a fully valid birth data object', () => {
    const result = InputValidator.validateBirthData(validBirthData());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts hasUnknownTime=true without a time field', () => {
    const result = InputValidator.validateBirthData(
      validBirthData({ hasUnknownTime: true, time: undefined }),
    );
    expect(result.valid).toBe(true);
  });

  it('accepts 12-hour time with AM', () => {
    const result = InputValidator.validateBirthData(validBirthData({ time: '6:30 AM' }));
    expect(result.valid).toBe(true);
  });

  it('accepts 12-hour time with PM', () => {
    const result = InputValidator.validateBirthData(validBirthData({ time: '11:59 PM' }));
    expect(result.valid).toBe(true);
  });

  it('accepts 12-hour time with lowercase am/pm', () => {
    const result = InputValidator.validateBirthData(validBirthData({ time: '3:00 pm' }));
    expect(result.valid).toBe(true);
  });

  it('accepts latitude at the equator (0)', () => {
    const result = InputValidator.validateBirthData(validBirthData({ latitude: 0 }));
    expect(result.valid).toBe(true);
  });

  it('accepts latitude at the poles (±90)', () => {
    expect(InputValidator.validateBirthData(validBirthData({ latitude: 90 })).valid).toBe(true);
    expect(InputValidator.validateBirthData(validBirthData({ latitude: -90 })).valid).toBe(true);
  });

  it('accepts longitude at the prime meridian (0)', () => {
    const result = InputValidator.validateBirthData(validBirthData({ longitude: 0 }));
    expect(result.valid).toBe(true);
  });

  it('accepts longitude at the date line (±180)', () => {
    expect(InputValidator.validateBirthData(validBirthData({ longitude: 180 })).valid).toBe(true);
    expect(InputValidator.validateBirthData(validBirthData({ longitude: -180 })).valid).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// validateBirthData — missing/empty place
// ═══════════════════════════════════════════════════════════════════════════════

describe('InputValidator.validateBirthData — place errors', () => {
  it('fails when place is empty string', () => {
    const result = InputValidator.validateBirthData(validBirthData({ place: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('location'))).toBe(true);
  });

  it('fails when place is only whitespace', () => {
    const result = InputValidator.validateBirthData(validBirthData({ place: '   ' }));
    expect(result.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// validateBirthData — date errors
// ═══════════════════════════════════════════════════════════════════════════════

describe('InputValidator.validateBirthData — date errors', () => {
  it('fails for an invalid date string', () => {
    const result = InputValidator.validateBirthData(validBirthData({ date: 'not-a-date' }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('date'))).toBe(true);
  });

  it('fails for year before 1900', () => {
    const result = InputValidator.validateBirthData(validBirthData({ date: '1899-06-01' }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('1900'))).toBe(true);
  });

  it('accepts year 1900', () => {
    const result = InputValidator.validateBirthData(validBirthData({ date: '1900-01-01' }));
    expect(result.valid).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// validateBirthData — time errors
// ═══════════════════════════════════════════════════════════════════════════════

describe('InputValidator.validateBirthData — time errors', () => {
  it('fails when time is required but missing', () => {
    const result = InputValidator.validateBirthData(
      validBirthData({ hasUnknownTime: false, time: undefined }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('time'))).toBe(true);
  });

  it('fails for an invalid time format', () => {
    const result = InputValidator.validateBirthData(validBirthData({ time: '25:00' }));
    expect(result.valid).toBe(false);
  });

  it('fails for "99:99"', () => {
    const result = InputValidator.validateBirthData(validBirthData({ time: '99:99' }));
    expect(result.valid).toBe(false);
  });

  it('accepts "00:00" (midnight)', () => {
    const result = InputValidator.validateBirthData(validBirthData({ time: '00:00' }));
    expect(result.valid).toBe(true);
  });

  it('accepts "23:59"', () => {
    const result = InputValidator.validateBirthData(validBirthData({ time: '23:59' }));
    expect(result.valid).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// validateBirthData — coordinate errors
// ═══════════════════════════════════════════════════════════════════════════════

describe('InputValidator.validateBirthData — coordinate errors', () => {
  it('fails for latitude > 90', () => {
    const result = InputValidator.validateBirthData(validBirthData({ latitude: 91 }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('latitude'))).toBe(true);
  });

  it('fails for latitude < -90', () => {
    const result = InputValidator.validateBirthData(validBirthData({ latitude: -91 }));
    expect(result.valid).toBe(false);
  });

  it('fails for longitude > 180', () => {
    const result = InputValidator.validateBirthData(validBirthData({ longitude: 181 }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('longitude'))).toBe(true);
  });

  it('fails for longitude < -180', () => {
    const result = InputValidator.validateBirthData(validBirthData({ longitude: -181 }));
    expect(result.valid).toBe(false);
  });

  it('fails for NaN latitude', () => {
    const result = InputValidator.validateBirthData(validBirthData({ latitude: NaN }));
    expect(result.valid).toBe(false);
  });

  it('fails for NaN longitude', () => {
    const result = InputValidator.validateBirthData(validBirthData({ longitude: NaN }));
    expect(result.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// validateBirthData — multiple errors
// ═══════════════════════════════════════════════════════════════════════════════

describe('InputValidator.validateBirthData — multiple errors', () => {
  it('accumulates all errors when multiple fields are invalid', () => {
    const result = InputValidator.validateBirthData({
      place: '',
      date: 'bad-date',
      time: 'bad-time',
      hasUnknownTime: false,
      latitude: 200,
      longitude: 400,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// normalizeTime
// ═══════════════════════════════════════════════════════════════════════════════

describe('InputValidator.normalizeTime', () => {
  it('normalizes 24-hour time', () => {
    expect(InputValidator.normalizeTime('14:30')).toBe('14:30');
  });

  it('normalizes single-digit hour in 24-hour format', () => {
    expect(InputValidator.normalizeTime('9:05')).toBe('09:05');
  });

  it('normalizes 12-hour PM time', () => {
    expect(InputValidator.normalizeTime('2:30 PM')).toBe('14:30');
  });

  it('normalizes 12-hour AM time', () => {
    expect(InputValidator.normalizeTime('6:00 AM')).toBe('06:00');
  });

  it('normalizes 12:00 PM (noon) correctly', () => {
    expect(InputValidator.normalizeTime('12:00 PM')).toBe('12:00');
  });

  it('normalizes 12:00 AM (midnight) to 00:00', () => {
    expect(InputValidator.normalizeTime('12:00 AM')).toBe('00:00');
  });

  it('normalizes lowercase am/pm', () => {
    expect(InputValidator.normalizeTime('3:15 pm')).toBe('15:15');
  });

  it('returns null for invalid time', () => {
    expect(InputValidator.normalizeTime('25:00')).toBeNull();
    expect(InputValidator.normalizeTime('not-a-time')).toBeNull();
    expect(InputValidator.normalizeTime('')).toBeNull();
  });

  it('returns null for 13:00 AM (invalid 12-hour)', () => {
    // 13 is not valid in 12-hour format
    expect(InputValidator.normalizeTime('13:00 AM')).toBeNull();
  });
});
