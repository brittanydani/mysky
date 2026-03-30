/**
 * components/ui/SomaticEnergyOrb.tsx
 * MySky — Somatic Energy Orb: A breathing Skia anchor that reflects energy intensity.
 *
 * Architecture:
 *   • Multi-layer concentric circles with blur — volumetric glow
 *   • Breathing rhythm scales with intensity (Low=slow, High=fast)
 *   • Color shifts: Low → cyan/indigo, Moderate → gold, High → rose/amber
 *   • Pure Skia + Reanimated — zero JS bridge, 120fps UI thread
 */

import React, { memo, useEffect } from 'react';
import { View } from 'react-native';
import {
  Canvas,
  Circle,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import type { EnergyIntensity } from '../../services/energy/energyEngine';

interface SomaticEnergyOrbProps {
  intensity: EnergyIntensity;
  size?: number;
}

const INTENSITY_CONFIG: Record<EnergyIntensity, {
  duration: number;
  colors: string[];
}> = {
  Low: {
    duration: 4200,
    colors: [
      'rgba(99,179,237,0.50)',   // core — soft cyan
      'rgba(99,179,237,0.22)',   // mid ring
      'rgba(76,110,245,0.10)',   // outer halo — indigo
    ],
  },
  Moderate: {
    duration: 3200,
    colors: [
      'rgba(232,214,174,0.55)',  // core — warm gold
      'rgba(232,214,174,0.25)',  // mid ring
      'rgba(232,214,174,0.08)',  // outer halo
    ],
  },
  High: {
    duration: 2200,
    colors: [
      'rgba(231,120,152,0.55)',  // core — rose
      'rgba(255,180,100,0.28)',  // mid ring — amber
      'rgba(231,120,152,0.10)',  // outer halo
    ],
  },
};

function SomaticEnergyOrbComponent({ intensity, size = 200 }: SomaticEnergyOrbProps) {
  const cx = size / 2;
  const cy = size / 2;
  const baseRadius = size * 0.18;
  const config = INTENSITY_CONFIG[intensity];

  const breath = useSharedValue(0.85);

  useEffect(() => {
    breath.value = 0.85;
    breath.value = withRepeat(
      withTiming(1.15, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity, config.duration]);

  const r0 = useDerivedValue(() => baseRadius * breath.value);
  const r1 = useDerivedValue(() => baseRadius * 1.8 * breath.value);
  const r2 = useDerivedValue(() => baseRadius * 2.8 * breath.value);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ flex: 1 }}>
        {/* Outer halo */}
        <Circle cx={cx} cy={cy} r={r2} color={config.colors[2]}>
          <BlurMask blur={18} style="normal" />
        </Circle>
        {/* Mid ring */}
        <Circle cx={cx} cy={cy} r={r1} color={config.colors[1]}>
          <BlurMask blur={10} style="normal" />
        </Circle>
        {/* Core */}
        <Circle cx={cx} cy={cy} r={r0} color={config.colors[0]}>
          <BlurMask blur={4} style="normal" />
        </Circle>
      </Canvas>
    </View>
  );
}

export const SomaticEnergyOrb = memo(SomaticEnergyOrbComponent);
