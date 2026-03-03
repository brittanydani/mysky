import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number; // slow horizontal drift distance
  driftY: number; // slow vertical drift distance
  driftDuration: number; // drift cycle duration
  layer: number; // parallax layer (0 = far, 1 = mid, 2 = near)
}

/**
 * Seeded PRNG (splitmix32) — deterministic star layout for a given index.
 * Returns a function that yields successive [0,1) values.
 */
function splitmix32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s |= 0;
    s = (s + 0x9e3779b9) | 0;
    let t = s ^ (s >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    t = t ^ (t >>> 15);
    return (t >>> 0) / 4294967296;
  };
}

const generateStars = (count: number, w: number, h: number): Star[] =>
  Array.from({ length: count }, (_, i) => {
    const rand = splitmix32(i * 2654435761); // unique seed per star
    const layer = rand() < 0.5 ? 0 : rand() < 0.75 ? 1 : 2;
    const sizeBase = layer === 0 ? 0.8 : layer === 1 ? 1.2 : 1.8;
    return {
      id: i,
      x: rand() * w,
      y: rand() * h,
      size: rand() * sizeBase + 0.5,
      delay: rand() * 3000,
      duration: rand() * 2000 + 2000,
      driftX: (rand() - 0.5) * (layer === 0 ? 3 : layer === 1 ? 6 : 10),
      driftY: (rand() - 0.5) * (layer === 0 ? 2 : layer === 1 ? 4 : 7),
      driftDuration: rand() * 8000 + 12000 + layer * 4000,
      layer,
    };
  });

const AnimatedStar = memo(function AnimatedStar({
  star,
  color,
}: {
  star: Star;
  color: string;
}) {
  const opacity = useSharedValue(0.2);
  const drift = useSharedValue(0);

  useEffect(() => {
    // Twinkle
    opacity.value = withDelay(
      star.delay,
      withRepeat(
        withTiming(star.layer === 2 ? 1 : star.layer === 1 ? 0.85 : 0.6, {
          duration: star.duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );
    // Slow particle drift
    drift.value = withDelay(
      star.delay * 0.5,
      withRepeat(
        withSequence(
          withTiming(1, { duration: star.driftDuration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: star.driftDuration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [opacity, drift, star.delay, star.duration, star.driftDuration, star.layer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [0, star.driftX]) },
      { translateY: interpolate(drift.value, [0, 1], [0, star.driftY]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          backgroundColor: color,
          // Subtle glow for closer stars
          ...(star.layer === 2 && {
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 3,
          }),
        },
        animatedStyle,
      ]}
    />
  );
});

function StarField({
  starCount = 30,
  color = '#FFFFFF',
}: {
  starCount?: number;
  color?: string;
}) {
  const { width, height } = useWindowDimensions();

  const stars = useMemo(() => generateStars(starCount, width, height), [starCount, width, height]);

  return (
    <View style={styles.container} pointerEvents="none">
      {stars.map((star) => (
        <AnimatedStar key={star.id} star={star} color={color} />
      ))}
    </View>
  );
}

export default memo(StarField);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
  },
});
