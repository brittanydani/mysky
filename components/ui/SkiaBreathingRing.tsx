/**
 * SkiaBreathingRing
 *
 * Animated concentric rings that pulse with a slow breathing rhythm.
 * Perfect for hero sections, empty states, or behind profile avatars.
 * Uses Reanimated shared values driving Skia Circle for zero-cost animation.
 *
 * Usage:
 *   <SkiaBreathingRing size={180} />
 *   <SkiaBreathingRing size={120} color="amethyst" rings={2} />
 */
import React, { useEffect, memo } from 'react';
import {
  Canvas,
  Circle,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
  useDerivedValue,
  SharedValue,
} from 'react-native-reanimated';

type ColorPreset = 'gold' | 'amethyst' | 'emerald' | 'silverBlue';

interface Props {
  /** Diameter of the outermost ring */
  size?: number;
  /** Number of concentric rings (1–4) */
  rings?: number;
  /** Color preset */
  color?: ColorPreset;
  /** Breathing cycle duration in ms */
  duration?: number;
}

const PRESETS: Record<ColorPreset, { ring: string; glow: string }> = {
  gold: {
    ring: 'rgba(207, 174, 115, 0.18)',
    glow: 'rgba(207, 174, 115, 0.06)',
  },
  amethyst: {
    ring: 'rgba(157, 118, 193, 0.18)',
    glow: 'rgba(157, 118, 193, 0.06)',
  },
  emerald: {
    ring: 'rgba(110, 191, 139, 0.18)',
    glow: 'rgba(110, 191, 139, 0.06)',
  },
  silverBlue: {
    ring: 'rgba(212, 175, 55, 0.18)',
    glow: 'rgba(212, 175, 55, 0.06)',
  },
};

const SkiaBreathingRing = memo(function SkiaBreathingRing({
  size = 160,
  rings = 3,
  color = 'gold',
  duration = 4000,
}: Props) {
  const breath = useSharedValue(0);
  const preset = PRESETS[color];
  const cx = size / 2;
  const cy = size / 2;
  const ringCount = Math.min(Math.max(rings, 1), 4);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(breath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  // Generate ring radii (outermost → innermost)
  const ringData = Array.from({ length: ringCount }, (_, i) => {
    const fraction = 1 - (i / ringCount) * 0.6; // 1.0, 0.85, 0.7, 0.55
    return {
      baseRadius: (size / 2) * fraction * 0.85,
      pulseAmp: 3 + i * 1.5, // outer rings breathe more
      opacity: 0.12 + i * 0.04, // inner rings slightly more opaque
      strokeWidth: 0.8 - i * 0.1,
    };
  });

  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      {/* Central glow */}
      <Circle cx={cx} cy={cy} r={size * 0.2} color={preset.glow}>
        <BlurMask blur={20} style="normal" />
      </Circle>

      {/* Breathing rings */}
      {ringData.map((ring, i) => (
        <BreathingCircle
          key={i}
          cx={cx}
          cy={cy}
          baseRadius={ring.baseRadius}
          pulseAmp={ring.pulseAmp}
          opacity={ring.opacity}
          strokeWidth={ring.strokeWidth}
          color={preset.ring}
          breath={breath}
          phase={i * 0.15}
        />
      ))}
    </Canvas>
  );
});

interface BreathingCircleProps {
  cx: number;
  cy: number;
  baseRadius: number;
  pulseAmp: number;
  opacity: number;
  strokeWidth: number;
  color: string;
  breath: SharedValue<number>;
  phase: number;
}

function BreathingCircle({
  cx, cy, baseRadius, pulseAmp, opacity, strokeWidth, color, breath, phase,
}: BreathingCircleProps) {
  const r = useDerivedValue(() => {
    const t = breath.value;
    // Offset phase so rings don't all pulse together
    const shifted = (t + phase) % 1;
    const pulse = Math.sin(shifted * Math.PI);
    return baseRadius + pulse * pulseAmp;
  });

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={r}
      style="stroke"
      strokeWidth={strokeWidth}
      color={color}
      opacity={opacity}
    />
  );
}

export default SkiaBreathingRing;
