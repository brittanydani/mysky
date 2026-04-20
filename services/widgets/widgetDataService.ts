import { NativeModules, Platform } from 'react-native';

const APP_GROUP = 'group.com.brittany.mysky';

// Orb colour channels are 0.0–1.0 linear-light values matching SwiftUI's Color(red:green:blue:).
// Map your chakra colours from the app theme to these values before calling update.
export interface WidgetData {
  energyLevel: number; // 0.0–1.0  (drives the lock-screen energy ring)
  focusTitle: string;  // dominant chakra name, e.g. "Solar Plexus"
  transit: string;     // short transit label, e.g. "Moon in Pisces"
  statusText: string;  // brief state label, e.g. "Grounding Needed"
  captionText: string; // quickMeaning sentence shown in the medium widget
  orbColorR: number;   // 0.0–1.0
  orbColorG: number;   // 0.0–1.0
  orbColorB: number;   // 0.0–1.0
  // Daily reflection prompt (optional — pushed when available)
  reflectionPrompt?: string;
  reflectionCategory?: string;
  // Streak data (optional — pushed after check-in or on foreground)
  streakCount?: number;
  checkedInToday?: boolean;
  lastCheckInDate?: string; // YYYY-MM-DD
}

/** A pending check-in queued by QuickCheckInIntent inside the widget extension. */
export interface PendingWidgetCheckIn {
  timestamp: number; // Unix epoch seconds
}

/**
 * Push fresh energy data into the shared App Group UserDefaults so the
 * WidgetKit extension can read it on its next timeline refresh.
 * Also calls WidgetCenter.reloadAllTimelines() so changes appear immediately.
 */
export function updateWidgetData(data: WidgetData): void {
  if (Platform.OS !== 'ios') return;
  NativeModules.WidgetDataBridge?.updateWidgetData(data);
}

/**
 * Atomically reads and clears all pending check-ins queued by QuickCheckInIntent.
 * The callback receives an empty array when there are no pending check-ins.
 * The caller is responsible for building the full DailyCheckIn record
 * (with natal-chart data) and persisting it via CheckInService.
 */
export function consumePendingCheckIns(
  callback: (records: PendingWidgetCheckIn[]) => void,
): void {
  if (Platform.OS !== 'ios') {
    callback([]);
    return;
  }
  if (NativeModules.WidgetDataBridge?.consumePendingCheckIns) {
    NativeModules.WidgetDataBridge.consumePendingCheckIns(
      (records: PendingWidgetCheckIn[]) => callback(records ?? []),
    );
  } else {
    callback([]);
  }
}
