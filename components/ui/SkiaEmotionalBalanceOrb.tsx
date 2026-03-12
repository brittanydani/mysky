import React, { memo, useEffect } from 'react';
import { View } from 'react-native';
import {
  Canvas,
  Circle,
  RadialGradient,
  BlurMask,
  Group,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  /** 1–10 average mood */
  moodAvg?: number;
  /** 1–10 average energy */
  energyAvg?: number;
  /** 1–10 average stress */
  stressAvg?: number;
  size?: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function SkiaEmotionalBalanceOrb({ moodAvg = 5, energyAvg = 5, stressAvg = 5, size = 160 }: Props) {
  const cx = size / 2;
  const cy = size / 2;

  // Normalise to 0–1
  const moodT = (moodAvg - 1) / 9;
  const energyT = (energyAvg - 1) / 9;
  const stressT = (stressAvg - 1) / 9;

  // Derive blend colours from the three axes
  const moodR = Math.round(lerp(120, 255, moodT));
  const moodG = Math.round(lerp(100, 218, moodT));
  const moodB = Math.round(lerp(40, 3, moodT));

  const energyR = Math.round(lerp(40, 60, energyT));
  const energyG = Math.round(lerp(100, 210, energyT));
  const energyB = Math.round(lerp(160, 240, energyT));

  // High stress = rose/red tint
  const stressInfluence = stressT * 0.45;

  const coreColor = `rgba(${Math.round(lerp(moodR, 220, stressInfluence))},${Math.round(lerp(moodG, 80, stressInfluence))},${Math.round(lerp(moodB, 80, stressInfluence))},0.85)`;
  const midColor  = `rgba(${Math.round(lerp(energyR, 180, stressInfluence * 0.5))},${Math.round(lerp(energyG, 100, stressInfluence * 0.5))},${Math.round(lerp(energyB, 100, stressInfluence * 0.5))},0.40)`;

  const baseRadius = size * 0.32;
  const orbRadius = useSharedValue(baseRadius * 0.85);
  const glowRadius = useSharedValue(baseRadius * 1.3);

  useEffect(() => {
    orbRadius.value = withTiming(baseRadius, { duration: 1000, easing: Easing.out(Easing.cubic) });
    glowRadius.value = withTiming(baseRadius * 1.55, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [moodAvg, energyAvg, stressAvg]);

  const orbR = useDerivedValue(() => orbRadius.value);
  const glowR = useDerivedValue(() => glowRadius.value);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ flex: 1 }}>
        {/* Outer atmospheric glow */}
        <Circle cx={cx} cy={cy} r={glowR} color={midColor}>
          <BlurMask blur={size * 0.12} style="normal" />
        </Circle>

        {/* Core orb */}
        <Circle cx={cx} cy={cy} r={orbR} color={coreColor}>
          <RadialGradient
            c={vec(cx - orbR.value * 0.2, cy - orbR.value * 0.2)}
            r={orbR.value * 1.2}
            colors={['rgba(255,255,255,0.25)', coreColor, 'rgba(0,0,0,0.15)']}
          />
          <BlurMask blur={3} style="solid" />
        </Circle>

        {/* Inner highlight */}
        <Circle
          cx={cx - baseRadius * 0.18}
          cy={cy - baseRadius * 0.22}
          r={baseRadius * 0.18}
          color="rgba(255,255,255,0.18)"
        >
          <BlurMask blur={4} style="normal" />
        </Circle>
      </Canvas>
    </View>
  );
}

export default memo(SkiaEmotionalBalanceOrb);
