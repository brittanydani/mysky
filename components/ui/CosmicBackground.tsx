import React, { memo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
  Canvas,
  LinearGradient as SkiaLinearGradient,
  RadialGradient as SkiaRadialGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { MYSTIC } from '../../constants/theme';

const { width: W, height: H } = Dimensions.get('window');

function CosmicBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Deep navy gradient base */}
        <Rect x={0} y={0} width={W} height={H}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, H)}
            colors={[MYSTIC.bgTop, MYSTIC.bgMid, MYSTIC.bgBottom]}
            positions={[0, 0.5, 1]}
          />
        </Rect>

        {/* Subtle radial highlight — depth from top center */}
        <Rect x={0} y={0} width={W} height={H * 0.6}>
          <SkiaRadialGradient
            c={vec(W / 2, 0)}
            r={W * 0.85}
            colors={['rgba(30,70,160,0.18)', 'transparent']}
          />
        </Rect>

        {/* Soft bottom vignette */}
        <Rect x={0} y={H * 0.55} width={W} height={H * 0.45}>
          <SkiaLinearGradient
            start={vec(0, H * 0.55)}
            end={vec(0, H)}
            colors={['transparent', 'rgba(4,10,28,0.45)']}
          />
        </Rect>
      </Canvas>
    </View>
  );
}

export default memo(CosmicBackground);

