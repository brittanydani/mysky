/**
 * SkiaTriadGlow - The high-density interactable Triad Check-In.
 * Users drag the "puck" within a triangle to balance Mood, Energy, and Stress.
 */

import React from 'react';
import { Dimensions, View } from 'react-native';
import {
  Canvas,
  Path,
  Circle,
  Skia,
  BlurMask,
  useSharedValue,
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, runOnJS, useDerivedValue } from 'react-native-reanimated';
import { TriadMetrics } from '../../logic/StabilityEngine';
import { checkAndTriggerResilienceAlert } from '../../services/energy/ResilienceAlertService';

const { width } = Dimensions.get('window');
const TRIAD_SIZE = width * 0.7;
const CENTER = TRIAD_SIZE / 2;
const RADIUS = TRIAD_SIZE * 0.4;

export const SkiaTriadGlow = ({
  onCheckIn,
  activeWindow,
}: {
  onCheckIn: (metrics: TriadMetrics, delta: number, context: string) => void;
  activeWindow: 'Gold' | 'Silver' | 'Indigo';
}) => {
  const puckX = useSharedValue(CENTER);
  const puckY = useSharedValue(CENTER);

  // Points of the triangle
  const ptMood = { x: CENTER, y: CENTER - RADIUS };
  const ptEnergy = { x: CENTER + RADIUS * Math.cos(Math.PI / 6), y: CENTER + RADIUS * Math.sin(Math.PI / 6) };
  const ptStress = { x: CENTER - RADIUS * Math.cos(Math.PI / 6), y: CENTER + RADIUS * Math.sin(Math.PI / 6) };

  const trianglePath = Skia.Path.Make();
  trianglePath.moveTo(ptMood.x, ptMood.y);
  trianglePath.lineTo(ptEnergy.x, ptEnergy.y);
  trianglePath.lineTo(ptStress.x, ptStress.y);
  trianglePath.close();

  const handleRelease = (x: number, y: number) => {
    // Basic barycentric coordinate approximation
    // Here we map the puck position to Mood, Energy, Stress values (0 to 1)
    const totalDist = RADIUS * 2;
    const moodScore = Math.max(0, 1 - Math.hypot(x - ptMood.x, y - ptMood.y) / totalDist);
    const energyScore = Math.max(0, 1 - Math.hypot(x - ptEnergy.x, y - ptEnergy.y) / totalDist);
    const stressScore = Math.max(0, 1 - Math.hypot(x - ptStress.x, y - ptStress.y) / totalDist);

    const metrics = { mood: moodScore, energy: energyScore, stress: stressScore };
    
    checkAndTriggerResilienceAlert(metrics, activeWindow, { x, y }).then(({ delta, context }) => {
      onCheckIn(metrics, delta, context);
    });
  };

  const gesture = Gesture.Pan()
    .onChange((e) => {
      puckX.value = Math.max(0, Math.min(TRIAD_SIZE, e.x));
      puckY.value = Math.max(0, Math.min(TRIAD_SIZE, e.y));
    })
    .onEnd((e) => {
      runOnJS(handleRelease)(e.x, e.y);
    });

  const puckProps = useDerivedValue(() => ({
    cx: puckX.value,
    cy: puckY.value,
  }));

  return (
    <View style={{ width: TRIAD_SIZE, height: TRIAD_SIZE, alignSelf: 'center', marginVertical: 30 }}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={{ flex: 1 }}>
          <Canvas style={{ flex: 1 }}>
            <Path path={trianglePath} style="stroke" strokeWidth={1} color="rgba(255, 255, 255, 0.2)" />
            
            {/* The interaction glow based on position */}
            <Circle cx={puckProps.value.cx} cy={puckProps.value.cy} r={24} color="#D4AF37">
              <BlurMask blur={15} style="normal" />
            </Circle>
            <Circle cx={puckProps.value.cx} cy={puckProps.value.cy} r={10} color="#FFFFFF" />
          </Canvas>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};
