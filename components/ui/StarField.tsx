import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
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
    return {
      id: i,
      x: rand() * w,
      y: rand() * h,
      size: rand() * 2 + 1,
      delay: rand() * 3000,
      duration: rand() * 2000 + 2000,
    };
  });

const AnimatedStar = memo(function AnimatedStar({
  star,
  color,
}: {
  star: Star;
  color: string;
}) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      star.delay,
      withRepeat(
        withTiming(1, { duration: star.duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [opacity, star.delay, star.duration]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

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
