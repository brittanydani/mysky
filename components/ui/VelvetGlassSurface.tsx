import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';

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
  backgroundColor,
  borderColor,
  highlightColor,
  innerBorderColor,
  topEdgeColor,
  leftEdgeColor,
  rightEdgeColor,
  bottomEdgeColor,
}: VelvetGlassSurfaceProps) {
  const theme = useAppTheme();
  const resolvedTint = tint ?? theme.blurTint;
  const resolvedBackgroundColor = backgroundColor ?? (theme.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.5)');
  const resolvedBorderColor = borderColor ?? (theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)');
  const resolvedHighlightColor = highlightColor ?? (theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.6)');
  const resolvedInnerBorderColor = innerBorderColor ?? (theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)');
  const resolvedTopEdgeColor = topEdgeColor ?? (theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)');

  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint={resolvedTint} style={StyleSheet.absoluteFillObject} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: resolvedBackgroundColor }]} />
      <LinearGradient
        pointerEvents="none"
        colors={[resolvedHighlightColor, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        pointerEvents="none"
        style={[
          styles.directionalBorder,
          {
            borderTopColor: resolvedTopEdgeColor,
            borderLeftColor: leftEdgeColor ?? resolvedBorderColor,
            borderRightColor: rightEdgeColor ?? resolvedBorderColor,
            borderBottomColor: bottomEdgeColor ?? resolvedInnerBorderColor,
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

  directionalBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
});