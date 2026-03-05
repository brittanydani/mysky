// File: components/premium/CircadianWindowDial.tsx
/**
 * Circadian Window Dial
 * A high-end wellness instrument mapping the Atmospheric Context onto a 24-hour cycle.
 * Calculates Biological Clock windows and visualizes them on a rotating Skia dial.
 *
 * Windows:
 * - Gold (Peak Cognition): Best for complex coding or app architecture.
 * - Indigo (Restoration): The optimal window for your nervous system to enter deep sleep.
 * - Silver (Social Battery): High-capacity times for family engagement or meetings.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  Canvas,
  Group,
  Circle,
  Path,
  Skia,
  SweepGradient,
  vec,
  Shadow,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

interface CircadianWindowDialProps {
  size?: number;
  currentHour?: number; // 0-23
}

export const CircadianWindowDial: React.FC<CircadianWindowDialProps> = ({
  size = 300,
  currentHour = new Date().getHours() + new Date().getMinutes() / 60,
}) => {
  const center = size / 2;
  const radius = size * 0.4;
  const strokeWidth = 20;

  // A simple 60FPS rotating needle simulation using reanimated
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  // Derived value for needle position to simulate realtime rotation
  const needleLength = radius - strokeWidth / 2;
  const needlePath = Skia.Path.Make();
  needlePath.moveTo(center, center);
  needlePath.lineTo(center, center - needleLength);

  // Rotate group so top (12 o'clock shape) corresponds to our hour
  // Hour 0 should point up. Our currentHour (0-24).
  const needleAngle = useDerivedValue(() => {
    // 0 hour = 0 degrees, 12 hour = 180 degrees
    const baseAngle = (currentHour / 24) * Math.PI * 2;
    const oscillation = Math.sin(rotation.value * 30) * 0.05;
    return baseAngle + oscillation;
  });

  const transform = useDerivedValue(() => [{ rotate: needleAngle.value }]);

  return (
    <View style={styles.container}>
      <Canvas style={{ width: size, height: size }}>
        <Group>
          {/* Dial Background Base */}
          <Circle cx={center} cy={center} r={radius} color="#1c1c1e" />

          {/* Biological Clock Windows (Sweep Gradient mapping the 24 hours)
              - 23:00 to 07:00 (Restoration): Indigo
              - 09:00 to 14:00 (Peak Cognition): Gold
              - 16:00 to 21:00 (Social Battery): Silver
          */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            style="stroke"
            strokeWidth={strokeWidth}
          >
            <SweepGradient
              c={vec(center, center)}
              colors={[
                '#4B0082', // 00:00 Indigo (Restoration)
                '#4B0082', // 06:00
                '#2c2c2e', // 07:00 Transition
                '#FFD700', // 10:00 Gold (Peak Cognition)
                '#FFD700', // 12:00 Gold
                '#2c2c2e', // 14:00 Transition
                '#C0C0C0', // 18:00 Silver (Social)
                '#C0C0C0', // 20:00 Silver
                '#2c2c2e', // 22:00 Transition
                '#4B0082', // 23:59 Indigo
              ]}
              positions={[0, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.85, 0.9, 1]}
              start={0}
              end={360}
            />
            <Shadow dx={0} dy={0} blur={10} color="rgba(0,0,0,0.5)" />
          </Circle>

          {/* Markers for every 6 hours */}
          {[0, 6, 12, 18].map((hour) => {
            const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
            const x1 = center + Math.cos(angle) * (radius - strokeWidth);
            const y1 = center + Math.sin(angle) * (radius - strokeWidth);
            const x2 = center + Math.cos(angle) * (radius + strokeWidth / 2);
            const y2 = center + Math.sin(angle) * (radius + strokeWidth / 2);
            const p = Skia.Path.Make();
            p.moveTo(x1, y1);
            p.lineTo(x2, y2);
            return (
              <React.Fragment key={`marker-${hour}`}>
                <Group>
                  <Path
                    path={p}
                    color="rgba(255,255,255,0.3)"
                    style="stroke"
                    strokeWidth={2}
                    strokeCap="round"
                  />
                </Group>
              </React.Fragment>
            );
          })}

          {/* The Needle */}
          <Group transform={transform} origin={vec(center, center)}>
            <Path
              path={needlePath}
              color="#FFFFFF"
              style="stroke"
              strokeWidth={3}
              strokeCap="round"
            >
              <Shadow dx={2} dy={4} blur={8} color="rgba(0,0,0,0.4)" />
            </Path>
          </Group>

          {/* Center Hub */}
          <Circle cx={center} cy={center} r={8} color="#FFFFFF">
            <Shadow dx={0} dy={2} blur={4} color="rgba(0,0,0,0.5)" />
          </Circle>
        </Group>
      </Canvas>

      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <View style={[styles.dot, { backgroundColor: '#FFD700' }]} />
          <Text style={styles.metricText}>Peak Cognition</Text>
        </View>
        <View style={styles.metricRow}>
          <View style={[styles.dot, { backgroundColor: '#4B0082' }]} />
          <Text style={styles.metricText}>Restoration</Text>
        </View>
        <View style={styles.metricRow}>
          <View style={[styles.dot, { backgroundColor: '#C0C0C0' }]} />
          <Text style={styles.metricText}>Social Battery</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  metricsContainer: {
    marginTop: 20,
    width: '80%',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  metricText: {
    color: '#E5E5EA',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System', // Replace with theme font if available, e.g., 'CormorantGaramond-Medium'
  },
});
