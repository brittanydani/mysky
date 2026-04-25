import { getArchiveDepth, getPersonalizedPremiumTeaser } from '../archiveDepth';

describe('archiveDepth', () => {
  it('marks early logs as patterns forming before the weekly read threshold', () => {
    const depth = getArchiveDepth({ checkIns: 3, journalEntries: 1 });

    expect(depth.label).toBe('Patterns forming');
    expect(depth.totalSignals).toBe(4);
    expect(depth.remaining).toBe(3);
    expect(depth.nextMilestone).toBe(7);
  });

  it('marks seven or more signals as ready for a weekly read', () => {
    const depth = getArchiveDepth({ checkIns: 5, journalEntries: 2 });

    expect(depth.label).toBe('Weekly read unlocked');
    expect(depth.totalSignals).toBe(7);
    expect(depth.nextMilestone).toBe(15);
    expect(depth.headline).toContain('connect the week into a real story');
  });

  it('counts sleep entries as archive signals', () => {
    const depth = getArchiveDepth({ sleepEntries: 2, dreamEntries: 1 });

    expect(depth.label).toBe('Patterns forming');
    expect(depth.totalSignals).toBe(3);
    expect(depth.body).toContain('2 sleep entries');
  });

  it('personalizes premium copy around detected patterns first', () => {
    const teaser = getPersonalizedPremiumTeaser(
      { checkIns: 5, journalEntries: 2, dreamEntries: 1 },
      { detectedPatterns: 2, surface: 'patterns' },
    );

    expect(teaser.eyebrow).toBe('Patterns detected');
    expect(teaser.title).toContain('2 deeper patterns');
    expect(teaser.cta).toBe('Reveal your patterns');
  });
});
