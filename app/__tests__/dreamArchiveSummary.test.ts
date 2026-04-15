import type { SleepEntry } from '../../services/storage/models';
import { buildDreamArchiveSummary, toReadableDreamLabel } from '../(tabs)/journal/dreamArchiveSummary';

function makeSleepEntry(overrides: Partial<SleepEntry> = {}): SleepEntry {
  return {
    id: 'entry-1',
    chartId: 'chart-1',
    date: '2026-04-10',
    createdAt: '2026-04-10T08:00:00.000Z',
    updatedAt: '2026-04-10T08:00:00.000Z',
    isDeleted: false,
    ...overrides,
  };
}

describe('dreamArchiveSummary', () => {
  it('returns null until enough dream entries exist', () => {
    expect(buildDreamArchiveSummary([
      makeSleepEntry({ dreamText: 'One dream' }),
      makeSleepEntry({ id: 'entry-2', date: '2026-04-11', dreamText: 'Two dream' }),
    ])).toBeNull();
  });

  it('summarizes repeated dream themes and feelings from json metadata', () => {
    const summary = buildDreamArchiveSummary([
      makeSleepEntry({ dreamText: 'Water everywhere', dreamFeelings: JSON.stringify([{ label: 'uneasy' }]), dreamMetadata: JSON.stringify({ overallTheme: 'returning_home' }) }),
      makeSleepEntry({ id: 'entry-2', date: '2026-04-11', dreamText: 'Back at home', dreamFeelings: JSON.stringify([{ label: 'uneasy' }]), dreamMetadata: JSON.stringify({ overallTheme: 'returning_home' }) }),
      makeSleepEntry({ id: 'entry-3', date: '2026-04-12', dreamText: 'Same place again', dreamFeelings: JSON.stringify([{ label: 'curious' }]), dreamMetadata: JSON.stringify({ overallTheme: 'returning_home' }) }),
    ]);

    expect(summary?.chips).toContain('Returning Home');
    expect(summary?.chips).toContain('Uneasy');
    expect(summary?.summary).toContain('keep returning across your recent dreams');
  });

  it('falls back to a weaker signal message when repetition is not yet strong', () => {
    const summary = buildDreamArchiveSummary([
      makeSleepEntry({ dreamText: 'Dream one', dreamFeelings: 'uneasy', dreamMetadata: JSON.stringify({ overallTheme: 'maze' }) }),
      makeSleepEntry({ id: 'entry-2', date: '2026-04-11', dreamText: 'Dream two', dreamFeelings: 'calm', dreamMetadata: JSON.stringify({ overallTheme: 'ocean' }) }),
      makeSleepEntry({ id: 'entry-3', date: '2026-04-12', dreamText: 'Dream three', dreamFeelings: 'alert', dreamMetadata: JSON.stringify({ overallTheme: 'birds' }) }),
    ]);

    expect(summary?.chips).toEqual(['Needs more repeated signals']);
  });

  it('formats dream labels for display', () => {
    expect(toReadableDreamLabel('returning_home')).toBe('Returning Home');
  });
});