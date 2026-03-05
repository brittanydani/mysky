/**
 * File: components/ui/InternalWeatherLabels.tsx
 * High-end Skia text components that react to the somatic painting.
 * Uses a mix of typography for an obsidian UI feel.
 */

import React from 'react';
import { Dimensions } from 'react-native';
import {
  Canvas,
  Text,
  useFont,
  useDerivedValue,
  SharedValue,
} from '@shopify/react-native-skia';

const { width } = Dimensions.get('window');

interface InternalWeatherLabelsProps {
  atmosphereState: SharedValue<number>; // e.g. 0 to 1 representing Heavy -> Radiant
  intensity: SharedValue<number>; // e.g. 0 to 1
}

export const InternalWeatherLabels = ({ atmosphereState, intensity }: InternalWeatherLabelsProps) => {
  // Replace these paths with actual fonts in your assets directory
  const serifFont = useFont(require('../../assets/fonts/PlayfairDisplay-Regular.ttf'), 24);
  const monoFont = useFont(require('../../assets/fonts/SpaceMono-Regular.ttf'), 12);

  const opacity = useDerivedValue(() => {
    return Math.max(0.2, intensity.value);
  });

  const stateText = useDerivedValue(() => {
    if (atmosphereState.value < 0.25) return "HEAVY";
    if (atmosphereState.value < 0.5) return "RESTLESS";
    if (atmosphereState.value < 0.75) return "STILL";
    return "RADIANT";
  });

  if (!serifFont || !monoFont) {
    return null; // Await fonts
  }

  return (
    <Canvas style={{ position: 'absolute', top: 120, left: 0, width, height: 100 }}>
      {/* Label category with Monospace styling */}
      <Text
        x={20}
        y={30}
        text="CURRENT ATMOSPHERE:"
        font={monoFont}
        color="#888888" // Subtle grey for the obsidian UI
        opacity={0.8}
      />
      
      {/* Dynamic State Value with bold Serif styling */}
      <Text
        x={20}
        y={65}
        text={stateText}
        font={serifFont}
        color="#D4AF37" // Copper/Gold accent
        opacity={opacity}
      />

      {/* Resilience Intensity label */}
      <Text
        x={width - 140}
        y={30}
        text="INTENSITY"
        font={monoFont}
        color="#888888"
        opacity={0.8}
      />
    </Canvas>
  );
};
