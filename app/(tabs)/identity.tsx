// app/(tabs)/identity.tsx
// MySky — Blueprint Hub
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Typography: Standardized screen titles with matching sizes.
// 2. Velvet Glass: Directional 1px light-catch borders (theme-integrated).
// 3. Midnight Slate: Heavy anchor washes for the Blueprint grid.
// 4. Metallic Hardware: Badges with sheer metallic saturation for tool icons.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CircleDot, Compass, Crosshair, Diamond, Orbit, Sparkles, Star } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

// ── Service & UI Layer ──
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { localDb } from '../../services/storage/localDb';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { MetallicLucideIcon } from '../../components/ui/MetallicLucideIcon';
import { PremiumSegmentedControl } from '../../components/ui/PremiumSegmentedControl';
import { EnergyScrollContent } from '../../components/screens/EnergyScrollContent';
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';
import { VelvetGlassSurface } from '../../components/ui/VelvetGlassSurface';

interface BlueprintCard {
  title: string;
  description: string;
  lucideIcon: React.ComponentType<{ color: string; size: number; strokeWidth?: number }>;
  iconColor: string;
  washKey: keyof AppTheme; 
  route: Href;
  premium?: boolean;
}

const CARDS: BlueprintCard[] = [
  {
    title: 'Inner World',
    description: "Core Values, Jungian Archetypes, Cognitive Style, and Intelligence — your mind's blueprint.",
    lucideIcon: Diamond,
    iconColor: '#A2C2E1', // Atmosphere
    washKey: 'cardSurfaceCognitive', 
    route: '/inner-world' as Href,
  },
  {
    title: 'Body & Somatics',
    description: 'Somatic map and nervous system trigger log — how your body holds experience.',
    lucideIcon: CircleDot,
    iconColor: '#6EBF8B', // Sage
    washKey: 'cardSurfaceSomatic',
    route: '/body-nervous' as Href,
  },
  {
    title: 'Relational Mirror',
    description: 'Attachment tendencies and nervous system patterns you notice in connection.',
    lucideIcon: Orbit,
    iconColor: '#A88BEB', // Nebula
    washKey: 'cardSurfaceRelational',
    route: '/relationship-patterns' as Href,
  },
  {
    title: 'Restorative Space',
    description: 'Shadow work, inner child needs, and restorative anchors for the soul.',
    lucideIcon: Sparkles,
    iconColor: '#D4A3B3', // Healing Rose
    washKey: 'cardSurfaceValues', // Atmosphere
    route: '/(tabs)/healing' as Href,
    premium: true,
  },
  {
    title: 'Internal Tensions',
    description: 'Nervous system conflict, psychological ambivalence, and shadow triggers.',
    lucideIcon: Crosshair,
    iconColor: '#DC5050', // Ember
    washKey: 'cardSurfaceTension',
    route: '/(tabs)/inner-tensions' as Href,
  },
  {
    title: 'Cosmic Blueprint',
    description: 'Planets, houses, and aspects mapping the celestial geometry of your arrival.',
    lucideIcon: Compass,
    iconColor: '#E8D6AE', // Gold
    washKey: 'cardSurfaceAnchor', // Midnight Slate
    route: '/(tabs)/chart' as Href,
  },
];

const IDENTITY_TABS = [
  { id: 'blueprint', label: 'BLUEPRINT' },
  { id: 'energy',    label: 'ENERGY'    },
];

export default function BlueprintScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { isPremium } = usePremium();
  const [chartName, setChartName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'energy'>('blueprint');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const storedName = await EncryptedAsyncStorage.getItem('msky_user_name');
          if (storedName) { setChartName(storedName); }
          else {
            const charts = await localDb.getCharts();
            if (charts.length > 0) {
              const name = charts[0].name;
              const place = charts[0].birthPlace;
              setChartName(name && name !== place ? name : null);
            }
          }
        } catch (err) {
          logger.error('Blueprint: failed to load chart name', err);
        }
      })();
    }, []),
  );

  const nav = (route: Href, premium?: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (premium && !isPremium) {
      router.push('/(tabs)/premium' as Href);
      return;
    }
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Atmospheric Nebula Depth */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -80, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 140, left: -100, backgroundColor: 'rgba(212, 175, 55, 0.08)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          
          {/* ── Apple Editorial Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.titleStack}>
                <Text style={styles.heroTitle} numberOfLines={1} adjustsFontSizeToFit>Identity</Text>
                <Text style={styles.heroSubtitle}>
                   {chartName ? `${chartName.toUpperCase()} · EVOLUTIONARY PATH` : 'YOUR ARCHETYPAL ARCHITECTURE'}
                </Text>
              </View>
              <Pressable
                style={styles.globalAction}
                onPress={() => nav('/inner-world' as Href)}
                accessibilityRole="button"
              >
                <Ionicons name="finger-print-outline" size={22} color={theme.titanium || '#E8D6AE'} />
              </Pressable>
            </View>
          </Animated.View>

          {/* ── High-End Segmented Control ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.tabSection}>
            <PremiumSegmentedControl
              options={IDENTITY_TABS}
              selectedIndex={activeTab === 'blueprint' ? 0 : 1}
              onChange={(idx) => {
                Haptics.selectionAsync();
                setActiveTab(idx === 0 ? 'blueprint' : 'energy');
              }}
            />
          </Animated.View>

          {/* ── Content Body ── */}
          {activeTab === 'blueprint' ? (
            <View style={styles.grid}>
              {CARDS.map((card, i) => (
                <Animated.View 
                  key={card.route as string} 
                  entering={FadeInDown.delay(300 + i * 100).duration(800)}
                >
                  <Pressable 
                    style={({ pressed }) => [pressed && styles.cardPressed]} 
                    onPress={() => nav(card.route, card.premium)}
                  >
                    <VelvetGlassSurface 
                      style={[styles.card, styles.velvetBorder]} 
                      intensity={45}
                    >
                      <LinearGradient 
                        colors={theme[card.washKey] as [string, string]} 
                        style={StyleSheet.absoluteFill} 
                      />
                      
                      <View style={styles.cardHeader}>
                        <View style={[styles.hardwareBadge, { borderColor: `${card.iconColor}30` }]}>
                          <MetallicLucideIcon 
                            icon={card.lucideIcon} 
                            size={22} 
                            strokeWidth={1.5} 
                            color={card.iconColor} 
                          />
                        </View>
                        {card.premium && <PremiumBadge />}
                      </View>

                      <View style={styles.cardTextContent}>
                        <Text style={styles.cardTitle}>{card.title}</Text>
                        <Text style={styles.cardDescription}>{card.description}</Text>
                      </View>

                      <View style={styles.cardActionRow}>
                        <Text style={[styles.actionText, { color: card.iconColor }]}>EXPLORE MODULE</Text>
                        <Ionicons name="chevron-forward" size={14} color={card.iconColor} />
                      </View>
                    </VelvetGlassSurface>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(600)}>
              <EnergyScrollContent embedded />
            </Animated.View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const PremiumBadge = () => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.badgeContainer}>
      <MetallicLucideIcon icon={Star} size={10} strokeWidth={2.5} variant="gold" />
      <Text style={styles.badgeText}>PREMIUM</Text>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  safeArea: { flex: 1 },
  glowOrb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.5 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },

  // Editorial Header
  header: { marginBottom: 40 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleStack: { flex: 1 },
  heroTitle: { 
    fontSize: 32, 
    color: '#FFFFFF', 
    fontWeight: '800', 
    letterSpacing: -0.5, 
  },
  heroSubtitle: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.6)', 
    fontWeight: '600', 
    letterSpacing: 2.5, 
    marginTop: 4,
    textTransform: 'uppercase'
  },
  globalAction: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // Tabs
  tabSection: { marginBottom: 32 },

  // Grid
  grid: { gap: 20 },

  // Card Architecture
  card: { 
    padding: 28, 
    borderRadius: 32, 
    overflow: 'hidden',
    minHeight: 220,
    justifyContent: 'space-between'
  },
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderLeftColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  cardPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },

  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  hardwareBadge: { 
    width: 54, 
    height: 54, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
  },
  
  cardTextContent: { flex: 1 },
  cardTitle: { 
    fontSize: 26, 
    color: '#FFFFFF', 
    fontWeight: '800', 
    letterSpacing: -1.0, 
    marginBottom: 8 
  },
  cardDescription: { 
    fontSize: 15, 
    color: 'rgba(255,255,255,0.55)', 
    lineHeight: 22, 
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  cardActionRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginTop: 24,
    opacity: 0.8
  },
  actionText: { 
    fontSize: 10, 
    fontWeight: '900', 
    letterSpacing: 1.5 
  },

  // Premium Badge
  badgeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: 'rgba(212,175,55,0.12)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(212,175,55,0.25)' 
  },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#E8D6AE', letterSpacing: 1.5 },
});

