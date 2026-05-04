export type TodayInsightRefreshReason =
  | 'dailyCheckIn'
  | 'dailyReflection'
  | 'sleep';

export interface TodayInsightRefreshState {
  revision: number;
  reason: TodayInsightRefreshReason | null;
  markedAt: string | null;
}

let refreshState: TodayInsightRefreshState = {
  revision: 0,
  reason: null,
  markedAt: null,
};

export function markTodayInsightsStale(reason: TodayInsightRefreshReason): TodayInsightRefreshState {
  refreshState = {
    revision: refreshState.revision + 1,
    reason,
    markedAt: new Date().toISOString(),
  };

  return refreshState;
}

export function getTodayInsightRefreshState(): TodayInsightRefreshState {
  return refreshState;
}
