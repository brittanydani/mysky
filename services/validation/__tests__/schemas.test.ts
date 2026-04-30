import {
  BirthDataSchema,
  CheckInSchema,
  JournalEntrySchema,
  SupabaseResponseSchema,
  ValidationError,
} from '../schemas';

describe('validation schemas', () => {
  it('validates birth data business rules', () => {
    expect(
      BirthDataSchema.validate({
        birthDate: '1990-01-01',
        birthTime: '12:30',
        hasUnknownTime: false,
        birthPlace: 'Detroit, MI',
        latitude: 42.3314,
        longitude: -83.0458,
      }).valid,
    ).toBe(true);

    const invalid = BirthDataSchema.validate({
      birthDate: '2099-01-01',
      hasUnknownTime: false,
      birthPlace: '',
      latitude: 100,
      longitude: -200,
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toEqual(
      expect.arrayContaining([
        'Birth date cannot be in the future',
        'Birth time is required or must be in HH:MM format',
        'Birth location is required',
        'Latitude must be between -90 and 90',
        'Longitude must be between -180 and 180',
      ]),
    );
  });

  it('accepts unknown birth time without a time value', () => {
    const result = BirthDataSchema.validate({
      birthDate: '1990-01-01',
      hasUnknownTime: true,
      birthPlace: 'Detroit, MI',
      latitude: 42,
      longitude: -83,
    });

    expect(result.valid).toBe(true);
  });

  it('validates check-in values and bounded text fields', () => {
    const valid = CheckInSchema.validate({
      moodScore: 7,
      energyLevel: 'medium',
      stressLevel: 'low',
      date: '2026-04-29',
      timeOfDay: 'evening',
      tags: ['sleep'],
      note: 'Good day',
    });

    expect(valid.valid).toBe(true);

    const invalid = CheckInSchema.validate({
      moodScore: 11,
      energyLevel: 'wired',
      stressLevel: 'high',
      date: '04/29/2026',
      timeOfDay: 'dawn',
      tags: ['x'.repeat(51)],
      note: 123,
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.errors.join('\n')).toContain('Mood score must be a number between 1 and 10');
    expect(invalid.errors.join('\n')).toContain('Energy level must be low, medium, or high');
    expect(invalid.errors.join('\n')).toContain('Check-in date must be in YYYY-MM-DD format');
    expect(invalid.errors.join('\n')).toContain('Time of day must be morning');
    expect(invalid.errors.join('\n')).toContain('Tag 1 must be text');
    expect(invalid.errors.join('\n')).toContain('note must be text');
  });

  it('validates journal entries', () => {
    expect(
      JournalEntrySchema.validate({
        date: '2026-04-29',
        title: 'Reflection',
        content: 'A grounded entry',
        mood: 'calm',
        tags: ['gratitude'],
      }).valid,
    ).toBe(true);

    const invalid = JournalEntrySchema.validate({
      date: 'yesterday',
      title: 'x'.repeat(201),
      content: '',
      mood: 'ecstatic',
      tags: Array.from({ length: 11 }, (_, index) => String(index)),
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.errors.join('\n')).toContain('Journal date must be in YYYY-MM-DD format');
    expect(invalid.errors.join('\n')).toContain('Journal title must be 200 characters or less');
    expect(invalid.errors.join('\n')).toContain('Journal content is required');
    expect(invalid.errors.join('\n')).toContain('Journal mood is invalid');
    expect(invalid.errors.join('\n')).toContain('Maximum 10 tags per entry');
  });

  it('validates Supabase responses and exposes validation errors', () => {
    expect(SupabaseResponseSchema.validate({ data: { id: 1 }, error: null }).valid).toBe(true);
    expect(SupabaseResponseSchema.validate(null).valid).toBe(false);
    expect(SupabaseResponseSchema.validate({ error: 'boom' }).errors[0]).toContain('Database error');

    const error = new ValidationError('Invalid data', ['field required']);
    expect(error.name).toBe('ValidationError');
    expect(error.errors).toEqual(['field required']);
    expect(error.message).toContain('Invalid data');
  });
});
