import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkiaDomainCard } from '../ui/SkiaDomainCard';

export function LifeDomainPressures() {
  const domains = [
    {
      label: 'Focus',
      color: '#D4AF37',
      pressure: 0.85,
      status: 'High Architectural Clarity.',
    },
    {
      label: 'Connection',
      color: '#6EBF8B',
      pressure: 0.65,
      status: 'Resilient Parental Flow.',
    },
    {
      label: 'Movement',
      color: '#CD7F5D',
      pressure: 0.90,
      status: 'Grounding Recommended.',
    },
  ];

  return (
    <View style={styles.container}>
      {domains.map((domain, index) => (
        <SkiaDomainCard
          key={index}
          label={domain.label}
          color={domain.color}
          pressure={domain.pressure}
          status={domain.status}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
    rowGap: 16,
  },
});
