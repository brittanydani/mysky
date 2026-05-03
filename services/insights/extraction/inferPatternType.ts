import type { PatternType, UserSignal } from '../../insightsV2/types';
import { PATTERN_TYPES } from '../taxonomy/patternTypes';

const PATTERN_TYPE_MATCHERS: Record<PatternType, RegExp[]> = {
  highTracking: [
    /\b(track|tracking|scan|notice|noticed|early|tone|shift|anticipat|brace|explain|precision|responsib|pressure|safety)\b/,
    /\b(repair|clarity|mental load|prepared|catch|prevent|replay|checking)\b/,
  ],
  lowAccess: [
    /\b(avoid|surface|numb|muted|quiet|drift|minimiz|disconnect|procrastinat|withdraw|detached)\b/,
    /\b(shutdown|distance|go quiet|not naming|delay starting|checked out)\b/,
  ],
  pushPull: [
    /\b(push pull|push-pull|both|closeness|space|guard|pull back|ambivalence|mixed)\b/,
    /\b(want\w* .{0,36}\bbut\b|support .{0,36}distrust|receive .{0,36}owe)\b/,
  ],
  delayedActivation: [
    /\b(later|afterward|delayed|quiet|came back|caught up|hours after|after the moment)\b/,
    /\b(lands later|shows up later|after it is over|after the pressure|replayed later)\b/,
  ],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function signalSearchText(signals: readonly UserSignal[]): string {
  return normalize(
    signals.map(signal => [
      signal.key,
      signal.source,
      ...(signal.roles ?? []),
      signal.evidence?.label,
      signal.evidence?.phrase,
      signal.evidence?.signal,
    ].filter(Boolean).join(' ')).join(' '),
  );
}

export function inferPatternTypeScores(signals: readonly UserSignal[]): Record<PatternType, number> {
  const haystack = signalSearchText(signals);

  return Object.fromEntries(
    PATTERN_TYPES.map(patternType => {
      const matches = PATTERN_TYPE_MATCHERS[patternType].filter(matcher => matcher.test(haystack)).length;
      return [patternType, Number(Math.min(1, 0.12 + matches * 0.22).toFixed(2))];
    }),
  ) as Record<PatternType, number>;
}

export function inferPatternType(signals: readonly UserSignal[]): PatternType {
  const scores = inferPatternTypeScores(signals);
  return [...PATTERN_TYPES].sort((a, b) => scores[b] - scores[a])[0];
}
