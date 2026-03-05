import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export const TriadGlow = ({ onSync }: { onSync: (metrics: any) => void }) => {
  const mood = useSharedValue(50);
  const energy = useSharedValue(50);
  const stress = useSharedValue(50);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      // Simplified tri-directional logic mapping
      mood.value = Math.max(0, Math.min(100, mood.value + e.translationX * 0.1));
      energy.value = Math.max(0, Math.min(100, energy.value - e.translationY * 0.1));
      stress.value = Math.max(0, Math.min(100, stress.value + (e.translationX + e.translationY) * 0.05));
    })
    .onEnd(() => {
      // Trigger sync logic
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: (mood.value - 50) },
        { translateY: -(energy.value - 50) },
      ],
      backgroundColor: `rgba(${stress.value * 2.5}, 100, 200, 0.8)`,
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Energy</Text>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.triadOrb, animatedStyle]} />
      </GestureDetector>
      <View style={styles.row}>
        <Text style={styles.label}>Mood</Text>
        <Text style={styles.label}>Stress</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  triadOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginVertical: 20,
    shadowColor: '#fff',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
  },
  label: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  }
});
