import React, { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Canvas, Circle, Fill, Group } from "@shopify/react-native-skia";
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const STATIC_COUNT = 48;
const TWINKLE_COUNT = 15;

export const SkiaDynamicCosmos = ({ fill }: { fill?: string }) => {
  const { staticStars, twinklingStars } = useMemo(() => {
    const sStars = Array.from({ length: STATIC_COUNT }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.6,
      opacity: Math.random() * 0.35 + 0.45,
    }));
    const tStars = Array.from({ length: TWINKLE_COUNT }).map((_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 1.0,
    }));
    return { staticStars: sStars, twinklingStars: tStars };
  }, []);

  // One shared value per twinkling star for independent rhythm
  const t0  = useSharedValue(0.2);
  const t1  = useSharedValue(0.2);
  const t2  = useSharedValue(0.2);
  const t3  = useSharedValue(0.2);
  const t4  = useSharedValue(0.2);
  const t5  = useSharedValue(0.2);
  const t6  = useSharedValue(0.2);
  const t7  = useSharedValue(0.2);
  const t8  = useSharedValue(0.2);
  const t9  = useSharedValue(0.2);
  const t10 = useSharedValue(0.2);
  const t11 = useSharedValue(0.2);
  const t12 = useSharedValue(0.2);
  const t13 = useSharedValue(0.2);
  const t14 = useSharedValue(0.2);
  const twinkleOpacities = [t0, t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12, t13, t14];

  useEffect(() => {
    twinkleOpacities.forEach((sv, i) => {
      sv.value = withDelay(
        i * 350,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1100 + i * 180, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.12, { duration: 1600 + i * 140, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}>
        {fill ? <Fill color={fill} /> : null}
        {/* blendMode="screen" ensures overlapping stars brighten (like real light),
            not muddy — equivalent to ColorFilter.MakeBlend(color, BlendMode.Screen) */}
        <Group blendMode="screen">
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
        {twinklingStars.map((star, i) => (
          <Group key={`twinkle-${star.id}`} opacity={twinkleOpacities[i]} blendMode="screen">
            <Circle cx={star.x} cy={star.y} r={star.r} color="#F0F4FF" />
          </Group>
        ))}
      </Canvas>
    </Animated.View>
  );
};
