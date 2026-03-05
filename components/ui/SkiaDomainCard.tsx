import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  SweepGradient,
  vec,
  BlurMask,
  Circle,
  Group,
} from '@shopify/react-native-skia';

const { width } = Dimensions.get('window');
const CARD_W = width * 0.44; // Optimized for a 2-column grid
const RADIUS = 35;
const CENTER = CARD_W / 2;

interface DomainProps {
  label: string;
  pressure: number; // 0.0 to 1.0
  color: string;
  status: string;
}

export const SkiaDomainCard = ({ label, pressure, color, status }: DomainProps) => {
  const arcPath = useMemo(() => {
    const p = Skia.Path.Make();
    // Create an incomplete circle arc representing current pressure
    p.addArc(
      Skia.XYWHRect(CENTER - RADIUS, 30, RADIUS * 2, RADIUS * 2),
      135,
      270 * pressure
    );
    return p;
  }, [pressure]);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      
      <Canvas style={{ width: CARD_W, height: 100 }}>
        <Group>
          {/* Background Track */}
          <Circle cx={CENTER} cy={30 + RADIUS} r={RADIUS} style="stroke" strokeWidth={4} color="rgba(255,255,255,0.05)" />
          
          {/* Active Pressure Arc */}
          <Path path={arcPath} style="stroke" strokeWidth={6} strokeCap="round" color={color}>
            <BlurMask blur={8} style="outer" />
          </Path>
          <Path path={arcPath} style="stroke" strokeWidth={4} strokeCap="round" color={color} />
        </Group>
      </Canvas>

      <Text style={[styles.status, { color }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: -20,
    textAlign: 'center',
  }
});