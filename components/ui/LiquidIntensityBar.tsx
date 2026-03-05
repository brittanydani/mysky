import React, { useEffect } from 'react';
import { Canvas, Rect, Shader, Skia } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const source = Skia.RuntimeEffect.Make(`
  uniform float time;
  uniform vec2 res;
  uniform float fill;
  uniform vec3 color;

  vec4 main(vec2 pos) {
    vec2 uv = pos / res;
    // Create the liquid wave movement
    float wave = sin(uv.x * 10.0 + time * 2.0) * 0.05;
    float threshold = 1.0 - fill + wave;
    
    if (uv.y > threshold) {
      // Add a subtle vertical gradient to the liquid
      float brightness = 1.2 - uv.y;
      return vec4(color * brightness, 1.0);
    }
    return vec4(1.0, 1.0, 1.0, 0.05); // The "Empty" glass background
  }
`)!;

export const LiquidIntensityBar = ({ fill, color }: { fill: number, color: string }) => {
  const time = useSharedValue(0);
  const rgb = Skia.Color(color);

  useEffect(() => {
    time.value = withRepeat(withTiming(10, { duration: 10000, easing: Easing.linear }), -1);
  }, []);

  return (
    <Canvas style={{ height: 12, width: '100%', borderRadius: 6, overflow: 'hidden' }}>
      <Rect x={0} y={0} width={400} height={12}>
        <Shader
          source={source}
          uniforms={{
            time,
            res: [300, 12],
            fill, // 0.0 to 1.0
            color: [rgb[0], rgb[1], rgb[2]],
          }}
        />
      </Rect>
    </Canvas>
  );
};
