import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Gauge = ({ label, value }: { label: string, value: number }) => {
  return (
    <View style={styles.gaugeContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%`, backgroundColor: value > 80 ? '#FF3B30' : '#34C759' }]} />
      </View>
    </View>
  );
};

export const DomainPressureCards = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DOMAIN PRESSURE</Text>
      <Gauge label="Focus" value={85} />
      <Gauge label="Connection" value={45} />
      <Gauge label="Movement" value={70} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#111',
    borderRadius: 20,
    marginVertical: 10,
    width: '90%',
  },
  title: {
    color: '#8A8A8E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
  },
  gaugeContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  track: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  }
});
