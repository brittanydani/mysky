import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SkiaGradient as LinearGradient } from '../ui/SkiaGradient';
import { MetallicGlyph } from '../ui/MetallicGlyph';
import { VelvetGlassSurface } from '../ui/VelvetGlassSurface';
import { useThemedStyles, useAppTheme } from '../../context/ThemeContext';
import { type AppTheme } from '../../constants/theme';
import { Aspect } from '../../services/astrology/types';
import { getAspectInterpretation } from '../../services/astrology/natalInterpretations';
import { CHART_CARD_WASHES } from './chartCardPalette';

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

const NATURE_WASH: Record<string, [string, string]> = {
  Harmonious: CHART_CARD_WASHES.sage,
  Challenging: CHART_CARD_WASHES.purple,
  Neutral: CHART_CARD_WASHES.taupe,
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

function formatAspectMeaning(text: string): string {
  const trimmed = text.trim();
  const normalized = /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;

  if (/^you may feel /i.test(normalized)) {
    return `A feeling of ${normalized.replace(/^you may feel /i, '')}`;
  }
  if (/^you may find that /i.test(normalized)) {
    return normalized.replace(/^you may find that /i, '').replace(/^./, (char) => char.toUpperCase());
  }
  if (/^you may notice a /i.test(normalized)) {
    return `A ${normalized.replace(/^you may notice a /i, '')}`;
  }
  if (/^you may notice that /i.test(normalized)) {
    return normalized.replace(/^you may notice that /i, '').replace(/^./, (char) => char.toUpperCase());
  }
  if (/^you may need /i.test(normalized)) {
    return `This asks for ${normalized.replace(/^you may need /i, '')}`;
  }
  if (/^you may sense that /i.test(normalized)) {
    return normalized.replace(/^you may sense that /i, '').replace(/^./, (char) => char.toUpperCase());
  }
  if (/^you may experience /i.test(normalized)) {
    return normalized.replace(/^you may experience /i, '').replace(/^./, (char) => char.toUpperCase());
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

// ── COMPONENT ──

export const ChartAspectsModuleSection = ({ aspects, limit = 6 }: Props) => {
  const styles = useThemedStyles(createStyles);
  useAppTheme();

  const displayed = aspects
    .slice()
    .sort((a, b) => (a.orb ?? 99) - (b.orb ?? 99))
    .filter((aspect, index, items) => {
      const typeName = safeStr(aspect?.type?.name ?? (aspect as any)?.type).toLowerCase();
      const planet1 = safeStr(aspect.planet1 ?? (aspect as any).body1);
      const planet2 = safeStr(aspect.planet2 ?? (aspect as any).body2);
      const identity = [planet1, planet2].sort().join('|') + `|${typeName}`;

      return index === items.findIndex((candidate) => {
        const candidateType = safeStr(candidate?.type?.name ?? (candidate as any)?.type).toLowerCase();
        const candidatePlanet1 = safeStr(candidate.planet1 ?? (candidate as any).body1);
        const candidatePlanet2 = safeStr(candidate.planet2 ?? (candidate as any).body2);
        const candidateIdentity = [candidatePlanet1, candidatePlanet2].sort().join('|') + `|${candidateType}`;
        return candidateIdentity === identity;
      });
    })
    .slice(0, limit);

  if (displayed.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Strongest Aspects</Text>
        <Text style={styles.sectionSubtitle}>THE INNER PATTERNS THAT SHAPE HOW DIFFERENT PARTS OF YOU WORK TOGETHER</Text>
        <Text style={styles.sectionIntro}>
          If you are new to astrology, think of each aspect as a relationship between two parts of your personality. These cards are less about prediction and more about understanding your own inner dynamics.
        </Text>
      </View>

      <View style={styles.grid}>
        {displayed.map((aspect, i) => {
          const typeName = safeStr(aspect?.type?.name ?? (aspect as any)?.type).toLowerCase();
          const planet1 = safeStr(aspect.planet1 ?? (aspect as any).body1);
          const planet2 = safeStr(aspect.planet2 ?? (aspect as any).body2);
          const symbol = ASPECT_SYMBOLS[typeName] ?? '◦';
          const nature = ASPECT_NATURE[typeName] ?? 'Neutral';
          const washColors = NATURE_WASH[nature];
          const orbDeg = aspect.orb != null ? `${aspect.orb.toFixed(1)}°` : '';
          const typeLabel = typeName.charAt(0).toUpperCase() + typeName.slice(1);
          const interpretation = formatAspectMeaning(getAspectInterpretation(aspect));

          return (
            <Animated.View
              key={`${planet1}-${typeName}-${planet2}`}
              entering={FadeInDown.delay(200 + i * 70).duration(700)}
            >
              <VelvetGlassSurface style={[styles.card, styles.velvetBorder]} intensity={40}>
                <LinearGradient colors={washColors} style={StyleSheet.absoluteFill} />
                <View style={styles.cardHeader}>
                  <View style={styles.hardwareBadge}>
                    <MetallicGlyph glyph={symbol} size={22} style={styles.symbolText} />
                  </View>
                  <View style={styles.cardTitles}>
                    <Text style={styles.typeLabel}>{typeLabel}</Text>
                    <Text style={styles.natureLabel}>
                      {nature.toUpperCase()}{orbDeg ? `  ·  ${orbDeg} ORB` : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.dialogueText} numberOfLines={2}>
                  <Text style={styles.planetEmphasis}>{planet1}</Text>
                  {' '}and{' '}
                  <Text style={styles.planetEmphasis}>{planet2}</Text>
                </Text>
                <Text style={styles.meaningText}>{interpretation}</Text>
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
  sectionIntro: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.6)',
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
    borderColor: 'rgba(207,174,115,0.24)',
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
    color: '#E8D6AE',
  },
  dialogueText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  meaningText: {
    marginTop: 10,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  planetEmphasis: {
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#F1E7CF',
  },
});
