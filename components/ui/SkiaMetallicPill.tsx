/**
 * SkiaMetallicPill
 *
 * A true reflective-metallic CTA button rendered entirely with Skia.
 * Replicates the MySky logo gold look via 6 layered passes:
 *
 *   1. dark under-glow shadow
 *   2. base metallic 6-stop gradient
 *   3. narrow reflection bands (bright highlights)
 *   4. top gloss strip (white → transparent)
 *   5. subtle bottom shade (dark → transparent)
 *   6. thin bright rim stroke
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
  BoxShadow,
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
        {/* ── 1. Dark under-glow shadow ───────────────────────── */}
        <Group>
          <RoundedRect x={0} y={2} width={w} height={height} r={r}>
            <BoxShadow dx={0} dy={4} blur={12} color="rgba(0,0,0,0.45)" />
          </RoundedRect>
        </Group>

        {/* ── 2. Base metallic gradient ───────────────────────── */}
        <RoundedRect x={0} y={0} width={w} height={height} r={r}>
          <LinearGradient
            start={vec(0.05 * w, 0.15 * height)}
            end={vec(0.95 * w, 0.85 * height)}
            colors={[...METALLIC_GOLD.pillGradient]}
          />
        </RoundedRect>

        {/* ── 3. Narrow reflection band — bright strip near top ── */}
        <Group
          clip={{ x: 0, y: 0, width: w, height: height }}
        >
          <RoundedRect
            x={0}
            y={height * 0.08}
            width={w}
            height={height * 0.18}
            r={r}
          >
            <LinearGradient
              start={vec(0, height * 0.08)}
              end={vec(0, height * 0.26)}
              colors={[
                'rgba(255,255,255,0.00)',
                'rgba(255,248,227,0.32)',
                'rgba(255,255,255,0.00)',
              ]}
            />
          </RoundedRect>
        </Group>

        {/* ── 4. Top gloss strip — white fade from very top ───── */}
        <RoundedRect x={0} y={0} width={w} height={height * 0.42} r={r}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height * 0.42)}
            colors={[
              METALLIC_GOLD.gloss,  // rgba(255,255,255,0.18)
              'rgba(255,255,255,0.02)',
            ]}
          />
        </RoundedRect>

        {/* ── 5. Subtle bottom shade — darker at lower edge ───── */}
        <RoundedRect
          x={0}
          y={height * 0.6}
          width={w}
          height={height * 0.4}
          r={r}
        >
          <LinearGradient
            start={vec(0, height * 0.6)}
            end={vec(0, height)}
            colors={[
              'rgba(0,0,0,0.00)',
              'rgba(78,58,31,0.28)', // METALLIC_GOLD.deepShadow tinted
            ]}
          />
        </RoundedRect>

        {/* ── 6. Thin bright rim stroke ───────────────────────── */}
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
