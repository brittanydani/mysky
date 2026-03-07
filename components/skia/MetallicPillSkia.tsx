import React, { memo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { metallicStopsSoft, metallicPositionsSoft } from '@/constants/mySkyMetallic';

type MetallicPillSkiaProps = {
  width: number;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const MetallicPillSkia = memo(({
  width,
  height,
  borderRadius = height / 2,
  style,
  children
}: MetallicPillSkiaProps) => {
  return (
    <View style={[{ width, height, justifyContent: 'center', alignItems: 'center' }, style]}>
      <View style={StyleSheet.absoluteFill}>
        <Canvas style={{ flex: 1 }}>
          <RoundedRect
            x={0}
            y={0}
            width={width}
            height={height}
            r={borderRadius}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height)}
              colors={[...metallicStopsSoft]}
              positions={[...metallicPositionsSoft]}
            />
          </RoundedRect>
        </Canvas>
      </View>
      {children}
    </View>
  );
});

export default MetallicPillSkia;
