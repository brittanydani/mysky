import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { EnergyVortexBackground } from '../../components/weather/EnergyVortexBackground';
import { CircadianWindowDial } from '../../components/weather/CircadianWindowDial';
import { SomaticSilhouette } from '../../components/weather/SomaticSilhouette';
import { LifeDomainPressures } from '../../components/weather/LifeDomainPressures';

export default function WeatherScreen() {
  const router = useRouter();
  const [activeTension, setActiveTension] = useState<string[]>([]);

  const handleClearPressure = () => {
    router.push({
      pathname: '/(tabs)/energy',
      params: { tension: activeTension.join(',') }
    });
  };

  return (
    <View style={styles.root}>
      <EnergyVortexBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
            <Text style={styles.atmosphericTitle}>Stability Index</Text>
            <Text style={styles.atmosphericValue}>High 82%</Text>
            <Text style={styles.activeDomain}>Active Domain: Deep Rest</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(150)}>
            <Pressable style={styles.dailyContextButton} onPress={() => router.push('/astrology-context')}>
              <Text style={styles.dailyContextButtonText}>View Daily Context</Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200)}>
            <CircadianWindowDial />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300)}>
            <SomaticSilhouette onTensionChange={setActiveTension} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400)}>
            <LifeDomainPressures />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500)}>
            <Pressable style={styles.gateButton} onPress={handleClearPressure}>
              <Text style={styles.gateButtonText}>Clear Atmospheric Pressure</Text>
            </Pressable>
          </Animated.View>
          
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  atmosphericTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  atmosphericValue: {
    color: '#e1b072',
    fontSize: 36,
    fontFamily: 'SpaceGrotesk-Bold',
    marginVertical: 4,
  },
  activeDomain: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  dailyContextButton: {
    backgroundColor: 'rgba(225, 176, 114, 0.1)',
    borderColor: 'rgba(225, 176, 114, 0.3)',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
    marginVertical: 10,
  },
  dailyContextButtonText: {
    color: '#e1b072',
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  gateButton: {
    backgroundColor: 'rgba(225, 176, 114, 0.2)',
    borderColor: '#e1b072',
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignSelf: 'center',
    marginVertical: 20,
    shadowColor: '#e1b072',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  gateButtonText: {
    color: '#e1b072',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    textAlign: 'center',
  },
});