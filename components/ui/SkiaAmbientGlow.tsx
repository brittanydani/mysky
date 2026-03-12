import React, { memo, useState, useCallback } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { Canvas, Rect, LinearGradient, BlurMask, vec } from '@shopify/react-native-skia';

type Color = 'gold' | 'purple' | 'blue' | 'white';
type Intensity = 'whisper' | 'soft' | 'medium' | 'strong';

interface Props {
  color?: Color;
  intensity?: Intensity;
  height?: number;
}

const colorMap: Record<Color, string> = {
  gold: 'rgba(255,218,3,',
  purple: 'rgba(148,0,211,',
  blue: 'rgba(99,179,237,',
  white: 'rgba(255,255,255,',
};

const intensityAlpha: Record<Intensity, number> = {
  whisper: 0.06,
  soft: 0.12,
  medium: 0.22,
  strong: 0.38,
};

function SkiaAmbientGlow({ color = 'gold', intensity = 'soft', height = 80 }: Props) {
  const [w, setW] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setW(e.nativeEvent.layout.width);
  }, []);

  const alpha = intensityAlpha[intensity];
  const base = colorMap[color];
  const glowColor = `${base}${alpha})`;
  const transparent = `${base}0)`;

  return (
    <View style={{ height, width: '100%' }} onLayout={onLayout} pointerEvents="none">
      {w > 0 && (
        <Canvas style={{ flex: 1 }}>
          <Rect x={0} y={0} width={w} height={height} color={transparent}>
            <LinearGradient
              start={vec(w / 2, 0)}
              end={vec(w / 2, height)}
              colors={[glowColor, transparent]}
            />
            <BlurMask blur={18} style="normal" />
          </Rect>
        </Canvas>
      )}
    </View>
  );
}

export default memo(SkiaAmbientGlow);
