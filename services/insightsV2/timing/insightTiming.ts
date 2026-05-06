import type {
  InsightDeliveryMode,
  InsightHistoryItem,
} from '../types';
import type { CurrentInsightStateProfile } from '../state/insightState';
import { toLocalDateString } from '../../../utils/dateUtils';

export interface InsightTimingDecision {
  deliveryMode: InsightDeliveryMode;
  maxDailyInsights: number;
  suppressDeepContext: boolean;
  suppressNovelty: boolean;
  preferReinforcement: boolean;
  reasonCodes: string[];
}

interface InsightTimingInput {
  stateProfile?: CurrentInsightStateProfile | null;
  history?: readonly (Partial<InsightHistoryItem> | null | undefined)[] | null;
  date?: string | null;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function dateKey(value: unknown): string | null {
  const raw = stringValue(value);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  return Number.isFinite(parsed.getTime())
    ? toLocalDateString(parsed)
    : /^\d{4}-\d{2}-\d{2}/.test(raw)
      ? raw.slice(0, 10)
      : null;
}

function sameDay(a: unknown, b: unknown): boolean {
  const aKey = dateKey(a);
  const bKey = dateKey(b);
  return !!aKey && !!bKey && aKey === bKey;
}

function heavyHistoryItem(item: Partial<InsightHistoryItem> | null | undefined): boolean {
  if (!item) return false;
  const slot = stringValue(item.slot);
  const title = stringValue(item.title);

  return (
    slot === 'whatMySkyNoticed' ||
    slot === 'growthEdge' ||
    slot === 'primaryPersona' ||
    /deep|growth|pattern|root|profile/i.test(title)
  );
}

export function buildInsightTimingDecision({
  stateProfile,
  history,
  date,
}: InsightTimingInput): InsightTimingDecision {
  const safeHistory = Array.isArray(history) ? history : [];
  const shownToday = safeHistory.filter(item => sameDay(item?.shownAt, date));
  const heavyShownToday = shownToday.filter(heavyHistoryItem);
  const primaryState = stateProfile?.primaryState ?? 'calm';
  const intensity = typeof stateProfile?.intensity === 'number' && Number.isFinite(stateProfile.intensity)
    ? stateProfile.intensity
    : 0;
  const stateReasonCodes = Array.isArray(stateProfile?.reasonCodes)
    ? stateProfile.reasonCodes
    : [];
  const reasonCodes = [
    `state:${primaryState}`,
    ...stateReasonCodes,
  ];

  if (
    primaryState === 'shutdown' &&
    intensity >= 0.72 &&
    heavyShownToday.length > 0
  ) {
    return {
      deliveryMode: 'space',
      maxDailyInsights: 1,
      suppressDeepContext: true,
      suppressNovelty: true,
      preferReinforcement: true,
      reasonCodes: [...reasonCodes, 'space:shutdownAfterHeavyInsight'],
    };
  }

  if (
    primaryState === 'overwhelmed' &&
    intensity >= 0.72
  ) {
    return {
      deliveryMode: heavyShownToday.length > 0 ? 'space' : 'gentleEcho',
      maxDailyInsights: heavyShownToday.length > 0 ? 1 : 2,
      suppressDeepContext: true,
      suppressNovelty: true,
      preferReinforcement: true,
      reasonCodes: [...reasonCodes, 'limit:overwhelmed'],
    };
  }

  if (
    shownToday.length >= 2 ||
    heavyShownToday.length >= 1
  ) {
    return {
      deliveryMode: 'reinforcement',
      maxDailyInsights: 2,
      suppressDeepContext: true,
      suppressNovelty: true,
      preferReinforcement: true,
      reasonCodes: [...reasonCodes, 'limit:alreadyShownToday'],
    };
  }

  if (
    primaryState === 'activated' &&
    intensity >= 0.6
  ) {
    return {
      deliveryMode: 'gentleEcho',
      maxDailyInsights: 2,
      suppressDeepContext: true,
      suppressNovelty: true,
      preferReinforcement: true,
      reasonCodes: [...reasonCodes, 'limit:activated'],
    };
  }

  if (
    primaryState === 'shutdown' ||
    primaryState === 'tired'
  ) {
    return {
      deliveryMode: 'gentleEcho',
      maxDailyInsights: 2,
      suppressDeepContext: primaryState === 'shutdown',
      suppressNovelty: true,
      preferReinforcement: true,
      reasonCodes: [...reasonCodes, `limit:${primaryState}`],
    };
  }

  return {
    deliveryMode: 'novelty',
    maxDailyInsights: primaryState === 'openReceptive' ? 4 : 3,
    suppressDeepContext: false,
    suppressNovelty: false,
    preferReinforcement: false,
    reasonCodes,
  };
}
