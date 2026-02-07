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

const generateStars = (count: number, w: number, h: number): Star[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 3000,
    duration: Math.random() * 2000 + 2000,
  }));

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
