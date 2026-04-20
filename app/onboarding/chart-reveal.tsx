// app/onboarding/chart-reveal.tsx
// MySky — Onboarding Chart Reveal
//
// The "wow moment" screen shown immediately after birth data is entered.
// Displays the user's Big Three (Sun, Moon, Rising) with a cinematic reveal
// before navigating to the main dashboard.

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { MetallicText } from '../../components/ui/MetallicText';
import { VelvetGlassSurface } from '../../components/ui/VelvetGlassSurface';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { AstrologySettingsService } from '../../services/astrology/astrologySettingsService';
import { NatalChart } from '../../services/astrology/types';
import { logger } from '../../utils/logger';
import { type AppTheme } from '../../constants/theme';
import { useThemedStyles } from '../../context/ThemeContext';

interface BigThreeEntry {
  glyph: string;
  label: string;
  sign: string;
  subtitle: string;
}

export default function ChartRevealScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const [chart, setChart] = useState<NatalChart | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const charts = await localDb.getCharts();
        if (charts.length === 0) {
          router.replace('/(tabs)/home' as Href);
          return;
        }
        const saved = charts[0];
        const astroSettings = await AstrologySettingsService.getSettings();
        const birthData = {
          date: saved.birthDate,
          time: saved.birthTime,
          hasUnknownTime: saved.hasUnknownTime,
          place: saved.birthPlace,
          latitude: saved.latitude,
          longitude: saved.longitude,
          timezone: saved.timezone,
          houseSystem: astroSettings.houseSystem,
          zodiacSystem: astroSettings.zodiacSystem,
          orbPreset: astroSettings.orbPreset,
        };
        const computed = AstrologyCalculator.generateNatalChart(birthData);
        setChart(computed);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch (err) {
        logger.error('[ChartReveal] failed to load chart:', err);
        router.replace('/(tabs)/home' as Href);
      }
    })();
  }, [router]);

  const handleBegin = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.replace('/(tabs)/home' as Href);
  }, [router]);

  const bigThree: BigThreeEntry[] = chart
    ? [
        {
          glyph: '☉',
          label: 'Sun',
          sign: chart.sun?.sign?.name ?? '',
          subtitle: 'Your core identity',
        },
        {
          glyph: '☽',
          label: 'Moon',
          sign: chart.moon?.sign?.name ?? '',
          subtitle: 'Your inner world',
        },
        ...(chart.ascendant?.sign?.name
          ? [
              {
                glyph: '↑',
                label: 'Rising',
                sign: chart.ascendant.sign.name,
                subtitle: 'How you meet the world',
              },
            ]
          : []),
      ]
    : [];

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Atmospheric depth */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(212, 175, 55, 0.10)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -100, backgroundColor: 'rgba(168, 139, 235, 0.08)' }]} />
      </View>

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>

          {/* Headline */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.titleBlock}>
            <Text style={styles.eyebrow}>YOUR BLUEPRINT IS READY</Text>
            <MetallicText style={styles.headline} variant="gold">
              Your Big Three
            </MetallicText>
            <Text style={styles.subtext}>
              The three pillars of your cosmic architecture — a foundation for everything MySky will reveal.
            </Text>
          </Animated.View>

          {/* Big Three Cards */}
          <View style={styles.cardsBlock}>
            {bigThree.map((entry, i) => (
              <Animated.View
                key={entry.label}
                entering={ZoomIn.delay(500 + i * 200).springify().damping(14).stiffness(120)}
                style={styles.cardWrapper}
              >
                <VelvetGlassSurface style={styles.card} intensity={30}>
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(212,175,55,0.12)', 'rgba(44,54,69,0.60)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.glyph}>{entry.glyph}</Text>
                  <Text style={styles.signName}>{entry.sign}</Text>
                  <Text style={styles.cardLabel}>{entry.label}</Text>
                  <Text style={styles.cardSubtitle}>{entry.subtitle}</Text>
                </VelvetGlassSurface>
              </Animated.View>
            ))}
          </View>

          {/* CTA */}
          {chart && (
            <Animated.View entering={FadeIn.delay(1400).duration(700)} style={styles.ctaBlock}>
              <Pressable
                onPress={handleBegin}
                style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Begin your journey"
              >
                <LinearGradient
                  colors={['rgba(212,175,55,0.30)', 'rgba(212,175,55,0.15)']}
                  style={StyleSheet.absoluteFill}
                />
                <MetallicText style={styles.ctaText} variant="gold">Begin My Journey</MetallicText>
              </Pressable>
              <Text style={styles.ctaHint}>
                Your data stays on your device — always private, always yours.
              </Text>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: 'center',
    },
    glowOrb: {
      position: 'absolute',
      width: 320,
      height: 320,
      borderRadius: 160,
      opacity: 0.7,
    },
    titleBlock: {
      alignItems: 'center',
      marginBottom: 36,
    },
    eyebrow: {
      fontSize: 11,
      letterSpacing: 2.5,
      fontWeight: '700',
      color: 'rgba(212,175,55,0.70)',
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    headline: {
      fontSize: 34,
      fontWeight: '700',
      letterSpacing: -1,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtext: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 300,
    },
    cardsBlock: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 40,
    },
    cardWrapper: {
      flex: 1,
    },
    card: {
      borderRadius: 20,
      paddingVertical: 24,
      paddingHorizontal: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.14)',
      borderBottomColor: 'rgba(0,0,0,0.30)',
      borderLeftColor: 'rgba(255,255,255,0.08)',
      borderRightColor: 'rgba(0,0,0,0.20)',
      overflow: 'hidden',
    },
    glyph: {
      fontSize: 28,
      color: '#D4AF37',
      marginBottom: 10,
    },
    signName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: 4,
    },
    cardLabel: {
      fontSize: 10,
      letterSpacing: 2,
      fontWeight: '700',
      color: 'rgba(212,175,55,0.70)',
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    cardSubtitle: {
      fontSize: 10,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 14,
    },
    ctaBlock: {
      alignItems: 'center',
      gap: 14,
    },
    ctaBtn: {
      borderRadius: 32,
      paddingVertical: 16,
      paddingHorizontal: 48,
      borderWidth: 1,
      borderColor: 'rgba(212,175,55,0.45)',
      overflow: 'hidden',
    },
    ctaBtnPressed: {
      opacity: 0.75,
    },
    ctaText: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    ctaHint: {
      fontSize: 12,
      color: theme.textMuted,
      textAlign: 'center',
    },
  });
