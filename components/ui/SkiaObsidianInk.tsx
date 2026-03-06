// File: components/ui/SkiaObsidianInk.tsx
/**
 * SkiaObsidianInk — Meditative Writing Shader
 *
 * Renders ripple effects across a frosted glass surface as the user types,
 * creating a tactile, meditative writing experience. Each character triggers
 * a subtle wave that radiates from the text area.
 *
 * Visual Language:
 *   - Obsidian glass base with specular highlights
 *   - Ink ripples that radiate outward as text changes
 *   - Gold and Silver-Blue luminance that responds to content length
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { memo, useEffect, useRef } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
  RadialGradient,
  Rect,
  vec,
  LinearGradient,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  Easing,
  useDerivedValue,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Palette ───────────────────────────────────────────────────────────────────

const COLORS = {
  ripple: 'rgba(197, 180, 147, 0.08)',
  rippleEdge: 'rgba(139, 196, 232, 0.05)',
  specular: 'rgba(255, 255, 255, 0.03)',
  surface: 'rgba(7, 9, 15, 0.4)',
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  /** Current text length — drives ripple intensity */
  textLength: number;
  /** Canvas width (defaults to screen width - 48) */
  width?: number;
  /** Canvas height */
  height?: number;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const SkiaObsidianInk = memo(function SkiaObsidianInk({
  textLength,
  width = SCREEN_W - 48,
  height = 300,
}: Props) {
  const prevLengthRef = useRef(textLength);

  // ── Ripple animations (staggered) ──
  const ripple1 = useSharedValue(0);
  const ripple2 = useSharedValue(0);
  const ripple3 = useSharedValue(0);

  // ── Ambient pulse ──
  const ambientPulse = useSharedValue(0);

  useEffect(() => {
    ambientPulse.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [ambientPulse]);

  // ── Trigger ripple on text change ──
  useEffect(() => {
    if (textLength !== prevLengthRef.current) {
      prevLengthRef.current = textLength;

      // Staggered ripple cascade
      ripple1.value = 0;
      ripple1.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });

      ripple2.value = 0;
      ripple2.value = withDelay(
        150,
        withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }),
      );

      ripple3.value = 0;
      ripple3.value = withDelay(
        300,
        withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }),
      );
    }
  }, [textLength, ripple1, ripple2, ripple3]);

  // ── Derived ripple radii and opacities ──
  const r1Radius = useDerivedValue(() => 20 + ripple1.value * 80);
  const r1Opacity = useDerivedValue(() => (1 - ripple1.value) * 0.15);

  const r2Radius = useDerivedValue(() => 15 + ripple2.value * 60);
  const r2Opacity = useDerivedValue(() => (1 - ripple2.value) * 0.1);

  const r3Radius = useDerivedValue(() => 10 + ripple3.value * 100);
  const r3Opacity = useDerivedValue(() => (1 - ripple3.value) * 0.08);

  // ── Ambient glow intensity based on text content ──
  const glowIntensity = Math.min(1, textLength / 200);
  const ambientRadius = useDerivedValue(
    () => 40 + ambientPulse.value * 15 + glowIntensity * 30,
  );

  // Ripple origin — semi-random but deterministic per keystroke
  const rippleX = (textLength * 37) % Math.round(width * 0.6) + width * 0.2;
  const rippleY = (textLength * 59) % Math.round(height * 0.6) + height * 0.2;

  return (
    <Canvas style={[{ width, height }, localStyles.canvas]} pointerEvents="none">
      {/* ── 1. Obsidian surface ── */}
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={['rgba(15, 18, 25, 0.2)', 'rgba(7, 9, 15, 0.3)']}
        />
      </Rect>

      {/* ── 2. Specular edge highlight ── */}
      <Rect x={0} y={0} width={width} height={2} color={COLORS.specular} />

      {/* ── 3. Ambient glow (responds to text volume) ── */}
      <Circle cx={width / 2} cy={height / 2} r={ambientRadius}>
        <RadialGradient
          c={vec(width / 2, height / 2)}
          r={80 + glowIntensity * 40}
          colors={[
            `rgba(197, 180, 147, ${(0.03 + glowIntensity * 0.05).toFixed(3)})`,
            'transparent',
          ]}
        />
        <BlurMask blur={20} style="normal" />
      </Circle>

      {/* ── 4. Ripple cascade ── */}
      <Group>
        {/* Ripple 1 — Gold */}
        <Circle cx={rippleX} cy={rippleY} r={r1Radius} opacity={r1Opacity}>
          <RadialGradient
            c={vec(rippleX, rippleY)}
            r={100}
            colors={[COLORS.ripple, 'transparent']}
          />
          <BlurMask blur={12} style="normal" />
        </Circle>

        {/* Ripple 2 — Silver-Blue */}
        <Circle cx={rippleX + 20} cy={rippleY - 10} r={r2Radius} opacity={r2Opacity}>
          <RadialGradient
            c={vec(rippleX + 20, rippleY - 10)}
            r={80}
            colors={[COLORS.rippleEdge, 'transparent']}
          />
          <BlurMask blur={10} style="normal" />
        </Circle>

        {/* Ripple 3 — Wide diffuse */}
        <Circle cx={rippleX - 15} cy={rippleY + 15} r={r3Radius} opacity={r3Opacity}>
          <RadialGradient
            c={vec(rippleX - 15, rippleY + 15)}
            r={120}
            colors={['rgba(110, 191, 139, 0.04)', 'transparent']}
          />
          <BlurMask blur={16} style="normal" />
        </Circle>
      </Group>
    </Canvas>
  );
});

export default SkiaObsidianInk;

// ─── Styles ────────────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
