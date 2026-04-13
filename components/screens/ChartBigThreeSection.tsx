import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SkiaGradient as LinearGradient } from '../ui/SkiaGradient';
import { VelvetGlassSurface } from '../ui/VelvetGlassSurface';
import { useThemedStyles, useAppTheme } from '../../context/ThemeContext';
import { type AppTheme } from '../../constants/theme';
import { NatalChart } from '../../services/astrology/types';

// ── TYPES ──

interface BigThreeModule {
  id: string;
  label: string;
  glyph: string;
  iconColor: string;
  washKey: keyof AppTheme;
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
      iconColor: '#D4AF37',
      washKey: 'cardSurfaceAnchor',
      signName: chart.sun.sign.name,
      degree: chart.sun.degree,
      minute: chart.sun.minute,
      house: chart.sun.house,
    },
    {
      id: 'moon',
      label: 'Moon',
      glyph: '☽',
      iconColor: '#A2C2E1',
      washKey: 'cardSurfaceCognitive',
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
          iconColor: '#A88BEB',
          washKey: 'cardSurfaceRelational' as keyof AppTheme,
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
          const washColors = theme[mod.washKey] as [string, string];
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
                  <LinearGradient colors={washColors} style={StyleSheet.absoluteFill} />

                  {/* Glyph Badge */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.hardwareBadge, { borderColor: `${mod.iconColor}30` }]}>
                      <Text style={[styles.glyphText, { color: mod.iconColor }]}>{mod.glyph}</Text>
                    </View>
                    <Text style={[styles.planetLabel, { color: mod.iconColor }]}>{mod.label.toUpperCase()}</Text>
                  </View>

                  {/* Sign */}
                  <Text style={styles.signName}>{mod.signName}</Text>

                  {/* Degree — gold-tracked, bottom-left */}
                  <Text style={[styles.degreeText, { color: mod.iconColor }]}>
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
              <View style={[styles.hardwareBadgeSm, { borderColor: 'rgba(207,174,115,0.25)' }]}>
                <Text style={[styles.glyphTextSm, { color: '#CFAE73' }]}>MC</Text>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 14,
  },
  cardWrapper: {
    flex: 1,
    minWidth: 100,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'space-between',
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
    gap: 8,
    marginBottom: 12,
  },
  hardwareBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
  },
  glyphText: {
    fontSize: 20,
    fontWeight: '400',
    transform: [{ translateY: -1 }],
  },
  planetLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  signName: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.8,
    flex: 1,
  },
  degreeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 8,
    opacity: 0.85,
  },
  // Midheaven row
  mcCard: {
    padding: 18,
    borderRadius: 20,
    overflow: 'hidden',
  },
  mcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  hardwareBadgeSm: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
  },
  glyphTextSm: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mcContent: {
    flex: 1,
  },
  mcLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '700',
    letterSpacing: 2,
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
