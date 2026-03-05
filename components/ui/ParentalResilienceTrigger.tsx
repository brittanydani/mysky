import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export const ParentalResilienceTrigger = () => {
  const router = useRouter();

  const handleTrigger = () => {
    // Navigates to the specialized Somatic Gate session
    router.push('/(tabs)/weather'); // or '/somatic-gate' if that's exposed
  };

  return (
    <TouchableOpacity onPress={handleTrigger} activeOpacity={0.8} style={styles.button}>
      <Text style={styles.title}>VAGUS NERVE RESET</Text>
      <Text style={styles.subtitle}>60s Deep-Link for High-Stress Moments</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 18,
    backgroundColor: '#rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    width: '90%',
  },
  title: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    color: '#FF3B30',
    opacity: 0.8,
    fontSize: 12,
  },
});
