import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  RadialGradient,
  BlurMask,
  Group,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const SIZE = 160;
const CENTER = SIZE / 2;

const GOLD = '#D4B872';
const AMETHYST = '#9D76C1';

const LiquidCheckInHub = memo(function LiquidCheckInHub() {
  const breathe = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathe]);

  const outerR = useDerivedValue(() => 68 + breathe.value * 8);
  const coreR = useDerivedValue(() => 38 + breathe.value * 4);
  const innerR = useDerivedValue(() => 16 + breathe.value * 2);
  const outerOpacity = useDerivedValue(() => 0.15 + breathe.value * 0.1);
  const coreOpacity = useDerivedValue(() => 0.55 + breathe.value * 0.15);

  return (
    <View style={styles.wrapper}>
      <Canvas style={styles.canvas}>
        {/* Atmospheric glow */}
        <Group opacity={outerOpacity}>
          <Circle cx={CENTER} cy={CENTER} r={outerR}>
            <RadialGradient
              c={vec(CENTER, CENTER)}
              r={outerR}
              colors={[AMETHYST + '50', GOLD + '18', 'transparent']}
            />
            <BlurMask blur={24} style="normal" />
          </Circle>
        </Group>

        {/* Core orb */}
        <Group opacity={coreOpacity}>
          <Circle cx={CENTER} cy={CENTER} r={coreR}>
            <RadialGradient
              c={vec(CENTER, CENTER)}
              r={coreR}
              colors={[GOLD, AMETHYST + 'AA', 'transparent']}
            />
            <BlurMask blur={8} style="normal" />
          </Circle>
        </Group>

        {/* Inner hot-spot */}
        <Circle cx={CENTER} cy={CENTER} r={innerR} color="rgba(255,255,255,0.35)">
          <BlurMask blur={6} style="normal" />
        </Circle>
      </Canvas>
    </View>
  );
});

export { LiquidCheckInHub };

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
  },
  canvas: {
    flex: 1,
  },
});
