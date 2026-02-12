// File: components/ui/ChakraWheelPlate.tsx
// MySky — Chakra Wheel background plate (PNG) with “floating card” shadow

import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';

interface ChakraWheelPlateProps {
  size: number;
  children?: React.ReactNode;
}

export default function ChakraWheelPlate({ size, children }: ChakraWheelPlateProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {/* Floating shadow UNDER the plate */}
      <View style={[styles.plateShadow, { width: size, height: size, borderRadius: size / 2 }]} />

      {/* Plate image */}
      <Image
        source={require('../../assets/images/chakra-wheel-bg.png')}
        style={[styles.bg, { width: size, height: size }]}
        resizeMode="contain"
      />

      {/* Content above plate */}
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateShadow: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.001)',

    // iOS shadow (true shadow)
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },

    // Android shadow (elevation)
    elevation: Platform.OS === 'android' ? 10 : 0,
  },
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
