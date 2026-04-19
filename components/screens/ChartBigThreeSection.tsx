import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SkiaGradient as LinearGradient } from '../ui/SkiaGradient';
import { MetallicGlyph } from '../ui/MetallicGlyph';
import { VelvetGlassSurface } from '../ui/VelvetGlassSurface';
import { useThemedStyles, useAppTheme } from '../../context/ThemeContext';
import { type AppTheme } from '../../constants/theme';
import { NatalChart } from '../../services/astrology/types';
import { CHART_CARD_WASHES } from './chartCardPalette';

// ── TYPES ──

interface BigThreeModule {
  id: string;
  label: string;
  glyph: string;
  washColors: [string, string];
  signName: string;
  degree: number;
  minute: number;
  house?: number;
  route?: Href;
}

interface Props {
  chart: NatalChart;
  onMoonPress?: () => void;
}

// ── COMPONENT ──

export const ChartBigThreeSection = ({ chart, onMoonPress }: Props) => {
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const router = useRouter();

  const modules: BigThreeModule[] = [
    {
      id: 'sun',
      label: 'Sun',
      glyph: '☉',
      washColors: CHART_CARD_WASHES.taupe,
      signName: chart.sun.sign.name,
      degree: chart.sun.degree,
      minute: chart.sun.minute,
      house: chart.sun.house,
    },
    {
      id: 'moon',
      label: 'Moon',
      glyph: '☽',
      washColors: CHART_CARD_WASHES.sage,
      signName: chart.moon.sign.name,
      degree: chart.moon.degree,
      minute: chart.moon.minute,
      house: chart.moon.house,
    },
    ...(chart.ascendant
      ? [{
          id: 'rising',
          label: 'Rising',
          glyph: '↑',
          washColors: CHART_CARD_WASHES.purple,
          signName: chart.ascendant.sign.name,
          degree: chart.ascendant.degree,
          minute: chart.ascendant.minute,
          house: undefined as number | undefined,
        }]
      : []),
  ];

  const handlePress = (mod: BigThreeModule) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (mod.id === 'moon' && onMoonPress) {
      onMoonPress();
      return;
    }
    if (mod.route) router.push(mod.route);
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>The Big Three</Text>
        <Text style={styles.sectionSubtitle}>
          {chart.sun.sign.name.toUpperCase()} · {chart.moon.sign.name.toUpperCase()}
          {chart.ascendant ? ` · ${chart.ascendant.sign.name.toUpperCase()} RISING` : ''}
        </Text>
      </View>

      <View style={styles.grid}>
        {modules.map((mod, i) => {
          return (
            <Animated.View
              key={mod.id}
              entering={FadeInDown.delay(200 + i * 80).duration(700)}
              style={styles.cardWrapper}
            >
              <Pressable
                style={({ pressed }) => [pressed && styles.cardPressed]}
                onPress={() => handlePress(mod)}
              >
                <VelvetGlassSurface style={[styles.card, styles.velvetBorder]} intensity={45}>
                  <LinearGradient colors={mod.washColors} style={StyleSheet.absoluteFill} />
                  <View style={styles.cardHeader}>
                    <View style={styles.hardwareBadge}>
                      <MetallicGlyph glyph={mod.glyph} size={22} style={styles.glyphText} />
                    </View>
                    <Text style={styles.planetLabel} numberOfLines={1}>{mod.label.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.signName}>{mod.signName}</Text>
                  <Text style={styles.degreeText}>
                    {mod.degree}°{String(mod.minute).padStart(2, '0')}'
                    {mod.house ? `  ·  H${mod.house}` : ''}
                  </Text>
                </VelvetGlassSurface>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Midheaven row if present */}
      {chart.midheaven && (
        <Animated.View entering={FadeInDown.delay(500).duration(700)}>
          <VelvetGlassSurface style={[styles.mcCard, styles.velvetBorder]} intensity={25}>
            <LinearGradient
              colors={theme.cardSurfaceAnchor as [string, string]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.mcRow}>
              <View style={styles.hardwareBadgeSm}>
                <MetallicGlyph glyph="MC" size={15} style={styles.glyphTextSm} />
              </View>
              <View style={styles.mcContent}>
                <Text style={styles.mcLabel}>Midheaven</Text>
                <Text style={styles.mcValue}>
                  {chart.midheaven.sign.name}{' '}
                  <Text style={styles.mcDeg}>
                    {chart.midheaven.degree}°{String(chart.midheaven.minute).padStart(2, '0')}'
                  </Text>
                </Text>
              </View>
            </View>
          </VelvetGlassSurface>
        </Animated.View>
      )}
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
    gap: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardWrapper: {
    width: '100%',
  },
  card: {
    paddingVertical: 26,
    paddingHorizontal: 22,
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 188,
    justifyContent: 'center',
    alignItems: 'center',
  },
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderLeftColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  hardwareBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(207,174,115,0.24)',
  },
  glyphText: {
    fontSize: 21,
    fontWeight: '400',
    transform: [{ translateY: -1 }],
  },
  planetLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#E8D6AE',
  },
  signName: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  degreeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginTop: 10,
    opacity: 0.82,
    textAlign: 'center',
    color: '#E8D6AE',
  },
  // Midheaven row
  mcCard: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 18,
  },
  mcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    justifyContent: 'center',
  },
  hardwareBadgeSm: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(207,174,115,0.24)',
  },
  glyphTextSm: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mcContent: {
    alignItems: 'flex-start',
  },
  mcLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  mcValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  mcDeg: {
    fontSize: 12,
    color: '#CFAE73',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
