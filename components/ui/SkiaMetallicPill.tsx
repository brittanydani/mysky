import React, { memo, useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, Platform, LayoutChangeEvent } from 'react-native';
import { SkiaMetallicSurface } from './skia/SkiaMetallicSurface';
import { luxuryTheme } from '../../constants/luxuryTheme';

const PILL_HEIGHT = 56;
const PILL_RADIUS = 9999; // full capsule

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
  labelStyle?: object;
  /** Override container style */
  style?: object;
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
}: Props) {
  const r = Math.min(borderRadius, height / 2);
  const [w, setW] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setW(e.nativeEvent.layout.width);
  }, []);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.outer,
        { height, borderRadius: r, opacity: disabled ? 0.5 : 1 },
        pressed && styles.pressed,
        style,
      ]}
    >
      {/* Skia canvas sits strictly behind layout */}
      {w > 0 && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <SkiaMetallicSurface
            width={w}
            height={height}
            borderRadius={r}
            type="strong"
            showGloss={true}
            showRim={true}
          />
        </View>
      )}

      {/* Label + icon sit above the canvas */}
      <View style={styles.content} pointerEvents="none">
        <Text style={[styles.label, labelStyle]}>{label}</Text>
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
    overflow: 'hidden',
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
    paddingHorizontal: 24,
    gap: 8,
  },
  label: {
    color: luxuryTheme.text.onGold,
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: 0.5,
  },
});
