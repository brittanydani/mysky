import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CircadianWindowDial } from '../components/weather/CircadianWindowDial';
import { SomaticSilhouette } from '../components/weather/SomaticSilhouette';
import { DomainPressureCards } from '../components/weather/DomainPressureCards';
import { SomaticGate } from '../components/reflect/SomaticGate';

export const WeatherScreen = () => {
  const [showGate, setShowGate] = useState(false);

  if (showGate) {
    return <SomaticGate />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>INTERNAL ATMOSPHERE</Text>

      <CircadianWindowDial activeDomain="Peak Cognition" />
      
      <DomainPressureCards />

      <View style={styles.silhouetteContainer}>
        <Text style={styles.subtitle}>SOMATIC SILHOUETTE</Text>
        <SomaticSilhouette />
      </View>

      <TouchableOpacity 
        style={styles.gateButton} 
        onPress={() => setShowGate(true)}
      >
        <Text style={styles.gateButtonText}>CLEAR PRESSURE</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 40,
  },
  subtitle: {
    color: '#8A8A8E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 20,
    marginTop: 20,
  },
  silhouetteContainer: {
    width: '100%',
    height: 400,
    alignItems: 'center',
    marginVertical: 20,
  },
  gateButton: {
    marginTop: 20,
    padding: 18,
    backgroundColor: '#34C759',
    borderRadius: 16,
    width: '90%',
    alignItems: 'center',
  },
  gateButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
