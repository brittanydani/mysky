// File: utils/HapticEngine.ts
//
// Centralised haptic-feedback utility for MySky.
// Wraps expo-haptics with semantic method names so call sites
// read as intent rather than raw haptic constants.
//
// All methods are fire-and-forget — errors are silently caught
// (haptics are optional; some simulators lack support).

import * as Haptics from 'expo-haptics';

/** MySky haptic engine — themed tactile feedback. */
export const HapticEngine = {
  /** Light selection tap — toggling a pill, switching a tab. */
  selectionTap() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },

  /** Crisp snap — slider value snapping, card press. */
  stringSnap() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
  },

  /** Subtle tick — scroll detent, minor state change. */
  stringTick() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },

  /** Selection feedback — sync progress tick during hold. */
  syncProgressTick() {
    Haptics.selectionAsync().catch(() => {});
  },

  /** Success notification — sync complete confirmation. */
  syncCompleteExplosion() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },

  /** Heavy thud — bottom-sheet impact, destructive action confirm. */
  sheetImpact() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },
} as const;
