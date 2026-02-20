import { logger } from '../../utils/logger';
// Enhanced timezone handling with IANA timezone database support
// Handles historical timezone rules, daylight saving time, and timezone offset changes

import { DateTime, IANAZone } from 'luxon';
import tzLookup from 'tz-lookup';

export interface TimezoneInfo {
  timezone: string; // IANA timezone identifier
  offset: number; // UTC offset in minutes
  isDST: boolean; // Daylight saving time active
  abbreviation: string; // Timezone abbreviation (e.g., "PST", "PDT")
  utcDateTime: DateTime; // UTC equivalent
  localDateTime: DateTime; // Local time
}

export interface Location {
  latitude: number;
  longitude: number;
  timezone?: string; // Optional IANA timezone override
}

export class TimezoneHandler {
  private static readonly CACHE_LIMIT = 250;
  private static readonly cache = new Map<string, TimezoneInfo>();
  /**
   * Resolve historical timezone for a given date and location
   * Uses IANA timezone database for accurate historical data
   */
  static resolveHistoricalTimezone(
    date: string, 
    latitude: number, 
    longitude: number,
    timezone?: string
  ): TimezoneInfo {
    try {
      if (!date) {
        throw new Error('Date is required for timezone resolution');
      }

      // If timezone is explicitly provided, use it
      let ianaZone: string;
      
      if (timezone) {
        ianaZone = timezone;
      } else {
        ianaZone = this.lookupTimezoneFromCoordinates(latitude, longitude);
      }

      const zone = IANAZone.create(ianaZone);
      if (!zone.isValid) {
        throw new Error(`Invalid timezone: ${ianaZone}`);
      }

      // Parse the date and create DateTime object
      const normalizedDate = this.normalizeDateTimeString(date);
      const cacheKey = `${normalizedDate}|${latitude.toFixed(4)}|${longitude.toFixed(4)}|${ianaZone}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const localDateTime = DateTime.fromISO(normalizedDate, { zone: ianaZone });
      
      if (!localDateTime.isValid) {
        throw new Error(`Invalid date: ${normalizedDate}`);
      }

      const utcDateTime = localDateTime.toUTC();

      const info = {
        timezone: ianaZone,
        offset: localDateTime.offset,
        isDST: localDateTime.isInDST,
        abbreviation: localDateTime.offsetNameShort || 'UTC',
        utcDateTime,
        localDateTime
      };
      this.addToCache(cacheKey, info);
      return info;
    } catch (error) {
      logger.error('Failed to resolve timezone:', error);
      // Do NOT silently fallback to UTC — that produces completely wrong charts
      // (e.g. a Tokyo birth would be off by 9 hours, yielding wrong Ascendant/houses).
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Timezone resolution failed for date="${date}", lat=${latitude}, lon=${longitude}: ${errorMsg}. ` +
        `Please provide a valid IANA timezone (e.g. "America/New_York") in birth data.`
      );
    }
  }

  /**
   * Apply daylight saving time rules for historical dates
   * Determines if DST was active on the given birth date
   */
  static applyDaylightSaving(
    localTime: string, 
    date: string, 
    location: Location
  ): DateTime {
    try {
      const timezone = location.timezone ||
        this.lookupTimezoneFromCoordinates(location.latitude, location.longitude);
      
      // Combine date and time
      const dateTimeString = this.normalizeDateTimeString(`${date}T${localTime}`);
      const localDateTime = DateTime.fromISO(dateTimeString, { zone: timezone });
      
      if (!localDateTime.isValid) {
        throw new Error(`Invalid date/time: ${dateTimeString}`);
      }

      return localDateTime.toUTC();
    } catch (error) {
      logger.error('Failed to apply daylight saving:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(
        `DST resolution failed for time="${localTime}", date="${date}", location=(${location.latitude}, ${location.longitude}): ${errorMsg}. ` +
        `Please provide a valid IANA timezone.`
      );
    }
  }

  /**
   * Convert local birth time to UTC accounting for historical timezone changes
   */
  static convertToUTC(
    date: string,
    time: string,
    latitude: number,
    longitude: number,
    timezone?: string
  ): DateTime {
    try {
      const ianaZone = timezone || this.lookupTimezoneFromCoordinates(latitude, longitude);
      const dateTimeString = this.normalizeDateTimeString(`${date}T${time}`);
      const localDateTime = DateTime.fromISO(dateTimeString, { zone: ianaZone });
      
      if (!localDateTime.isValid) {
        throw new Error(`Invalid date/time: ${dateTimeString}`);
      }

      return localDateTime.toUTC();
    } catch (error) {
      logger.error('Failed to convert to UTC:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(
        `UTC conversion failed for date="${date}", time="${time}", lat=${latitude}, lon=${longitude}: ${errorMsg}. ` +
        `Please provide a valid IANA timezone.`
      );
    }
  }

  /**
   * Estimate timezone from coordinates
   * This is a simplified implementation - in production, use a proper timezone lookup service
   */
  private static lookupTimezoneFromCoordinates(latitude: number, longitude: number): string {
    try {
      return tzLookup(latitude, longitude);
    } catch (error) {
      logger.warn('[TimezoneHandler] tz-lookup failed, falling back to estimate', error);
      return this.estimateTimezoneFromCoordinates(latitude, longitude);
    }
  }

  private static estimateTimezoneFromCoordinates(latitude: number, longitude: number): string {
    // Simplified timezone estimation based on longitude
    // Each 15 degrees of longitude represents roughly 1 hour of time difference
    const hourOffset = Math.round(longitude / 15);
    
    // Map common coordinates to known timezones
    const timezoneMap: { [key: string]: string } = {
      // North America
      'US-East': 'America/New_York',
      'US-Central': 'America/Chicago', 
      'US-Mountain': 'America/Denver',
      'US-Pacific': 'America/Los_Angeles',
      'CA-East': 'America/Toronto',
      'CA-Central': 'America/Winnipeg',
      'CA-Mountain': 'America/Edmonton',
      'CA-Pacific': 'America/Vancouver',
      
      // Europe
      'EU-West': 'Europe/London',
      'EU-Central': 'Europe/Berlin',
      'EU-East': 'Europe/Moscow',
      
      // Asia
      'AS-East': 'Asia/Tokyo',
      'AS-Central': 'Asia/Shanghai',
      'AS-South': 'Asia/Kolkata',
      
      // Australia
      'AU-East': 'Australia/Sydney',
      'AU-Central': 'Australia/Adelaide',
      'AU-West': 'Australia/Perth',
    };

    // Rough geographic mapping
    if (latitude >= 25 && latitude <= 50) {
      if (longitude >= -125 && longitude <= -67) {
        // North America
        if (longitude >= -84) return timezoneMap['US-East'];
        if (longitude >= -104) return timezoneMap['US-Central'];
        if (longitude >= -115) return timezoneMap['US-Mountain'];
        return timezoneMap['US-Pacific'];
      }
      if (longitude >= -10 && longitude <= 40) {
        // Europe
        if (longitude <= 0) return timezoneMap['EU-West'];
        if (longitude <= 25) return timezoneMap['EU-Central'];
        return timezoneMap['EU-East'];
      }
      if (longitude >= 100 && longitude <= 150) {
        // Asia-Pacific
        if (longitude >= 135) return timezoneMap['AS-East'];
        if (longitude >= 115) return timezoneMap['AS-Central'];
        return timezoneMap['AS-South'];
      }
    }

    // Australia
    if (latitude >= -45 && latitude <= -10 && longitude >= 110 && longitude <= 155) {
      if (longitude >= 145) return timezoneMap['AU-East'];
      if (longitude >= 135) return timezoneMap['AU-Central'];
      return timezoneMap['AU-West'];
    }

    // Fallback to UTC offset estimation
    if (hourOffset >= -12 && hourOffset <= 12) {
      const offsetMap: { [key: number]: string } = {
        '-12': 'Etc/GMT+12',
        '-11': 'Etc/GMT+11',
        '-10': 'Pacific/Honolulu',
        '-9': 'America/Anchorage',
        '-8': 'America/Los_Angeles',
        '-7': 'America/Denver',
        '-6': 'America/Chicago',
        '-5': 'America/New_York',
        '-4': 'America/Halifax',
        '-3': 'America/Sao_Paulo',
        '-2': 'Atlantic/South_Georgia',
        '-1': 'Atlantic/Azores',
        '0': 'Europe/London',
        '1': 'Europe/Berlin',
        '2': 'Europe/Helsinki',
        '3': 'Europe/Moscow',
        '4': 'Asia/Dubai',
        '5': 'Asia/Karachi',
        '6': 'Asia/Dhaka',
        '7': 'Asia/Bangkok',
        '8': 'Asia/Shanghai',
        '9': 'Asia/Tokyo',
        '10': 'Australia/Sydney',
        '11': 'Pacific/Norfolk',
        '12': 'Pacific/Auckland'
      };
      
      return offsetMap[hourOffset] || 'UTC';
    }

    return 'UTC';
  }

  private static normalizeDateTimeString(value: string): string {
    // If date only, append midnight
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${value}T00:00:00`;
    }

    // If date and time without seconds, append seconds
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      return `${value}:00`;
    }

    return value;
  }

  private static addToCache(key: string, value: TimezoneInfo): void {
    if (this.cache.size >= this.CACHE_LIMIT) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  /**
   * Validate timezone identifier
   */
  static isValidTimezone(timezone: string): boolean {
    try {
      const zone = IANAZone.create(timezone);
      return zone.isValid;
    } catch {
      return false;
    }
  }

  /**
   * Get all available IANA timezone identifiers.
   * Uses the runtime's Intl API for a comprehensive list; falls back to common zones.
   */
  static getAvailableTimezones(): string[] {
    try {
      // Intl.supportedValuesOf('timeZone') returns all IANA zones the runtime supports
      if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
        return Intl.supportedValuesOf('timeZone');
      }
    } catch {
      // Not supported in this runtime — fall through to static list
    }
    // Fallback: common timezones covering major regions
    return [
      'UTC',
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/Toronto', 'America/Sao_Paulo', 'America/Mexico_City', 'America/Anchorage',
      'America/Halifax', 'America/Phoenix', 'America/Bogota', 'America/Buenos_Aires',
      'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Rome',
      'Europe/Madrid', 'Europe/Moscow', 'Europe/Istanbul', 'Europe/Athens',
      'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
      'Asia/Seoul', 'Asia/Singapore', 'Asia/Bangkok', 'Asia/Hong_Kong',
      'Asia/Karachi', 'Asia/Jakarta', 'Asia/Tehran', 'Asia/Manila',
      'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
      'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Brisbane',
      'Pacific/Auckland', 'Pacific/Honolulu', 'Pacific/Fiji',
    ];
  }
}