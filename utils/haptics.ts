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
 *
 * expo-haptics is lazy-loaded to avoid touching the native module during
 * startup-critical module evaluation.
 */

import type * as ExpoHaptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── In-memory cache — defaults to enabled until loaded ───────────────────────
let _hapticsEnabled = true;
let hapticsModule: typeof ExpoHaptics | null = null;

export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
  Rigid = 'rigid',
  Soft = 'soft',
}

export enum NotificationFeedbackType {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

type ImpactFeedbackStyleValue = ImpactFeedbackStyle;
type NotificationFeedbackTypeValue = NotificationFeedbackType;

function getHapticsModule(): typeof ExpoHaptics | null {
  if (hapticsModule) {
    return hapticsModule;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    hapticsModule = require('expo-haptics') as typeof ExpoHaptics;
  } catch {
    hapticsModule = null;
  }

  return hapticsModule;
}

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
  getHapticsModule()?.selectionAsync().catch(() => {});
}

/** Physical impact — used for confirming actions. */
export function impact(style: ImpactFeedbackStyleValue = ImpactFeedbackStyle.Medium) {
  if (!_hapticsEnabled) return;
  getHapticsModule()?.impactAsync(style as unknown as ExpoHaptics.ImpactFeedbackStyle).catch(() => {});
}

/** Success / warning / error notification feedback. */
export function notification(type: NotificationFeedbackTypeValue = NotificationFeedbackType.Success) {
  if (!_hapticsEnabled) return;
  getHapticsModule()?.notificationAsync(type as unknown as ExpoHaptics.NotificationFeedbackType).catch(() => {});
}

/**
 * Drop-in async replacements that match the expo-haptics API.
 * Existing files can swap `import * as Haptics from 'expo-haptics'`
 * to `import * as Haptics from '../../utils/haptics'` and all calls
 * will automatically respect the user's haptic preference.
 */
export function selectionAsync(): Promise<void> {
  if (!_hapticsEnabled) return Promise.resolve();
  return getHapticsModule()?.selectionAsync().catch(() => {}) ?? Promise.resolve();
}

export function impactAsync(style: ImpactFeedbackStyleValue = ImpactFeedbackStyle.Medium): Promise<void> {
  if (!_hapticsEnabled) return Promise.resolve();
  return getHapticsModule()?.impactAsync(style as unknown as ExpoHaptics.ImpactFeedbackStyle).catch(() => {}) ?? Promise.resolve();
}

export function notificationAsync(type: NotificationFeedbackTypeValue = NotificationFeedbackType.Success): Promise<void> {
  if (!_hapticsEnabled) return Promise.resolve();
  return getHapticsModule()?.notificationAsync(type as unknown as ExpoHaptics.NotificationFeedbackType).catch(() => {}) ?? Promise.resolve();
}
