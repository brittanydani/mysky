/**
 * LottieSomaticFigure
 *
 * Human body silhouette rendered via lottie-react-native.
 * 4 variants: female/male × front/back.
 * Zone highlights are Skia radial glows overlaid on top.
 */
import React, { useEffect, memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import {
  Canvas,
  Circle,
  RadialGradient,
  BlurMask,
  vec,
  Group,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

const LOTTIE_SRC = {
  female: {
    front: require('../../assets/body-female-front.json'),
    back:  require('../../assets/body-female-back.json'),
  },
  male: {
    front: require('../../assets/body-male-front.json'),
    back:  require('../../assets/body-male-back.json'),
  },
};

const LOTTIE_RATIO = 480 / 200;

const ZONE_ELLIPSES: Record<string, Record<string, Record<string, { cx: number; cy: number; rx: number; ry: number }>>> = {
  female: {
    front: {
      head:   { cx: 0.5, cy: 0.079, rx: 0.130, ry: 0.058 },
      throat: { cx: 0.5, cy: 0.158, rx: 0.065, ry: 0.038 },
      chest:  { cx: 0.5, cy: 0.292, rx: 0.210, ry: 0.065 },
      arms:   { cx: 0.5, cy: 0.308, rx: 0.420, ry: 0.072 },
      gut:    { cx: 0.5, cy: 0.383, rx: 0.165, ry: 0.048 },
      back:   { cx: 0.5, cy: 0.446, rx: 0.210, ry: 0.052 },
      limbs:  { cx: 0.5, cy: 0.725, rx: 0.240, ry: 0.200 },
    },
    back: {
      head:   { cx: 0.5, cy: 0.079, rx: 0.130, ry: 0.058 },
      throat: { cx: 0.5, cy: 0.158, rx: 0.060, ry: 0.036 },
      chest:  { cx: 0.5, cy: 0.288, rx: 0.200, ry: 0.062 },
      arms:   { cx: 0.5, cy: 0.305, rx: 0.410, ry: 0.070 },
      back:   { cx: 0.5, cy: 0.416, rx: 0.200, ry: 0.076 },
      limbs:  { cx: 0.5, cy: 0.725, rx: 0.230, ry: 0.196 },
    },
  },
  male: {
    front: {
      head:   { cx: 0.5, cy: 0.079, rx: 0.140, ry: 0.062 },
      throat: { cx: 0.5, cy: 0.158, rx: 0.075, ry: 0.040 },
      chest:  { cx: 0.5, cy: 0.296, rx: 0.240, ry: 0.070 },
      arms:   { cx: 0.5, cy: 0.312, rx: 0.440, ry: 0.076 },
      gut:    { cx: 0.5, cy: 0.388, rx: 0.185, ry: 0.052 },
      back:   { cx: 0.5, cy: 0.450, rx: 0.215, ry: 0.052 },
      limbs:  { cx: 0.5, cy: 0.728, rx: 0.240, ry: 0.196 },
    },
    back: {
      head:   { cx: 0.5, cy: 0.079, rx: 0.140, ry: 0.062 },
      throat: { cx: 0.5, cy: 0.158, rx: 0.070, ry: 0.038 },
      chest:  { cx: 0.5, cy: 0.292, rx: 0.230, ry: 0.068 },
      arms:   { cx: 0.5, cy: 0.308, rx: 0.430, ry: 0.074 },
      back:   { cx: 0.5, cy: 0.420, rx: 0.210, ry: 0.080 },
      limbs:  { cx: 0.5, cy: 0.728, rx: 0.232, ry: 0.196 },
    },
  },
};

export interface LottieSomaticFigureProps {
  width?: number;
  side?: 'front' | 'back';
  gender?: 'female' | 'male';
  selectedZone?: string | null;
  activeColor?: string;
  onZonePress?: (zoneId: string) => void;
  zones: { id: string; frontLabel: string; backLabel: string }[];
}

const LottieSomaticFigure = memo(function LottieSomaticFigure({
  width = 180,
  side = 'front',
  gender = 'female',
  selectedZone = null,
  activeColor = '#A2C2E1',
  onZonePress,
}: LottieSomaticFigureProps) {
  const height = Math.round(width * LOTTIE_RATIO);
  const zoneMap = ZONE_ELLIPSES[gender][side];

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = 0;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [selectedZone]);

  const glowR = useDerivedValue(() => {
    if (!selectedZone || !zoneMap[selectedZone]) return 0;
    const z = zoneMap[selectedZone];
    return Math.max(z.rx * width, z.ry * height) * (1.15 + pulse.value * 0.3);
  });

  return (
    <View style={{ width, height }}>
      <LottieView
        source={LOTTIE_SRC[gender][side]}
        autoPlay
        loop
        speed={0.2}
        style={{ width, height }}
        resizeMode="contain"
      />

      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {selectedZone && zoneMap[selectedZone] && (() => {
          const z = zoneMap[selectedZone];
          const cx = z.cx * width;
          const cy = z.cy * height;
          const ringR = Math.max(z.rx * width, z.ry * height) * 0.9;
          return (
            <Group>
              <Circle cx={cx} cy={cy} r={glowR}>
                <RadialGradient
                  c={vec(cx, cy)}
                  r={glowR}
                  colors={[`${activeColor}70`, `${activeColor}28`, `${activeColor}00`]}
                />
                <BlurMask blur={16} style="normal" />
              </Circle>
              <Circle cx={cx} cy={cy} r={ringR}
                color={`${activeColor}80`} style="stroke" strokeWidth={1.5} />
            </Group>
          );
        })()}

        {Object.entries(zoneMap).map(([zoneId, z]) => {
          if (zoneId === selectedZone) return null;
          return (
            <Circle key={zoneId}
              cx={z.cx * width} cy={z.cy * height}
              r={2.5} color="rgba(255,255,255,0.28)" />
          );
        })}
      </Canvas>

      {Object.entries(zoneMap).map(([zoneId, z]) => {
        const cx = z.cx * width;
        const cy = z.cy * height;
        const rx = z.rx * width;
        const ry = z.ry * height;
        return (
          <Pressable
            key={zoneId}
            onPress={() => onZonePress?.(zoneId)}
            style={{
              position: 'absolute',
              left: cx - rx, top: cy - ry,
              width: rx * 2, height: ry * 2,
              borderRadius: rx,
            }}
            hitSlop={8}
          />
        );
      })}
    </View>
  );
});

export default LottieSomaticFigure;
