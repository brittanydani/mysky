import React, { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import {
  Canvas,
  Circle,
  Group,
} from "@shopify/react-native-skia";
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const STATIC_STARS = 40;
const TWINKLE_STARS = 10;

export const SkiaDynamicCosmos = () => {
  // Generate static positions once
  const { staticStars, twinklingStars } = useMemo(() => {
    const sStars = Array.from({ length: STATIC_STARS }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 1.0, // Base size up to 2.5
      opacity: Math.random() * 0.4 + 0.6, // Min opacity 0.6 (bright)
    }));

    const tStars = Array.from({ length: TWINKLE_STARS }).map((_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      baseR: Math.random() * 2.0 + 1.5, // Brighter twinkling stars
    }));

    return { staticStars: sStars, twinklingStars: tStars };
  }, []);

  const twinkleProgress = useSharedValue(0.3);

  useEffect(() => {
    twinkleProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {staticStars.map((star, i) => (
            <Circle 
              key={`static-${i}`} 
              cx={star.x} 
              cy={star.y} 
              r={star.r} 
              color={`rgba(255, 255, 255, ${star.opacity})`} 
            />
          ))}
        </Group>

        <Group opacity={twinkleProgress}>
          {twinklingStars.map((star) => (
            <Circle 
              key={`twinkle-${star.id}`} 
              cx={star.x} 
              cy={star.y} 
              r={star.baseR} 
              color="#FDFBF7" 
            />
          ))}
        </Group>
      </Canvas>
    </Animated.View>
  );
};
