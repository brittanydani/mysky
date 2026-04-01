import React, { memo, useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, LayoutChangeEvent } from 'react-native';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  Group,
  vec,
} from '@shopify/react-native-skia';
import { metallicFillColors, metallicFillPositions } from '../../constants/mySkyMetallic';

const PILL_HEIGHT = 56;
const PILL_RADIUS = 999;

// Rich diagonal metallic sweep matching the golden fill gradient system
const pillGradientColors = [...metallicFillColors];
const pillGradientPositions = [...metallicFillPositions];

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
      {w > 0 && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <Canvas style={{ flex: 1 }}>
            <Group>
              <RoundedRect x={0} y={0} width={w} height={height} r={r}>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(w, height)}
                  positions={pillGradientPositions}
                  colors={pillGradientColors}
                />
              </RoundedRect>
            </Group>
          </Canvas>
        </View>
      )}

      {/* Inner highlight for polished metal effect */}
      <View style={[styles.innerHighlight, { borderRadius: r }]} />

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
