import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SomaticHeatMap } from '../components/reflect/SomaticHeatMap';
import { StabilityRecurrences } from '../components/reflect/StabilityRecurrences';
import { ResetEfficacy } from '../components/reflect/ResetEfficacy';

export default function ReflectScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Reflect / Patterns</Text>
          <Text style={styles.subtitle}>Insights into your stability over time.</Text>
        </View>

        <SomaticHeatMap />
        <StabilityRecurrences />
        <ResetEfficacy />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
});
