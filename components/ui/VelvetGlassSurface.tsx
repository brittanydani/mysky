import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle as RNViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';

interface VelvetGlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<RNViewStyle>;
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
  const resolvedBackgroundColor = backgroundColor ?? (theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.6)');
  const resolvedBorderColor = borderColor ?? (theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)');
  const resolvedHighlightColor = highlightColor ?? (theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.6)');
  const resolvedInnerBorderColor = innerBorderColor ?? (theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)');
  const resolvedTopEdgeColor = topEdgeColor ?? (theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)');

  // Extract border radii from style to apply identically on shadow wrapper and clip wrapper.
  // Shadow must live on an overflow-visible outer view; clipping lives on an inner view.
  const flatStyle = StyleSheet.flatten(style) as RNViewStyle | undefined;
  const borderRadiusStyle: RNViewStyle = {
    borderRadius: flatStyle?.borderRadius,
    borderTopLeftRadius: flatStyle?.borderTopLeftRadius,
    borderTopRightRadius: flatStyle?.borderTopRightRadius,
    borderBottomLeftRadius: flatStyle?.borderBottomLeftRadius,
    borderBottomRightRadius: flatStyle?.borderBottomRightRadius,
  };

  const shadowStyle: RNViewStyle = theme.isDark
    ? {}
    : {
        shadowColor: '#4A3F35',
        shadowOpacity: 0.06,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
      };

  return (
    <View style={[styles.outerContainer, borderRadiusStyle, shadowStyle, style]}>
      <View style={[StyleSheet.absoluteFillObject, styles.clipContainer, borderRadiusStyle]}>
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
              borderLeftColor: leftEdgeColor ?? resolvedTopEdgeColor,
              borderRightColor: rightEdgeColor ?? resolvedBorderColor,
              borderBottomColor: bottomEdgeColor ?? resolvedInnerBorderColor,
            },
          ]}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Outer wrapper — carries shadow & border radii (no overflow clip)
  outerContainer: {},

  // Inner wrapper — clips blur/gradient to border radius
  clipContainer: {
    overflow: 'hidden',
  },

  directionalBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
});