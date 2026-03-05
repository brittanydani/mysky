import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Path, Circle, Group, LinearGradient, BlurMask } from '@shopify/react-native-skia';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';

export default function WeeklyResilienceShield({ score = 75 }: { score?: number }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Simple shield path
  const shieldPath = "M 75 20 C 75 20, 130 20, 130 50 C 130 100, 75 130, 75 130 C 75 130, 20 100, 20 50 C 20 20, 75 20, 75 20 Z";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Resilience Shield</Text>
      <View style={styles.shieldWrapper}>
        <Canvas style={{ width: 150, height: 150 }}>
          <Group transform={[{ rotate: rotation.value }]} origin={{ x: 75, y: 75 }}>
            <Circle cx={75} cy={75} r={60} color="rgba(197, 180, 147, 0.1)">
              <BlurMask blur={10} style="normal" />
            </Circle>
            {/* Outer segmented ring mock */}
            <Path path="M 75 5 A 70 70 0 0 1 145 75" color="rgba(139, 196, 232, 0.5)" style="stroke" strokeWidth={4} />
            <Path path="M 145 75 A 70 70 0 0 1 75 145" color="rgba(205, 127, 93, 0.5)" style="stroke" strokeWidth={4} />
            <Path path="M 75 145 A 70 70 0 0 1 5 75" color="rgba(110, 191, 139, 0.5)" style="stroke" strokeWidth={4} />
            <Path path="M 5 75 A 70 70 0 0 1 75 5" color="rgba(157, 118, 193, 0.5)" style="stroke" strokeWidth={4} />
          </Group>
          <Path path={shieldPath} color="rgba(255,255,255,0.05)" />
          <Path path={shieldPath} color="rgba(197, 180, 147, 0.4)" style="stroke" strokeWidth={2} />
        </Canvas>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreLabel}>Shield</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(15, 18, 25, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  title: {
    color: '#C5B493',
    fontFamily: 'Georgia',
    fontSize: 16,
    marginBottom: 16
  },
  shieldWrapper: {
    position: 'relative',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scoreContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scoreText: {
    color: '#FDFBF7',
    fontSize: 28,
    fontFamily: 'Georgia',
    fontWeight: 'bold'
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontFamily: 'Georgia',
    textTransform: 'uppercase'
  }
});