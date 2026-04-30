export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ValidationSchema<T> {
  validate(value: unknown): ValidationResult;
  coerce?(value: unknown): T;
}

export class ValidationError extends Error {
  readonly errors: string[];

  constructor(message: string, errors: string[]) {
    super(`${message}: ${errors.join('; ')}`);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const isDateOnly = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);

const isFiniteNumberInRange = (value: unknown, min: number, max: number): boolean =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

const validateOptionalText = (
  data: Record<string, unknown>,
  key: string,
  maxLength: number,
  errors: string[],
) => {
  const value = data[key];
  if (value == null) return;
  if (typeof value !== 'string') {
    errors.push(`${key} must be text`);
    return;
  }
  if (value.length > maxLength) {
    errors.push(`${key} must be ${maxLength} characters or less`);
  }
};

export const BirthDataSchema = {
  validate(value: unknown): ValidationResult {
    const errors: string[] = [];

    if (!isPlainObject(value)) {
      return { valid: false, errors: ['Invalid birth data object'] };
    }

    const date = value.birthDate ?? value.date;
    const time = value.birthTime ?? value.time;
    const place = value.birthPlace ?? value.place;

    if (typeof date !== 'string' || !isDateOnly(date)) {
      errors.push('Birth date must be in YYYY-MM-DD format');
    } else {
      const birthDate = new Date(`${date}T00:00:00`);
      if (birthDate > new Date()) errors.push('Birth date cannot be in the future');
      if (birthDate < new Date(1900, 0, 1)) errors.push('Birth date cannot be before 1900');
    }

    if (!value.hasUnknownTime) {
      if (typeof time !== 'string' || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
        errors.push('Birth time is required or must be in HH:MM format');
      }
    }

    if (typeof place !== 'string' || !place.trim()) {
      errors.push('Birth location is required');
    }

    if (!isFiniteNumberInRange(value.latitude, -90, 90)) {
      errors.push('Latitude must be between -90 and 90');
    }

    if (!isFiniteNumberInRange(value.longitude, -180, 180)) {
      errors.push('Longitude must be between -180 and 180');
    }

    return { valid: errors.length === 0, errors };
  },
} satisfies ValidationSchema<unknown>;

export const CheckInSchema = {
  validate(value: unknown): ValidationResult {
    const errors: string[] = [];

    if (!isPlainObject(value)) {
      return { valid: false, errors: ['Invalid check-in object'] };
    }

    if (!isFiniteNumberInRange(value.moodScore, 1, 10)) {
      errors.push('Mood score must be a number between 1 and 10');
    }

    if (!['low', 'medium', 'high'].includes(String(value.energyLevel))) {
      errors.push('Energy level must be low, medium, or high');
    }

    if (!['low', 'medium', 'high'].includes(String(value.stressLevel))) {
      errors.push('Stress level must be low, medium, or high');
    }

    if (typeof value.date !== 'string' || !isDateOnly(value.date)) {
      errors.push('Check-in date must be in YYYY-MM-DD format');
    }

    if (!['morning', 'afternoon', 'evening', 'night'].includes(String(value.timeOfDay))) {
      errors.push('Time of day must be morning, afternoon, evening, or night');
    }

    if (!Array.isArray(value.tags)) {
      errors.push('Tags must be an array');
    } else if (value.tags.length > 10) {
      errors.push('Maximum 10 tags per check-in');
    } else {
      value.tags.forEach((tag, index) => {
        if (typeof tag !== 'string' || tag.length > 50) {
          errors.push(`Tag ${index + 1} must be text of 50 characters or less`);
        }
      });
    }

    validateOptionalText(value, 'note', 2_000, errors);
    validateOptionalText(value, 'wins', 2_000, errors);
    validateOptionalText(value, 'challenges', 2_000, errors);

    return { valid: errors.length === 0, errors };
  },
} satisfies ValidationSchema<unknown>;

export const JournalEntrySchema = {
  validate(value: unknown): ValidationResult {
    const errors: string[] = [];

    if (!isPlainObject(value)) {
      return { valid: false, errors: ['Invalid journal entry object'] };
    }

    if (typeof value.date !== 'string' || !isDateOnly(value.date)) {
      errors.push('Journal date must be in YYYY-MM-DD format');
    }

    if (value.title != null) {
      if (typeof value.title !== 'string') {
        errors.push('Journal title must be text');
      } else if (value.title.length > 200) {
        errors.push('Journal title must be 200 characters or less');
      }
    }

    if (typeof value.content !== 'string' || value.content.trim().length === 0) {
      errors.push('Journal content is required');
    } else if (value.content.length > 10_000) {
      errors.push('Journal content must be 10,000 characters or less');
    }

    if (!['calm', 'soft', 'okay', 'heavy', 'stormy'].includes(String(value.mood))) {
      errors.push('Journal mood is invalid');
    }

    if (value.tags != null) {
      if (!Array.isArray(value.tags)) {
        errors.push('Tags must be an array');
      } else if (value.tags.length > 10) {
        errors.push('Maximum 10 tags per entry');
      } else {
        value.tags.forEach((tag, index) => {
          if (typeof tag !== 'string' || tag.length > 50) {
            errors.push(`Tag ${index + 1} must be text of 50 characters or less`);
          }
        });
      }
    }

    return { valid: errors.length === 0, errors };
  },
} satisfies ValidationSchema<unknown>;

export const SupabaseResponseSchema = {
  validate(response: unknown): ValidationResult {
    if (!isPlainObject(response)) {
      return { valid: false, errors: ['Invalid Supabase response'] };
    }

    if (response.error) {
      return { valid: false, errors: [`Database error: ${String(response.error)}`] };
    }

    return { valid: true, errors: [] };
  },
} satisfies ValidationSchema<unknown>;
