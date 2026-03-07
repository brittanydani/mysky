// File: components/ui/ResponsiveLuxuryButtonSkia.tsx

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {
  BlurMask,
  Canvas,
  Group,
  LinearGradient,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import { luxuryTheme } from '../../constants/luxuryTheme';

type ResponsiveLuxuryButtonSkiaProps = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  metallic?: boolean;
  darkTextColor?: string;
  lightTextColor?: string;
};

export default function ResponsiveLuxuryButtonSkia({
  label,
  onPress,
  disabled = false,
  loading = false,
  selected = false,
  height = 62,
  borderRadius = 999,
  style,
  textStyle,
  metallic = true,
  darkTextColor = luxuryTheme.button.textDark,
  lightTextColor = luxuryTheme.text.white,
}: ResponsiveLuxuryButtonSkiaProps) {
  const [width, setWidth] = useState(0);
  const isDisabled = disabled || loading;
  const isGoldFill = metallic || selected;
  const resolvedTextColor = isGoldFill ? darkTextColor : lightTextColor;

  const outerGlowOpacity = isDisabled ? 0.18 : selected ? 0.44 : 0.32;
  const borderOpacity = isDisabled ? 0.42 : selected ? 0.95 : 0.72;
  const glossOpacity = isDisabled ? 0.4 : selected ? 1 : 0.9;

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextWidth = Math.round(event.nativeEvent.layout.width);
      if (nextWidth > 0 && nextWidth !== width) {
        setWidth(nextWidth);
      }
    },
    [width],
  );

  return (
    <Pressable
      onLayout={handleLayout}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        {
          minHeight: height,
          opacity: isDisabled ? 0.6 : pressed ? 0.96 : 1,
          transform: [{ scale: pressed ? 0.992 : 1 }],
          borderRadius,
        },
        style,
      ]}
    >
      {width > 0 ? (
        <Canvas style={StyleSheet.absoluteFill}>
          <Group>
            {/* Outer glow */}
            <RoundedRect
              x={2}
              y={3}
              width={Math.max(width - 4, 0)}
              height={Math.max(height - 5, 0)}
              r={borderRadius}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, height)}
                colors={
                  isGoldFill
                    ? [
                        'rgba(247,231,194,0.00)',
                        `rgba(247,231,194,${0.18 * outerGlowOpacity})`,
                        'rgba(247,231,194,0.00)',
                      ]
                    : [
                        'rgba(255,255,255,0.00)',
                        `rgba(255,248,220,${0.08 * outerGlowOpacity})`,
                        'rgba(255,255,255,0.00)',
                      ]
                }
                positions={[0, 0.5, 1]}
              />
              <BlurMask blur={12} style="solid" />
            </RoundedRect>

            {/* Base fill */}
            <RoundedRect
              x={0}
              y={0}
              width={width}
              height={height}
              r={borderRadius}
            >
              {isGoldFill ? (
                <LinearGradient
                  start={vec(height * 0.08, height * 0.12)}
                  end={vec(width * 0.95, height * 0.88)}
                  colors={[...luxuryTheme.gradients.goldStrong]}
                  positions={[0, 0.16, 0.34, 0.56, 0.78, 1]}
                />
              ) : (
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(0, height)}
                  colors={[
                    'rgba(255,255,255,0.045)',
                    'rgba(255,255,255,0.022)',
                    'rgba(255,255,255,0.015)',
                  ]}
                  positions={[0, 0.48, 1]}
                />
              )}
            </RoundedRect>

            {/* Metallic reflection sweep */}
            {isGoldFill ? (
              <RoundedRect
                x={0}
                y={0}
                width={width}
                height={height}
                r={borderRadius}
              >
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(width, 0)}
                  colors={[...luxuryTheme.gradients.metallicReflection]}
                  positions={[0, 0.08, 0.2, 0.3, 0.42, 0.58, 0.78, 1]}
                />
              </RoundedRect>
            ) : null}

            {/* Top gloss */}
            <RoundedRect
              x={6}
              y={4}
              width={Math.max(width - 12, 0)}
              height={height * 0.38}
              r={borderRadius}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, height * 0.38)}
                colors={
                  isGoldFill
                    ? [
                        `rgba(255,255,255,${0.24 * glossOpacity})`,
                        `rgba(255,255,255,${0.10 * glossOpacity})`,
                        'rgba(255,255,255,0.00)',
                      ]
                    : [
                        'rgba(255,255,255,0.10)',
                        'rgba(255,255,255,0.04)',
                        'rgba(255,255,255,0.00)',
                      ]
                }
                positions={[0, 0.45, 1]}
              />
            </RoundedRect>

            {/* Lower anchor shadow */}
            <RoundedRect
              x={0}
              y={0}
              width={width}
              height={height}
              r={borderRadius}
            >
              <LinearGradient
                start={vec(0, height * 0.58)}
                end={vec(0, height)}
                colors={
                  isGoldFill
                    ? [
                        'rgba(0,0,0,0.00)',
                        'rgba(78,58,31,0.06)',
                        'rgba(78,58,31,0.16)',
                      ]
                    : [
                        'rgba(0,0,0,0.00)',
                        'rgba(0,0,0,0.05)',
                        'rgba(0,0,0,0.14)',
                      ]
                }
                positions={[0, 0.6, 1]}
              />
            </RoundedRect>

            {/* Outer metallic outline */}
            <RoundedRect
              x={0.8}
              y={0.8}
              width={Math.max(width - 1.6, 0)}
              height={Math.max(height - 1.6, 0)}
              r={borderRadius}
              style="stroke"
              strokeWidth={1.2}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(width, height)}
                colors={
                  isGoldFill
                    ? [
                        `rgba(255,248,220,${0.52 * borderOpacity})`,
                        `rgba(221,187,131,${0.26 * borderOpacity})`,
                        `rgba(111,85,46,${0.20 * borderOpacity})`,
                      ]
                    : [
                        `rgba(255,248,220,${0.18 * borderOpacity})`,
                        `rgba(255,248,220,${0.11 * borderOpacity})`,
                        `rgba(111,85,46,${0.08 * borderOpacity})`,
                      ]
                }
                positions={[0, 0.45, 1]}
              />
            </RoundedRect>

            {/* Bright upper rim */}
            <RoundedRect
              x={1.5}
              y={1.5}
              width={Math.max(width - 3, 0)}
              height={Math.max(height - 3, 0)}
              r={borderRadius}
              style="stroke"
              strokeWidth={0.8}
              color={
                isGoldFill
                  ? `rgba(255,248,220,${0.34 * borderOpacity})`
                  : `rgba(255,255,255,${0.12 * borderOpacity})`
              }
            />

            {/* Inner shadow rim */}
            <RoundedRect
              x={2.2}
              y={2.2}
              width={Math.max(width - 4.4, 0)}
              height={Math.max(height - 4.4, 0)}
              r={borderRadius}
              style="stroke"
              strokeWidth={0.7}
              color={
                isGoldFill ? 'rgba(78,58,31,0.16)' : 'rgba(0,0,0,0.16)'
              }
            />
          </Group>
        </Canvas>
      ) : null}

      <View style={styles.content} pointerEvents="none">
        {loading ? (
          <ActivityIndicator color={resolvedTextColor} />
        ) : (
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              { color: resolvedTextColor },
              textStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    overflow: 'visible',
    position: 'relative',
    justifyContent: 'center',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
