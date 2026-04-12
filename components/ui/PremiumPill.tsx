// components/ui/PremiumPill.tsx
//
// Animated toggle pill for multi-select or single-select tag grids.
//
// Visual behaviour:
//   • Press-in  → spring scale to 0.92 (feels like a physical button depression).
//   • Press-out → spring returns to 1.0.
//   • Toggle    → 200ms color interpolation from ghost styles to a 13%-opacity
//                 wash of the accentColor, with a matching border brightening.
//   • Haptics   → Light impact on toggle, Medium on long-press remove.
//
// All scale and color animations run on the native UI thread via Reanimated
// SharedValues / useAnimatedStyle — zero JS bridge stalls.

import React, { memo, useEffect, useCallback } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PremiumPillProps {
  label: string;
  isSelected: boolean;
  /** Called when the pill is toggled (selection logic lives in parent). */
  onToggle: () => void;
  /** Optional long-press handler — used for removing custom tags. */
  onLongPress?: () => void;
  /** Hex accent colour that drives the selected bg/border. Default: gold. */
  accentColor?: string;
  /** When true the pill is visually dimmed and tap is ignored. */
  disabled?: boolean;
}

// ── Spring config ──────────────────────────────────────────────────────────────

const SPRING_PRESS = {
  mass: 0.4,
  damping: 14,
  stiffness: 320,
  overshootClamping: false,
} as const;

// ── Component ─────────────────────────────────────────────────────────────────

const PremiumPill = memo(function PremiumPill({
  label,
  isSelected,
  onToggle,
  onLongPress,
  accentColor = '#D4AF37',
  disabled = false,
}: PremiumPillProps) {
  // 0 = deselected, 1 = selected — drives color interpolation
  const progress = useSharedValue(isSelected ? 1 : 0);
  // 1 = resting, 0.92 = pressed — drives scale spring
  const scale = useSharedValue(1);

  // Sync external isSelected changes (e.g. restoring a saved check-in)
  useEffect(() => {
    progress.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
  }, [isSelected, progress]);

  // Animated style — both properties change on the UI thread, no React re-render
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.08)', `${accentColor}26`], // subtle fill unselected, ~15% accent fill when selected
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.18)', `${accentColor}80`], // visible border unselected, accent when selected
    ),
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.38 : 1,
  }));

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, SPRING_PRESS);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1.0, SPRING_PRESS);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggle();
  }, [disabled, onToggle]);

  const handleLongPress = useCallback(() => {
    if (!onLongPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onLongPress();
  }, [onLongPress]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      delayLongPress={600}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected, disabled }}
      accessibilityHint={
        isSelected
          ? onLongPress ? 'Double-tap to deselect, hold to remove' : 'Double-tap to deselect'
          : disabled
            ? 'Maximum selections reached'
            : 'Double-tap to select'
      }
    >
      <Animated.View style={[styles.pill, animatedStyle]}>
        <Text
          style={[
            styles.label,
            isSelected ? { color: accentColor } : { color: 'rgba(255,255,255,0.70)' },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

export default PremiumPill;

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.80)',
    letterSpacing: -0.2,
  },
});
