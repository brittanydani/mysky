/**
 * MetallicBadgeSkia
 *
 * Small metallic pill badge for labels like "PREMIUM", "TODAY", "FEATURED".
 * Renders with the shared champagne-gold system.
 *
 * Usage:
 *   <MetallicBadgeSkia label="PREMIUM" />
 *   <MetallicBadgeSkia label="TODAY" mode="tiny" />
 */
import React, { memo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import { Canvas, RoundedRect, LinearGradient, vec } from '@shopify/react-native-skia';
import { getMetallicStops, MetallicMode } from '@/constants/mySkyMetallic';
import { mySkyText } from '@/constants/mySkyText';

type Props = {
  label: string;
  mode?: MetallicMode;
  fontSize?: number;
};

const MetallicBadgeSkia = memo(function MetallicBadgeSkia({
  label,
  mode = 'soft',
  fontSize = 10,
}: Props) {
  const [w, setW] = useState(0);
  const height = fontSize * 2.2;
  const r = height / 2;
  const { colors, positions } = getMetallicStops(mode);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setW(e.nativeEvent.layout.width);
  }, []);

  return (
    <View
      style={[styles.outer, { height, borderRadius: r }]}
      onLayout={onLayout}
    >
      {w > 0 && (
        <View style={StyleSheet.absoluteFill}>
          <Canvas style={{ flex: 1 }}>
            <RoundedRect x={0} y={0} width={w} height={height} r={r}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, height)}
                colors={colors as string[]}
                positions={positions as number[]}
              />
            </RoundedRect>
          </Canvas>
        </View>
      )}
      <Text style={[styles.label, { fontSize }]}>{label}</Text>
    </View>
  );
});

export default MetallicBadgeSkia;

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: '#020817',
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
});
