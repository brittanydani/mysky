/**
 * StabilityDeltaSparkline
 * A high-end biometric feedback component.
 * Visualizes the projected stability increase post-regulation.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  BlurMask,
} from '@shopify/react-native-skia';

const W = 120;
const H = 40;

export const StabilityDeltaSparkline = ({ intensity }: { intensity: number }) => {
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    // Start at baseline
    p.moveTo(0, H * 0.8);
    // Project upward based on intensity of the session
    const lift = Math.min(intensity * 10, H * 0.6);
    p.cubicTo(W * 0.4, H * 0.8, W * 0.6, H * 0.8 - lift, W, H * 0.8 - lift);
    return p;
  }, [intensity]);

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.label}>STABILITY DELTA</Text>
        <Text style={styles.value}>+{Math.round(intensity * 10)}%</Text>
      </View>
      <Canvas style={{ width: W, height: H }}>
        <Path path={path} style="stroke" strokeWidth={3} color="#6EBF8B">
          <BlurMask blur={4} style="outer" />
        </Path>
        <Path path={path} style="stroke" strokeWidth={2} color="#6EBF8B" />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(110, 191, 139, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(110, 191, 139, 0.2)',
  },
  textBlock: { flex: 1 },
  label: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  value: { color: '#6EBF8B', fontSize: 18, fontWeight: '700', marginTop: 2 },
});