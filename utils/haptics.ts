/**
 * utils/haptics.ts
 *
 * Safe haptic feedback wrappers. All calls are fire-and-forget with
 * silent error suppression — haptics failing should never crash the app
 * or produce unhandled promise rejections in production.
 *
 * Haptics respect the user's `pref_haptic` AsyncStorage preference.
 * Call `initHapticPreference()` once on app startup to seed the cache,
 * and `setHapticsEnabled()` whenever the user changes the setting.
 */

import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── In-memory cache — defaults to enabled until loaded ───────────────────────
let _hapticsEnabled = true;

/** Load the persisted preference from storage. Call once at app startup. */
export async function initHapticPreference(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem('pref_haptic');
    if (stored !== null) _hapticsEnabled = stored === '1';
  } catch {
    // Retain default (true) on failure
  }
}

/** Update the in-memory cache immediately (called when user toggles the pref). */
export function setHapticsEnabled(enabled: boolean): void {
  _hapticsEnabled = enabled;
}

/** Light tap — used for selections, toggles, navigation. */
export function selection() {
  if (!_hapticsEnabled) return;
  Haptics.selectionAsync().catch(() => {});
}

/** Physical impact — used for confirming actions. */
export function impact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) {
  if (!_hapticsEnabled) return;
  Haptics.impactAsync(style).catch(() => {});
}

/** Success / warning / error notification feedback. */
export function notification(type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) {
  if (!_hapticsEnabled) return;
  Haptics.notificationAsync(type).catch(() => {});
}

/**
 * Drop-in async replacements that match the expo-haptics API.
 * Existing files can swap `import * as Haptics from 'expo-haptics'`
 * to `import * as Haptics from '../../utils/haptics'` and all calls
 * will automatically respect the user's haptic preference.
 */
export function selectionAsync(): Promise<void> {
  if (!_hapticsEnabled) return Promise.resolve();
  return Haptics.selectionAsync().catch(() => {});
}

export function impactAsync(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium): Promise<void> {
  if (!_hapticsEnabled) return Promise.resolve();
  return Haptics.impactAsync(style).catch(() => {});
}

export function notificationAsync(type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success): Promise<void> {
  if (!_hapticsEnabled) return Promise.resolve();
  return Haptics.notificationAsync(type).catch(() => {});
}

// Re-export enums for convenience
export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
