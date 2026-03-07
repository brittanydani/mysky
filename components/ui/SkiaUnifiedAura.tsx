// File: components/ui/SkiaUnifiedAura.tsx
/**
 * SkiaUnifiedAura — "The Internal Weather Station"
 *
 * Three Glow-Mapped Orbs (Mood, Energy, Tension) that merge and shift
 * into a "Unified Aura" based on the day's check-in values.
 *
 * Architecture:
 *   - Each orb is a radial gradient sphere with inner catch-light.
 *   - Orbs overlap and their colours blend additively in the overlap zone.
 *   - A shared "atmosphere" glow radiates behind all three.
 *   - Values (1–10) control:
 *       • Orb radius (larger = more intense)
 *       • Orb luminance (brighter = higher value)
 *       • Atmosphere hue (blended from all three)
 *
 * Colour Language:
 *   Mood:    Gold spectrum     (low → muted amber, high → radiant gold)
 *   Energy:  Blue spectrum     (low → slate, high → vivid cerulean)
 *   Tension: Rose-red spectrum (low → soft rose, high → intense crimson)
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  BlurMask,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

const { width: W } = Dimensions.get('window');
const AURA_W = W - 32;
const AURA_H = 180;
const CX = AURA_W / 2;
const CY = AURA_H / 2;

// ── Orb positions (triangle layout) ────────────────────────────────────────

const ORB_POSITIONS = {
  mood: { x: CX - 50, y: CY - 15 },
  energy: { x: CX + 50, y: CY - 15 },
  tension: { x: CX, y: CY + 30 },
};

// ── Colour interpolation ───────────────────────────────────────────────────

function moodColor(v: number): string {
  const t = v / 10;
  const r = Math.round(180 + t * 32);
  const g = Math.round(140 + t * 35);
  const b = Math.round(40 + t * 15);
  return `rgba(${r}, ${g}, ${b}, ${0.3 + t * 0.4})`;
}

function energyColor(v: number): string {
  const t = v / 10;
  const r = Math.round(60 + t * 40);
  const g = Math.round(120 + t * 59);
  const b = Math.round(170 + t * 41);
  return `rgba(${r}, ${g}, ${b}, ${0.3 + t * 0.4})`;
}

function tensionColor(v: number): string {
  const t = v / 10;
  const r = Math.round(180 + t * 44);
  const g = Math.round(80 - t * 10);
  const b = Math.round(80 - t * 10);
  return `rgba(${r}, ${g}, ${b}, ${0.25 + t * 0.35})`;
}

function moodLabel(v: number): string {
  if (v <= 3) return 'Low';
  if (v <= 6) return 'Steady';
  return 'Radiant';
}

function energyLabel(v: number): string {
  if (v <= 3) return 'Depleted';
  if (v <= 6) return 'Stable';
  return 'Vibrant';
}

function tensionLabel(v: number): string {
  if (v <= 3) return 'Relaxed';
  if (v <= 6) return 'Alert';
  return 'Intense';
}

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  /** Mood score 1–10 */
  mood: number;
  /** Energy score 1–10 */
  energy: number;
  /** Tension/stress score 1–10 */
  tension: number;
}

// ── Component ───────────────────────────────────────────────────────────────

const SkiaUnifiedAura = memo(function SkiaUnifiedAura({
  mood,
  energy,
  tension,
}: Props) {
  const m = Math.max(1, Math.min(10, mood));
  const e = Math.max(1, Math.min(10, energy));
  const t = Math.max(1, Math.min(10, tension));

  // ── Breathing animation ──
  const breathValue = useSharedValue(0);

  useEffect(() => {
    breathValue.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathValue]);

  // ── Orb radii (animated) ──
  const moodR = useDerivedValue(() => {
    'worklet';
    return 24 + (m / 10) * 18 + breathValue.value * 4;
  });

  const energyR = useDerivedValue(() => {
    'worklet';
    return 24 + (e / 10) * 18 + breathValue.value * 3;
  });

  const tensionR = useDerivedValue(() => {
    'worklet';
    return 22 + (t / 10) * 16 + breathValue.value * 3;
  });

  // ── Atmosphere glow ──
  const atmosRadius = useDerivedValue(() => {
    'worklet';
    const avg = (m + e + t) / 30; // 0–1
    return 70 + avg * 50 + breathValue.value * 15;
  });

  const atmosOpacity = useDerivedValue(() => {
    'worklet';
    const avg = (m + e + t) / 30;
    return 0.06 + avg * 0.12 + breathValue.value * 0.03;
  });

  // Precompute static colours
  const mCol = moodColor(m);
  const eCol = energyColor(e);
  const tCol = tensionColor(t);

  return (
    <View style={styles.wrapper}>
      <Canvas style={styles.canvas} mode="continuous">
        {/* ── Glass card ── */}
        <Rect
          x={0}
          y={0}
          width={AURA_W}
          height={AURA_H}
          color="rgba(255,255,255,0.03)"
        />

        {/* ── Unified atmosphere glow ── */}
        <Group opacity={atmosOpacity}>
          <Circle cx={CX} cy={CY} r={atmosRadius}>
            <RadialGradient
              c={vec(CX, CY)}
              r={150}
              colors={[mCol, eCol, 'transparent']}
            />
            <BlurMask blur={40} style="normal" />
          </Circle>
        </Group>

        {/* ── Mood Orb (Gold) ── */}
        <Group>
          {/* Outer glow */}
          <Circle
            cx={ORB_POSITIONS.mood.x}
            cy={ORB_POSITIONS.mood.y}
            r={moodR}
            color={mCol}
          >
            <BlurMask blur={20} style="normal" />
          </Circle>
          {/* Core */}
          <Circle
            cx={ORB_POSITIONS.mood.x}
            cy={ORB_POSITIONS.mood.y}
            r={useDerivedValue(() => { 'worklet'; return moodR.value * 0.6; })}
          >
            <RadialGradient
              c={vec(ORB_POSITIONS.mood.x, ORB_POSITIONS.mood.y)}
              r={30}
              colors={['rgba(255, 255, 255, 0.3)', mCol, 'transparent']}
            />
          </Circle>
          {/* Catch-light */}
          <Circle
            cx={ORB_POSITIONS.mood.x - 6}
            cy={ORB_POSITIONS.mood.y - 6}
            r={4}
            color="rgba(255, 255, 255, 0.25)"
          >
            <BlurMask blur={3} style="solid" />
          </Circle>
        </Group>

        {/* ── Energy Orb (Blue) ── */}
        <Group>
          <Circle
            cx={ORB_POSITIONS.energy.x}
            cy={ORB_POSITIONS.energy.y}
            r={energyR}
            color={eCol}
          >
            <BlurMask blur={20} style="normal" />
          </Circle>
          <Circle
            cx={ORB_POSITIONS.energy.x}
            cy={ORB_POSITIONS.energy.y}
            r={useDerivedValue(() => { 'worklet'; return energyR.value * 0.6; })}
          >
            <RadialGradient
              c={vec(ORB_POSITIONS.energy.x, ORB_POSITIONS.energy.y)}
              r={30}
              colors={['rgba(255, 255, 255, 0.3)', eCol, 'transparent']}
            />
          </Circle>
          <Circle
            cx={ORB_POSITIONS.energy.x - 6}
            cy={ORB_POSITIONS.energy.y - 6}
            r={4}
            color="rgba(255, 255, 255, 0.25)"
          >
            <BlurMask blur={3} style="solid" />
          </Circle>
        </Group>

        {/* ── Tension Orb (Rose) ── */}
        <Group>
          <Circle
            cx={ORB_POSITIONS.tension.x}
            cy={ORB_POSITIONS.tension.y}
            r={tensionR}
            color={tCol}
          >
            <BlurMask blur={18} style="normal" />
          </Circle>
          <Circle
            cx={ORB_POSITIONS.tension.x}
            cy={ORB_POSITIONS.tension.y}
            r={useDerivedValue(() => { 'worklet'; return tensionR.value * 0.55; })}
          >
            <RadialGradient
              c={vec(ORB_POSITIONS.tension.x, ORB_POSITIONS.tension.y)}
              r={28}
              colors={['rgba(255, 255, 255, 0.25)', tCol, 'transparent']}
            />
          </Circle>
          <Circle
            cx={ORB_POSITIONS.tension.x - 5}
            cy={ORB_POSITIONS.tension.y - 5}
            r={3}
            color="rgba(255, 255, 255, 0.2)"
          >
            <BlurMask blur={2} style="solid" />
          </Circle>
        </Group>
      </Canvas>

      {/* ── Refined Label Row: Prevents text collision ── */}
      <View style={styles.labelRow}>
        <MetricLabel 
          title="MOOD" 
          value={moodLabel(m)} 
          color="#C9AE78"
        />
        <MetricLabel 
          title="TENSION" 
          value={tensionLabel(t)} 
          color="#CD7F5D"
        />
        <MetricLabel 
          title="ENERGY" 
          value={energyLabel(e)} 
          color="#6EBF8B"
        />
      </View>
    </View>
  );
});

// Sub-component for clean, stacked metrics
const MetricLabel = ({ title, value, color }: { title: string; value: string; color: string }) => (
  <View style={styles.metricItem}>
    <Text style={[styles.metricTitle, { color }]}>{title}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

export default SkiaUnifiedAura;

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    width: AURA_W,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 24,
  },
  canvas: {
    width: AURA_W,
    height: AURA_H,
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1, // Ensures equal distribution to prevent overlapping
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  metricValue: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
});
