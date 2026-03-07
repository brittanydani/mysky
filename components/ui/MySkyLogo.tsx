import React from 'react';
import { View } from 'react-native';
import { Canvas, Rect, Group, Path, Circle, RoundedRect } from '@shopify/react-native-skia';

const MySkyLogo = ({ size = 120 }) => {
  const scale = size / 768;

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ flex: 1 }}>
        <Rect x={0} y={0} width={size} height={size} color="#191C3A" />
        <Group transform={[{ scale }]}>
          <Path path="M192 480C192 384 288 320 384 320C480 320 576 384 576 480" color="#E9D9B8" strokeWidth={12} style="stroke" />
          <Path path="M224 480C224 400 304 352 384 352C464 352 544 400 544 480" color="#E9D9B8" strokeWidth={8} style="stroke" />
          <Path path="M256 480C256 416 320 384 384 384C448 384 512 416 512 480" color="#E9D9B8" strokeWidth={6} style="stroke" />
          
          <RoundedRect x={192} y={480} width={384} height={12} r={6} color="#E9D9B8" />
          <RoundedRect x={224} y={504} width={320} height={8} r={4} color="#E9D9B8" />
          <RoundedRect x={256} y={520} width={256} height={6} r={3} color="#E9D9B8" />
          
          <Path path="M384 320 L384 200 L388 200 L388 320 Z" color="#E9D9B8" />
          
          <Circle cx={384} cy={180} r={8} color="#E9D9B8" />
          <Circle cx={384} cy={160} r={4} color="#E9D9B8" />
          <Circle cx={404} cy={190} r={3} color="#E9D9B8" />
          <Circle cx={364} cy={190} r={3} color="#E9D9B8" />
        </Group>
      </Canvas>
    </View>
  );
};

export default MySkyLogo;
