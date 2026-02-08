// File: components/ui/IntensityBar.tsx
// MySky — Enhanced intensity bar with gradient fill and glow

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Rect,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  ClipPath,
} from 'react-native-svg';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

interface IntensityBarProps {
  /** 0–1 fill fraction */
  fill: number;
  /** Bar colour (maps to intensity level) */
  color: string;
  /** "Gentle" | "Moderate" | "Elevated" */
  label: string;
  /** Optional reanimated pulse value (0–1 range) */
  pulseValue?: SharedValue<number>;
  /** Overall bar height — default 8 */
  height?: number;
}

const BAR_WIDTH = 280;

export default function IntensityBar({
  fill,
  color,
  label,
  pulseValue,
  height = 8,
}: IntensityBarProps) {
  const fillWidth = Math.max(fill, 0.05) * 100; // Percentage

  // If a reanimated shared-value was passed in, animate opacity
  const pulseStyle = pulseValue
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useAnimatedStyle(() => ({ opacity: pulseValue.value }))
    : undefined;

  // Pick a secondary tint for the gradient end
  const gradientEnd =
    color === theme.calm
      ? '#8BC4E8'
      : color === theme.stormy
        ? '#E0B07A'
        : theme.primaryLight;

  return (
    <View style={styles.wrapper}>
      {/* Track (background) */}
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        {/* Glow underlay — wider & blurred */}
        <Animated.View
          style={[
            styles.glow,
            {
              width: `${fillWidth}%`,
              height: height + 6,
              borderRadius: (height + 6) / 2,
              backgroundColor: color,
            },
            pulseStyle,
          ]}
        />
        {/* Filled bar with SVG gradient */}
        <View
          style={[
            styles.fillClip,
            {
              width: `${fillWidth}%`,
              height,
              borderRadius: height / 2,
              overflow: 'hidden',
            },
          ]}
        >
          <Svg width="100%" height={height}>
            <Defs>
              <SvgGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor={color} stopOpacity={0.9} />
                <Stop offset="100%" stopColor={gradientEnd} stopOpacity={1} />
              </SvgGradient>
            </Defs>
            <Rect
              x={0}
              y={0}
              width="100%"
              height={height}
              rx={height / 2}
              fill="url(#barGrad)"
            />
          </Svg>
        </View>
        {/* Bright tip dot at the end of the fill */}
        <View
          style={[
            styles.tip,
            {
              left: `${fillWidth}%`,
              top: (height - 4) / 2,
              backgroundColor: '#fff',
              shadowColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  track: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    top: -3,
    left: 0,
    opacity: 0.25,
  },
  fillClip: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tip: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: -2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
});
