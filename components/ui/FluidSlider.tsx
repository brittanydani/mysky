// components/ui/FluidSlider.tsx
//
// High-precision physical instrument slider.
// Reanimated 3 for physics, Skia for light-emitting track, Expo Haptics
// for haptic notches. The phone clicks at every integer, and the track's
// glow intensifies based on the value.

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  useDerivedValue,
} from 'react-native-reanimated';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  vec,
  Shadow,
  BlurMask,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';

// ── Types & Constants ─────────────────────────────────────────────────────────

export interface FluidSliderProps {
  question: string;
  value: number; // 1 to 9
  onChange: (val: number) => void;
  color: string;
  anchors: [string, string, string]; // [Low, Mid, High]
  min?: number;
  max?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_MARGIN = 40;
const TRACK_WIDTH = SCREEN_WIDTH - SLIDER_MARGIN * 2;
const TRACK_HEIGHT = 12;
const THUMB_SIZE = 32;

// ── Component ─────────────────────────────────────────────────────────────────

export default function FluidSlider({
  question,
  value,
  onChange,
  color,
  anchors,
  min = 1,
  max = 9,
}: FluidSliderProps) {

  // Physics values
  const isPressed = useSharedValue(false);
  const lastSnap = useSharedValue(value);

  // Calculate initial position based on value
  const x = useSharedValue(((value - min) / (max - min)) * TRACK_WIDTH);

  // Trigger haptic and state update on the JS thread
  const onPointReached = useCallback((val: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(val);
  }, [onChange]);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      isPressed.value = true;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onChange((event) => {
      // Move the thumb with clamping
      const newX = Math.min(Math.max(0, event.x), TRACK_WIDTH);
      x.value = newX;

      // Calculate current integer value
      const currentVal = Math.round(interpolate(newX, [0, TRACK_WIDTH], [min, max]));

      // If we hit a new integer "notch", click!
      if (currentVal !== lastSnap.value) {
        lastSnap.value = currentVal;
        runOnJS(onPointReached)(currentVal);
      }
    })
    .onFinalize(() => {
      isPressed.value = false;
      // Spring to the nearest integer position for that "mechanical snap"
      const finalX = ((lastSnap.value - min) / (max - min)) * TRACK_WIDTH;
      x.value = withSpring(finalX, { damping: 15, stiffness: 120 });
    });

  // ── Animated Styles ────────────────────────────────────────────────────────

  const thumbStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [{ translateX: x.value - THUMB_SIZE / 2 }],
    backgroundColor: isPressed.value ? '#FFFFFF' : color,
    shadowOpacity: withSpring(isPressed.value ? 0.6 : 0.3),
  }));

  const thumbScaleStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [{ scale: withSpring(isPressed.value ? 1.3 : 1) }],
  }));

  // Skia: The progress fill of the track
  const fillWidth = useDerivedValue(() => x.value);

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>

      <GestureDetector gesture={gesture}>
        <View style={styles.sliderWrapper}>

          {/* SKIA LAYER: The Track and Glow */}
          <Canvas style={styles.canvas}>
            {/* Background Track */}
            <RoundedRect x={0} y={0} width={TRACK_WIDTH} height={TRACK_HEIGHT} r={6} color="rgba(255,255,255,0.05)" />

            {/* Active Glow Fill */}
            <RoundedRect x={0} y={0} width={fillWidth} height={TRACK_HEIGHT} r={6}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(TRACK_WIDTH, 0)}
                colors={['rgba(255,255,255,0.1)', color]}
              />
              <Shadow dx={0} dy={0} blur={6} color={color} />
            </RoundedRect>
          </Canvas>

          {/* PHYSICAL THUMB */}
          <Animated.View style={[styles.thumb, thumbStyle, thumbScaleStyle, { shadowColor: color }]} />
        </View>
      </GestureDetector>

      {/* ANCHOR LABELS */}
      <View style={styles.anchorRow}>
        <Text style={styles.anchorText}>{anchors[0]}</Text>
        <Text style={styles.anchorText}>{anchors[1]}</Text>
        <Text style={styles.anchorText}>{anchors[2]}</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    width: '100%',
  },
  question: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  sliderWrapper: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  canvas: {
    height: TRACK_HEIGHT,
    width: TRACK_WIDTH,
    borderRadius: 6,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.25,
    elevation: 5,
  },
  anchorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 2,
  },
  anchorText: {
    color: 'rgba(255,255,255,0.30)',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
