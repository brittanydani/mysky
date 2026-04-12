// File: app/(tabs)/identity.tsx
// MySky — Blueprint Hub
//
// High-End "Lunar Sky" & "Smoked Glass" Aesthetic Update:
// 1. Purged "Muddy Gold" background gradients from all tools and headers.
// 2. Mapped Tool Cards to specific Semantic Washes (Atmosphere, Nebula, Sage, Rose).
// 3. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 4. Elevated typography: Metallic Gold icons and pure white data labels.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CircleDot, Compass, Crosshair, Diamond, Orbit, Sparkles, Star } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { localDb } from '../../services/storage/localDb';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicText } from '../../components/ui/MetallicText';
import { MetallicLucideIcon } from '../../components/ui/MetallicLucideIcon';
import { PremiumSegmentedControl } from '../../components/ui/PremiumSegmentedControl';
import { EnergyScrollContent } from '../../components/screens/EnergyScrollContent';
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';
import { VelvetGlassSurface } from '../../components/ui/VelvetGlassSurface';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // Metallic Brand Gold
  atmosphere: '#A2C2E1', // Icy Blue
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
  lavender: '#A88BEB',   // Nebula Wash
  emerald: '#6B9080',    // Sage Wash
  rose: '#D4A3B3',       // Identity/Intelligence
  ember: '#DC5050',      // Stress/Tension
  bg: '#0A0A0F',
  textMain: '#FFFFFF',
};

interface BlueprintCard {
  title: string;
  description: string;
  lucideIcon: React.ComponentType<{ color: string; size: number; strokeWidth?: number }>;
  iconColor: string;
  wash: [string, string];
  route: Href;
  premium?: boolean;
}

const CARDS: BlueprintCard[] = [
  {
    title: 'Inner World',
    description: "Core Values, Jungian Archetypes, Cognitive Style, and Intelligence — your mind's blueprint.",
    lucideIcon: Diamond,
    iconColor: PALETTE.atmosphere,
    wash: ['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)'], // Atmosphere
    route: '/inner-world' as Href,
  },
  {
    title: 'Body & Nervous System',
    description: 'Somatic map and trigger log — how your body holds experience.',
    lucideIcon: CircleDot,
    iconColor: PALETTE.emerald,
    wash: ['rgba(107, 144, 128, 0.20)', 'rgba(107, 144, 128, 0.05)'], // Sage
    route: '/body-nervous' as Href,
  },
  {
    title: 'Relational Mirror',
    description: 'Attachment tendencies and nervous system patterns you notice in connection.',
    lucideIcon: Orbit,
    iconColor: PALETTE.lavender,
    wash: ['rgba(168, 139, 235, 0.20)', 'rgba(168, 139, 235, 0.05)'], // Nebula
    route: '/relationship-patterns' as Href,
  },
  {
    title: 'Healing Space',
    description: 'Shadow work, inner child needs, and restorative anchors.',
    lucideIcon: Sparkles,
    iconColor: PALETTE.rose,
    wash: ['rgba(212, 163, 179, 0.20)', 'rgba(212, 163, 179, 0.05)'], // Rose Glass
    route: '/(tabs)/healing' as Href,
    premium: true,
  },
  {
    title: 'Inner Tensions',
    description: 'Nervous system conflict, ambivalence, and shadow triggers.',
    lucideIcon: Crosshair,
    iconColor: PALETTE.ember,
    wash: ['rgba(220, 80, 80, 0.20)', 'rgba(220, 80, 80, 0.05)'], // Ember
    route: '/(tabs)/inner-tensions' as Href,
  },
  {
    title: 'Cosmic Blueprint',
    description: 'Planets, houses, and aspects mapping the moment of your arrival.',
    lucideIcon: Compass,
    iconColor: PALETTE.gold,
    wash: ['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)'], // Midnight Slate Anchor
    route: '/(tabs)/chart' as Href,
  },
];

const IDENTITY_TABS = [
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'energy',    label: 'Energy'    },
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

      {/* Nebula/Atmosphere glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.08)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle}>Inner World</Text>
                <GoldSubtitle style={styles.headerSubtitle}>
                  {chartName ? `${chartName} · Know yourself deeply` : 'Values, patterns, body & mind'}
                </GoldSubtitle>
              </View>
              <Pressable
                style={styles.headerAction}
                onPress={() => nav('/inner-world' as Href)}
                accessibilityRole="button"
                accessibilityLabel="Open inner world hub"
              >
                <Ionicons name="arrow-forward-outline" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </Animated.View>

          {/* Tab Pill */}
          <Animated.View entering={FadeInDown.delay(120).duration(600)}>
            <PremiumSegmentedControl
              options={IDENTITY_TABS}
              selectedIndex={activeTab === 'blueprint' ? 0 : 1}
              onChange={(idx) => setActiveTab(idx === 0 ? 'blueprint' : 'energy')}
            />
          </Animated.View>

          {activeTab === 'blueprint' ? (
            /* Cards */
            <View style={styles.grid}>
              {CARDS.map((card, i) => (
                <Animated.View key={card.route as string} entering={FadeInDown.delay(160 + i * 80).duration(600)}>
                  <Pressable style={({ pressed }) => [pressed && styles.cardPressed]} onPress={() => nav(card.route, card.premium)}>
                    <VelvetGlassSurface style={styles.card} intensity={25}>
                      <LinearGradient colors={card.wash} style={StyleSheet.absoluteFill} />
                      <View style={styles.cardIconRow}>
                        <View style={[styles.cardIconBadge, { borderColor: `${card.iconColor}40`, backgroundColor: `${card.iconColor}15` }]}>
                          <MetallicLucideIcon icon={card.lucideIcon} size={20} strokeWidth={1.5} color={card.iconColor} />
                        </View>
                        {card.premium && <PremiumBadge />}
                      </View>
                      <Text style={styles.cardTitle}>{card.title}</Text>
                      <Text style={styles.cardSubtitle}>{card.description}</Text>
                    </VelvetGlassSurface>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : (
            /* Energy Content */
            <EnergyScrollContent embedded />
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Premium lock indicator
const PremiumBadge = () => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.badgeContainer}>
      <MetallicLucideIcon icon={Star} size={12} strokeWidth={1.5} variant="gold" />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  safeArea: { flex: 1 },
  glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },

  header: { marginBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  headerTextWrap: { flex: 1 },
  headerAction: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: { fontSize: 34, color: '#FFFFFF', fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  headerSubtitle: { fontSize: 14 },

  grid: { gap: 20 },

  card: { padding: 28, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderTopColor: 'rgba(255,255,255,0.20)', overflow: 'hidden' },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },

  cardIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardIconBadge: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cardTitle: { fontSize: 20, color: '#FFFFFF', fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 24 },

  badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.30)' },
});
