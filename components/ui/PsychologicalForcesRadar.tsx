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
  size = 300 
}) => {
  const center = size / 2;
  const radius = (size / 2) * 0.5;
  const steps = 5;

  // ── Entrance animation: scale factor 0 → 1 over 800ms with ease-out ──
  const [scale, setScale] = useState(0);

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

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas style={{ width: size, height: size, position: 'absolute' }}>
        {/* Draw concentric grid circles */}
        {Array.from({ length: steps }).map((_, i) => {
          const r = radius * ((i + 1) / steps);
          return (
            <Circle
              key={`grid-circle-${i}`}
              cx={center}
              cy={center}
              r={r}
              color="rgba(255, 255, 255, 0.1)"
              style="stroke"
              strokeWidth={1}
            />
          );
        })}

        {/* Draw axes */}
        {forces.map((force, i) => {
          const outerPoint = getCoordinates(100, i);
          return (
            <SkiaLine
              key={`axis-${i}`}
              p1={vec(center, center)}
              p2={vec(outerPoint.x, outerPoint.y)}
              color="rgba(255, 255, 255, 0.15)"
              strokeWidth={1}
            />
          );
        })}

        {/* The Data Polygon */}
        <Path path={skiaPath} style="fill">
          <SkiaRadialGradient
            c={vec(center, center)}
            r={radius}
            colors={[`${dominantForce}66`, `${dominantForce}0D`]}
          />
        </Path>
        <Path path={skiaPath} color={dominantForce} style="stroke" strokeWidth={2} strokeJoin="round" />
        
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
});
