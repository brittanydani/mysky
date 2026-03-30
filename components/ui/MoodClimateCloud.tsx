/**
 * components/ui/MoodClimateCloud.tsx
 * MySky — Mood Climate: Pure Skia Particle Cloud (120fps UI thread)
 *
 * Architecture:
 *   • 300 particles driven by Reanimated useDerivedValue worklet — zero JS bridge
 *   • Renders via @shopify/react-native-skia <Points>
 *   • Low turbulence: slow laminar drift, cyan/indigo tones
 *   • High turbulence: chaotic noise, rose/amber tones
 *   • No React Three Fiber · No THREE · Pure Skia + Reanimated
 */

import React, { useEffect, useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import {
  Canvas,
  Points,
  Group,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MoodClimateCloudProps {
  /** 1–10 average anxiety/stress proxy — drives turbulence. Default 3 (calm) */
  turbulence?: number;
  height?:     number;
}

// ─── Static particle data — computed once at module load ──────────────────────

const PARTICLE_COUNT = 300;

interface ParticleData {
  baseX:  number;
  baseY:  number;
  phase:  number;
  speed:  number;
}

const _PARTICLES: ParticleData[] = (() => {
  const arr: ParticleData[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = (i / PARTICLE_COUNT) * Math.PI * 2 * 13.7;
    const phi   = Math.acos(1 - 2 * ((i * 0.618033) % 1));
    const r     = 60 + (i % 5) * 30;
    arr.push({
      baseX: Math.sin(phi) * Math.cos(theta) * r,
      baseY: Math.sin(phi) * Math.sin(theta) * r * 0.65,  // flatten Z
      phase: (i / PARTICLE_COUNT) * Math.PI * 2,
      speed: 0.25 + (i % 7) * 0.09,
    });
  }
  return arr;
})();

// ─── Color helper ─────────────────────────────────────────────────────────────

function turbulenceColor(t01: number): string {
  const r = Math.round(t01 * 255);
  const g = Math.round(200 - t01 * 140);
  const b = Math.round(255 - t01 * 80);
  return `rgb(${r},${g},${b})`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');

export function MoodClimateCloud({ turbulence = 3, height = 280 }: MoodClimateCloudProps) {
  const t01 = Math.max(0, Math.min(1, (turbulence - 1) / 9));

  // Continously incrementing clock on the UI thread
  // Using 2π×100 ensures sin/cos wraps seamlessly (sin(2π×100×speed) = sin(0) for integer speeds)
  const clock = useSharedValue(0);
  useEffect(() => {
    clock.value = withRepeat(
      withTiming(Math.PI * 2 * 100, { duration: 400_000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => { clock.value = 0; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Turbulence level accessible on the UI thread
  const turbulenceShared = useSharedValue(t01);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { turbulenceShared.value = t01; }, [t01]);

  const cx = SCREEN_W / 2;
  const cy = height  / 2;

  // All 300 particle positions computed in a Reanimated worklet — 60-120fps, zero JS bridge
  const points = useDerivedValue<{ x: number; y: number }[]>(() => {
    const t    = clock.value;
    const turb = turbulenceShared.value;
    const laminar = (1.0 - turb * 0.4) * 90;
    const jitter  = turb * 55;

    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = _PARTICLES[i];
      const lx = Math.sin(t * p.speed * 0.4  + p.phase)           * laminar;
      const ly = Math.cos(t * p.speed * 0.35 + p.phase + 1.2)     * laminar;
      const tx = Math.sin(t * p.speed * 4.2  + p.phase * 3.1)     * jitter;
      const ty = Math.cos(t * p.speed * 3.8  + p.phase * 2.7)     * jitter;
      pts.push({ x: cx + p.baseX + lx + tx, y: cy + p.baseY + ly + ty });
    }
    return pts;
  });

  const pointColor = useMemo(() => turbulenceColor(t01), [t01]);

  return (
    <View style={{ height, width: '100%' }}>
      <Canvas style={{ flex: 1 }}>
        {/* Soft outer glow — blurred, low opacity */}
        <Group opacity={0.14}>
          <Points points={points} mode="points" color={pointColor} strokeWidth={22}>
            <BlurMask blur={14} style="solid" />
          </Points>
        </Group>

        {/* Mid glow layer */}
        <Group opacity={0.30}>
          <Points points={points} mode="points" color={pointColor} strokeWidth={7} />
        </Group>

        {/* Crisp particle core */}
        <Points points={points} mode="points" color={pointColor} strokeWidth={2.5} opacity={0.85} />
      </Canvas>
    </View>
  );
}

