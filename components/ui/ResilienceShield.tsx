import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  SweepGradient,
  vec,
  BlurMask,
  Group,
} from '@shopify/react-native-skia';

const SIZE = 240;
const CENTER = SIZE / 2;

interface ResilienceShieldProps {
  stabilityIndex: number; // 0-100
  somaticCompletion: number; // 0-100
  blueprintAlignment: number; // 0-100
}

export const ResilienceShield = ({ 
  stabilityIndex, 
  somaticCompletion, 
  blueprintAlignment 
}: ResilienceShieldProps) => {
  // The Resilience Calculation Logic
  // Stability Index (40%)
  // Somatic Completion (30%)
  // Blueprint Alignment (30%)
  const score = useMemo(() => {
    return (stabilityIndex * 0.4) + (somaticCompletion * 0.3) + (blueprintAlignment * 0.3);
  }, [stabilityIndex, somaticCompletion, blueprintAlignment]);

  // Create a segmented shield path based on the score (0-100)
  const shieldPath = useMemo(() => {
    const p = Skia.Path.Make();
    // Prevent radius from being 0 or negative
    const radius = Math.max((score / 100) * (CENTER - 20), 1);
    p.addCircle(CENTER, CENTER, radius);
    return p;
  }, [score]);

  return (
    <View style={styles.container}>
      <Canvas style={{ width: SIZE, height: SIZE }}>
        <Group>
          {/* Outer Protective Glow */}
          <Path path={shieldPath} style="stroke" strokeWidth={4} opacity={0.4}>
            <BlurMask blur={15} style="outer" />
            <SweepGradient
              c={vec(CENTER, CENTER)}
              colors={['#6EBF8B', '#D4AF37', '#8BC4E8', '#6EBF8B']}
            />
          </Path>

          {/* The Core Armor */}
          <Path path={shieldPath} style="stroke" strokeWidth={2}>
             <SweepGradient
              c={vec(CENTER, CENTER)}
              colors={['#6EBF8B', '#D4AF37', '#8BC4E8', '#6EBF8B']}
            />
          </Path>
        </Group>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  }
});
