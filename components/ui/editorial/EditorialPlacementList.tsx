import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VelvetGlassCard } from './VelvetGlassCard';
import { SkiaGradientText } from './SkiaGradientText';
import { Colors, Typography, Spacing } from './theme';

export interface DataPlacement {
  id: string;
  glyph?: string;
  icon?: React.ReactNode;
  name: string;
  sign: string;
  degree: string;
  house?: number | string;
}

interface EditorialPlacementListProps {
  title: string;
  subtitle?: string;
  data: DataPlacement[];
  bottomContent?: React.ReactNode;
}

const DataRow = ({ item, isLast }: { item: DataPlacement; isLast: boolean }) => {
  return (
    <View style={[styles.rowContainer, !isLast && styles.rowDivider]}>
      {/* Left side: Glyph and Planet Name */}
      <View style={styles.leftContent}>
        <View style={styles.glyphContainer}>
          {item.glyph ? (
             <SkiaGradientText text={item.glyph} variant="h2" direction="vertical" />
          ) : (
             item.icon
          )}
        </View>
        <Text style={[Typography.body, styles.planetName]}>{item.name}</Text>
      </View>

      {/* Right side: Sign, Degree, House */}
      <View style={styles.rightContent}>
        <Text style={[Typography.body, styles.signText]}>{item.sign}</Text>
        <View style={styles.metaDataContainer}>
          <Text style={Typography.bodyDetail}>{item.degree}</Text>
          {item.house ? (
            <>
              <Text style={styles.metaDot}>•</Text>
              <Text style={Typography.bodyDetail}>H{item.house}</Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export const EditorialPlacementList = ({ title, subtitle, data, bottomContent }: EditorialPlacementListProps) => {
  if (data.length === 0) return null;
  
  return (
    <View style={styles.sectionContainer}>
      
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={Typography.h1}>{title}</Text>
        {subtitle && <Text style={Typography.bodyDetail}>{subtitle}</Text>}
      </View>

      {/* Unified Velvet Glass Container */}
      <VelvetGlassCard tint="navy">
        
        {/* Table Column Headers */}
        <View style={styles.columnHeaders}>
          <Text style={[Typography.pillLabel, { color: Colors.textSecondary }]}>PLANET</Text>
          <Text style={[Typography.pillLabel, { color: Colors.textSecondary, textAlign: 'right' }]}>PLACEMENT</Text>
        </View>

        {/* The Flat List */}
        <View style={styles.listContainer}>
          {data.map((item, index) => (
            <DataRow 
              key={item.id} 
              item={item} 
              isLast={index === data.length - 1 && !bottomContent} 
            />
          ))}
          {bottomContent && (
             <View style={{ marginTop: Spacing.md }}>
               {bottomContent}
             </View>
          )}
        </View>

      </VelvetGlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.section,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  columnHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginBottom: Spacing.xs,
  },
  listContainer: {},
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  glyphContainer: {
    width: 24,
    alignItems: 'center',
  },
  planetName: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  signText: {
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  metaDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    fontFamily: Typography.bodyDetail.fontFamily,
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
    opacity: 0.5,
  },
});
