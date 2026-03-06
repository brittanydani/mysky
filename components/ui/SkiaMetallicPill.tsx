/**
 * SkiaMetallicPill
 *
 * A true reflective-metallic CTA button rendered entirely with Skia.
 * Replicates the MySky logo gold look via 7 layered passes:
 *
 *   1. Outer glow (BlurMask)
 *   2. Base metallic 6-stop gradient with position control
 *   3. Horizontal reflection bands (8-stop) — the key to "metal" feel
 *   4. Top gloss strip (inset from edges)
 *   5. Bottom shadow (3-stop, covers full rect)
 *   6. Outer rim light
 *   7. Inner lower rim
 *
 * Drop-in replacement for all expo-linear-gradient CTA buttons.
 */

import React, { memo, useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, Platform, LayoutChangeEvent } from 'react-native';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  Group,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';
import { METALLIC_GOLD } from '../../constants/theme';

// ── Layout ──────────────────────────────────────────────────────────
const PILL_HEIGHT = 56;
const PILL_RADIUS = 9999; // full capsule

interface Props {
  /** Button label */
  label: string;
  /** Press handler */
  onPress: () => void;
  /** Optional: replace default height */
  height?: number;
  /** Optional: replace default border-radius */
  borderRadius?: number;
  /** Show a disabled/loading state */
  disabled?: boolean;
  /** Icon element to render after label */
  icon?: React.ReactNode;
  /** Override label style */
  labelStyle?: object;
  /** Override container style */
  style?: object;
}

function SkiaMetallicPill({
  label,
  onPress,
  height = PILL_HEIGHT,
  borderRadius = PILL_RADIUS,
  disabled = false,
  icon,
  labelStyle,
  style,
}: Props) {
  const r = Math.min(borderRadius, height / 2);
  const [w, setW] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setW(e.nativeEvent.layout.width);
  }, []);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.outer,
        { height, borderRadius: r, opacity: disabled ? 0.5 : 1 },
        pressed && styles.pressed,
        style,
      ]}
    >
      {/* Skia canvas fills the entire pill */}
      {w > 0 && (
      <Canvas style={[StyleSheet.absoluteFillObject, { borderRadius: r }]}>  
        {/* ── 1. Outer glow ───────────────────────────────────── */}
        <RoundedRect x={1} y={2} width={w - 2} height={height - 2} r={r}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(w, height)}
            colors={[
              'rgba(247,231,194,0.00)',
              METALLIC_GOLD.glow,
              'rgba(247,231,194,0.00)',
            ]}
          />
          <BlurMask blur={10} style="solid" />
        </RoundedRect>

        {/* ── 2. Base metallic gradient ───────────────────────── */}
        <RoundedRect x={0} y={0} width={w} height={height} r={r}>
          <LinearGradient
            start={vec(w * 0.05, height * 0.15)}
            end={vec(w * 0.95, height * 0.85)}
            colors={[...METALLIC_GOLD.pillGradient]}
            positions={[0, 0.16, 0.34, 0.56, 0.78, 1]}
          />
        </RoundedRect>

        {/* ── 3. Reflection bands — these make it feel metallic ── */}
        <RoundedRect x={0} y={0} width={w} height={height} r={r}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(w, 0)}
            colors={[
              'rgba(255,255,255,0.00)',
              'rgba(255,255,255,0.10)',
              'rgba(255,248,220,0.38)',
              'rgba(255,255,255,0.12)',
              'rgba(255,255,255,0.00)',
              'rgba(111,85,46,0.06)',
              'rgba(255,248,220,0.28)',
              'rgba(255,255,255,0.00)',
            ]}
            positions={[0, 0.08, 0.18, 0.28, 0.40, 0.58, 0.78, 1]}
          />
        </RoundedRect>

        {/* ── 4. Top gloss strip ──────────────────────────────── */}
        <RoundedRect x={6} y={4} width={w - 12} height={height * 0.36} r={r}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height * 0.36)}
            colors={[
              'rgba(255,255,255,0.24)',
              'rgba(255,255,255,0.10)',
              'rgba(255,255,255,0.00)',
            ]}
            positions={[0, 0.45, 1]}
          />
        </RoundedRect>

        {/* ── 5. Bottom shadow ────────────────────────────────── */}
        <RoundedRect x={0} y={0} width={w} height={height} r={r}>
          <LinearGradient
            start={vec(0, height * 0.55)}
            end={vec(0, height)}
            colors={[
              'rgba(0,0,0,0.00)',
              'rgba(78,58,31,0.06)',
              'rgba(78,58,31,0.16)',
            ]}
            positions={[0, 0.55, 1]}
          />
        </RoundedRect>

        {/* ── 6. Outer rim light ──────────────────────────────── */}
        <RoundedRect
          x={0.5}
          y={0.5}
          width={w - 1}
          height={height - 1}
          r={r}
          style="stroke"
          strokeWidth={1}
          color={METALLIC_GOLD.rim}
        />

        {/* ── 7. Inner lower rim ──────────────────────────────── */}
        <RoundedRect
          x={1.5}
          y={1.5}
          width={w - 3}
          height={height - 3}
          r={r}
          style="stroke"
          strokeWidth={1}
          color="rgba(111,85,46,0.18)"
        />
      </Canvas>
      )}

      {/* Label + icon sit above the canvas */}
      <View style={styles.content} pointerEvents="none">
        <Text style={[styles.label, labelStyle]}>{label}</Text>
        {icon}
      </View>
    </Pressable>
  );
}

export default memo(SkiaMetallicPill);

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  label: {
    color: '#020817',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: 0.5,
  },
});
