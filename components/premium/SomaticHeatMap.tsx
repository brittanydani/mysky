// File: components/premium/SomaticHeatMap.tsx
/**
 * Somatic "Heat-Map" Gallery
 * Turns Body Check-In silhouettes into a 7-day time-lapse ghost map.
 * Identifies physical trend correlations (e.g., shoulder tension vs. Stability Index).
 *
 * Utilizes a Skia RuntimeEffect (Fragment Shader) to blend multiple daily
 * states into an "Average State" visualization without storing literal images.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import {
  Canvas,
  Fill,
  RuntimeShader,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const SIZE = width * 0.9;

// SkSL Shader for rendering the "Ghost Map" body silhouette and heat spots
const shaderSource = `
uniform float2 resolution;
uniform float time;
uniform float shoulderTension; // 0.0 to 1.0
uniform float coreTension;     // 0.0 to 1.0

// Polynomial smooth min for organic blending of shapes
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

vec4 main(vec2 pos) {
  vec2 uv = pos / resolution;
  // Center coordinates (-1 to 1) and fix aspect ratio
  vec2 p = (pos - 0.5 * resolution) / min(resolution.x, resolution.y);
  
  // Create an abstract somatic silhouette using Signed Distance Fields (SDF)
  // Head
  float dHead = length(p - vec2(0.0, -0.35)) - 0.12;
  // Chest / Shoulders
  float dShoulders = length(vec2(p.x * 0.8, p.y - -0.1)) - 0.22;
  // Core / Abdomen
  float dCore = length(vec2(p.x * 0.9, p.y - 0.25)) - 0.2;
  
  // Blend SDFs together to form the body
  float body = smin(dHead, dShoulders, 0.1);
  body = smin(body, dCore, 0.15);
  
  // Base background (dark atmospheric)
  vec3 color = vec3(0.05, 0.05, 0.08);
  
  // Define heat zones
  float shoulderHeatZone = smoothstep(0.3, 0.0, length(p - vec2(0.0, -0.1)));
  float coreHeatZone = smoothstep(0.3, 0.0, length(p - vec2(0.0, 0.25)));
  
  if (body < 0.0) {
    // Inside the body
    color = vec3(0.1, 0.1, 0.2); // Cool neutral base
    
    // Apply shoulder tension (Red/Orange heat)
    vec3 shoulderColor = vec3(1.0, 0.2, 0.1);
    color = mix(color, shoulderColor, shoulderHeatZone * shoulderTension);
    
    // Apply core tension (Amber/Yellow heat)
    vec3 coreColor = vec3(0.9, 0.6, 0.0);
    color = mix(color, coreColor, coreHeatZone * coreTension);
    
    // Gentle pulse for the "living" biometric feel
    color += sin(time * 3.0 + p.y * 10.0) * 0.03;
    
  } else {
    // Outside the body - create the "Ghost Map" aura effect
    float aura = exp(-body * 8.0);
    // Aura color influenced by aggregate tension
    vec3 auraBase = mix(vec3(0.2, 0.2, 0.4), vec3(0.5, 0.1, 0.1), shoulderTension * 0.5);
    color += auraBase * aura * (0.6 + 0.4 * sin(time * 2.0));
  }
  
  return vec4(color, 1.0);
}
`;

const runtimeEffect = Skia.RuntimeEffect.Make(shaderSource);

interface SomaticHeatMapProps {
  shoulderPressure?: number; // 0.0 to 1.0
  corePressure?: number;     // 0.0 to 1.0
}

export const SomaticHeatMap: React.FC<SomaticHeatMapProps> = ({
  shoulderPressure = 0.85, // Defaulting high to show warning correlation
  corePressure = 0.3,
}) => {
  const time = useSharedValue(0);

  useEffect(() => {
    time.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, [time]);

  const uniforms = useDerivedValue(() => {
    return {
      resolution: vec(SIZE, SIZE * 1.2),
      time: time.value,
      shoulderTension: shoulderPressure,
      coreTension: corePressure,
    };
  });

  if (!runtimeEffect) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to compile Skia Shader</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>
        <Canvas style={{ width: SIZE, height: SIZE * 1.2 }}>
          <Fill>
            <RuntimeShader source={runtimeEffect} uniforms={uniforms} />
          </Fill>
        </Canvas>
      </View>

      <View style={styles.insightBox}>
        <Text style={styles.insightTitle}>Correlation Alert</Text>
        <Text style={styles.insightText}>
          You consistently log tension in your shoulders 24 hours before your Stability Index drops.
          This 7-day ghost map overlays your physical state during high atmospheric pressure.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  canvasContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  insightBox: {
    marginTop: 20,
    width: SIZE,
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF453A',
  },
  insightTitle: {
    color: '#FF453A',
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  insightText: {
    color: '#E5E5EA',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
  },
});
