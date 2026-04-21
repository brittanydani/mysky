// app/astrology-context.tsx
// MySky — Cosmic Context (Celestial Weather)
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged "Muddy Gold" tints and opaque grey backgrounds.
// 2. Implemented "Midnight Slate" for heavy anchor elements (Transit Shells, Reflection Card).
// 3. Implemented "Atmosphere" and "Nebula" washes for the weekly moon row and insights.
// 4. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 5. Unified celestial iconography with the Metallic Gold and Atmosphere Blue standard.

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { Ionicons } from '@expo/vector-icons';
import { getMoonPhaseInfo } from '../utils/moonPhase';
import { getTransitInfo } from '../services/astrology/transits';
import { signNameFromLongitude, degreeInSign, normalize360 } from '../services/astrology/sharedHelpers';
import MoonPhaseView from '../components/ui/MoonPhaseView';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import { usePremium } from '../context/PremiumContext';
import { dayOfYear } from '../utils/dateUtils';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // Metallic Brand Gold
  atmosphere: '#A2C2E1', // Icy Blue (Moon / Active)
  nebula: '#A88BEB',     // Dreams / Insights
  ember: '#DC5050',      // Retrograde Warnings
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
};

const REFLECTION_PROMPTS = [
  'What felt most charged for you today?',
  'Where did you notice tension — and what was underneath it?',
  'What restored your energy today?',
  'What are you quietly proud of?',
  'What did you want to say but held back?',
  'Who or what brought a moment of ease today?',
  'What do you want to release before tomorrow?',
];

function getDailyPrompt(): string {
  return REFLECTION_PROMPTS[dayOfYear() % REFLECTION_PROMPTS.length];
}

const MOON_DEG_PER_HOUR = 13.176 / 24;

function hoursUntilMoonIngress(moonLon: number): number {
  const degLeft = 30 - degreeInSign(normalize360(moonLon));
  return degLeft / MOON_DEG_PER_HOUR;
}

function formatHoursMinutes(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function CosmicContext() {
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const router = useRouter();
  const { isPremium } = usePremium();
  
  const [weekExpanded, setWeekExpanded] = useState(false);

  const moonInfo = useMemo(() => getMoonPhaseInfo(), []);
  const transitInfo = useMemo(() => getTransitInfo(new Date(), 0, 0), []);
  const moonLon = transitInfo.longitudes['Moon'] ?? 0;
  const vocHours = hoursUntilMoonIngress(moonLon);

  const weeklyPhases = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + (i - today.getDay() + 1));
      return { date: d, phase: getMoonPhaseInfo(d), isToday: d.toDateString() === today.toDateString(), dayName: d.toLocaleDateString('en-US', { weekday: 'short' }), dayNum: d.getDate() };
    });
  }, []);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
      </View>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Cosmic Context</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Personalized celestial weather</GoldSubtitle>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* ── Hero Moon (Atmosphere Highlight) ── */}
          <View style={styles.heroSection}>
            <MoonPhaseView size={120} gradient interactive={false} />
            <Text style={styles.moonTitle}>{moonInfo.name} in {signNameFromLongitude(moonLon)}</Text>
            <MetallicText style={styles.moonDegree} color={PALETTE.atmosphere}>
              {degreeInSign(moonLon).toFixed(0)}° {signNameFromLongitude(moonLon)}
            </MetallicText>

            {vocHours < 24 && (
              <View style={[styles.vocBadge, styles.velvetBorder]}>
                <View style={styles.vocPulse} />
                <MetallicText style={styles.vocText} variant="gold">VOID-OF-COURSE IN {formatHoursMinutes(vocHours)}</MetallicText>
              </View>
            )}
          </View>

          {/* ── Weekly Moon Phases (Atmosphere Wash) ── */}
          <Pressable style={styles.weekHeader} onPress={() => setWeekExpanded(!weekExpanded)}>
            <Text style={styles.weekHeaderLabel}>PHASE ARCHITECTURE</Text>
            <Ionicons name={weekExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={PALETTE.gold} />
          </Pressable>

          {weekExpanded && (
            <View style={[styles.weekRow, styles.velvetBorder]}>
              <LinearGradient colors={['rgba(162, 194, 225, 0.15)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
              {weeklyPhases.map(({ dayName, dayNum, isToday, phase }, i) => (
                <View key={i} style={styles.weekDayCol}>
                  <Text style={[styles.weekDayName, isToday && { color: PALETTE.gold }]}>{dayName.toUpperCase()}</Text>
                  <Text style={[styles.weekDayNum, isToday && { fontWeight: '800', color: theme.textPrimary }]}>{dayNum}</Text>
                  <View style={{ marginTop: 4, opacity: isToday ? 1 : 0.6 }}>
                    <Text style={{ fontSize: 16 }}>{phase.emoji}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Retrograde Alerts (Ember Wash) ── */}
          {transitInfo.retrogrades.length > 0 && (
            <VelvetGlassSurface style={styles.rxAlertCard} intensity={40}>
              <LinearGradient colors={['rgba(220, 80, 80, 0.18)', 'rgba(220, 80, 80, 0.05)']} style={StyleSheet.absoluteFill} />
              <View style={styles.rxAlertHeader}>
                <MetallicIcon name="warning-outline" size={16} color={PALETTE.ember} />
                <MetallicText style={styles.rxAlertTitle} color={PALETTE.ember}>RETROGRADE ALERT</MetallicText>
              </View>
              <Text style={styles.rxAlertBody}>{transitInfo.retrogrades.join(', ')} currently revisiting past ground.</Text>
            </VelvetGlassSurface>
          )}

          {/* ── Daily Alignment (Midnight Slate Anchor) ── */}
          <VelvetGlassSurface style={styles.affirmationCard} intensity={45}>
            <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
            <View style={styles.cardHeaderRow}>
              <MetallicText style={styles.cardEyebrow} variant="gold">CELESTIAL ALIGNMENT</MetallicText>
              <MetallicText style={styles.premiumIcon} variant="gold">✦</MetallicText>
            </View>
            <Text style={styles.affirmationText}>{moonInfo.message}</Text>
          </VelvetGlassSurface>

          {/* ── Pattern Insights (Nebula Wash) ── */}
          {isPremium && (
             <VelvetGlassSurface style={styles.insightCard} intensity={40}>
                <LinearGradient colors={['rgba(168, 139, 235, 0.18)', 'rgba(168, 139, 235, 0.05)']} style={StyleSheet.absoluteFill} />
                <View style={styles.cardHeaderRow}>
                  <MetallicIcon name="planet-outline" size={16} color={PALETTE.nebula} />
                  <MetallicText style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }} color={PALETTE.nebula}>COSMIC CORRELATIONS</MetallicText>
                </View>
                <Text style={styles.insightText}>Your journal shows increased emotional depth during Scorpio transits.</Text>
             </VelvetGlassSurface>
          )}

          {/* ── Today's Reflection (Midnight Slate Anchor) ── */}
          <VelvetGlassSurface style={styles.reflectionCard} intensity={45}>
            <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
            <View style={styles.promptHeader}>
              <MetallicIcon name="sparkles-outline" size={14} variant="gold" />
              <MetallicText style={styles.promptEyebrow} variant="gold">TODAY'S REFLECTION</MetallicText>
            </View>
            <Text style={styles.promptText}>{getDailyPrompt()}</Text>
            <View style={styles.actionRow}>
              <Pressable style={[styles.actionPill, styles.velvetBorder]} onPress={() => router.push('/(tabs)/internal-weather')}>
                <MetallicText style={styles.actionLabel} variant="gold">Log Mood</MetallicText>
              </Pressable>
              <Pressable style={[styles.actionPill, styles.velvetBorder]} onPress={() => router.push('/(tabs)/journal')}>
                <MetallicText style={styles.actionLabel} variant="gold">Journal</MetallicText>
              </Pressable>
            </View>
          </VelvetGlassSurface>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  
  velvetBorder: {
    ...theme.velvetBorder,
  },

  header: { paddingHorizontal: 24, paddingTop: 12 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  closeIcon: { color: theme.textPrimary, fontSize: 24 },

  titleArea: { paddingHorizontal: 24, marginVertical: 32 },
  headerTitle: { fontSize: 32, color: theme.textPrimary, fontWeight: '800', letterSpacing: -1 },
  headerSubtitle: { fontSize: 12, fontWeight: '600' },
  glowOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.5 },

  heroSection: { alignItems: 'center', marginBottom: 40 },
  moonTitle: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, marginTop: 24, marginBottom: 4 },
  moonDegree: { fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  
  vocBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212,175,55,0.08)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginTop: 20 },
  vocPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: PALETTE.gold, marginRight: 10 },
  vocText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },

  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  weekHeaderLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 2 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 24, padding: 20, marginBottom: 32, overflow: 'hidden' },
  weekDayCol: { alignItems: 'center', gap: 6 },
  weekDayName: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.3)' },
  weekDayNum: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  rxAlertCard: { borderRadius: 24, padding: 24, marginBottom: 24, overflow: 'hidden' },
  rxAlertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  rxAlertTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  rxAlertBody: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },

  affirmationCard: { padding: 28, borderRadius: 28, marginBottom: 24, overflow: 'hidden' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  premiumIcon: { fontSize: 14, lineHeight: 14 },
  affirmationText: { fontSize: 19, color: theme.textPrimary, lineHeight: 28, fontWeight: '600' },

  insightCard: { padding: 24, borderRadius: 24, marginBottom: 24, overflow: 'hidden' },
  insightText: { fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginTop: 12 },

  reflectionCard: { padding: 32, borderRadius: 32, marginBottom: 40, overflow: 'hidden' },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  promptEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  promptText: { fontSize: 22, fontWeight: '800', color: theme.textPrimary, lineHeight: 32, marginBottom: 24 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionPill: { flex: 1, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  actionLabel: { fontSize: 14, fontWeight: '800' },
});
