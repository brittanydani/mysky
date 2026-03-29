import React, { forwardRef, useImperativeHandle, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  useAnimatedStyle,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

export interface StarNotificationRef {
  show: (message: string) => void;
}

const NUM_PARTICLES = 12;

const SkiaFallingStarNotification = forwardRef<StarNotificationRef>((_, ref) => {
  const { width } = useWindowDimensions();
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-60);
  const starProgress = useSharedValue(0);

  const particles = useMemo(
    () =>
      Array.from({ length: NUM_PARTICLES }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * 80,
        r: Math.random() * 1.5 + 0.8,
      })),
    [width],
  );

  const hide = useCallback(() => setVisible(false), []);

  useImperativeHandle(ref, () => ({
    show(text: string) {
      setMessage(text);
      setVisible(true);
      translateY.value = -60;
      opacity.value = 0;
      starProgress.value = 0;

      translateY.value = withSequence(
        withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withDelay(2200, withTiming(-60, { duration: 350, easing: Easing.in(Easing.cubic) })),
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 400 }),
        withDelay(2200, withTiming(0, { duration: 350 })),
      );
      starProgress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) });

      // Auto-hide after animation completes
      setTimeout(() => runOnJS(hide)(), 3000);
    },
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      <Canvas style={styles.canvas}>
        <Group opacity={starProgress}>
          {particles.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={p.r} color="rgba(255,255,255,0.7)" />
          ))}
        </Group>
      </Canvas>
      <Animated.View style={[styles.banner, animatedStyle]}>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
});

SkiaFallingStarNotification.displayName = 'SkiaFallingStarNotification';

const styles = StyleSheet.create({
  container: { zIndex: 9999, justifyContent: 'flex-start', alignItems: 'center' },
  canvas: { ...StyleSheet.absoluteFillObject },
  banner: {
    marginTop: 60,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 20, 33, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.25)',
    maxWidth: '90%',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SkiaFallingStarNotification;
