/**
 * utils/haptics.ts
 *
 * Safe haptic feedback wrappers. All calls are fire-and-forget with
 * silent error suppression — haptics failing should never crash the app
 * or produce unhandled promise rejections in production.
 */

import * as Haptics from 'expo-haptics';

/** Light tap — used for selections, toggles, navigation. */
export function selection() {
  Haptics.selectionAsync().catch(() => {});
}

/** Physical impact — used for confirming actions. */
export function impact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) {
  Haptics.impactAsync(style).catch(() => {});
}

/** Success / warning / error notification feedback. */
export function notification(type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) {
  Haptics.notificationAsync(type).catch(() => {});
}

// Re-export enums for convenience
export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
