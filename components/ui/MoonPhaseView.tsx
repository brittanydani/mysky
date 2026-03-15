// components/ui/MoonPhaseView.tsx
// Astronomically-accurate lunar phase — elliptical terminator + Skia rendering
//
// The illumination boundary (terminator) is an ellipse whose eccentricity is
// driven by the JPL-grade phase angle from astronomy-engine.  This is the same
// projection geometry used by planetarium and professional astronomy apps.
//
// Rendering layers:
//   1 – Subtle silver aura (atmosphere glow outside disc)
//   2 – Dark base disc (shadow / night side)
//   3 – Earthshine (faint blue-grey on dark limb — never pitch black)
//   4 – Illuminated region (elliptical terminator path, limb-darkened)
//   5 – Limb rim ring (thin silver stroke)
//
// Illumination math:
//   angle 0° = New Moon, 90° = First Quarter, 180° = Full, 270° = Last Quarter.
//   The terminator projects as a vertical ellipse with semi-minor = r × cos(θ).
//   Waxing (0–180°): right side lit.  Waning (180–360°): left side lit.

import React, { useMemo } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  RadialGradient,
  LinearGradient,
  Group,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getMoonPhaseInfo } from '../../utils/moonPhase';

interface MoonPhaseViewProps {
  size?: number;
  /** Override the date to visualize (defaults to now). Used for weekly forecast orbs. */
  date?: Date;
  /** When false, renders a non-tappable display orb. Defaults to true. */
  interactive?: boolean;
  /** Apply a warm champagne-gold gradient to the moon disc. */
  gradient?: boolean;
}

export default function MoonPhaseView({ size = 40, date, interactive = true, gradient = false }: MoonPhaseViewProps) {
  const router = useRouter();
  const r = size / 2;

  // JPL-grade phase angle (0–360°)
  const angle = useMemo(() => getMoonPhaseInfo(date).angle, [date]);

  const handlePress = () => {
    Haptics.selectionAsync();
    router.push('/astrology-context');
  };

  // Disc clip path
  const discClip = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(r, r, r - 0.5);
    return p;
  }, [r]);

  // ── Elliptical terminator → illuminated region path ─────────────────────
  // On a sphere the terminator is a great circle; projected to the visible
  // disc it becomes an ellipse with semi-axes (r·|cos θ|, r).  The sign of
  // cos θ tells us whether the ellipse curves toward the lit or dark side.
  const litPath = useMemo(() => {
    const rad = (angle * Math.PI) / 180;
    const cosP = Math.cos(rad);
    const sign = angle <= 180 ? 1 : -1; // waxing → right lit, waning → left lit
    const cx = r;
    const cy = r;
    const N = 64;
    const p = Skia.Path.Make();

    // 1) Outer semicircle on the lit side: top → bottom
    for (let i = 0; i <= N; i++) {
      const a = -Math.PI / 2 + (i / N) * Math.PI;
      const x = cx + sign * r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      i === 0 ? p.moveTo(x, y) : p.lineTo(x, y);
    }

    // 2) Terminator ellipse: bottom → top
    for (let i = 0; i <= N; i++) {
      const a = Math.PI / 2 - (i / N) * Math.PI;
      const x = cx + sign * cosP * r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      p.lineTo(x, y);
    }

    p.close();
    return p;
  }, [r, angle]);

  // Aura padding
  const glowPad = size * 0.35;
  const totalSize = size + glowPad * 2;
  const offset = glowPad;

  const moonLayers = (
    <>
      {/* ── Layer 1: Subtle aura (gold when gradient, silver otherwise) ──── */}
      <Canvas
        style={[
          StyleSheet.absoluteFillObject,
          { top: -glowPad, left: -glowPad, width: totalSize, height: totalSize },
        ]}
        pointerEvents="none"
      >
        <Circle cx={offset + r} cy={offset + r} r={r * 1.5}>
          <RadialGradient
            c={vec(offset + r, offset + r)}
            r={r * 1.5}
            colors={
              gradient
                ? ['rgba(221,186,106,0.22)', 'rgba(185,152,90,0.08)', 'transparent']
                : ['rgba(190,195,210,0.20)', 'rgba(170,175,190,0.07)', 'transparent']
            }
            positions={[0, 0.4, 1]}
          />
        </Circle>
      </Canvas>

      {/* ── Moon disc ─────────────────────────────────────────────────────── */}
      <Canvas style={{ width: size, height: size }} pointerEvents="none">

        {/* Layer 2 – Dark base (night side) */}
        <Circle cx={r} cy={r} r={r - 0.5}>
          <RadialGradient
            c={vec(r, r)}
            r={r}
            colors={['#1C1A22', '#131118', '#0A090E']}
            positions={[0, 0.6, 1]}
          />
        </Circle>

        {/* Layer 3 – Earthshine: faint blue-grey on dark limb */}
        <Group clip={discClip}>
          <Circle cx={r} cy={r} r={r}>
            <RadialGradient
              c={vec(r, r)}
              r={r}
              colors={['rgba(65,70,88,0.10)', 'rgba(50,54,70,0.05)', 'transparent']}
              positions={[0, 0.5, 1]}
            />
          </Circle>
        </Group>

        {/* Layer 4 – Illuminated region (elliptical terminator + limb darkening) */}
        <Group clip={discClip}>
          <Path path={litPath}>
            {gradient ? (
              <LinearGradient
                start={vec(0, 0)}
                end={vec(size, size)}
                colors={['#7A511C', '#C99949', '#DDBA6A', '#EFD596', '#F7E7C6', '#EFD596', '#DDBA6A', '#A8742E']}
                positions={[0, 0.15, 0.3, 0.48, 0.58, 0.72, 0.86, 1]}
              />
            ) : (
              <RadialGradient
                c={vec(r, r)}
                r={r * 0.95}
                colors={['#E0DCD4', '#C6C2B8', '#98948A', '#565350']}
                positions={[0, 0.35, 0.72, 1]}
              />
            )}
          </Path>
        </Group>

        {/* Layer 5 – Limb rim ring */}
        <Circle
          cx={r}
          cy={r}
          r={r - 0.75}
          color={gradient ? 'rgba(221,186,106,0.30)' : 'rgba(180,185,195,0.25)'}
          style="stroke"
          strokeWidth={0.75}
        />
      </Canvas>
    </>
  );

  if (!interactive) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        {moonLayers}
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { width: size, height: size },
        pressed && { opacity: 0.75 },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Moon phase — tap for Cosmic Context"
    >
      {moonLayers}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});


