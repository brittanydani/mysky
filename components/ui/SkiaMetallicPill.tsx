import React, { memo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { metallicFillColors, metallicFillPositions } from '../../constants/mySkyMetallic';

const PILL_HEIGHT = 56;
const PILL_RADIUS = 999;

// Rich diagonal metallic sweep matching the golden fill gradient system
const pillGradientColors = [...metallicFillColors] as [string, string, ...string[]];
const pillGradientPositions = [...metallicFillPositions] as [number, number, ...number[]];

interface Props {
  /** Button label */
  label: string;
  /** Press handler */
  onPress: () => void;
  /** Optional: replace default height */
  height?: number;
  /** Optional: replace default border-radius */
  borderRadius?: number;
  /** Show a disabled/loading state */
  disabled?: boolean;
  /** Icon element to render after label */
  icon?: React.ReactNode;
  /** Override label style */
  labelStyle?: any;
  /** Override container style */
  style?: any;
  /** Override gradient colors */
  gradientColors?: [string, string, ...string[]];
  /** Render as a plain solid color with no gradient or highlight overlays */
  solidColor?: string;
}

function SkiaMetallicPill({
  label,
  onPress,
  height = PILL_HEIGHT,
  borderRadius = PILL_RADIUS,
  disabled = false,
  icon,
  labelStyle,
  style,
  gradientColors,
  solidColor,
}: Props) {
  const r = Math.min(borderRadius, height / 2);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.outer,
        { height, borderRadius: r, opacity: (disabled && !solidColor) ? 0.5 : 1 },        solidColor && { borderTopWidth: 0, borderBottomWidth: 0 },        pressed && styles.pressed,
        style,
      ]}
    >
      {!solidColor && (
        <LinearGradient
          colors={gradientColors ?? pillGradientColors}
          locations={gradientColors ? undefined : pillGradientPositions}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: r }]}
          pointerEvents="none"
        />
      )}
      {solidColor && (
        <View style={[StyleSheet.absoluteFillObject, { borderRadius: r, backgroundColor: solidColor }]} pointerEvents="none" />
      )}

      {/* Inner highlight for polished metal effect */}
      {!solidColor && <View style={[styles.innerHighlight, { borderRadius: r }]} />}

      {/* Label + icon sit above the canvas */}
      <View style={styles.content} pointerEvents="none">
        {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
        {icon}
      </View>
    </Pressable>
  );
}

export default memo(SkiaMetallicPill);

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    position: 'relative',
    borderTopWidth: 2,
    borderTopColor: 'rgba(254, 249, 207, 0.35)', // #FEF9CF at 35%
    borderBottomWidth: 1,
    borderBottomColor: '#5C380A',
    overflow: 'hidden',
  },
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    pointerEvents: 'none',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  label: {
    color: '#020817',
    fontSize: 18,
    fontWeight: '700',
  },
});
