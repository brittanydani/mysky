// File: components/ui/SkiaFrequencyOrb.tsx
/**
 * SkiaFrequencyOrb — "The Vital Frequency"
 *
 * A breathing radial gradient orb. Scale pulses 0.95 → 1.05 every 4 seconds
 * mimicking a resting human breath cycle.
 *
 * Chakra color logic:
 *   Heart  (Aligned & mood ≥ 6)        → green  #4CAF50 / #1B5E20
 *   Sacral (Turbulent or Recovering)   → amber  #FFA500 / #CC5500
 *   Root   (Depleted / other)           → red    #E04040 / #7B1818
 *
 * Tap → navigates via onPress prop (Energy Architecture screen).
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const ORB_SIZE = 72;
const CX = ORB_SIZE / 2;
const CY = ORB_SIZE / 2;
const BASE_RADIUS = 22;

// ── Chakra color gate ─────────────────────────────────────────────────────

function getOrbPalette(stabilityLabel: string, mood: number): [string, string] {
  if (stabilityLabel === 'Aligned' && mood >= 6) return ['#4CAF50', '#1B5E20'];  // Heart
  if (stabilityLabel === 'Turbulent' || stabilityLabel === 'Recovering') return ['#FFA500', '#CC5500']; // Sacral
  return ['#E04040', '#7B1818'];  // Root
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  stabilityLabel: string;
  mood: number;
  /** Called when user taps the orb (navigate to Energy Architecture) */
  onPress?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SkiaFrequencyOrb({ stabilityLabel, mood, onPress }: Props) {
  // 4-second breath cycle: scale 0.95 → 1.05 (inhale) → 0.95 (exhale)
  const breathe = useSharedValue(0.95);

  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1.05, {
        duration: 2000, // 2s inhale, then 2s exhale (reverse=true) = 4s cycle
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [breathe]);

  // Group transform — scale orb from its centre
  const orbTransform = useDerivedValue(() => [
    { scale: breathe.value },
  ]);

  const glowOpacity = useDerivedValue(() => {
    'worklet';
    return 0.15 + (breathe.value - 0.95) * 2.5;
  });

  const [innerColor, outerColor] = getOrbPalette(stabilityLabel, mood);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Frequency Orb — open Energy Architecture"
    >
      <Canvas style={{ width: ORB_SIZE, height: ORB_SIZE }}>
        {/* Outer glow pulses with scale */}
        <Group opacity={glowOpacity}>
          <Circle cx={CX} cy={CY} r={BASE_RADIUS * 1.9} color={innerColor}>
            <BlurMask blur={16} style="normal" />
          </Circle>
        </Group>

        {/* Core orb — scale breathes 0.95→1.05 */}
        <Group
          origin={vec(CX, CY)}
          transform={orbTransform}
        >
          <Circle cx={CX} cy={CY} r={BASE_RADIUS}>
            <RadialGradient
              c={vec(CX, CY)}
              r={BASE_RADIUS * 1.5}
              colors={[innerColor, outerColor]}
            />
            <BlurMask blur={2.5} style="normal" />
          </Circle>
          {/* Catch-light specular */}
          <Circle
            cx={CX - BASE_RADIUS * 0.28}
            cy={CY - BASE_RADIUS * 0.3}
            r={BASE_RADIUS * 0.22}
            color="rgba(255,255,255,0.28)"
          />
        </Group>
      </Canvas>
    </Pressable>
  );
}

/**
 * SkiaFrequencyOrb — "The Vital Frequency"
 *
 * A breathing radial gradient orb positioned in the screen header.
 * Its color is determined by the user's current stability + mood state:
 *
 *   Heart   (Aligned & mood ≥ 6)  → green  #4CAF50 / #1B5E20
 *   Sacral  (Tense / Recovering)  → amber  #FFA500 / #CC5500
 *   Root    (Dysregulated)        → red    #E04040 / #7B1818
 *
 * The breathing animation uses withRepeat(withTiming(1.2, 2000), -1, true)
 * on the circle radius — the standard "living pulse" pattern.
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { useEffect } from 'react';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const ORB_SIZE = 72;
const CX = ORB_SIZE / 2;
const CY = ORB_SIZE / 2;
const BASE_RADIUS = 22;

// ── Stability → chakra color gate ──────────────────────────────────────────

function getOrbPalette(stabilityLabel: string, mood: number): [string, string] {
  if (stabilityLabel === 'Aligned' && mood >= 6) {
    return ['#4CAF50', '#1B5E20']; // Heart — verdant, high coherence
  }
  if (stabilityLabel === 'Turbulent' || stabilityLabel === 'Recovering') {
    return ['#FFA500', '#CC5500']; // Sacral — amber, activation needed
  }
  return ['#E04040', '#7B1818'];   // Root — ground yourself first
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  stabilityLabel: string;
  mood: number;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function SkiaFrequencyOrb({ stabilityLabel, mood }: Props) {
  const breathe = useSharedValue(1.0);

  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true, // reverse — smooth inhale/exhale
    );
  }, [breathe]);

  const coreRadius = useDerivedValue(() => {
    'worklet';
    return BASE_RADIUS * breathe.value;
  });

  const glowRadius = useDerivedValue(() => {
    'worklet';
    return BASE_RADIUS * breathe.value * 1.7;
  });

  const glowOpacity = useDerivedValue(() => {
    'worklet';
    return 0.18 + (breathe.value - 1.0) * 0.25;
  });

  const [innerColor, outerColor] = getOrbPalette(stabilityLabel, mood);

  return (
    <Canvas style={{ width: ORB_SIZE, height: ORB_SIZE }}>
      {/* Outer diffuse glow ring */}
      <Group opacity={glowOpacity}>
        <Circle cx={CX} cy={CY} r={glowRadius} color={innerColor}>
          <BlurMask blur={14} style="normal" />
        </Circle>
      </Group>

      {/* Core orb with radial gradient */}
      <Circle cx={CX} cy={CY} r={coreRadius}>
        <RadialGradient
          c={vec(CX, CY)}
          r={BASE_RADIUS * 1.5}
          colors={[innerColor, outerColor]}
        />
        <BlurMask blur={2.5} style="normal" />
      </Circle>

      {/* Catch-light — small bright specular spot */}
      <Circle
        cx={CX - BASE_RADIUS * 0.28}
        cy={CY - BASE_RADIUS * 0.3}
        r={BASE_RADIUS * 0.22}
        color="rgba(255,255,255,0.28)"
      />
    </Canvas>
  );
}
