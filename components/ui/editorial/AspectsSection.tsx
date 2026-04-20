import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, LayoutChangeEvent } from 'react-native';
import { Canvas, Line, vec, LinearGradient, Circle } from '@shopify/react-native-skia';
import { VelvetGlassCard } from './VelvetGlassCard';
import { Colors, Typography, Spacing, Layout } from './theme';

// --- TYPES ---

export type AspectType = 'Harmonious' | 'Challenging' | 'Neutral';

export interface AspectData {
  id: string;
  planet1: string;
  planet2: string;
  aspectName: string; // e.g., "Trine", "Opposition"
  orb: string;
  type: AspectType;
  description: string;
}

const MOCK_ASPECTS: AspectData[] = [
  {
    id: '1',
    planet1: 'Moon',
    planet2: 'Mercury',
    aspectName: 'Trine',
    orb: '0.9°',
    type: 'Harmonious',
    description: 'Feelings and comfort flow naturally with curiosity. This creates an intuitive ease between your emotional needs and your communication style.',
  },
  {
    id: '2',
    planet1: 'Ascendant',
    planet2: 'Descendant',
    aspectName: 'Opposition',
    orb: '0.0°',
    type: 'Challenging',
    description: 'Tension between your outward persona and what you seek in partnerships. This friction drives growth through reconciling both sides of the relationship axis.',
  },
  {
    id: '3',
    planet1: 'Mars',
    planet2: 'Midheaven',
    aspectName: 'Sextile',
    orb: '0.3°',
    type: 'Harmonious',
    description: 'Action, passion, and willpower align effortlessly with your career path and public reputation.',
  }
];

// --- MICRO-COMPONENTS ---

/**
 * A sleek, high-end badge for the aspect type (e.g., 'HARMONIOUS')
 */
const PillBadge = ({ type }: { type: AspectType }) => {
  let tintColor = Colors.textSecondary;
  if (type === 'Harmonious') tintColor = Colors.glassSage;
  if (type === 'Challenging') tintColor = Colors.glassCoral;

  return (
    <View style={[styles.pillContainer, { borderColor: tintColor }]}>
      <Text style={[Typography.pillLabel, { color: tintColor }]}>
        {type}
      </Text>
    </View>
  );
};

/**
 * React Native Skia Mini-Chart: Visualizes the energy flow between two planets.
 */
const AspectEnergyFlow = ({ type }: { type: AspectType }) => {
  const [width, setWidth] = useState(0);
  
  // Determine gradient colors based on the aspect's energy
  const gradientColors = type === 'Harmonious' 
    ? [Colors.glassSage, 'rgba(126, 140, 84, 0.1)'] 
    : type === 'Challenging' 
      ? [Colors.glassCoral, 'rgba(251, 94, 99, 0.1)']
      : [Colors.textSecondary, 'rgba(214, 199, 180, 0.1)'];

  return (
    <View 
      style={styles.energyFlowContainer} 
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Canvas style={{ flex: 1 }}>
          {/* Subtle connecting line with gradient flow */}
          <Line
            p1={vec(0, 10)}
            p2={vec(width, 10)}
            color="transparent"
            style="stroke"
            strokeWidth={1.5}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, 0)}
              colors={gradientColors}
            />
          </Line>
          {/* Anchor dots representing the planets */}
          <Circle cx={2} cy={10} r={2} color={gradientColors[0]} />
          <Circle cx={width - 2} cy={10} r={2} color={gradientColors[1]} />
        </Canvas>
      )}
    </View>
  );
};


// --- MAIN COMPONENTS ---

const AspectCard = ({ data }: { data: AspectData }) => {
  // Map the aspect type to our VelvetGlassCard semantic tints
  const cardTint = data.type === 'Harmonious' ? 'sage' : data.type === 'Challenging' ? 'coral' : 'navy';

  return (
    <VelvetGlassCard tint={cardTint} style={styles.cardSpacing}>
      
      {/* Header Row: Planets and Badge */}
      <View style={styles.cardHeader}>
        <Text style={Typography.h2}>
          {data.planet1} <Text style={{ color: Colors.textSecondary, fontWeight: '400' }}>{data.aspectName}</Text> {data.planet2}
        </Text>
        <PillBadge type={data.type} />
      </View>

      {/* Skia Data Visualization Row */}
      <View style={styles.visualRow}>
        <Text style={[Typography.bodyDetail, { width: 40, textAlign: 'right' }]}>{data.orb}</Text>
        <AspectEnergyFlow type={data.type} />
      </View>

      {/* Editorial Description */}
      <Text style={Typography.body}>
        {data.description}
      </Text>
      
    </VelvetGlassCard>
  );
};

export const AspectsSection = ({ aspects }: { aspects: AspectData[] }) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={Typography.h1}>Strongest Aspects</Text>
        <Text style={Typography.bodyDetail}>
          The geometric angles between planets that shape your internal dialogue.
        </Text>
      </View>

      <FlatList
        data={aspects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AspectCard data={item} />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Assuming this sits inside an outer ScrollView
      />
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
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  cardSpacing: {
    marginBottom: Spacing.md, // Tighter spacing between individual aspect cards
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  visualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    height: 20,
    gap: Spacing.sm,
  },
  energyFlowContainer: {
    flex: 1,
    height: 20,
  },
  pillContainer: {
    borderWidth: 1,
    borderRadius: Layout.pillRadius,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(3, 7, 18, 0.4)', // Darkest substrate to pop the pill off the glass
  },
});
