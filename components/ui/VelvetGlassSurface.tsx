import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface VelvetGlassSurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default' | 'prominent' | 'systemUltraThinMaterial';
  backgroundColor?: string;
  borderColor?: string;
  highlightColor?: string;
  innerBorderColor?: string;
  topEdgeColor?: string;
  leftEdgeColor?: string;
  rightEdgeColor?: string;
  bottomEdgeColor?: string;
}

export function VelvetGlassSurface({
  children,
  style,
  intensity = 45,
  tint,
  backgroundColor = 'rgba(255, 255, 255, 0.02)',
  borderColor = 'rgba(255, 255, 255, 0.08)',
  highlightColor = 'rgba(255, 255, 255, 0.03)',
  innerBorderColor = 'rgba(255, 255, 255, 0.03)',
  topEdgeColor = 'rgba(255, 255, 255, 0.15)',
  leftEdgeColor,
  rightEdgeColor,
  bottomEdgeColor,
}: VelvetGlassSurfaceProps) {
  const resolvedTint = tint ?? 'dark';

  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint={resolvedTint} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor }]} />
      <View pointerEvents="none" style={[styles.highlight, { backgroundColor: highlightColor }]} />
      <View
        pointerEvents="none"
        style={[
          styles.directionalBorder,
          {
            borderTopColor: topEdgeColor,
            borderLeftColor: leftEdgeColor ?? borderColor,
            borderRightColor: rightEdgeColor ?? borderColor,
            borderBottomColor: bottomEdgeColor ?? innerBorderColor,
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
  },
  directionalBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
});