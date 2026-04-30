import { DailyCheckIn } from '../../patterns/types';
import { SIGNALS } from '../signalDefinitions';
import { UserSignal } from '../types/knowledgeEngine';

const CHALLENGING_ASPECTS = new Set(['conjunction', 'square', 'opposition']);
const RELATIONAL_POINTS = new Set(['Moon', 'Venus', 'Mars', 'Chiron']);

/**
 * Normalizes the sky snapshot saved with each check-in.
 *
 * Astrology is intentionally treated as a supporting signal: it can strengthen
 * a pattern already present in lived data, but should not overpower the user's
 * own entries.
 */
export function normalizeAstrology(checkIn: DailyCheckIn): UserSignal[] {
  const signals: UserSignal[] = [];
  const date = checkIn.date;
  const lunarPhase = checkIn.lunarPhase ?? 'unknown';

  if (checkIn.moonHouse === 4 || checkIn.moonHouse === 8 || checkIn.moonHouse === 12) {
    signals.push({
      key: SIGNALS.DEEP_PROCESSING.key,
      source: 'astrology',
      date,
      strength: 0.45,
      evidence: {
        source: 'astrology',
        date,
        label: `Moon in house ${checkIn.moonHouse}`,
      },
    });
  }

  if (checkIn.moonHouse === 6) {
    signals.push({
      key: SIGNALS.REST_RESISTANCE.key,
      source: 'astrology',
      date,
      strength: 0.35,
      evidence: {
        source: 'astrology',
        date,
        label: 'Moon in house 6',
      },
    });
  }

  if (checkIn.moonHouse === 7) {
    signals.push({
      key: SIGNALS.MUTUALITY_NEED.key,
      source: 'astrology',
      date,
      strength: 0.4,
      evidence: {
        source: 'astrology',
        date,
        label: 'Moon in house 7',
      },
    });
  }

  if (lunarPhase === 'full') {
    signals.push({
      key: SIGNALS.LOW_CAPACITY.key,
      source: 'astrology',
      date,
      strength: 0.35,
      evidence: {
        source: 'astrology',
        date,
        label: 'full moon check-in',
      },
    });
  } else if (lunarPhase.includes('waning') || lunarPhase === 'last_quarter') {
    signals.push({
      key: SIGNALS.QUIET_AS_REPAIR.key,
      source: 'astrology',
      date,
      strength: 0.35,
      evidence: {
        source: 'astrology',
        date,
        label: 'waning moon check-in',
      },
    });
  }

  for (const transit of checkIn.transitEvents ?? []) {
    const aspect = String(transit.aspect).toLowerCase();
    if (!CHALLENGING_ASPECTS.has(aspect)) continue;

    const planetLabel = `${transit.transitPlanet}-${transit.natalPlanet} ${transit.aspect}`;
    const tightness = Math.max(0.25, Math.min(0.6, 0.65 - (transit.orb ?? 3) * 0.08));
    const relational = RELATIONAL_POINTS.has(transit.natalPlanet) || RELATIONAL_POINTS.has(transit.transitPlanet);

    signals.push({
      key: relational ? SIGNALS.MUTUALITY_NEED.key : SIGNALS.CALM_BRACING.key,
      source: 'astrology',
      date,
      strength: tightness,
      evidence: {
        source: 'astrology',
        date,
        label: planetLabel,
      },
    });
  }

  if ((checkIn.retrogrades ?? []).length >= 2) {
    signals.push({
      key: SIGNALS.DEEP_PROCESSING.key,
      source: 'astrology',
      date,
      strength: 0.35,
      evidence: {
        source: 'astrology',
        date,
        label: `${checkIn.retrogrades.length} retrogrades active`,
      },
    });
  }

  return signals;
}
