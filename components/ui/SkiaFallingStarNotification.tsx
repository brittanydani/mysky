// File: components/ui/SkiaFallingStarNotification.tsx
/**
 * SkiaFallingStarNotification
 * A cinematic in-app notification system.
 * Renders a high-speed "Falling Star" that streaks across the UI
 * using Skia's DiscretePathEffect for tail shimmer and LinearGradient
 * for the motion-blur head.
 *
 * Haptic feedback fires at the moment of "impact."
 */

import React, { useImperativeHandle, forwardRef, useState, useMemo, useCallback } from 'react';
import { StyleSheet, Dimensions, Text, View, Platform } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  BlurMask,
  Group,
  LinearGradient,
  vec,
  DiscretePathEffect,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// ── Public handle ──────────────────────────────────────────────────────────────
export interface StarNotificationRef {
  show: (message: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
const SkiaFallingStarNotification = forwardRef<StarNotificationRef>((_, ref) => {
  const [message, setMessage] = useState<string | null>(null);

  // Shared values driven by Reanimated on the UI thread
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Random start / end coordinates refreshed on each ignite
  const [coords, setCoords] = useState({ x1: 0, y1: 0, x2: width, y2: 200 });

  // ── Haptic "impact" helper (runs on JS thread) ──
  const fireHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  // ── clearMessage helper (runs on JS thread) ──
  const clearMessage = useCallback(() => setMessage(null), []);

  // ── Imperative API ──
  useImperativeHandle(ref, () => ({
    show: (msg: string) => {
      // Randomise origin corner
      const isLeft = Math.random() > 0.5;
      setCoords({
        x1: isLeft ? -50 : width + 50,
        y1: Math.random() * 100,
        x2: isLeft ? width * 0.7 : width * 0.3,
        y2: height * 0.4,
      });

      setMessage(msg);
      opacity.value = withTiming(1, { duration: 200 });
      progress.value = 0;

      // The "Streak" animation
      progress.value = withTiming(
        1,
        { duration: 1200, easing: Easing.out(Easing.quad) },
        (finished) => {
          if (finished) {
            // Haptic at impact point
            runOnJS(fireHaptic)();

            // Hold briefly, then fade out
            opacity.value = withTiming(0, { duration: 1500 }, (done) => {
              if (done) {
                runOnJS(clearMessage)();
              }
            });
          }
        },
      );
    },
  }));

  // ── Streak path (rebuilt when coords change) ──
  const streakPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(coords.x1, coords.y1);
    p.lineTo(coords.x2, coords.y2);
    return p;
  }, [coords]);

  // ── Derived value for the "head" start clamp ──
  const headStart = useDerivedValue(() => Math.max(0, progress.value - 0.15));

  // Nothing to render while idle
  if (!message) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ── Skia Canvas (GPU-rendered streak) ── */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Group opacity={opacity}>
          {/* 1. Tail Shimmer — thin, shimmering trail with discrete noise */}
          <Path
            path={streakPath}
            style="stroke"
            strokeWidth={1}
            color="rgba(255, 244, 212, 0.4)"
            start={0}
            end={progress}
          >
            <BlurMask blur={2} style="normal" />
            <DiscretePathEffect length={10} deviation={2} />
          </Path>

          {/* 2. High-Speed Head — bright gradient tip with outer glow */}
          <Path
            path={streakPath}
            style="stroke"
            strokeWidth={3}
            start={headStart}
            end={progress}
          >
            <LinearGradient
              start={vec(coords.x1, coords.y1)}
              end={vec(coords.x2, coords.y2)}
              colors={['transparent', '#C5B493', '#FDFBF7']}
            />
            <BlurMask blur={8} style="outer" />
          </Path>
        </Group>
      </Canvas>

      {/* 3. Message floating near the impact point */}
      <Animated.View
        entering={FadeIn.delay(400).duration(500)}
        exiting={FadeOut.duration(600)}
        style={[
          styles.messageContainer,
          {
            top: coords.y2 + 20,
            alignSelf: coords.x2 > width / 2 ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <Text style={styles.messageText}>{message}</Text>
        <View style={styles.messageUnderline} />
      </Animated.View>
    </View>
  );
});

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  messageContainer: {
    paddingHorizontal: 30,
    maxWidth: width * 0.7,
  },
  messageText: {
    color: '#FDFBF7',
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontStyle: 'italic',
    textShadowColor: 'rgba(197, 180, 147, 0.5)',
    textShadowRadius: 10,
  },
  messageUnderline: {
    height: 1,
    width: 40,
    backgroundColor: '#C5B493',
    marginTop: 8,
    opacity: 0.6,
  },
});

export default SkiaFallingStarNotification;
