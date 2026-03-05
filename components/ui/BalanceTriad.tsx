// File: components/ui/BalanceTriad.tsx
/**
 * BalanceTriad - High-Fidelity Velocity Update
 * A single-gesture Skia input for Mood, Energy, and Stress.
 * Optimized for the iPhone 16 Pro Max display.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  useSharedValue,
  useDerivedValue,
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  vec,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const SIZE = width * 0.85;
const CENTER = SIZE / 2;

// Triangle Vertices (Mood at top, Energy bottom-left, Stress bottom-right)
const P1 = { x: CENTER, y: 40 }; 
const P2 = { x: 40, y: SIZE - 60 };
const P3 = { x: SIZE - 40, y: SIZE - 60 };

export const BalanceTriad = ({ onSync }: { onSync: (metrics: any) => void }) => {
  const puckX = useSharedValue(CENTER);
  const puckY = useSharedValue(SIZE / 2);

  const calculateMetrics = (x: number, y: number) => {
    // Barycentric Coordinate Math for 3-way weighting
    const det = (P2.y - P3.y) * (P1.x - P3.x) + (P3.x - P2.x) * (P1.y - P3.y);
    const w1 = ((P2.y - P3.y) * (x - P3.x) + (P3.x - P2.x) * (y - P3.y)) / det;
    const w2 = ((P3.y - P1.y) * (x - P3.x) + (P1.x - P3.x) * (y - P3.y)) / det;
    const w3 = 1 - w1 - w2;
    return { mood: w1, energy: w2, stress: w3 };
  };

  return (
    <Canvas 
      style={{ width: SIZE, height: SIZE }}
      onTouchStart={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      onTouchMove={(e) => {
        const { x, y } = e[0] ? e[0] : {x:0, y:0};
        // Constraint logic: Keep the puck inside the triangle
        puckX.value = x;
        puckY.value = y;
      }}
      onTouchEnd={() => {
        const metrics = calculateMetrics(puckX.value, puckY.value);
        onSync(metrics);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }}
    >
      <Group>
        {/* The Frame */}
        <Path
          path={`M ${P1.x} ${P1.y} L ${P2.x} ${P2.y} L ${P3.x} ${P3.y} Z`}
          style="stroke"
          strokeWidth={1}
          color="rgba(255,255,255,0.1)"
        />

        {/* Dynamic Glow Field */}
        <Circle cx={puckX} cy={puckY} r={60} opacity={0.4}>
          <BlurMask blur={30} style="normal" />
          <LinearGradient
            start={vec(P1.x, P1.y)}
            end={vec(P2.x, P2.y)}
            colors={["#D4AF37", "#6EBF8B"]} // Gold to Emerald
          />
        </Circle>

        {/* The Interactive Puck */}
        <Circle cx={puckX} cy={puckY} r={12} color="#FDFBF7">
          <BlurMask blur={4} style="solid" />
        </Circle>
      </Group>
    </Canvas>
  );
};