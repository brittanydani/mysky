import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';

/**
 * Desert Titanium subtitle — Apple Editorial subtitle spec.
 * Weight 600, #C5B5A1, letterSpacing 0.5. Drop-in <Text> replacement.
 */
interface GoldSubtitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const GoldSubtitle: React.FC<GoldSubtitleProps> = ({ children, style }) => (
  <Text style={[styles.base, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  base: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C5B5A1',
    letterSpacing: 0.5,
  },
});
