import { TimezoneHandler } from '../timezoneHandler';

describe('TimezoneHandler', () => {
  // Clear cache between tests
  beforeEach(() => {
    (TimezoneHandler as any).cache?.clear?.();
  });

  describe('resolveHistoricalTimezone', () => {
    it('resolves timezone from coordinates (New York)', () => {
      const info = TimezoneHandler.resolveHistoricalTimezone(
        '1990-03-15T14:30:00',
        40.7128, -74.006
      );

      expect(info.timezone).toBe('America/New_York');
      expect(typeof info.offset).toBe('number');
      expect(typeof info.isDST).toBe('boolean');
      expect(typeof info.abbreviation).toBe('string');
      expect(info.utcDateTime).toBeDefined();
      expect(info.localDateTime).toBeDefined();
    });

    it('resolves Tokyo timezone', () => {
      const info = TimezoneHandler.resolveHistoricalTimezone(
        '1990-07-01T09:00:00',
        35.6762, 139.6503
      );

      expect(info.timezone).toBe('Asia/Tokyo');
      expect(info.offset).toBe(540); // +9 hours
    });

    it('uses explicit timezone when provided', () => {
      const info = TimezoneHandler.resolveHistoricalTimezone(
        '1990-03-15T14:30:00',
        0, 0, // bogus coordinates
        'Europe/London'
      );

      expect(info.timezone).toBe('Europe/London');
    });

    it('detects DST for summer dates in US', () => {
      const info = TimezoneHandler.resolveHistoricalTimezone(
        '2025-07-15T14:00:00',
        40.7128, -74.006
      );

      expect(info.isDST).toBe(true);
    });

    it('detects non-DST for winter dates in US', () => {
      const info = TimezoneHandler.resolveHistoricalTimezone(
        '2025-01-15T14:00:00',
        40.7128, -74.006
      );

      expect(info.isDST).toBe(false);
    });

    it('handles date-only input (no time)', () => {
      const info = TimezoneHandler.resolveHistoricalTimezone(
        '1990-03-15',
        40.7128, -74.006
      );

      expect(info).toBeDefined();
      expect(info.localDateTime.hour).toBe(0);
    });

    it('throws on empty date', () => {
      expect(() =>
        TimezoneHandler.resolveHistoricalTimezone('', 40.7128, -74.006)
      ).toThrow();
    });

    it('throws on invalid timezone', () => {
      expect(() =>
        TimezoneHandler.resolveHistoricalTimezone(
          '1990-03-15T14:30:00', 0, 0, 'Invalid/Zone'
        )
      ).toThrow();
    });

    it('converts local time to UTC correctly', () => {
      const info = TimezoneHandler.resolveHistoricalTimezone(
        '2025-06-15T12:00:00',
        40.7128, -74.006 // EDT = UTC-4
      );

      expect(info.utcDateTime.hour).toBe(16); // 12 + 4 = 16 UTC
    });

    it('caches results and returns same object on repeated call', () => {
      const args = ['2025-01-01T12:00:00', 40.7128, -74.006] as const;
      const info1 = TimezoneHandler.resolveHistoricalTimezone(...args);
      const info2 = TimezoneHandler.resolveHistoricalTimezone(...args);
      expect(info1.timezone).toBe(info2.timezone);
      expect(info1.offset).toBe(info2.offset);
    });
  });

  describe('convertToUTC', () => {
    it('converts local NY time to UTC', () => {
      const utc = TimezoneHandler.convertToUTC(
        '2025-06-15', '12:00',
        40.7128, -74.006
      );

      expect(utc.hour).toBe(16); // EDT = UTC-4
      expect(utc.year).toBe(2025);
    });

    it('uses explicit timezone override', () => {
      const utc = TimezoneHandler.convertToUTC(
        '2025-06-15', '12:00',
        0, 0,
        'Asia/Tokyo'
      );

      expect(utc.hour).toBe(3); // JST = UTC+9 → 12 - 9 = 3
    });

    it('throws on invalid date', () => {
      expect(() =>
        TimezoneHandler.convertToUTC('invalid', '12:00', 40.7128, -74.006)
      ).toThrow();
    });
  });

  describe('applyDaylightSaving', () => {
    it('returns UTC DateTime for summer time', () => {
      const utc = TimezoneHandler.applyDaylightSaving(
        '14:00',
        '2025-07-15',
        { latitude: 40.7128, longitude: -74.006 }
      );

      expect(utc.hour).toBe(18); // EDT 14:00 → UTC 18:00
    });

    it('returns UTC DateTime for winter time', () => {
      const utc = TimezoneHandler.applyDaylightSaving(
        '14:00',
        '2025-01-15',
        { latitude: 40.7128, longitude: -74.006 }
      );

      expect(utc.hour).toBe(19); // EST 14:00 → UTC 19:00
    });

    it('respects explicit timezone in location', () => {
      const utc = TimezoneHandler.applyDaylightSaving(
        '12:00',
        '2025-06-15',
        { latitude: 0, longitude: 0, timezone: 'Europe/Berlin' }
      );

      expect(utc.hour).toBe(10); // CEST = UTC+2 → 12 - 2 = 10
    });
  });

  describe('isValidTimezone', () => {
    it('returns true for valid IANA zones', () => {
      expect(TimezoneHandler.isValidTimezone('America/New_York')).toBe(true);
      expect(TimezoneHandler.isValidTimezone('Europe/London')).toBe(true);
      expect(TimezoneHandler.isValidTimezone('Asia/Tokyo')).toBe(true);
      expect(TimezoneHandler.isValidTimezone('UTC')).toBe(true);
    });

    it('returns false for invalid zones', () => {
      expect(TimezoneHandler.isValidTimezone('Fake/Zone')).toBe(false);
      expect(TimezoneHandler.isValidTimezone('')).toBe(false);
      expect(TimezoneHandler.isValidTimezone('not-a-zone')).toBe(false);
    });
  });

  describe('getAvailableTimezones', () => {
    it('returns an array of timezone strings', () => {
      const zones = TimezoneHandler.getAvailableTimezones();
      expect(Array.isArray(zones)).toBe(true);
      expect(zones.length).toBeGreaterThan(10);
    });

    it('includes common timezones', () => {
      const zones = TimezoneHandler.getAvailableTimezones();
      expect(zones).toContain('America/New_York');
      expect(zones).toContain('Europe/London');
      expect(zones).toContain('Asia/Tokyo');
    });
  });
});
