import {
  detectCurrentInsightState,
  stateAwareParagraphScore,
} from '../state/insightState';
import type { UserSignal } from '../types';

const signal = (overrides: Partial<UserSignal>): UserSignal => ({
  key: 'calm',
  source: 'dailyCheckIn',
  date: '2026-04-24',
  strength: 0.8,
  ...overrides,
});
describe('insightState', () => {
  it('detects overwhelmed state from high stress and overwhelm signals', () => {
    const profile = detectCurrentInsightState([
      signal({ key: 'high_stress', strength: 0.9 }),
      signal({ key: 'overwhelm', source: 'journal', strength: 0.95 }),
      signal({ key: 'capacity_strain', source: 'dailyCheckIn', strength: 0.8 }),
    ], '2026-04-24T12:00:00Z');

    expect(profile.primaryState).toBe('overwhelmed');
    expect(profile.preferredWriterShapes).toEqual(expect.arrayContaining(['tender', 'body']));
    expect(profile.avoidedWriterShapes).toContain('poetic');
    expect(profile.maxDepthLevel).toBe(1);
  });

  it('detects shutdown when numbness and disconnection dominate', () => {
    const profile = detectCurrentInsightState([
      signal({ key: 'numbness', source: 'journal', strength: 0.95 }),
      signal({ key: 'disconnected', source: 'dailyCheckIn', strength: 0.85 }),
      signal({ key: 'shutdown', source: 'triggerLog', strength: 0.9 }),
    ], '2026-04-24T12:00:00Z');

    expect(profile.primaryState).toBe('shutdown');
    expect(profile.preferredTones).toContain('tender');
    expect(profile.avoidedTones).toContain('direct');
  });

  it('scores paragraph delivery by state without changing paragraph bodies', () => {
    const profile = detectCurrentInsightState([
      signal({ key: 'overwhelm', source: 'journal', strength: 0.95 }),
      signal({ key: 'capacity_strain', strength: 0.9 }),
    ], '2026-04-24T12:00:00Z');

    const tenderScore = stateAwareParagraphScore({
      writerShape: 'tender',
      tone: 'tender',
      intensity: 'low',
      body: 'One. Two. Three. Four.',
    }, profile);
    const poeticScore = stateAwareParagraphScore({
      writerShape: 'poetic',
      tone: 'poetic',
      intensity: 'high',
      body: 'One. Two. Three. Four. Five.',
    }, profile);

    expect(tenderScore).toBeGreaterThan(poeticScore);
  });
});
