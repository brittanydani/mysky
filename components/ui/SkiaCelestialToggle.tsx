// File: components/ui/SkiaCelestialToggle.tsx
/**
 * SkiaCelestialToggle — Star-Ignition Toggle Switch
 *
 * A high-end replacement for standard switches.
 * Features: Ignition glow, star-core rendering, and GPU-accelerated transitions.
 *
 * When activated the toggle "ignites" a Skia star (Active Emerald).
 * When deactivated it collapses into a "Singularity" (Deep Space Indigo).
 *
 * Uses BlurMask for the glow and Mixed Color Filters
 * (via interpolateColor) to shift between "Active Emerald" and
 * "Dormant Indigo."
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 3.x
 */

import React, { memo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import {
  Canvas,
  RoundedRect,
  Circle,
  Group,
  RadialGradient,
  LinearGradient,
  BlurMask,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withRepeat,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';

// ── Dimensions ──────────────────────────────────────────────────────────────

const TRACK_W = 52;
const TRACK_H = 28;
const TRACK_R = 14;
const THUMB_R = 10;
const THUMB_OFF_X = TRACK_R;
const THUMB_ON_X = TRACK_W - TRACK_R;
const THUMB_CY = TRACK_H / 2;

// ── Palette ─────────────────────────────────────────────────────────────────

const PAL = {
  active: '#6EBF8B',                    // Emerald Ignite
  dormant: '#2A3B52',                   // Deep Space Indigo (Singularity)
  trackOff: 'rgba(20, 25, 40, 0.92)',
  trackOn: 'rgba(30, 50, 45, 0.95)',
  starCore: '#F0EAD6',                  // Core Light
  starGlow: 'rgba(110, 191, 139, 0.5)', // Emerald glow
  starFlare: 'rgba(110, 191, 139, 0.25)',
  voidColor: 'rgba(42, 59, 82, 0.4)',
  specular: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255,255,255,0.06)',
};

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  /** Current state */
  value: boolean;
  /** Toggle handler */
  onToggle: (newValue: boolean) => void;
  /** Optional label text */
  label?: string;
  /** Optional description */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────────

const SkiaCelestialToggle = memo(function SkiaCelestialToggle({
  value,
  onToggle,
  label,
  description,
  disabled = false,
}: Props) {
  // ── Animation (0 = off, 1 = on) ──
  const toggleProgress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    toggleProgress.value = withTiming(value ? 1 : 0, {
      duration: 350,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [value, toggleProgress]);

  // ── Star pulse (only when on) ──
  const starPulse = useSharedValue(0);

  useEffect(() => {
    if (value) {
      starPulse.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      starPulse.value = withTiming(0, { duration: 300 });
    }
  }, [value, starPulse]);

  // ── Derived values ──
  const thumbX = useDerivedValue(() => {
    'worklet';
    return THUMB_OFF_X + toggleProgress.value * (THUMB_ON_X - THUMB_OFF_X);
  });

  const starOpacity = useDerivedValue(() => {
    'worklet';
    return toggleProgress.value * (0.8 + starPulse.value * 0.2);
  });

  const starFlareRadius = useDerivedValue(() => {
    'worklet';
    return 14 + starPulse.value * 4;
  });

  const glowOpacity = useDerivedValue(() => {
    'worklet';
    return toggleProgress.value * (0.15 + starPulse.value * 0.1);
  });

  // Mixed Color Filter: smooth Dormant Indigo → Active Emerald
  const thumbColor = useDerivedValue(() => {
    'worklet';
    return interpolateColor(
      toggleProgress.value,
      [0, 1],
      [PAL.dormant, PAL.active],
    );
  });

  // ── Handle press ──
  const handlePress = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggle(!value);
  }, [value, onToggle, disabled]);

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.row, disabled && styles.disabled]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
    >
      {/* Text content */}
      {(label || description) && (
        <View style={styles.textCol}>
          {label && <Text style={styles.label}>{label}</Text>}
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      )}

      {/* Skia Toggle */}
      <View style={styles.toggleWrap}>
        <Canvas style={styles.toggleCanvas}>
          {/* Track — obsidian surface */}
          <RoundedRect
            x={0}
            y={0}
            width={TRACK_W}
            height={TRACK_H}
            r={TRACK_R}
            color={PAL.trackOff}
          />

          {/* Track specular top-edge */}
          <RoundedRect
            x={1}
            y={1}
            width={TRACK_W - 2}
            height={TRACK_H * 0.45}
            r={TRACK_R - 1}
            color={PAL.specular}
          />

          {/* Track border */}
          <RoundedRect
            x={0.5}
            y={0.5}
            width={TRACK_W - 1}
            height={TRACK_H - 1}
            r={TRACK_R}
            style="stroke"
            strokeWidth={1}
            color={PAL.border}
          />

          {/* Glow trail (when on) */}
          <Group opacity={glowOpacity}>
            <RoundedRect
              x={THUMB_OFF_X - 6}
              y={THUMB_CY - 8}
              width={TRACK_W - TRACK_R * 2 + 12}
              height={16}
              r={8}
              color={PAL.starGlow}
            >
              <BlurMask blur={8} style="normal" />
            </RoundedRect>
          </Group>

          {/* Star flare (behind thumb, when on) */}
          <Group opacity={starOpacity}>
            <Circle cx={thumbX} cy={THUMB_CY} r={starFlareRadius}>
              <RadialGradient
                c={vec(THUMB_ON_X, THUMB_CY)}
                r={20}
                colors={[PAL.starFlare, 'transparent']}
              />
              <BlurMask blur={6} style="normal" />
            </Circle>
          </Group>

          {/* Thumb sphere */}
          <Group>
            {/* Shadow */}
            <Circle
              cx={thumbX}
              cy={THUMB_CY + 1}
              r={THUMB_R}
              color="rgba(0, 0, 0, 0.3)"
            >
              <BlurMask blur={3} style="normal" />
            </Circle>
            {/* Main sphere — interpolated Dormant Indigo → Active Emerald */}
            <Circle
              cx={thumbX}
              cy={THUMB_CY}
              r={THUMB_R}
              color={thumbColor}
            />
            {/* Catch-light */}
            <Circle
              cx={useDerivedValue(() => { 'worklet'; return thumbX.value - 3; })}
              cy={THUMB_CY - 3}
              r={2.5}
              color="rgba(255, 255, 255, 0.4)"
            >
              <BlurMask blur={1} style="solid" />
            </Circle>
          </Group>
        </Canvas>
      </View>
    </Pressable>
  );
});

export default SkiaCelestialToggle;

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.4,
  },
  textCol: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  description: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  toggleWrap: {
    width: TRACK_W,
    height: TRACK_H,
  },
  toggleCanvas: {
    width: TRACK_W,
    height: TRACK_H,
  },
});
