import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Canvas, Path, LinearGradient, vec } from '@shopify/react-native-skia';

export const StabilitySparkline = ({ delta }: { delta: number }) => {
  const path = `M 0 50 C 20 ${50 - delta}, 40 ${50 + delta}, 60 ${50 - delta * 2}, 80 ${50 + delta}, 100 ${50 - delta}`;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>24H STABILITY DELTA</Text>
      <Canvas style={styles.canvas}>
        <Path path={path} style="stroke" strokeWidth={3}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(100, 0)}
            colors={['#FF3B30', '#34C759']}
          />
        </Path>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    alignItems: 'center',
  },
  label: {
    color: '#8A8A8E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  canvas: {
    width: 100,
    height: 100,
  },
});
