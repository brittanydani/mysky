// File: components/ui/ResponsiveLuxuryCardSkia.tsx

import React, { useCallback, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
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

type ResponsiveLuxuryCardSkiaProps = {
  children?: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  height?: number;
  minHeight?: number;
  borderRadius?: number;
  selected?: boolean;
  subtle?: boolean;
  padding?: number;
};

export default function ResponsiveLuxuryCardSkia({
  children,
  style,
  contentContainerStyle,
  height,
  minHeight = 160,
  borderRadius = 24,
  selected = false,
  subtle = false,
  padding = 18,
}: ResponsiveLuxuryCardSkiaProps) {
  const [width, setWidth] = useState(0);

  const resolvedHeight = height ?? minHeight;
  const outlineOpacity = selected ? 0.95 : subtle ? 0.58 : 0.78;
  const glowOpacity = selected ? 1 : subtle ? 0.55 : 0.75;
  const fillOpacity = selected ? 1.1 : subtle ? 0.78 : 1;

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
    <View
      onLayout={handleLayout}
      style={[
        styles.wrapper,
        {
          minHeight: resolvedHeight,
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
              y={4}
              width={Math.max(width - 4, 0)}
              height={Math.max(resolvedHeight - 6, 0)}
              r={borderRadius}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, resolvedHeight)}
                colors={[
                  'rgba(247,231,194,0.00)',
                  `rgba(247,231,194,${0.09 * glowOpacity})`,
                  'rgba(247,231,194,0.00)',
                ]}
              />
              <BlurMask blur={12} style="solid" />
            </RoundedRect>

            {/* Base card fill */}
            <RoundedRect
              x={0}
              y={0}
              width={width}
              height={resolvedHeight}
              r={borderRadius}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, resolvedHeight)}
                colors={[
                  `rgba(255,255,255,${0.032 * fillOpacity})`,
                  `rgba(255,255,255,${0.018 * fillOpacity})`,
                  `rgba(255,255,255,${0.012 * fillOpacity})`,
                ]}
                positions={[0, 0.48, 1]}
              />
            </RoundedRect>

            {/* Lower dark anchor */}
            <RoundedRect
              x={0}
              y={0}
              width={width}
              height={resolvedHeight}
              r={borderRadius}
            >
              <LinearGradient
                start={vec(0, resolvedHeight * 0.58)}
                end={vec(0, resolvedHeight)}
                colors={[
                  'rgba(0,0,0,0.00)',
                  'rgba(0,0,0,0.05)',
                  'rgba(0,0,0,0.14)',
                ]}
                positions={[0, 0.6, 1]}
              />
            </RoundedRect>

            {/* Top gloss */}
            <RoundedRect
              x={8}
              y={6}
              width={Math.max(width - 16, 0)}
              height={resolvedHeight * 0.26}
              r={borderRadius}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, resolvedHeight * 0.26)}
                colors={[
                  selected
                    ? 'rgba(255,255,255,0.13)'
                    : 'rgba(255,255,255,0.09)',
                  'rgba(255,255,255,0.04)',
                  'rgba(255,255,255,0.00)',
                ]}
                positions={[0, 0.42, 1]}
              />
            </RoundedRect>

            {/* Metallic reflection sweep */}
            <RoundedRect
              x={0}
              y={0}
              width={width}
              height={resolvedHeight}
              r={borderRadius}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(width, 0)}
                colors={[
                  'rgba(255,255,255,0.00)',
                  'rgba(255,255,255,0.03)',
                  'rgba(255,248,220,0.12)',
                  'rgba(255,255,255,0.04)',
                  'rgba(255,255,255,0.00)',
                  'rgba(111,85,46,0.03)',
                  'rgba(255,248,220,0.08)',
                  'rgba(255,255,255,0.00)',
                ]}
                positions={[0, 0.08, 0.2, 0.3, 0.42, 0.58, 0.78, 1]}
              />
            </RoundedRect>

            {/* Outer metallic outline */}
            <RoundedRect
              x={0.75}
              y={0.75}
              width={Math.max(width - 1.5, 0)}
              height={Math.max(resolvedHeight - 1.5, 0)}
              r={borderRadius}
              style="stroke"
              strokeWidth={1.2}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(width, resolvedHeight)}
                colors={[
                  `rgba(255,248,220,${0.36 * outlineOpacity})`,
                  `rgba(221,187,131,${0.22 * outlineOpacity})`,
                  `rgba(111,85,46,${0.18 * outlineOpacity})`,
                ]}
                positions={[0, 0.45, 1]}
              />
            </RoundedRect>

            {/* Bright upper rim */}
            <RoundedRect
              x={1.4}
              y={1.4}
              width={Math.max(width - 2.8, 0)}
              height={Math.max(resolvedHeight - 2.8, 0)}
              r={Math.max(borderRadius - 0.4, 0)}
              style="stroke"
              strokeWidth={0.8}
              color={
                selected
                  ? 'rgba(255,248,220,0.30)'
                  : 'rgba(255,248,220,0.18)'
              }
            />

            {/* Inner shadow rim */}
            <RoundedRect
              x={2.2}
              y={2.2}
              width={Math.max(width - 4.4, 0)}
              height={Math.max(resolvedHeight - 4.4, 0)}
              r={Math.max(borderRadius - 0.9, 0)}
              style="stroke"
              strokeWidth={0.7}
              color="rgba(0,0,0,0.16)"
            />
          </Group>
        </Canvas>
      ) : null}

      <View
        style={[
          styles.content,
          {
            minHeight: resolvedHeight,
            borderRadius,
            padding,
          },
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    overflow: 'visible',
    position: 'relative',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
});
