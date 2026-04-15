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
import { ChartDignityAnalysis } from '../../services/astrology/dignityService';
import { CHART_CARD_COLORS, CHART_CARD_WASHES } from './chartCardPalette';

// ── TYPES ──

type DignityLevel = 'Exaltation' | 'Domicile' | 'Neutral' | 'Detriment' | 'Fall';

const DIGNITY_SCORE: Record<string, number> = {
  exaltation: 100,
  domicile: 75,
  peregrine: 50,
  detriment: 25,
  fall: 0,
};

const DIGNITY_DISPLAY: Record<string, DignityLevel> = {
  exaltation: 'Exaltation',
  domicile: 'Domicile',
  peregrine: 'Neutral',
  detriment: 'Detriment',
  fall: 'Fall',
};

interface DignityModule {
  id: string;
  glyph: string;
  planet: string;
  sign: string;
  dignity: DignityLevel;
  score: number;
  iconColor: string;
  surfaceColors: [string, string];
}

// ── SPECTRUM VISUAL (native View-based, no Skia Canvas) ──

const DignitySpectrum = ({ score, dotColor }: { score: number; dotColor: string }) => {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <View>
      <View style={spectrumStyles.track}>
        <View style={spectrumStyles.centerTick} />
        <View
          style={[
            spectrumStyles.dot,
            {
              left: `${pct}%` as any,
              backgroundColor: dotColor,
              shadowColor: dotColor,
            },
          ]}
        />
      </View>
      <View style={spectrumStyles.labels}>
        <Text style={spectrumStyles.labelLeft}>FALL</Text>
        <Text style={spectrumStyles.labelRight}>EXALTATION</Text>
      </View>
    </View>
  );
};

const spectrumStyles = StyleSheet.create({
  track: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
    marginTop: 16,
  },
  centerTick: {
    position: 'absolute',
    left: '50%' as any,
    top: -4,
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dot: {
    position: 'absolute',
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    transform: [{ translateX: -4 }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  labelLeft: {
    fontSize: 8,
    color: 'rgba(164,158,151,0.72)',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  labelRight: {
    fontSize: 8,
    color: 'rgba(96,138,141,0.72)',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});

// ── MAIN COMPONENT ──

interface Props {
  dignityAnalysis: ChartDignityAnalysis | null;
}

export const ChartDignitiesSection = ({ dignityAnalysis }: Props) => {
  const styles = useThemedStyles(createStyles);
  useAppTheme();

  if (!dignityAnalysis) return null;

  const modules: DignityModule[] = [...dignityAnalysis.strongestPlanets, ...dignityAnalysis.challengedPlanets]
    .filter((planet, index, items) => index === items.findIndex((candidate) => candidate.planet === planet.planet))
    .slice(0, 6)
    .map((p) => {
      const score = DIGNITY_SCORE[p.dignity] ?? 50;
      const isChallenged = score < 50;
      const isStrong = score > 50;
      return {
        id: p.planet,
        glyph: '•',
        planet: p.planet,
        sign: p.sign,
        dignity: DIGNITY_DISPLAY[p.dignity] ?? 'Neutral',
        score,
        iconColor: CHART_CARD_COLORS.gold,
        surfaceColors: isChallenged
          ? CHART_CARD_WASHES.purple
          : isStrong
            ? CHART_CARD_WASHES.sage
            : CHART_CARD_WASHES.taupe,
      };
    });

  if (modules.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Planet Strength</Text>
        <Text style={styles.sectionSubtitle}>DIGNITY & ESSENTIAL CONDITION</Text>
      </View>

      <View style={styles.grid}>
        {modules.map((mod, i) => {
          return (
            <Animated.View
              key={mod.id}
              entering={FadeInDown.delay(200 + i * 80).duration(700)}
            >
              <VelvetGlassSurface style={[styles.card, styles.velvetBorder]} intensity={40}>
                <LinearGradient colors={mod.surfaceColors} style={StyleSheet.absoluteFill} />
                <View style={styles.cardHeader}>
                  <View style={styles.hardwareBadge}>
                    <MetallicGlyph glyph={mod.glyph} size={28} style={styles.glyphText} />
                  </View>
                  <View style={styles.cardTitles}>
                    <Text style={styles.planetName}>{mod.planet}</Text>
                    <Text style={styles.dignityLabel}>{mod.dignity.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.signDesc} numberOfLines={1}>
                  in <Text style={styles.signName}>{mod.sign}</Text>
                </Text>
                <DignitySpectrum score={mod.score} dotColor={mod.iconColor} />
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
    padding: 24,
    borderRadius: 28,
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
    marginBottom: 12,
  },
  hardwareBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(207,174,115,0.24)',
  },
  glyphText: {
    fontSize: 28,
    fontWeight: '400',
    transform: [{ translateY: -1 }],
  },
  cardTitles: {
    flex: 1,
    gap: 3,
  },
  planetName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dignityLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#E8D6AE',
  },
  signDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 16,
  },
  signName: {
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#F1E7CF',
  },
  spectrumTrack: {},
  spectrumLabels: {},
  spectrumLabelLeft: {},
  spectrumLabelRight: {},
});
