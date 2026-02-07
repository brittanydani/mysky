import { BirthData } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ParsedTime {
  hour: number;
  minute: number;
  normalized: string;
}

const MIN_YEAR = 1900;

const getMaxYear = () => {
  const currentYear = new Date().getFullYear();
  return currentYear + 100;
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return Number.isFinite(date.getTime());
};

const parseTimeString = (value: string): ParsedTime | null => {
  const trimmed = value.trim();
  const twentyFourHour = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  const twelveHour = /^([1-9]|1[0-2]):([0-5]\d)\s*([AaPp][Mm])$/;

  const match24 = trimmed.match(twentyFourHour);
  if (match24) {
    const hour = Number(match24[1]);
    const minute = Number(match24[2]);
    return {
      hour,
      minute,
      normalized: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    };
  }

  const match12 = trimmed.match(twelveHour);
  if (match12) {
    let hour = Number(match12[1]);
    const minute = Number(match12[2]);
    const meridiem = match12[3].toLowerCase();
    if (meridiem === 'pm' && hour !== 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    return {
      hour,
      minute,
      normalized: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    };
  }

  return null;
};

export class InputValidator {
  static validateBirthData(birthData: BirthData): ValidationResult {
    const errors: string[] = [];

    if (!birthData.place || birthData.place.trim().length === 0) {
      errors.push('Birth location is required.');
    }

    if (!isValidDate(birthData.date)) {
      errors.push('Birth date must be a valid date.');
    } else {
      const year = Number(birthData.date.slice(0, 4));
      const maxYear = getMaxYear();
      if (year < MIN_YEAR || year > maxYear) {
        errors.push(`Birth year must be between ${MIN_YEAR} and ${maxYear}.`);
      }
    }

    if (!birthData.hasUnknownTime) {
      if (!birthData.time) {
        errors.push('Birth time is required unless marked as unknown.');
      } else if (!parseTimeString(birthData.time)) {
        errors.push('Birth time must be in 24-hour format (HH:MM) or 12-hour format (H:MM AM/PM).');
      }
    }

    if (!Number.isFinite(birthData.latitude) || birthData.latitude < -90 || birthData.latitude > 90) {
      errors.push('Latitude must be between -90 and 90 degrees.');
    }

    if (!Number.isFinite(birthData.longitude) || birthData.longitude < -180 || birthData.longitude > 180) {
      errors.push('Longitude must be between -180 and 180 degrees.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static normalizeTime(value: string): string | null {
    const parsed = parseTimeString(value);
    return parsed ? parsed.normalized : null;
  }
}
