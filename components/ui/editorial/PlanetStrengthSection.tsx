import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Canvas, Line, Circle, vec, LinearGradient } from '@shopify/react-native-skia';
import { VelvetGlassCard } from './VelvetGlassCard';
import { SkiaGradientText } from './SkiaGradientText';
import { Colors, Typography, Spacing } from './theme';
import { ChartDignityAnalysis } from '../../../services/astrology/dignityService';

// --- TYPES ---

// We map our real app's 'peregrine' string to 'Neutral' and uppercase everything
type DignityDisplay = 'Fall' | 'Detriment' | 'Neutral' | 'Domicile' | 'Exaltation';

interface StrengthData {
  id: string;
  glyph: string;
  planet: string;
  sign: string;
  dignityText: DignityDisplay;
  score: number; // 0-100 (Fall=0, Detriment=25, Peregrine=50, Domicile=75, Exaltation=100)
}

// --- MICRO-COMPONENTS ---

const DignitySpectrum = ({ score }: { score: number }) => {
  const [width, setWidth] = useState(0);

  let dotColor = Colors.textSecondary; // Neutral
  if (score > 50) dotColor = Colors.glassSage;
  if (score < 50) dotColor = Colors.glassCoral;

  return (
    <View 
      style={styles.spectrumContainer}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Canvas style={{ flex: 1 }}>
          {/* Base Track */}
          <Line p1={vec(0, 10)} p2={vec(width, 10)} color="transparent" style="stroke" strokeWidth={2}>
            <LinearGradient
              start={vec(0, 0)} end={vec(width, 0)}
              colors={['rgba(251, 94, 99, 0.3)', 'rgba(214, 199, 180, 0.1)', 'rgba(126, 140, 84, 0.3)']}
            />
          </Line>
          
          {/* Center Tick */}
          <Line p1={vec(width / 2, 6)} p2={vec(width / 2, 14)} color="rgba(214, 199, 180, 0.3)" strokeWidth={1} />

          {/* Indicator Dot */}
          <Circle cx={(score / 100) * width} cy={10} r={4} color={dotColor} />
        </Canvas>
      )}
    </View>
  );
};

const StrengthRow = ({ data, isLast }: { data: StrengthData; isLast: boolean }) => {
  return (
    <View style={[styles.rowContainer, !isLast && styles.rowDivider]}>
      <View style={styles.rowHeader}>
        <View style={styles.planetGroup}>
          <View style={styles.glyphWrapper}>
            <SkiaGradientText text={data.glyph} variant="h2" direction="vertical" />
          </View>
          <Text style={[Typography.body, { fontWeight: '600', color: Colors.textPrimary }]}>{data.planet}</Text>
        </View>
        <View style={styles.dignityLabelGroup}>
          <Text style={[Typography.bodyDetail, { color: Colors.textPrimary }]}>{data.dignityText}</Text>
          <Text style={Typography.bodyDetail}> in {data.sign}</Text>
        </View>
      </View>
      <DignitySpectrum score={data.score} />
    </View>
  );
};

// --- MAIN COMPONENT ---

export const PlanetStrengthSection = ({ dignityAnalysis }: { dignityAnalysis: ChartDignityAnalysis | null }) => {
  if (!dignityAnalysis || dignityAnalysis.planetDignities.length === 0) return null;

  // Transform core service data to UI props
  const mapDignityToScore = (d: string) => {
    switch (d) {
      case 'fall': return 0;
      case 'detriment': return 25;
      case 'exaltation': return 100;
      case 'domicile': return 75;
      case 'peregrine': default: return 50;
    }
  };

  const mapDignityToText = (d: string): DignityDisplay => {
    switch (d) {
      case 'fall': return 'Fall';
      case 'detriment': return 'Detriment';
      case 'exaltation': return 'Exaltation';
      case 'domicile': return 'Domicile';
      case 'peregrine': default: return 'Neutral';
    }
  };

  const getPlanetSymbol = (pName: string) => {
    const table: Record<string, string> = {
      sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
      jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
    };
    return table[pName.toLowerCase()] || '•';
  };

  const data: StrengthData[] = dignityAnalysis.planetDignities
    // In editorial style, we might only want to show planets with actual dignity.
    // If you want to show Peregrine too, we can map them, but let's filter out non-dignified planets
    // to match the original app logic of `filter(d => d.dignity !== 'peregrine')`.
    .filter(d => d.dignity !== 'peregrine')
    .map(d => ({
      id: d.planet,
      glyph: getPlanetSymbol(d.planet),
      planet: d.planet,
      sign: d.sign,
      dignityText: mapDignityToText(d.dignity),
      score: mapDignityToScore(d.dignity),
    }));

  if (data.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={Typography.h1}>Planet Strength & Dignity</Text>
        <Text style={[Typography.bodyDetail, { marginTop: 4 }]}>
          Where your instincts operate with natural ease versus where they face friction.
        </Text>
      </View>

      <VelvetGlassCard tint="navy">
        {data.map((item, index) => (
          <StrengthRow key={item.id} data={item} isLast={index === data.length - 1} />
        ))}
      </VelvetGlassCard>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.section,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  rowContainer: {
    paddingVertical: Spacing.lg,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  planetGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  glyphWrapper: {
    width: 24,
    alignItems: 'center',
  },
  dignityLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spectrumContainer: {
    width: '100%',
    height: 20,
    paddingHorizontal: Spacing.xs,
  },
});
