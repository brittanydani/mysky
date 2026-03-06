import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, TSpan, Defs, RadialGradient, Stop } from 'react-native-svg';
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

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={dominantForce} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={dominantForce} stopOpacity="0.05" />
          </RadialGradient>
        </Defs>

        {/* Draw concentric grid circles */}
        {Array.from({ length: steps }).map((_, i) => {
          const r = radius * ((i + 1) / steps);
          return (
            <Circle
              key={`grid-circle-${i}`}
              cx={center}
              cy={center}
              r={r}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
              fill="none"
              strokeDasharray={i === steps - 1 ? 'none' : '4 4'}
            />
          );
        })}

        {/* Draw axes and labels */}
        {forces.map((force, i) => {
          const outerPoint = getCoordinates(100, i);
          const labelPoint = getCoordinates(100, i, true);
          
          return (
            <React.Fragment key={`axis-${i}`}>
              <Line
                x1={center}
                y1={center}
                x2={outerPoint.x}
                y2={outerPoint.y}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
              />
              <SvgText
                x={labelPoint.x}
                y={labelPoint.y}
                fill={force.color}
                fontSize="12"
                fontWeight="600"
                textAnchor={
                  Math.abs(labelPoint.x - center) < 10 
                    ? "middle" 
                    : labelPoint.x < center 
                      ? "end" 
                      : "start"
                }
                alignmentBaseline="middle"
                fontFamily={Platform.select({ ios: 'Georgia', android: 'serif' })}
              >
                {/* Fallback to original story labels if it's not mapped, slicing cleanly if we ever bypass it */}
                {(SHORT_FORCE_LABELS[force.label] ? SHORT_FORCE_LABELS[force.label] : applyStoryLabels(force.label)).split(' ').map((word, wIdx, arr) => (
                  <TSpan
                    key={wIdx}
                    x={labelPoint.x}
                    dy={wIdx === 0 ? `-${(arr.length - 1) * 0.5}em` : '1.2em'}
                  >
                    {word.substring(0, 10)}
                  </TSpan>
                ))}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* The Data Polygon */}
        <Polygon
          points={polygonPoints}
          fill="url(#radarFill)"
          stroke={dominantForce}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* Force Points */}
        {forces.map((force, i) => {
          const { x, y } = getCoordinates(force.value, i);
          return (
            <Circle
              key={`point-${i}`}
              cx={x}
              cy={y}
              r="4"
              fill={force.color}
              stroke="#07090F"
              strokeWidth="1"
            />
          );
        })}
      </Svg>
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
