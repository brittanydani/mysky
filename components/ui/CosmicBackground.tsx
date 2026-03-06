import React, { memo, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient as SkiaLinearGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
} from 'react-native-reanimated';
import { MYSTIC } from '../../constants/theme';

const { width: W, height: H } = Dimensions.get('window');

// ── Star field: ~50 total stars, ~10 twinkle ──────
const STATIC_COUNT = 40;
const TWINKLE_COUNT = 10;

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
}

interface TwinkleStar extends Star {
  phase: number;
  speed: number;
}

function makeStaticStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STATIC_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.4 + Math.random() * 1.0,
      baseAlpha: 0.25 + Math.random() * 0.55,
    });
  }
  return stars;
}

function makeTwinkleStars(): TwinkleStar[] {
  const stars: TwinkleStar[] = [];
  for (let i = 0; i < TWINKLE_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.6 + Math.random() * 1.2,
      baseAlpha: 0.5 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.2,
    });
  }
  return stars;
}

// Twinkling star — driven by shared value, zero React re-renders
const TwinklingStarComp = memo(({ star, time }: { star: TwinkleStar; time: any }) => {
  const opacity = useDerivedValue(() => {
    const t = time.value / 1000;
    const pulse = 0.55 + 0.45 * Math.sin(t * star.speed + star.phase);
    return star.baseAlpha * pulse;
  });

  return (
    <Circle cx={star.x} cy={star.y} r={star.r} color={MYSTIC.star} opacity={opacity} />
  );
});

function CosmicBackground() {
  const staticStars = useMemo(() => makeStaticStars(), []);
  const twinkleStars = useMemo(() => makeTwinkleStars(), []);

  const time = useSharedValue(0);
  useFrameCallback((frameInfo) => {
    if (frameInfo.timeSinceFirstFrame !== undefined) {
      time.value = frameInfo.timeSinceFirstFrame;
    }
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Dark navy-black gradient base */}
        <Rect x={0} y={0} width={W} height={H}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, H)}
            colors={[MYSTIC.bgTop, MYSTIC.bgBottom]}
          />
        </Rect>

        {/* Static stars — constant brightness */}
        <Group>
          {staticStars.map((s, i) => (
            <Circle
              key={`s-${i}`}
              cx={s.x}
              cy={s.y}
              r={s.r}
              color={MYSTIC.starDim}
              opacity={s.baseAlpha}
            />
          ))}
        </Group>

        {/* Twinkling stars — subtle animated opacity */}
        <Group>
          {twinkleStars.map((s, i) => (
            <TwinklingStarComp key={`t-${i}`} star={s} time={time} />
          ))}
        </Group>

        {/* Soft bottom vignette */}
        <Rect x={0} y={0} width={W} height={H}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, H)}
            colors={['transparent', 'transparent', 'rgba(0,0,0,0.35)']}
            positions={[0, 0.6, 1]}
          />
        </Rect>
      </Canvas>
    </View>
  );
}

export default memo(CosmicBackground);

