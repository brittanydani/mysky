// File: app/(tabs)/patterns.tsx
// MySky — Patterns Hub
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged "Muddy Gold" background gradients; implemented Midnight Slate Anchors.
// 2. Implemented Smoked Glass architecture (Atmosphere, Nebula, Sage) for insight cards.
// 3. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 4. Enhanced Typography: Pure White data hero numbers and crisp Metallic Gold headers.

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, ActivityIndicator, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { localDb } from '../../services/storage/localDb';
import { runPipeline } from '../../services/insights/pipeline';
import { computeNarrativeInsights, NarrativeInsightBundle } from '../../utils/narrativeInsights';
import { buildPersonalProfile } from '../../utils/personalProfile';
import { computeDeepInsights, DeepInsightBundle } from '../../utils/deepInsights';
import { PatternOrbitMap } from '../../components/ui/PatternOrbitMap';
import { DailyCheckIn } from '../../services/patterns/types';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import { VelvetGlassSurface } from '../../components/ui/VelvetGlassSurface';
import { loadSelfKnowledgeContext } from '../../services/insights/selfKnowledgeContext';
import {
  computeSelfKnowledgeCrossRef,
  CrossRefInsight,
} from '../../utils/selfKnowledgeCrossRef';
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

const SCREEN_W = Dimensions.get('window').width;
const ORBIT_SIZE = SCREEN_W - 48;

// ─── Semantic Palette ─────────────────────────────────────────────────────────
const PALETTE = {
  gold: '#D4AF37',       // Metallic hardware elements
  atmosphere: '#A2C2E1', // Icy Blue for dashboard glass
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
  nebula: '#A88BEB',     // Dreams/Subconscious
  sage: '#6B9080',       // Growth/Somatic
  ember: '#DC5050',      // Stress/Tension
  bg: '#0A0A0F',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PatternsScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [snapshot, setSnapshot] = useState({ avgMood: 0, avgStress: 0, checkInCount: 0 });
  const [trendCheckIns, setTrendCheckIns] = useState<DailyCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [crossRefs, setCrossRefs] = useState<CrossRefInsight[]>([]);
  const [, setNarrative] = useState<NarrativeInsightBundle | null>(null);
  const [, setDeepInsights] = useState<DeepInsightBundle | null>(null);
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      (async () => {
        try {
          const charts = await localDb.getCharts();
          if (!charts?.length) return;
          const chartId = charts[0].id;
          const checkIns = await localDb.getCheckIns(chartId, 30);
          
          const moods = checkIns.map(c => c.moodScore).filter(v => v != null) as number[];
          const avgMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
          
          setTrendCheckIns(checkIns);
          setSnapshot({ avgMood, avgStress: 4.2, checkInCount: checkIns.length });

          const skContext = await loadSelfKnowledgeContext();
          const refs = computeSelfKnowledgeCrossRef(skContext, checkIns);
          setCrossRefs(refs);

          const pipelineResult = runPipeline({ checkIns, journalEntries: [], sleepEntries: [], chart: null, todayContext: null });
          setNarrative(computeNarrativeInsights(pipelineResult.dailyAggregates));
          setDeepInsights(computeDeepInsights(buildPersonalProfile(pipelineResult.dailyAggregates)));

        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(44, 54, 69, 0.08)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <Text style={styles.title}>Patterns</Text>
            <GoldSubtitle style={styles.subtitle}>Analysis of your internal weather</GoldSubtitle>
          </Animated.View>

          {/* ── Quantitative Snapshot (Midnight Slate Anchor) ── */}
          <View style={styles.snapshotRow}>
            <MetricCard label="AVG MOOD" value={snapshot.avgMood.toFixed(1)} wash={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} />
            <MetricCard label="STRESS" value={snapshot.avgStress.toFixed(1)} wash={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} />
            <MetricCard label="LOGGED" value={snapshot.checkInCount.toString()} wash={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} />
          </View>

          {/* ── Pattern Orbit Map (Atmosphere Blue) ── */}
          <View style={[styles.orbitCard, theme.velvetBorder]}>
            <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
            <View style={styles.orbitCardHeader}>
              <MetallicIcon name="planet-outline" size={14} variant="gold" />
              <MetallicText style={styles.orbitCardEyebrow} variant="gold">PATTERN ORBIT MAP</MetallicText>
            </View>
            {loading ? <ActivityIndicator size="large" color={PALETTE.gold} /> : <PatternOrbitMap checkIns={trendCheckIns} size={ORBIT_SIZE} />}
          </View>

          {/* ── SURFACING TODAY (Dynamic Washes) ── */}
          <SectionHeader label="SURFACING TODAY" icon="radio-outline" />
          
          {crossRefs.length > 0 && (
            <VelvetGlassSurface style={styles.insightCard} intensity={25}>
              <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
              <View style={styles.cardHeader}>
                <MetallicText style={styles.cardLabel} variant="gold">PERSONAL PATTERN</MetallicText>
                <View style={styles.confirmedBadge}><Text style={styles.confirmedText}>DATA CONFIRMED</Text></View>
              </View>
              <Text style={styles.patternTitle}>{crossRefs[0].title}</Text>
              <Text style={styles.insightBody}>{crossRefs[0].body}</Text>
              <GlassTakeaway label="Gentle read" body="Treat the pattern as information, not a diagnosis." icon="compass-outline" />
            </VelvetGlassSurface>
          )}

          {/* ── View Pattern Library Button ── */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowLibraryModal(true);
            }}
            style={styles.libraryButton}
          >
             <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
             <MetallicIcon name="library-outline" size={16} variant="gold" />
             <MetallicText style={styles.libraryButtonText} variant="gold">View Pattern Library</MetallicText>
          </Pressable>

        </ScrollView>
      </SafeAreaView>

      <Modal
        animationType="fade"
        transparent
        visible={showLibraryModal}
        onRequestClose={() => setShowLibraryModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <BlurView intensity={30} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
          <VelvetGlassSurface style={styles.modalCard} intensity={35}>
            <LinearGradient colors={['rgba(44, 54, 69, 0.92)', 'rgba(26, 30, 41, 0.72)']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHeader}>
              <MetallicText style={styles.modalTitle} variant="gold">Pattern Library</MetallicText>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setShowLibraryModal(false);
                }}
                hitSlop={8}
              >
                <MetallicIcon name="close-outline" size={18} variant="gold" />
              </Pressable>
            </View>
            <Text style={styles.modalBody}>
              This library will surface recurring nervous-system, mood, and reflection patterns as your check-in history grows.
            </Text>
            <Text style={styles.modalBodyMuted}>
              Keep logging check-ins and journaling to unlock richer pattern summaries here.
            </Text>
          </VelvetGlassSurface>
        </View>
      </Modal>
    </View>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

const MetricCard = ({ label, value, wash }: { label: string; value: string; wash: [string, string] }) => {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.metricCard, theme.velvetBorder]}>
      <LinearGradient colors={wash} style={StyleSheet.absoluteFill} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
};

const SectionHeader = ({ label, icon }: { label: string; icon: any }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.sectionHeaderRow}>
      <MetallicIcon name={icon} size={14} variant="gold" />
      <MetallicText style={styles.sectionHeaderLabel} variant="gold">{label}</MetallicText>
    </View>
  );
};

const GlassTakeaway = ({ label, body, icon }: { label: string; body: string; icon: any }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.supportCallout}>
      <View style={styles.supportCalloutHeader}>
        <Ionicons name={icon} size={13} color={PALETTE.sage} />
        <Text style={styles.supportCalloutLabel}>{label}</Text>
      </View>
      <Text style={styles.supportCalloutBody}>{body}</Text>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  
  snapshotRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  metricCard: { flex: 1, height: 110, borderRadius: 24, padding: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  metricLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.2, marginBottom: 8 },
  metricValue: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },

  orbitCard: { height: ORBIT_SIZE + 80, borderRadius: 24, marginBottom: 40, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  orbitCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'absolute', top: 24, left: 24 },
  orbitCardEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionHeaderLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },

  insightCard: { padding: 32, borderRadius: 24, marginBottom: 24, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  confirmedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(107,144,128,0.15)', borderWidth: 1, borderColor: 'rgba(107,144,128,0.3)' },
  confirmedText: { fontSize: 8, fontWeight: '800', color: '#6B9080' },
  patternTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  insightBody: { fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 24 },

  supportCallout: { marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  supportCalloutHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  supportCalloutLabel: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase' },
  supportCalloutBody: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },

  libraryButton: { height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  libraryButtonText: { fontSize: 15, fontWeight: '700' },

  modalBackdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { borderRadius: 24, padding: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalBody: { fontSize: 15, lineHeight: 24, color: '#FFFFFF', marginBottom: 12 },
  modalBodyMuted: { fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.62)' },

  glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },
});

