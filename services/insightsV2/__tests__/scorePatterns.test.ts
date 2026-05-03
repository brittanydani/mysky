import { scoreArchivePattern } from '../engine/scorePatterns';
import type { ArchivePattern, UserSignal } from '../types';

const pattern: ArchivePattern = {
  key: 'test_pattern',
  title: 'Test Pattern',
  category: 'restCapacity',
  description: 'A test pattern.',
  requiredSignals: ['low_energy'],
  supportingSignals: ['rest_guilt'],
  conflictingSignals: ['high_energy'],
  shameLabel: 'This is a flaw.',
  clarityReframe: 'This is information.',
  lookbackDays: 7,
  minEvidenceCount: 2,
  minScore: 0.1,
};

const signal = (
  key: UserSignal['key'],
  date: string,
  strength = 0.8,
): UserSignal => ({
  key,
  source: 'journal',
  date,
  strength,
  evidence: {
    source: 'journal',
    date,
    signal: key,
  },
});

describe('scoreArchivePattern', () => {
  it('keeps old conflicting signals outside the lookback window from penalizing the current score', () => {
    const baseSignals = [
      signal('low_energy', '2026-04-18'),
      signal('rest_guilt', '2026-04-22'),
    ];
    const withoutOldConflict = scoreArchivePattern(
      pattern,
      baseSignals,
      '2026-04-24T12:00:00Z',
    );
    const withOldConflict = scoreArchivePattern(
      pattern,
      [
        ...baseSignals,
        signal('high_energy', '2026-04-01'),
      ],
      '2026-04-24T12:00:00Z',
    );
    const withRecentConflict = scoreArchivePattern(
      pattern,
      [
        ...baseSignals,
        signal('high_energy', '2026-04-23'),
      ],
      '2026-04-24T12:00:00Z',
    );

    expect(withOldConflict.score).toBe(withoutOldConflict.score);
    expect(withRecentConflict.score).toBeLessThan(withoutOldConflict.score);
  });

  it('reports the latest relevant signal date even when signals are not sorted by date', () => {
    const score = scoreArchivePattern(
      pattern,
      [
        signal('rest_guilt', '2026-04-19'),
        signal('low_energy', '2026-04-22'),
        signal('rest_guilt', '2026-04-20'),
      ],
      '2026-04-24T12:00:00Z',
    );

    expect(score.lastSeenAt).toBe('2026-04-22');
  });
});
