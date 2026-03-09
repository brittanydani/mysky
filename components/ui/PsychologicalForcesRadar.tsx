import React, { useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Canvas, Path, Circle, vec, Line as SkiaLine, RadialGradient as SkiaRadialGradient } from '@shopify/react-native-skia';
import { theme } from '../../constants/theme';
import { applyStoryLabels } from '../../constants/storyLabels';

interface ForceData {
  label: string;
  value: number; // 0 to 100
  color: string;
}

interface PsychologicalForcesRadarProps {
  forces: ForceData[];
  size?: number;
  behavioralForces?: ForceData[]; // 30-day adaptive layer (optional)
}

const SHORT_FORCE_LABELS: Record<string, string> = {
  'Sun': 'Vitality',
  'Moon': 'Emotion',
  'Mercury': 'Intellect', 
  'Venus': 'Relate',
  'Mars': 'Action',
  'Jupiter': 'Expand',
  'Saturn': 'Focus',
  'Uranus': 'Change',
  'Neptune': 'Spirit',
  'Pluto': 'Rebirth',
  'Chiron': 'Healing',
  'Aries': 'Spark',
  'Taurus': 'Rooted',
  'Gemini': 'Curious',
  'Cancer': 'Feeling',
  'Leo': 'Radiant',
  'Virgo': 'Logic',
  'Libra': 'Harmony',
  'Scorpio': 'Depth',
  'Sagittarius': 'Vision',
  'Capricorn': 'Mastery',
  'Aquarius': 'Rebel',
  'Pisces': 'Empathy',
};

export const PsychologicalForcesRadar: React.FC<PsychologicalForcesRadarProps> = ({ 
  forces, 
  size = 300,
  behavioralForces,
}) => {
  const center = size / 2;
  const radius = (size / 2) * 0.5;
  const steps = 5;

  // ── Entrance animation: scale factor 0 → 1 over 800ms with ease-out ──
  const [scale, setScale] = useState(0);
  // ── Pulse / breathe: continuous sine oscillation after entrance ──
  const [pulseAlpha, setPulseAlpha] = useState(0.4);

  useEffect(() => {
    const DURATION = 800;
    const start = Date.now();
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / DURATION, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setScale(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [forces.length]);

  useEffect(() => {
    const PULSE_PERIOD = 3000; // ms per full breathe cycle
    const startTs = Date.now();
    let pulseRaf: number;

    const pulseTick = () => {
      const elapsed = (Date.now() - startTs) % PULSE_PERIOD;
      const t = elapsed / PULSE_PERIOD;
      // smooth sine wave 0..1..0
      const sine = (Math.sin(Math.PI * 2 * t - Math.PI / 2) + 1) / 2;
      setPulseAlpha(0.35 + 0.35 * sine); // oscillates 0.35 → 0.70
      pulseRaf = requestAnimationFrame(pulseTick);
    };

    pulseRaf = requestAnimationFrame(pulseTick);
    return () => cancelAnimationFrame(pulseRaf);
  }, []);

  // Calculate coordinates for a given value and index
  const getCoordinates = (value: number, index: number, isLabel: boolean = false) => {
    // Offset by -90 degrees (Math.PI / 2) to start at the top
    const angle = (Math.PI * 2 * index) / forces.length - Math.PI / 2;
    const r = isLabel ? radius * 1.65 : (radius * value) / 100;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const polygonPoints = useMemo(() => {
    return forces
      .map((f, i) => {
        const { x, y } = getCoordinates(f.value * scale, i);
        return `${x},${y}`;
      })
      .join(' ');
  }, [forces, center, radius, scale]);

  // Determine the dominant force color for the fill gradient
  const dominantForce = useMemo(() => {
    if (forces.length === 0) return theme.primary;
    return forces.reduce((prev, current) => (prev.value > current.value ? prev : current)).color;
  }, [forces]);

  // Map valid polygon points for Skia Path
  const skiaPath = useMemo(() => {
    if (forces.length === 0) return '';
    const points = forces.map((f, i) => getCoordinates(f.value * scale, i));
    const start = points[0];
    let path = `M${start.x},${start.y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x},${points[i].y}`;
    }
    path += ' Z';
    return path;
  }, [forces, center, radius, scale]);

  // ── Behavioral overlay path (check-in derived, 30-day adaptation) ──
  const behavioralPath = useMemo(() => {
    if (!behavioralForces || behavioralForces.length === 0) return '';
    const refForces = behavioralForces.length === forces.length ? behavioralForces : forces;
    const points = refForces.map((f, i) => getCoordinates(f.value * scale, i));
    const start = points[0];
    let path = `M${start.x},${start.y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x},${points[i].y}`;
    }
    path += ' Z';
    return path;
  }, [behavioralForces, forces, center, radius, scale]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas style={{ width: size, height: size, position: 'absolute' }}>
        {/* Draw concentric grid circles — Silver: the unshakable natal past */}
        {Array.from({ length: steps }).map((_, i) => {
          const r = radius * ((i + 1) / steps);
          return (
            <Circle
              key={`grid-circle-${i}`}
              cx={center}
              cy={center}
              r={r}
              color="rgba(192, 192, 192, 0.12)"
              style="stroke"
              strokeWidth={1}
            />
          );
        })}

        {/* Draw axes — silver tones for natal architecture */}
        {forces.map((force, i) => {
          const outerPoint = getCoordinates(100, i);
          return (
            <SkiaLine
              key={`axis-${i}`}
              p1={vec(center, center)}
              p2={vec(outerPoint.x, outerPoint.y)}
              color="rgba(192, 192, 192, 0.18)"
              strokeWidth={1}
            />
          );
        })}

        {/* Behavioral overlay polygon — Gold: 30-day alchemized experience */}
        {behavioralPath ? (
          <>
            <Path path={behavioralPath} style="fill" color="rgba(212,175,55,0.07)" />
            <Path
              path={behavioralPath}
              color="rgba(212,175,55,0.55)"
              style="stroke"
              strokeWidth={1.4}
              strokeJoin="round"
            />
          </>
        ) : null}

        {/* The Data Polygon — fill breathes with pulseAlpha */}
        <Path path={skiaPath} style="fill">
          <SkiaRadialGradient
            c={vec(center, center)}
            r={radius}
            colors={[
              `${dominantForce}${Math.round(pulseAlpha * 255).toString(16).padStart(2, '0')}`,
              `${dominantForce}0D`,
            ]}
          />
        </Path>
        {/* Outer glow stroke that pulses */}
        <Path
          path={skiaPath}
          color={`${dominantForce}${Math.round(pulseAlpha * 0.55 * 255).toString(16).padStart(2, '0')}`}
          style="stroke"
          strokeWidth={8}
          strokeJoin="round"
          opacity={0.4}
        />
        <Path path={skiaPath} color={dominantForce} style="stroke" strokeWidth={1.8 + pulseAlpha} strokeJoin="round" />
        
        {/* Force Points */}
        {forces.map((force, i) => {
          const { x, y } = getCoordinates(force.value * scale, i);
          return (
            <Circle
              key={`point-${i}`}
              cx={x}
              cy={y}
              r={4}
              color={force.color}
            />
          );
        })}
      </Canvas>

      {/* HTML absolute text for labels */}
      {forces.map((force, i) => {
        const labelPoint = getCoordinates(100, i, true);
        const txtAlign = Math.abs(labelPoint.x - center) < 10 ? 'center' : (labelPoint.x < center ? 'right' : 'left');
        const topOffset = txtAlign === 'center' && labelPoint.y < center ? -20 : -10;

        const textContent = SHORT_FORCE_LABELS[force.label] ? SHORT_FORCE_LABELS[force.label] : applyStoryLabels(force.label);

        return (
          <View 
            key={`text-${i}`} 
            style={{ 
              position: 'absolute', 
              top: labelPoint.y + topOffset, 
              left: labelPoint.x + (txtAlign === 'center' ? -50 : (txtAlign === 'right' ? -105 : 5)), 
              width: 100, 
              alignItems: txtAlign === 'center' ? 'center' : (txtAlign === 'right' ? 'flex-end' : 'flex-start')
            }}>
              <Text 
                numberOfLines={1}
                style={{ 
                  color: force.color, 
                  fontSize: 12, 
                  fontWeight: '600', 
                  fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' })
                }}>
                {textContent}
              </Text>
          </View>
        );
      })}

      {/* Legend — shown only when behavioral layer is present */}
      {behavioralForces && behavioralForces.length > 0 && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: dominantForce }]} />
            <Text style={styles.legendText}>Natal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(139,196,232,0.6)' }]} />
            <Text style={styles.legendText}>Behavioral (30d)</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  legend: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    color: 'rgba(240,234,214,0.50)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
