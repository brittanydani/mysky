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
import { Aspect } from '../../services/astrology/types';

// ── CONSTANTS ──

const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: '☌',
  sextile: '✱',
  square: '□',
  trine: '△',
  opposition: '☍',
  quincunx: '⊻',
  semisextile: '∨',
  sesquiquadrate: '⊞',
};

const ASPECT_NATURE: Record<string, 'Harmonious' | 'Challenging' | 'Neutral'> = {
  conjunction: 'Neutral',
  sextile: 'Harmonious',
  square: 'Challenging',
  trine: 'Harmonious',
  opposition: 'Challenging',
  quincunx: 'Challenging',
  semisextile: 'Neutral',
  sesquiquadrate: 'Challenging',
};

const NATURE_COLOR: Record<string, string> = {
  Harmonious: '#608A8D',  // Sage / teal
  Challenging: '#A88BEB', // Nebula purple
  Neutral: '#A49E97',     // Taupe
};

const NATURE_WASH: Record<string, [string, string]> = {
  Harmonious: ['rgba(96, 138, 141, 0.24)', 'rgba(96, 138, 141, 0.08)'],
  Challenging: ['rgba(168, 139, 235, 0.20)', 'rgba(168, 139, 235, 0.06)'],
  Neutral: ['rgba(164, 158, 151, 0.28)', 'rgba(120, 116, 111, 0.12)'],
};

// ── TYPES ──

interface Props {
  aspects: Aspect[];
  limit?: number;
}

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && 'name' in v) return (v as { name: string }).name;
  return '';
}

// ── COMPONENT ──

export const ChartAspectsModuleSection = ({ aspects, limit = 6 }: Props) => {
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();

  const displayed = aspects
    .slice()
    .sort((a, b) => (a.orb ?? 99) - (b.orb ?? 99))
    .slice(0, limit);

  if (displayed.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Strongest Aspects</Text>
        <Text style={styles.sectionSubtitle}>ENERGY FLOWS & PLANETARY DIALOGUES</Text>
      </View>

      <View style={styles.grid}>
        {displayed.map((aspect, i) => {
          const typeName = safeStr(aspect?.type?.name ?? (aspect as any)?.type).toLowerCase();
          const planet1 = safeStr(aspect.planet1 ?? (aspect as any).body1);
          const planet2 = safeStr(aspect.planet2 ?? (aspect as any).body2);
          const symbol = ASPECT_SYMBOLS[typeName] ?? '◦';
          const nature = ASPECT_NATURE[typeName] ?? 'Neutral';
          const iconColor = NATURE_COLOR[nature];
          const washColors = NATURE_WASH[nature];
          const orbDeg = aspect.orb != null ? `${aspect.orb.toFixed(1)}°` : '';
          const typeLabel = typeName.charAt(0).toUpperCase() + typeName.slice(1);

          return (
            <Animated.View
              key={`${planet1}-${typeName}-${planet2}`}
              entering={FadeInDown.delay(200 + i * 70).duration(700)}
            >
              <VelvetGlassSurface style={[styles.card, styles.velvetBorder]} intensity={40}>
                <LinearGradient colors={washColors} style={StyleSheet.absoluteFill} />

                {/* Header: Badge + Type */}
                <View style={styles.cardHeader}>
                  <View style={[styles.hardwareBadge, { borderColor: `${iconColor}30` }]}>
                    <Text style={[styles.symbolText, { color: iconColor }]}>{symbol}</Text>
                  </View>
                  <View style={styles.cardTitles}>
                    <Text style={styles.typeLabel}>{typeLabel}</Text>
                    <Text style={[styles.natureLabel, { color: iconColor }]}>
                      {nature.toUpperCase()}{orbDeg ? `  ·  ${orbDeg} ORB` : ''}
                    </Text>
                  </View>
                </View>

                {/* Dialogue sentence */}
                <Text style={styles.dialogueText}>
                  <Text style={[styles.planetEmphasis, { color: iconColor }]}>{planet1}</Text>
                  {' '}meets{' '}
                  <Text style={[styles.planetEmphasis, { color: iconColor }]}>{planet2}</Text>
                  {' '}— a {nature.toLowerCase()} {typeLabel.toLowerCase()} weaving their energies together.
                </Text>
              </VelvetGlassSurface>
            </Animated.View>
          );
        })}
      </View>
    </View>
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
  grid: {
    gap: 14,
  },
  card: {
    padding: 22,
    borderRadius: 26,
    overflow: 'hidden',
  },
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderLeftColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  hardwareBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
  },
  symbolText: {
    fontSize: 22,
    fontWeight: '400',
    transform: [{ translateY: -1 }],
  },
  cardTitles: {
    flex: 1,
    gap: 3,
  },
  typeLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  natureLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },
  dialogueText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  planetEmphasis: {
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
});
