// File: app/(tabs)/daily-synthesis.tsx
// MySky — Daily Synthesis (The Morning Report)
//
// A full-screen, vertical scroll with a glassmorphism header that stays
// fixed as you scroll. Triggered from the "Daily Context" card on Today tab.
//
// Sections:
//   Hero    — Moon Phase animation + date
//   §1      — The Atmosphere (astrological transits in plain English)
//   §2      — The Reflection (recent check-in correlation)
//   §3      — The Advice (focus for today)
//   Somatic — 30-second physical anchor card
//   Ahead   — Look Ahead (next 48 hours)
//   Loop    — Validation (Yes / No feedback loop)

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { NatalChart } from '../../services/astrology/types';
import {
  generateDailySynthesis,
  storeTransitFeedback,
  DailySynthesis,
} from '../../services/today/dailySynthesis';
import { logger } from '../../utils/logger';

const { width } = Dimensions.get('window');

// ── Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  amethyst: '#9D76C1',
  rose: '#D4A3B3',
  textMain: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.75)',
  textMuted: 'rgba(255,255,255,0.45)',
  glassBg: 'rgba(14, 24, 48, 0.72)',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
  headerBg: 'rgba(2, 8, 23, 0.88)',
};

// Moon phase visual data
const MOON_PHASE_CONFIG: Record<string, { gradient: string[]; symbol: string }> = {
  'New Moon':         { gradient: ['#0A0F1E', '#1A1F35'], symbol: '🌑' },
  'Waxing Crescent':  { gradient: ['#0D1525', '#1E2B45'], symbol: '🌒' },
  'First Quarter':    { gradient: ['#0E1828', '#1F2F4A'], symbol: '🌓' },
  'Waxing Gibbous':   { gradient: ['#101C30', '#223350'], symbol: '🌔' },
  'Full Moon':        { gradient: ['#1A2040', '#2D3A65'], symbol: '🌕' },
  'Waning Gibbous':   { gradient: ['#131B38', '#22305A'], symbol: '🌖' },
  'Last Quarter':     { gradient: ['#0F1728', '#1E2D48'], symbol: '🌗' },
  'Waning Crescent':  { gradient: ['#0C1320', '#191F38'], symbol: '🌘' },
};

// ─── Section Card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  eyebrow: string;
  eyebrowColor: string;
  eyebrowIcon: React.ComponentProps<typeof Ionicons>['name'];
  body: string;
  delay?: number;
}

function SectionCard({ eyebrow, eyebrowColor, eyebrowIcon, body, delay = 0 }: SectionCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(700)} style={styles.sectionCard}>
      <View style={[styles.sectionCardInner, { borderColor: `${eyebrowColor}22` }]}>
        <View style={styles.eyebrowRow}>
          <View style={[styles.eyebrowDot, { backgroundColor: eyebrowColor }]} />
          <Ionicons name={eyebrowIcon} size={13} color={eyebrowColor} />
          <Text style={[styles.eyebrow, { color: eyebrowColor }]}>{eyebrow}</Text>
        </View>
        <Text style={styles.sectionBody}>{body}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DailySynthesisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [synthesis, setSynthesis] = useState<DailySynthesis | null>(null);
  const [chartId, setChartId] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);

  const scrollY = useRef(new RNAnimated.Value(0)).current;

  // Header opacity — becomes fully opaque once scrolled past hero
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          setFeedbackGiven(null);

          const charts = await localDb.getCharts();
          if (!charts.length || cancelled) return;

          const saved = charts[0];
          setChartId(saved.id);

          const natal = AstrologyCalculator.generateNatalChart({
            date: saved.birthDate,
            time: saved.birthTime,
            hasUnknownTime: saved.hasUnknownTime,
            place: saved.birthPlace,
            latitude: saved.latitude,
            longitude: saved.longitude,
            timezone: saved.timezone,
            houseSystem: saved.houseSystem,
          });

          const result = await generateDailySynthesis(natal, saved.id);
          if (!cancelled) setSynthesis(result);
        } catch (err) {
          logger.error('[DailySynthesis] load failed:', err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, []),
  );

  const handleFeedback = useCallback(async (felt: 'yes' | 'no') => {
    if (!synthesis?.primaryTransitKey || !chartId) return;
    Haptics.selectionAsync().catch(() => {});
    setFeedbackGiven(felt);
    try {
      await storeTransitFeedback(chartId, synthesis.primaryTransitKey, felt);
    } catch (err) {
      logger.error('[DailySynthesis] feedback failed:', err);
    }
  }, [synthesis, chartId]);

  const moonConfig = synthesis
    ? (MOON_PHASE_CONFIG[synthesis.moonPhaseName] ?? MOON_PHASE_CONFIG['Waning Gibbous'])
    : MOON_PHASE_CONFIG['Waning Gibbous'];

  if (loading) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingMoon}>🌙</Text>
            <Text style={styles.loadingText}>Reading the sky…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!synthesis) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No synthesis available. Complete a check-in first.</Text>
            <Pressable
              style={styles.backBtn}
              onPress={() => router.back()}
              accessibilityRole="button"
            >
              <Text style={styles.backBtnText}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background */}
      <SkiaDynamicCosmos />

      {/* Floating glassmorphism header — fades in on scroll */}
      <RNAnimated.View
        style={[
          styles.floatingHeader,
          { opacity: headerOpacity, paddingTop: insets.top },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.floatingHeaderInner}>
          <Pressable
            onPress={() => router.back()}
            style={styles.floatingBackBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={PALETTE.textSoft} />
          </Pressable>
          <Text style={styles.floatingTitle}>Daily Synthesis</Text>
          <View style={{ width: 36 }} />
        </View>
      </RNAnimated.View>

      {/* Back button — always visible at top */}
      <View style={[styles.topBackRow, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.topBackBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={PALETTE.textSoft} />
        </Pressable>
      </View>

      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >

        {/* ── Hero Header ── */}
        <Animated.View entering={FadeIn.duration(1200)} style={styles.hero}>
          <LinearGradient
            colors={moonConfig.gradient as any}
            style={styles.heroGradient}
          >
            {/* Moon phase orb */}
            <View style={styles.moonOrb}>
              <Text style={styles.moonEmoji}>{synthesis.moonPhaseEmoji}</Text>
              <View style={styles.moonGlow} />
            </View>

            <Text style={styles.moonPhaseName}>{synthesis.moonPhaseName}</Text>
            <Text style={styles.moonSignText}>Moon in {synthesis.moonSign}</Text>
            <Text style={styles.heroDate}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.heroTagline}>The Story of Today</Text>
          </LinearGradient>
        </Animated.View>

        {/* ── Section 1: The Atmosphere ── */}
        <SectionCard
          eyebrow="THE ATMOSPHERE"
          eyebrowColor={PALETTE.silverBlue}
          eyebrowIcon="planet-outline"
          body={synthesis.atmosphereParagraph}
          delay={200}
        />

        {/* ── Section 2: The Reflection ── */}
        <SectionCard
          eyebrow="THE REFLECTION"
          eyebrowColor={PALETTE.amethyst}
          eyebrowIcon="water-outline"
          body={synthesis.reflectionParagraph}
          delay={350}
        />

        {/* ── Section 3: The Advice ── */}
        <SectionCard
          eyebrow="THE FOCUS"
          eyebrowColor={PALETTE.gold}
          eyebrowIcon="compass-outline"
          body={synthesis.adviceParagraph}
          delay={500}
        />

        {/* ── Somatic Anchor ── */}
        <Animated.View entering={FadeInDown.delay(650).duration(700)} style={styles.somaticCard}>
          <View style={[styles.somaticInner, { borderColor: `${synthesis.somaticAnchor.accentColor}35` }]}>
            {/* Glow border effect */}
            <View style={[styles.somaticGlow, { backgroundColor: `${synthesis.somaticAnchor.accentColor}08` }]} />

            <View style={styles.somaticHeader}>
              <View style={[styles.somaticIconCircle, { borderColor: `${synthesis.somaticAnchor.accentColor}50` }]}>
                <Ionicons
                  name={synthesis.somaticAnchor.icon as any}
                  size={20}
                  color={synthesis.somaticAnchor.accentColor}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.somaticEyebrow}>SOMATIC ANCHOR</Text>
                <Text style={[styles.somaticTitle, { color: synthesis.somaticAnchor.accentColor }]}>
                  {synthesis.somaticAnchor.title}
                </Text>
              </View>
              <View style={styles.durationPill}>
                <Ionicons name="time-outline" size={11} color={PALETTE.textMuted} />
                <Text style={styles.durationText}>{synthesis.somaticAnchor.durationLabel}</Text>
              </View>
            </View>

            <Text style={styles.somaticInstruction}>{synthesis.somaticAnchor.instruction}</Text>
          </View>
        </Animated.View>

        {/* ── Look Ahead ── */}
        <Animated.View entering={FadeInDown.delay(800).duration(700)} style={styles.lookAheadSection}>
          <View style={styles.lookAheadHeader}>
            <Ionicons name="telescope-outline" size={15} color={PALETTE.copper} />
            <Text style={[styles.sectionEyebrow, { color: PALETTE.copper }]}>LOOK AHEAD</Text>
          </View>

          <View style={styles.lookAheadCards}>
            {synthesis.lookAhead.map((point, i) => (
              <View
                key={i}
                style={[
                  styles.lookAheadCard,
                  { borderColor: `${point.accentColor}25` },
                ]}
              >
                <View style={styles.lookAheadCardHeader}>
                  <Ionicons name={point.icon as any} size={14} color={point.accentColor} />
                  <Text style={[styles.lookAheadTimeLabel, { color: point.accentColor }]}>
                    {point.timeLabel}
                  </Text>
                </View>
                <Text style={styles.lookAheadDesc}>{point.description}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Validation Loop ── */}
        {synthesis.primaryTransitKey && (
          <Animated.View entering={FadeInDown.delay(950).duration(700)} style={styles.validationCard}>
            <Text style={styles.validationQuestion}>
              Does this feel like you today?
            </Text>
            <Text style={styles.validationSubtext}>
              Your answer helps the engine learn your unique pattern over time
            </Text>

            {feedbackGiven ? (
              <Animated.View entering={FadeIn.duration(400)} style={styles.feedbackConfirm}>
                <Ionicons
                  name={feedbackGiven === 'yes' ? 'checkmark-circle' : 'close-circle'}
                  size={22}
                  color={feedbackGiven === 'yes' ? PALETTE.emerald : PALETTE.copper}
                />
                <Text style={[
                  styles.feedbackConfirmText,
                  { color: feedbackGiven === 'yes' ? PALETTE.emerald : PALETTE.copper },
                ]}>
                  {feedbackGiven === 'yes'
                    ? 'Noted. This transit will carry more weight.'
                    : 'Noted. The engine will recalibrate this pattern.'}
                </Text>
              </Animated.View>
            ) : (
              <View style={styles.feedbackRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.feedbackBtn,
                    styles.feedbackBtnYes,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleFeedback('yes')}
                  accessibilityRole="button"
                  accessibilityLabel="Yes, this resonates"
                >
                  <Text style={styles.feedbackBtnText}>Yes</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.feedbackBtn,
                    styles.feedbackBtnNo,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleFeedback('no')}
                  accessibilityRole="button"
                  accessibilityLabel="No, this does not resonate"
                >
                  <Text style={styles.feedbackBtnText}>No</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        )}

      </RNAnimated.ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingMoon: { fontSize: 48 },
  loadingText: { color: PALETTE.textMuted, fontSize: 15, fontStyle: 'italic' },
  backBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: PALETTE.textSoft, fontSize: 15 },

  // Floating glass header
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: PALETTE.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.glassBorder,
  },
  floatingHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  floatingBackBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  floatingTitle: {
    color: PALETTE.textMain,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: 0.3,
  },

  // Always-visible top back button (before scroll)
  topBackRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 50,
    paddingLeft: 12,
  },
  topBackBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  // Scroll content
  scrollContent: { paddingBottom: 100 },

  // Hero
  hero: { marginBottom: 24 },
  heroGradient: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  moonOrb: { position: 'relative', marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  moonEmoji: { fontSize: 80, lineHeight: 96 },
  moonGlow: {
    position: 'absolute',
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(139,196,232,0.08)',
  },
  moonPhaseName: {
    color: PALETTE.textMain,
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    textAlign: 'center',
    marginBottom: 4,
  },
  moonSignText: {
    color: PALETTE.silverBlue,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroDate: {
    color: PALETTE.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroTagline: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },

  // Section cards
  sectionCard: { marginHorizontal: 16, marginBottom: 16 },
  sectionCardInner: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(14,24,48,0.55)',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  eyebrowDot: { width: 4, height: 4, borderRadius: 2 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionBody: {
    color: PALETTE.textSoft,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },

  // Somatic anchor
  somaticCard: { marginHorizontal: 16, marginBottom: 16 },
  somaticInner: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  somaticGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  somaticHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  somaticIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  somaticEyebrow: {
    color: PALETTE.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  somaticTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  durationText: { color: PALETTE.textMuted, fontSize: 10, fontWeight: '600' },
  somaticInstruction: {
    color: PALETTE.textSoft,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },

  // Look Ahead
  lookAheadSection: { marginHorizontal: 16, marginBottom: 16 },
  lookAheadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  lookAheadCards: { flexDirection: 'row', gap: 10 },
  lookAheadCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(14,24,48,0.55)',
  },
  lookAheadCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  lookAheadTimeLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  lookAheadDesc: { color: PALETTE.textMuted, fontSize: 12, lineHeight: 18 },

  // Validation loop
  validationCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    padding: 24,
    backgroundColor: 'rgba(14,24,48,0.55)',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    alignItems: 'center',
  },
  validationQuestion: {
    color: PALETTE.textMain,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 6,
  },
  validationSubtext: {
    color: PALETTE.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  feedbackRow: { flexDirection: 'row', gap: 12 },
  feedbackBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  feedbackBtnYes: {
    backgroundColor: 'rgba(110,191,139,0.12)',
    borderColor: 'rgba(110,191,139,0.35)',
  },
  feedbackBtnNo: {
    backgroundColor: 'rgba(205,127,93,0.12)',
    borderColor: 'rgba(205,127,93,0.35)',
  },
  feedbackBtnText: { color: PALETTE.textMain, fontSize: 15, fontWeight: '600' },
  feedbackConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  feedbackConfirmText: { fontSize: 13, fontStyle: 'italic', flex: 1, lineHeight: 18 },
});
