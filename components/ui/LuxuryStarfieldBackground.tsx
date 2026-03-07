// File: components/ui/LuxuryStarfieldBackground.tsx

import React, { memo, useMemo } from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
} from 'react-native-reanimated';
import { luxuryTheme } from '../../constants/luxuryTheme';

type StarPoint = {
  x: number;
  y: number;
  r: number;
  opacity: number;
  twinkle: boolean;
  twinklePhase: number;
  twinkleSpeed: number;
};

type LuxuryStarfieldBackgroundProps = {
  children?: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  starCount?: number;
  twinkleCount?: number;
  topColor?: string;
  bottomColor?: string;
  showNebulaGlow?: boolean;
  softenCenter?: boolean;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
};

const DEFAULT_STAR_COUNT = 50;
const DEFAULT_TWINKLE_COUNT = 10;

// Stable seeded random so stars don't jump around on every render.
function mulberry32(seed: number) {
  let t = seed;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStars(
  width: number,
  height: number,
  starCount: number,
  twinkleCount: number,
  seed = 90210,
): StarPoint[] {
  const rand = mulberry32(seed);
  const stars: StarPoint[] = [];

  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);

  for (let i = 0; i < starCount; i += 1) {
    const edgePaddingX = safeWidth * 0.05;
    const edgePaddingY = safeHeight * 0.04;

    // Bias slightly upward so the top half feels a bit more celestial/premium.
    const yBias = Math.pow(rand(), 0.84);

    const x = edgePaddingX + rand() * (safeWidth - edgePaddingX * 2);
    const y = edgePaddingY + yBias * (safeHeight - edgePaddingY * 2);

    // Small elegant stars. A few can be slightly brighter/larger.
    const sizeRoll = rand();
    let r = 0.9 + rand() * 1.15;
    if (sizeRoll > 0.88) r = 1.85 + rand() * 0.55;
    if (sizeRoll > 0.96) r = 2.35 + rand() * 0.45;

    const opacityBase = 0.58 + rand() * 0.34;
    stars.push({
      x,
      y,
      r,
      opacity: opacityBase,
      twinkle: false,
      twinklePhase: rand() * Math.PI * 2,
      twinkleSpeed: 0.65 + rand() * 0.9,
    });
  }

  // Mark a subset as twinkling — pick the brightest/largest ones.
  const ranked = [...stars]
    .map((star, index) => ({
      index,
      score: star.opacity * 0.8 + star.r * 0.35 + rand() * 0.12,
    }))
    .sort((a, b) => b.score - a.score);

  const chosen = ranked.slice(0, Math.min(twinkleCount, stars.length));
  for (const item of chosen) {
    stars[item.index].twinkle = true;
  }

  return stars;
}

// Twinkling star — Reanimated shared value, zero React re-renders.
const TwinklingStar = memo(
  ({ star, time }: { star: StarPoint; time: { value: number } }) => {
    const opacity = useDerivedValue(() => {
      const t = time.value / 1000;
      const pulse =
        0.5 + 0.5 * Math.sin(t * star.twinkleSpeed * 2.2 + star.twinklePhase);
      const flicker =
        0.5 +
        0.5 *
          Math.sin(
            t * star.twinkleSpeed * 6.3 + star.twinklePhase * 1.7,
          );
      const intensity = 0.52 + pulse * 0.28 + flicker * 0.12;
      return Math.max(0.32, Math.min(1, intensity * star.opacity));
    });

    const glowOpacity = useDerivedValue(() => {
      const t = time.value / 1000;
      const pulse =
        0.5 + 0.5 * Math.sin(t * star.twinkleSpeed * 2.2 + star.twinklePhase);
      return Math.max(0.06, Math.min(0.28, 0.08 + pulse * 0.18));
    });

    return (
      <Group>
        <Circle
          cx={star.x}
          cy={star.y}
          r={star.r * 2.5}
          color="rgba(255,255,255,0.10)"
        />
        <Circle
          cx={star.x}
          cy={star.y}
          r={star.r * 1.8}
          opacity={glowOpacity}
          color="white"
        />
        <Circle
          cx={star.x}
          cy={star.y}
          r={star.r}
          opacity={opacity}
          color={luxuryTheme.stars.bright}
        />
      </Group>
    );
  },
);

function StaticStar({ star }: { star: StarPoint }) {
  return (
    <Group>
      {star.r > 1.9 ? (
        <Circle
          cx={star.x}
          cy={star.y}
          r={star.r * 1.9}
          color={`rgba(255,255,255,${Math.min(star.opacity * 0.14, 0.16)})`}
        />
      ) : null}
      <Circle
        cx={star.x}
        cy={star.y}
        r={star.r}
        color={`rgba(255,255,255,${star.opacity})`}
      />
    </Group>
  );
}

function LuxuryStarfieldBackground({
  children,
  style,
  contentContainerStyle,
  starCount = DEFAULT_STAR_COUNT,
  twinkleCount = DEFAULT_TWINKLE_COUNT,
  topColor = luxuryTheme.background.top,
  bottomColor = luxuryTheme.background.bottom,
  showNebulaGlow = true,
  softenCenter = true,
  pointerEvents = 'box-none',
}: LuxuryStarfieldBackgroundProps) {
  const { width, height } = useWindowDimensions();

  // Reanimated v2 clock — identical pattern to existing CosmicBackground.
  const time = useSharedValue(0);
  useFrameCallback((frameInfo) => {
    if (frameInfo.timeSinceFirstFrame !== undefined) {
      time.value = frameInfo.timeSinceFirstFrame;
    }
  });

  const stars = useMemo(
    () => buildStars(width, height, starCount, twinkleCount),
    [width, height, starCount, twinkleCount],
  );

  const staticStars = useMemo(() => stars.filter((s) => !s.twinkle), [stars]);
  const twinklingStars = useMemo(() => stars.filter((s) => s.twinkle), [stars]);

  return (
    <View style={[styles.container, style]} pointerEvents={pointerEvents}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Base deep luxury gradient */}
        <RoundedRect x={0} y={0} width={width} height={height} r={0}>
          <LinearGradient
            start={vec(width * 0.5, 0)}
            end={vec(width * 0.5, height)}
            colors={[topColor, bottomColor]}
            positions={[0, 1]}
          />
        </RoundedRect>

        {/* Very subtle navy variation / depth */}
        <RoundedRect x={0} y={0} width={width} height={height} r={0}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, height)}
            colors={[
              'rgba(10,20,40,0.18)',
              'rgba(3,10,24,0.00)',
              'rgba(0,0,0,0.18)',
            ]}
            positions={[0, 0.5, 1]}
          />
        </RoundedRect>

        {/* Optional faint center softness */}
        {softenCenter ? (
          <Circle
            cx={width * 0.52}
            cy={height * 0.34}
            r={Math.max(width, height) * 0.42}
            color="rgba(255,255,255,0.018)"
          />
        ) : null}

        {/* Optional champagne-toned nebula glow — extremely subtle */}
        {showNebulaGlow ? (
          <>
            <Circle
              cx={width * 0.18}
              cy={height * 0.12}
              r={Math.max(width, height) * 0.14}
              color="rgba(247,231,194,0.028)"
            />
            <Circle
              cx={width * 0.82}
              cy={height * 0.22}
              r={Math.max(width, height) * 0.11}
              color="rgba(255,248,220,0.018)"
            />
            <Circle
              cx={width * 0.72}
              cy={height * 0.72}
              r={Math.max(width, height) * 0.12}
              color="rgba(255,255,255,0.010)"
            />
          </>
        ) : null}

        {/* Static stars */}
        <Group>
          {staticStars.map((star, index) => (
            <StaticStar key={`static-${index}`} star={star} />
          ))}
        </Group>

        {/* Twinkling stars */}
        <Group>
          {twinklingStars.map((star, index) => (
            <TwinklingStar key={`twinkle-${index}`} star={star} time={time} />
          ))}
        </Group>
      </Canvas>

      <View style={[styles.content, contentContainerStyle]}>{children}</View>
    </View>
  );
}

export default memo(LuxuryStarfieldBackground);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: luxuryTheme.background.top,
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
});
