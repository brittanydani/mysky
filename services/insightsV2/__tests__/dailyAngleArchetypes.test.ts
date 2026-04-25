import { DAILY_ANGLE_ARCHETYPES } from '../dailyAngleArchetypes';

describe('daily angle archetypes', () => {
  it('contains the full 50-angle catalog in sequence', () => {
    expect(DAILY_ANGLE_ARCHETYPES).toHaveLength(50);

    DAILY_ANGLE_ARCHETYPES.forEach((archetype, index) => {
      expect(archetype.order).toBe(index + 1);
      expect(archetype.key).toMatch(/^[a-z0-9_]+$/);
      expect(archetype.title).toBeTruthy();
      expect(archetype.description).toBeTruthy();
      expect(archetype.formula).toBeTruthy();
    });
  });

  it('uses unique stable keys', () => {
    const keys = DAILY_ANGLE_ARCHETYPES.map((archetype) => archetype.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves key copy formulas used by the insight writer', () => {
    expect(DAILY_ANGLE_ARCHETYPES[0]).toMatchObject({
      key: 'todays_active_signal',
      formula: 'Today, this pattern seems active through [current signal].',
    });
    expect(DAILY_ANGLE_ARCHETYPES[2]).toMatchObject({
      key: 'shame_to_clarity',
      formula: 'This does not read as [shame label]. It reads as [clearer truth].',
    });
    expect(DAILY_ANGLE_ARCHETYPES[49]).toMatchObject({
      key: 'the_archive_mirror',
      formula: 'Your archive is not reducing you to this pattern. It is showing one place where your inner world has been asking to be understood.',
    });
  });
});
