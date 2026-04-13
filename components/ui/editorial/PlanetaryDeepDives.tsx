import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { VelvetGlassCard } from './VelvetGlassCard';
import { SkiaGradientText } from './SkiaGradientText';
import { Colors, Typography, Spacing, Layout } from './theme';

// --- TYPES & MOCK DATA ---

type ElementType = 'Fire' | 'Earth' | 'Air' | 'Water';
type ModalityType = 'Cardinal' | 'Fixed' | 'Mutable';

interface PlanetData {
  id: string;
  planetName: string;
  glyph: string;
  sign: string;
  element: ElementType;
  modality: ModalityType;
  degree: string;
  house: number;
  coreMeaning: string;
  signExpression: string;
  housePlacement: string;
}

const MOCK_PLANETS: PlanetData[] = [
  {
    id: '1',
    planetName: 'Sun',
    glyph: '☉',
    sign: 'Pisces',
    element: 'Water',
    modality: 'Mutable',
    degree: "10°58'",
    house: 10,
    coreMeaning: 'Governs your core identity, ego, vitality, and ultimate life purpose.',
    signExpression: 'Expresses with empathic sensitivity, imagination, and a permeable openness to the invisible currents of life.',
    housePlacement: 'Activates in the area of career, public role, reputation, and long-term legacy.',
  },
  {
    id: '2',
    planetName: 'Moon',
    glyph: '☽',
    sign: 'Libra',
    element: 'Air',
    modality: 'Cardinal',
    degree: "14°40'",
    house: 5,
    coreMeaning: 'Governs your emotions, baseline instincts, inner needs, and unconscious behavioral patterns.',
    signExpression: 'Expresses through a need for diplomacy, aesthetic awareness, and a deep relational focus.',
    housePlacement: 'Activates in the area of creativity, romance, spontaneous joy, and self-expression.',
  }
];

// --- MICRO-COMPONENTS ---

/**
 * Clean, subtle tag for planetary metadata (Element & Modality)
 */
const MetaTag = ({ label }: { label: string }) => (
  <View style={styles.tagContainer}>
    <Text style={Typography.pillLabel}>{label}</Text>
  </View>
);

// --- MAIN COMPONENTS ---

const PlanetCard = ({ data }: { data: PlanetData }) => {
  return (
    // Default navy tint ensures the gold glyph pops beautifully
    <VelvetGlassCard tint="navy" style={styles.cardSpacing}>
      
      {/* Header: Gold Glyph, Planet Name, and Sign */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.glyphWrapper}>
            <SkiaGradientText text={data.glyph} variant="h1" />
          </View>
          <View>
            <Text style={[Typography.hero, { fontSize: 28, lineHeight: 32 }]}>
              {data.sign}
            </Text>
            <Text style={[Typography.h2, { color: Colors.textSecondary, marginTop: -4 }]}>
              {data.planetName}
            </Text>
          </View>
        </View>
      </View>

      {/* Metadata Tags */}
      <View style={styles.tagsRow}>
        <MetaTag label={data.element} />
        <MetaTag label={data.modality} />
      </View>

      {/* Editorial Narrative (Broken into scannable chunks) */}
      <View style={styles.narrativeContainer}>
        <Text style={Typography.body}>
          <Text style={styles.boldLeadIn}>The Core: </Text>
          {data.coreMeaning}
        </Text>
        
        <Text style={Typography.body}>
          <Text style={styles.boldLeadIn}>In {data.sign}: </Text>
          {data.signExpression}
        </Text>
        
        <Text style={Typography.body}>
          <Text style={styles.boldLeadIn}>House {data.house}: </Text>
          {data.housePlacement}
        </Text>
      </View>

      {/* Subtle Footer Divider and Data */}
      <View style={styles.footer}>
        <Text style={Typography.bodyDetail}>
          Degree: {data.degree}
        </Text>
        <Text style={Typography.bodyDetail}>
          •
        </Text>
        <Text style={Typography.bodyDetail}>
          House: {data.house}
        </Text>
      </View>
      
    </VelvetGlassCard>
  );
};

export const PlanetaryDeepDivesSection = () => {
  return (
    <View style={styles.sectionContainer}>
      
      {/* Gold Eyebrow Header */}
      <View style={styles.sectionHeader}>
        <SkiaGradientText 
          text="PLANETARY DEEP-DIVES" 
          variant="h2" 
          direction="horizontal" 
        />
      </View>

      <FlatList
        data={MOCK_PLANETS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PlanetCard data={item} />}
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
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center', // Centers the gold eyebrow header
  },
  cardSpacing: {
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  glyphWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(214, 199, 180, 0.05)', // Extremely subtle taupe backing
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tagContainer: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Layout.pillRadius,
    backgroundColor: 'rgba(3, 7, 18, 0.4)',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  narrativeContainer: {
    gap: Spacing.md, // 16px space between narrative blocks
    marginBottom: Spacing.xl,
  },
  boldLeadIn: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
});
