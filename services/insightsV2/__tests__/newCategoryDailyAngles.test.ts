import { DAILY_ANGLES } from '../anglePacks';
import { NEW_CATEGORY_DAILY_ANGLES } from '../anglePacks/newCategoryDailyAngles';
import { ARCHIVE_PATTERNS } from '../patternPacks';

describe('new category daily angles', () => {
  it('contains the supplied 30-angle pack with unique keys', () => {
    const keys = NEW_CATEGORY_DAILY_ANGLES.map((angle) => angle.key);

    expect(NEW_CATEGORY_DAILY_ANGLES).toHaveLength(30);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('is registered in the complete daily angle catalog', () => {
    const allAngleKeys = new Set(DAILY_ANGLES.map((angle) => angle.key));

    NEW_CATEGORY_DAILY_ANGLES.forEach((angle) => {
      expect(allAngleKeys.has(angle.key)).toBe(true);
    });
  });

  it('maps each daily angle to an existing archive pattern', () => {
    const archivePatternKeys = new Set(
      ARCHIVE_PATTERNS.map((pattern) => pattern.key),
    );

    NEW_CATEGORY_DAILY_ANGLES.forEach((angle) => {
      expect(archivePatternKeys.has(angle.patternKey)).toBe(true);
    });
  });

  it('preserves representative user-facing copy from the supplied pack', () => {
    expect(NEW_CATEGORY_DAILY_ANGLES[0]).toMatchObject({
      key: 'responsibilityCare_emergingLoad',
      title: 'The Load Is Starting to Show',
      pattern:
        'You may be tracking what needs care even when you are not actively doing anything. That kind of load can be easy to miss because it often happens in the background.',
      question: 'What are you carrying mentally that no one else can see?',
    });
    expect(NEW_CATEGORY_DAILY_ANGLES[29]).toMatchObject({
      key: 'pleasurePlay_mixedAliveness',
      title: 'Your Aliveness Has Clues',
      reframe:
        'This is useful data. Pleasure can show what restores you, not just what entertains you.',
      question: 'What reliably makes you feel more alive?',
    });
  });
});
