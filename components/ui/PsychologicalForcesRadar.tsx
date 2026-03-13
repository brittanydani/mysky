import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Canvas, Path, Circle, vec, Line as SkiaLine, RadialGradient as SkiaRadialGradient, BlurMask } from '@shopify/react-native-skia';
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
  const radius = (size / 2) * 0.5; // Slightly smaller to ensure full visibility
  const steps = 5;

  // Calculate coordinates for a given value and index
  const getCoordinates = (value: number, index: number, isLabel: boolean = false) => {
    // Offset by -90 degrees (Math.PI / 2) to start at the top
    const angle = (Math.PI * 2 * index) / forces.length - Math.PI / 2;
    const r = isLabel ? radius * 1.5 : (radius * value) / 100;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const polygonPoints = useMemo(() => {
    return forces
      .map((f, i) => {
        const { x, y } = getCoordinates(f.value, i);
        return `${x},${y}`;
      })
      .join(' ');
  }, [forces, center, radius]);

  // Determine the dominant force color for the fill gradient
  const dominantForce = useMemo(() => {
    if (forces.length === 0) return theme.primary;
    return forces.reduce((prev, current) => (prev.value > current.value ? prev : current)).color;
  }, [forces]);

  // Map valid polygon points for Skia Path
  const skiaPath = useMemo(() => {
    if (forces.length === 0) return '';
    const points = forces.map((f, i) => getCoordinates(f.value, i));
    const start = points[0];
    let path = `M${start.x},${start.y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x},${points[i].y}`;
    }
    path += ' Z';
    return path;
  }, [forces, center, radius]);

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

        {/* The Data Polygon — glow layer beneath */}
        <Path path={skiaPath} style="fill" opacity={0.35}>
          <SkiaRadialGradient
            c={vec(center, center)}
            r={radius}
            colors={[`${dominantForce}CC`, `${dominantForce}22`]}
          />
          <BlurMask blur={14} style="normal" />
        </Path>

        {/* The Data Polygon — solid fill */}
        <Path path={skiaPath} style="fill">
          <SkiaRadialGradient
            c={vec(center, center)}
            r={radius}
            colors={[`${dominantForce}55`, `${dominantForce}10`]}
          />
        </Path>
        <Path path={skiaPath} color={dominantForce} style="stroke" strokeWidth={2} strokeJoin="round" opacity={0.85} />
        
        {/* Force Points — glow halo + crisp dot */}
        {forces.map((force, i) => {
          const { x, y } = getCoordinates(force.value, i);
          return (
            <React.Fragment key={`point-${i}`}>
              <Circle cx={x} cy={y} r={9} color={force.color} opacity={0.25}>
                <BlurMask blur={7} style="normal" />
              </Circle>
              <Circle cx={x} cy={y} r={4} color={force.color} />
              <Circle cx={x} cy={y} r={1.8} color="rgba(255,255,255,0.80)" />
            </React.Fragment>
          );
        })}
      </Canvas>

      {/* Text labels anchored to axis endpoints */}
      {forces.map((force, i) => {
        const labelPoint = getCoordinates(100, i, true);
        const isLeft   = labelPoint.x < center - 10;
        const isRight  = labelPoint.x > center + 10;
        const isCenter = !isLeft && !isRight;
        const isAbove  = labelPoint.y < center;

        const leftOffset = isCenter ? -50 : isLeft ? -108 : 8;
        const topOffset  = isCenter ? (isAbove ? -22 : 4) : -10;

        const textContent = SHORT_FORCE_LABELS[force.label] ? SHORT_FORCE_LABELS[force.label] : applyStoryLabels(force.label);

        return (
          <View
            key={`text-${i}`}
            style={{
              position: 'absolute',
              top: labelPoint.y + topOffset,
              left: labelPoint.x + leftOffset,
              width: 100,
              alignItems: isCenter ? 'center' : isLeft ? 'flex-end' : 'flex-start',
            }}>
            <Text
              numberOfLines={1}
              style={{
                color: 'rgba(226,232,240,0.72)',
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 0.3,
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
