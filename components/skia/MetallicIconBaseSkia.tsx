import React, { memo } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Canvas, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import { metallicStopsSoft, metallicPositionsSoft, metallicStopsHero, metallicPositionsHero } from '@/constants/mySkyMetallic';

type MetallicMode = 'soft' | 'hero';

type MetallicIconBaseSkiaProps = {
  path: string;
  size: number;
  mode?: MetallicMode;
  style?: StyleProp<ViewStyle>;
};

const MetallicIconBaseSkia = memo(({
  path,
  size,
  mode = 'soft',
  style
}: MetallicIconBaseSkiaProps) => {
  const isHero = mode === 'hero';
  const colors = isHero ? [...metallicStopsHero] : [...metallicStopsSoft];
  const positions = isHero ? [...metallicPositionsHero] : [...metallicPositionsSoft];

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Canvas style={{ flex: 1 }}>
        <Path path={path}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(size, size)}
            colors={colors}
            positions={positions}
          />
        </Path>
      </Canvas>
    </View>
  );
});

export default MetallicIconBaseSkia;
