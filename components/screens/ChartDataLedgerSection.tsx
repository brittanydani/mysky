import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SkiaGradient as LinearGradient } from '../ui/SkiaGradient';
import { VelvetGlassSurface } from '../ui/VelvetGlassSurface';
import { useThemedStyles, useAppTheme } from '../../context/ThemeContext';
import { type AppTheme } from '../../constants/theme';

// ── TYPES ──

export interface LedgerRow {
  id: string;
  glyph?: string;
  planetName: string;
  signName: string;
  degree: string;
  house?: number;
  isRetrograde?: boolean;
}

interface Props {
  title?: string;
  subtitle?: string;
  rows: LedgerRow[];
}

// ── COMPONENT ──

export const ChartDataLedgerSection = ({ title = 'Complete Placements', subtitle, rows }: Props) => {
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();

  if (rows.length === 0) return null;

  const washColors = theme.cardSurfaceAnchor as [string, string];

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>

      {/* Single High-End Module Card */}
      <VelvetGlassSurface style={[styles.card, styles.velvetBorder]} intensity={40}>
        <LinearGradient colors={washColors} style={StyleSheet.absoluteFill} />

        {/* Column Headers */}
        <View style={styles.columnHeaders}>
          <Text style={[styles.colHeader, { flex: 3 }]} numberOfLines={1}>PLANET</Text>
          <Text style={[styles.colHeader, styles.rightHeader]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>SIGN · DEGREE · HOUSE</Text>
        </View>

        {/* Flat Ledger Rows */}
        {rows.map((row, i) => (
          <View
            key={row.id}
            style={[styles.row, i < rows.length - 1 && styles.rowDivider]}
          >
            {/* Left: Glyph + Planet name */}
            <View style={styles.leftCol}>
              {row.glyph ? (
                <Text style={styles.glyphText}>{row.glyph}</Text>
              ) : null}
              <Text style={styles.planetName} numberOfLines={1}>{row.planetName}</Text>
              {row.isRetrograde && (
                <Text style={styles.retroBadge}>℞</Text>
              )}
            </View>

            {/* Right: Sign (metallic gold) + degree + house */}
            <View style={styles.rightCol}>
              <Text style={styles.signName}>{row.signName}</Text>
              <Text style={styles.degreeMeta}>
                {row.degree}{row.house ? `  ·  H${row.house}` : ''}
              </Text>
            </View>
          </View>
        ))}
      </VelvetGlassSurface>
    </Animated.View>
  );
};

// ── STYLES ──

const createStyles = (theme: AppTheme) => StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 4,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    padding: 0,
  },
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderLeftColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  columnHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  colHeader: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '800',
    letterSpacing: 2,
  },
  rightHeader: {
    flex: 4.6,
    textAlign: 'right',
    fontSize: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  leftCol: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glyphText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
    width: 18,
    textAlign: 'center',
  },
  planetName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  retroBadge: {
    fontSize: 10,
    color: '#DC5050',
    fontWeight: '700',
    marginLeft: 2,
  },
  rightCol: {
    flex: 4,
    alignItems: 'flex-end',
    gap: 2,
  },
  signName: {
    fontSize: 14,
    color: '#CFAE73',
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  degreeMeta: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    letterSpacing: 1,
  },
});
