import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Shader,
  useSharedValue,
  useDerivedValue,
  Group,
  ColorMatrix,
} from '@shopify/react-native-skia';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');
const BODY_W = width * 0.7;

// Fragment Shader to interpolate between two states of tension
const transitionShader = Skia.RuntimeEffect.Make(`
  uniform float u_progress;
  uniform vec4 u_stateA; // x, y, radius, intensity
  uniform vec4 u_stateB;

  vec4 main(vec2 pos) {
    float distA = distance(pos, u_stateA.xy);
    float distB = distance(pos, u_stateB.xy);
    
    float heatA = smoothstep(u_stateA.z, 0.0, distA) * u_stateA.w;
    float heatB = smoothstep(u_stateB.z, 0.0, distB) * u_stateB.w;
    
    float finalHeat = mix(heatA, heatB, u_progress);
    vec3 col = mix(vec3(0.05, 0.08, 0.15), vec3(0.8, 0.4, 0.2), finalHeat);
    
    return vec4(col, 1.0);
  }
`)!;

export const SomaticTimeLapse = ({ historicalData }: { historicalData: any[] }) => {
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(0);

  const bodyPath = useMemo(() => {
    const path = Skia.Path.Make();
    const cx = BODY_W / 2;
    // Head
    path.addCircle(cx, BODY_W * 0.15, BODY_W * 0.1);
    // Neck
    path.addRect({ x: cx - BODY_W * 0.05, y: BODY_W * 0.25, width: BODY_W * 0.1, height: BODY_W * 0.05 });
    // Shoulders & Torso
    path.addRoundRect({ x: cx - BODY_W * 0.25, y: BODY_W * 0.3, width: BODY_W * 0.5, height: BODY_W * 0.5 }, BODY_W * 0.1, BODY_W * 0.1);
    // Arms
    path.addRoundRect({ x: cx - BODY_W * 0.35, y: BODY_W * 0.35, width: BODY_W * 0.08, height: BODY_W * 0.4 }, BODY_W * 0.04, BODY_W * 0.04);
    path.addRoundRect({ x: cx + BODY_W * 0.27, y: BODY_W * 0.35, width: BODY_W * 0.08, height: BODY_W * 0.4 }, BODY_W * 0.04, BODY_W * 0.04);
    // Legs
    path.addRoundRect({ x: cx - BODY_W * 0.15, y: BODY_W * 0.8, width: BODY_W * 0.1, height: BODY_W * 0.4 }, BODY_W * 0.05, BODY_W * 0.05);
    path.addRoundRect({ x: cx + BODY_W * 0.05, y: BODY_W * 0.8, width: BODY_W * 0.1, height: BODY_W * 0.4 }, BODY_W * 0.05, BODY_W * 0.05);
    return path;
  }, []);

  const handleValueChange = (val: number) => {
    const floor = Math.floor(val);
    setIndex(floor);
    progress.value = val - floor;
  };

  return (
    <View style={styles.container}>
      <Canvas style={{ width: BODY_W, height: BODY_W * 1.5 }}>
        <Group>
          {bodyPath && (
            <Path path={bodyPath}>
              <Shader 
                source={transitionShader} 
                uniforms={useDerivedValue(() => ({
                  u_progress: progress.value,
                  u_stateA: historicalData[index],
                  u_stateB: historicalData[Math.min(index + 1, historicalData.length - 1)],
                }))}
              />
            </Path>
          )}
        </Group>
      </Canvas>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={historicalData.length - 1}
        onValueChange={handleValueChange}
        minimumTrackTintColor="#D4AF37"
        maximumTrackTintColor="rgba(255,255,255,0.1)"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 20 },
  slider: { width: width * 0.8, height: 40, marginTop: 30 }
});
