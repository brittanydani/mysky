import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Rect,
  Shader,
  Skia,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const source = Skia.RuntimeEffect.Make(`
  uniform float u_time;
  uniform vec2 u_res;

  // Fluid noise function for natural motion
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Generate a star field with varying depth
  float starField(vec2 p, float scale) {
    vec2 sp = p * scale;
    vec2 gridPos = floor(sp);
    vec2 localPos = fract(sp) - 0.5;
    float n = noise(gridPos);
    
    // Add random offset so stars aren't in a perfect grid
    vec2 offset = vec2(noise(gridPos + 10.0), noise(gridPos + 20.0)) - 0.5;
    
    // Very strict probability for twinkling: only ~0.5% of stars are allowed to twinkle
    float isTwinkler = step(0.995, noise(gridPos + 42.0));
    
    // Animate brightness for twinklers using a smooth sine wave, static otherwise
    float sparkleProg = sin(u_time * 0.002 + n * 100.0) * 0.5 + 0.5;
    float twinkle = mix(0.5, 0.2 + sparkleProg * 0.8, isTwinkler);
    
    // Draw the local shape as a circular point - balanced size
    float starShape = smoothstep(0.08, 0.015, length(localPos - offset * 0.8));
    
    // Balanced step threshold (~10% fill)
    return starShape * twinkle * step(0.90, n);
  }

  vec4 main(vec2 pos) {
    vec2 uv = pos / u_res;
    vec2 center = vec2(0.5, 0.5);
    float d = distance(uv, center);
    
    // Use aspect-corrected coordinates for perfectly round stars
    vec2 p = pos / min(u_res.x, u_res.y);
    
    // Subtly drift the field
    vec2 drift = vec2(u_time * 0.0005, u_time * 0.0003);
    p += drift;
    
    // Layer three fields for depth
    float stars = 0.0;
    stars += starField(p, 20.0) * 1.0;   // Near (Large)
    stars += starField(p, 45.0) * 0.8;   // Medium
    stars += starField(p, 90.0) * 0.5;   // Far (Small)
    
    // Add "Vitals" color shift (Gold to Silver)
    vec3 col = mix(vec3(0.9, 0.8, 0.5), vec3(0.65, 0.85, 0.95), noise(p + u_time * 0.001));
    
    // Balanced final brightness
    return vec4(col * stars * (1.0 - d * 0.4), stars);
  }
`)!;

export const SkiaDynamicCosmos = () => {
  const time = useSharedValue(0);

  useEffect(() => {
    // Start the clock: A very slow loop ensures the drift is barely noticeable.
    time.value = withRepeat(
      withTiming(100, { duration: 100000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const uniforms = useDerivedValue(() => ({
    u_time: time.value,
    u_res: [width, height],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={width} height={height}>
          <Shader source={source} uniforms={uniforms} />
        </Rect>
      </Canvas>
    </View>
  );
};
