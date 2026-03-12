import React, { memo, useState, useCallback } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';

type Variant = 'default' | 'elevated' | 'featured';

interface Props {
  variant?: Variant;
  glow?: boolean;
  children?: React.ReactNode;
  style?: any;
}

const RADIUS = 18;

const variantGradients: Record<Variant, [string, string]> = {
  default: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)'],
  elevated: ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.03)'],
  featured: ['rgba(232,214,174,0.14)', 'rgba(2,8,23,0.80)'],
};

const variantBorder: Record<Variant, string> = {
  default: 'rgba(255,255,255,0.08)',
  elevated: 'rgba(255,255,255,0.14)',
  featured: 'rgba(232,214,174,0.22)',
};

function SkiaGlassCard({ variant = 'default', glow = false, children, style }: Props) {
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setW(e.nativeEvent.layout.width);
    setH(e.nativeEvent.layout.height);
  }, []);

  const gradientColors = variantGradients[variant];

  return (
    <View style={[styles.card, { borderColor: variantBorder[variant] }, style]} onLayout={onLayout}>
      {w > 0 && h > 0 && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFillObject}>
            <RoundedRect x={0} y={0} width={w} height={h} r={RADIUS}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, h)}
                colors={gradientColors}
              />
            </RoundedRect>
            {glow && (
              <RoundedRect x={1} y={1} width={w - 2} height={h - 2} r={RADIUS - 1} color="rgba(255,218,3,0.06)">
                <BlurMask blur={8} style="normal" />
              </RoundedRect>
            )}
          </Canvas>
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 4,
  },
  content: {
    padding: 16,
  },
});

export default memo(SkiaGlassCard);
