// app/inner-world.tsx
// MySky — Inner World Hub
// 
// High-End "Lunar Sky" & "Smoked Glass" Aesthetic Update:
// 1. Purged "Muddy Gold" background gradients from all tools and headers.
// 2. Mapped Tool Cards to specific Semantic Washes (Gold, Nebula, Stratosphere, Rose).
// 3. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 4. Elevated typography: Metallic Gold metrics and pure white data labels.

import React, { useCallback, useState, useRef } from 'react';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { usePremium } from '../context/PremiumContext';
import type { AppTheme } from '../constants/theme';
import { logger } from '../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import {
  getCategorySealStatus,
  getReflectionDate,
  loadReflections,
  getCurrentStreak,
} from '../services/insights/dailyReflectionService';
import {
  getSomaticReflectionCorrelations,
  SomaticCorrelation,
} from '../services/insights/reflectionProfileSync';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  ReflectionCategory,
} from '../constants/dailyReflectionQuestions';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // Metallic Brand Gold
  silverBlue: '#A2C2E1', // Atmosphere Wash
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
  lavender: '#A88BEB',   // Nebula Wash
  emerald: '#6B9080',    // Sage Wash
  rose: '#D4A3B3',       // Identity/Intelligence
  atmosphere: '#A2C2E1',
  bg: '#0A0A0F',
  textMain: '#FFFFFF',
};

const SOMATIC_FALLBACK_LABELS = {
  overall: 'Across Reflections',
} as const;

const SOMATIC_FALLBACK_ICONS = {
  overall: '◌',
} as const;

type ToolId = 'values' | 'archetypes' | 'cognitive' | 'intelligence';

interface ToolCard {
  id: ToolId;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  wash: [string, string];
  route: Href;
}

const TOOLS: ToolCard[] = [
  {
    id: 'values',
    title: 'Core Values',
    description: 'Identify what guides your everyday choices and uncover hidden contradictions.',
    icon: '◈',
    iconColor: PALETTE.atmosphere,
    wash: ['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)'], // Atmosphere
    route: '/core-values' as Href,
  },
  {
    id: 'archetypes',
    title: 'Archetypes',
    description: 'Discover the Jungian patterns driving your behavior and relationships.',
    icon: '⬡',
    iconColor: PALETTE.lavender,
    wash: ['rgba(168, 139, 235, 0.20)', 'rgba(168, 139, 235, 0.05)'], // Nebula
    route: '/archetypes' as Href,
  },
  {
    id: 'cognitive',
    title: 'Cognitive Style',
    description: 'Map how your mind naturally processes information and makes decisions.',
    icon: '◉',
    iconColor: '#5C7CAA', // Slate Blue variant
    wash: ['rgba(92, 124, 170, 0.20)', 'rgba(92, 124, 170, 0.05)'], // Stratosphere
    route: '/cognitive-style' as Href,
  },
  {
    id: 'intelligence',
    title: 'Intelligence Profile',
    description: 'Discover your unique mix of intelligences — how your mind is brilliant.',
    icon: '✧',
    iconColor: PALETTE.rose,
    wash: ['rgba(212, 163, 179, 0.20)', 'rgba(212, 163, 179, 0.05)'], // Rose Glass
    route: '/intelligence-profile' as Href,
  },
];

export default function InnerWorldScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { isPremium } = usePremium();

  const [completion, setCompletion] = useState<Record<ToolId, boolean>>({
    values: false, archetypes: false, cognitive: false, intelligence: false,
  });
  const [categorySealed, setCategorySealed] = useState<Record<ReflectionCategory, boolean>>({
    values: false, archetypes: false, cognitive: false, intelligence: false,
  });
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [somaticCorrelations, setSomaticCorrelations] = useState<SomaticCorrelation[]>([]);

  const hasCompleteCognitiveProfile = (raw: string | null): boolean => {
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw) as Partial<Record<'scope' | 'processing' | 'decisions', number>>;
      return ['scope', 'processing', 'decisions'].every((key) => parsed[key as 'scope' | 'processing' | 'decisions'] !== undefined);
    } catch { return false; }
  };

  useFocusEffect(
    useCallback(() => {
      const checkProgress = async () => {
        try {
          const refDate = getReflectionDate();
          const [valuesRaw, archetypesRaw, cognitiveRaw, intelligenceRaw, sealStatus, reflData, currentStreak] =
            await Promise.all([
              EncryptedAsyncStorage.getItem('@mysky:core_values'),
              EncryptedAsyncStorage.getItem('@mysky:archetype_profile'),
              EncryptedAsyncStorage.getItem('@mysky:cognitive_style'),
              EncryptedAsyncStorage.getItem('@mysky:intelligence_profile'),
              getCategorySealStatus(refDate),
              loadReflections(),
              getCurrentStreak(),
            ]);

          setCompletion({
            values: !!valuesRaw && JSON.parse(valuesRaw).topFive?.length > 0,
            archetypes: !!archetypesRaw,
            cognitive: hasCompleteCognitiveProfile(cognitiveRaw),
            intelligence: !!intelligenceRaw,
          });

          setCategorySealed(sealStatus);
          setStreak(currentStreak);
          setTotalDays(new Set(reflData.answers.map(a => a.date)).size);

          getSomaticReflectionCorrelations().then(setSomaticCorrelations).catch((e) => logger.warn('[InnerWorld] Somatic correlations failed:', e));
        } catch (e) { logger.warn('[InnerWorld] Failed to load progress', e); }
      };
      checkProgress().catch((e) => logger.warn('[InnerWorld] checkProgress failed:', e));
    }, [])
  );

  const nav = (route: Href) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(route);
  };

  const allToolsCompleted = completion.values && completion.archetypes && completion.cognitive && completion.intelligence;
  const allCategoriesSealed = categorySealed.values && categorySealed.archetypes && categorySealed.cognitive && categorySealed.intelligence;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Nebula depth — atmospheric glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => { Haptics.selectionAsync().catch(() => {}); router.replace('/(tabs)/identity'); }} accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Inner World</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Mind, values & cognitive patterns</GoldSubtitle>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Sync Status Banner */}
          {allToolsCompleted && (
            <Animated.View entering={FadeInDown.duration(500)} layout={Layout.springify()} style={[styles.syncBanner, theme.isDark && styles.velvetBorder]}>
              <LinearGradient colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']} style={StyleSheet.absoluteFill} />
              <MetallicIcon name="git-network-outline" size={16} variant="gold" />
              <MetallicText style={styles.syncText} variant="gold">INNER WORLD SYNCHRONIZED</MetallicText>
            </Animated.View>
          )}

          {/* Stats Bar */}
          {(streak > 0 || totalDays > 0) && (
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={[styles.statsBar, theme.isDark && styles.velvetBorder]}>
              <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
              <View style={styles.statItem}>
                <MetallicText style={styles.statValue} variant="gold">{totalDays}</MetallicText>
                <Text style={styles.statLabel}>days</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MetallicText style={styles.statValue} variant="gold">{streak}</MetallicText>
                <Text style={styles.statLabel}>streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MetallicText style={styles.statValue} color={PALETTE.atmosphere}>{Object.values(categorySealed).filter(Boolean).length}/4</MetallicText>
                <Text style={styles.statLabel}>recorded</Text>
              </View>
            </Animated.View>
          )}

          {/* All Sealed Banner */}
          {allCategoriesSealed && (
            <Animated.View entering={FadeIn.duration(500)} style={[styles.sealedBanner, theme.isDark && styles.velvetBorder]}>
              <LinearGradient colors={['rgba(107, 144, 128, 0.15)', 'rgba(107, 144, 128, 0.05)']} style={StyleSheet.absoluteFill} />
              <MetallicIcon name="shield-checkmark-outline" size={16} variant="green" />
              <MetallicText style={styles.sealedBannerText} variant="green">ALL CATEGORIES RECORDED TODAY</MetallicText>
            </Animated.View>
          )}

          {/* Tool Cards */}
          <Animated.View entering={FadeInDown.delay(560).duration(600)} style={styles.dailyHeader}>
            <MetallicText style={styles.dailyHeaderTitle} variant="gold">Explore & Log</MetallicText>
            <GoldSubtitle style={styles.dailyHeaderSub}>Build your inner world profile</GoldSubtitle>
          </Animated.View>

          <View style={styles.grid}>
            {TOOLS.map((tool, i) => {
              const isDone = completion[tool.id];
              return (
                <Animated.View key={tool.id} entering={FadeInDown.delay(620 + i * 80).duration(600)} layout={Layout.springify()}>
                  <Pressable style={({ pressed }) => [pressed && styles.cardPressed]} onPress={() => nav(tool.route)} accessibilityRole="button" accessibilityLabel={tool.title}>
                    <VelvetGlassSurface style={styles.card} intensity={25}>
                      <LinearGradient colors={tool.wash} style={StyleSheet.absoluteFill} />
                      <View style={styles.cardHeader}>
                        <MetallicText style={[styles.cardIcon]} color={tool.iconColor}>{tool.icon}</MetallicText>
                        <View style={[styles.badge, isDone ? { backgroundColor: 'rgba(212,175,55,0.15)', borderColor: 'rgba(212,175,55,0.40)' } : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                          {isDone ? (
                            <MetallicText style={styles.badgeText} variant="gold">RECORDED</MetallicText>
                          ) : (
                            <Text style={[styles.badgeText, { color: 'rgba(255,255,255,0.4)' }]}>EXPLORE</Text>
                          )}
                          {isDone && <MetallicIcon name="checkmark-outline" size={10} variant="gold" style={{ marginLeft: 4 }} />}
                        </View>
                      </View>
                      <Text style={styles.cardTitle}>{tool.title}</Text>
                      <Text style={styles.cardSubtitle}>{tool.description}</Text>
                    </VelvetGlassSurface>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* Premium synthesis gate — shown when at least one tool is done */}
          {!isPremium && Object.values(completion).some(Boolean) && (
            <Pressable
              onPress={() => router.push('/(tabs)/premium' as any)}
              style={{ marginTop: 28, padding: 20, borderRadius: 20, backgroundColor: 'rgba(212,175,55,0.07)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.22)', alignItems: 'center', gap: 6 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MetallicIcon name="lock-closed-outline" size={12} variant="gold" />
                <Text style={{ color: 'rgba(212,175,55,0.9)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>DEEPER SKY</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 2 }}>Unlock Your Healing Space</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                Premium synthesises your archetype, somatic patterns, and relational tendencies into personalised shadow work, rituals, and integration prompts.
              </Text>
              <Text style={{ color: 'rgba(212,175,55,0.8)', fontSize: 12, fontWeight: '600', marginTop: 4 }}>Unlock the Full Portrait →</Text>
            </Pressable>
          )}

          {/* Journey Progress */}
          {totalDays > 0 && (
            <Animated.View entering={FadeIn.delay(900).duration(500)} style={styles.progressSection}>
              <Text style={styles.progressTitle}>Your Journey</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min((totalDays / 365) * 100, 100)}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{totalDays} of 365 days — {Math.round((totalDays / 365) * 100)}% of a full cycle</Text>

              <Pressable style={[styles.pastLink, theme.isDark && styles.velvetBorder]} onPress={() => { Haptics.selectionAsync().catch(() => {}); router.push('/past-reflections'); }} accessibilityRole="button" accessibilityLabel="View past reflections">
                <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} />
                <MetallicIcon name="time-outline" size={16} variant="gold" />
                <MetallicText style={styles.pastLinkText} variant="gold">View Past Reflections</MetallicText>
                <MetallicIcon name="chevron-forward-outline" size={14} variant="gold" />
              </Pressable>
            </Animated.View>
          )}

          {/* Body Intelligence (Sage Wash) */}
          {somaticCorrelations.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(500)}>
              <VelvetGlassSurface style={styles.somaticCard} intensity={25}>
                <LinearGradient colors={['rgba(107, 144, 128, 0.20)', 'rgba(107, 144, 128, 0.05)']} style={StyleSheet.absoluteFill} />
                <MetallicText style={styles.somaticLabel} variant="green">BODY INTELLIGENCE</MetallicText>
                <Text style={styles.somaticDesc}>The body states that show up most often on your reflection days:</Text>
                {somaticCorrelations.map(c => (
                  <View key={c.category} style={styles.somaticRow}>
                    <Text style={styles.somaticCat}>
                      {c.category === 'overall' ? `${SOMATIC_FALLBACK_ICONS.overall} ${SOMATIC_FALLBACK_LABELS.overall}` : `${CATEGORY_ICONS[c.category]} ${CATEGORY_LABELS[c.category]}`}
                    </Text>
                    <View style={styles.somaticValueGroup}>
                      <MetallicText style={styles.somaticEmotion} variant="green">{c.topEmotion}</MetallicText>
                      <Text style={styles.somaticCount}>{c.count} {c.count === 1 ? 'day' : 'days'}</Text>
                    </View>
                  </View>
                ))}
              </VelvetGlassSurface>
            </Animated.View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },
  
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },

  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingHorizontal: 24 },
  titleArea: { paddingHorizontal: 24, marginVertical: 32 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  headerTitle: { fontSize: 32, color: theme.textPrimary, fontWeight: '800', letterSpacing: -1, marginBottom: 4, maxWidth: '88%' },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  syncBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, marginBottom: 24, overflow: 'hidden' },
  syncText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  statsBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 24, overflow: 'hidden' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },

  sealedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  sealedBannerText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  grid: { gap: 20, marginBottom: 36 },
  card: { padding: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderTopColor: 'rgba(255,255,255,0.20)', overflow: 'hidden' },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardIcon: { fontSize: 32 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  cardTitle: { fontSize: 20, color: theme.textPrimary, fontWeight: '700', marginBottom: 6 },
  cardSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 22 },

  dailyHeader: { marginBottom: 24 },
  dailyHeaderTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6, letterSpacing: 0.2 },
  dailyHeaderSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  progressSection: { marginTop: 8, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  progressTitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: PALETTE.gold, borderRadius: 3 },
  progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },
  pastLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, overflow: 'hidden' },
  pastLinkText: { flex: 1, fontSize: 13, fontWeight: '600' },

  somaticCard: { marginTop: 24, borderRadius: 24, padding: 20, gap: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderTopColor: 'rgba(255,255,255,0.20)' },
  somaticLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  somaticDesc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 17 },
  somaticRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  somaticCat: { fontSize: 13, color: theme.textPrimary, fontWeight: '700' },
  somaticValueGroup: { alignItems: 'flex-end', gap: 2 },
  somaticEmotion: { fontSize: 13, fontWeight: '600' },
  somaticCount: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
});
