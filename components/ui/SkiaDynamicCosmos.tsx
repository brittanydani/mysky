import React from 'react';
import { StyleSheet, View } from 'react-native';

export const SkiaDynamicCosmos = ({ fill }: { fill?: string }) => {
  if (!fill) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: fill }]}
      pointerEvents="none"
    />
  );
};
