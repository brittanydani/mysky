import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { PsychologicalForcesRadar } from '../../components/ui/PsychologicalForcesRadar';
import { localDb } from '../../services/storage/localDb';
import { DailyCheckIn } from '../../services/patterns/types';
import { logger } from '../../utils/logger';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import {
  loadSelfKnowledgeContext,
  SelfKnowledgeContext,
  ArchetypeKey,
} from '../../services/insights/selfKnowledgeContext';

// ── Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#C9AE78',
  bg: '#0A0A0C',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
};


// ── Archetype display data (mirrors archetypes.tsx) ──
const ARCHETYPES: Record<ArchetypeKey, { name: string; icon: string; color: string; tagline: string; light: string; shadow: string }> = {
  hero:      { name: 'The Hero',      icon: '⚔',  color: '#E8C97A', tagline: 'Driven to prove strength and overcome',          light: 'Courage, determination, protection of others',         shadow: 'Overextension, fear of weakness, difficulty receiving help' },
  caregiver: { name: 'The Caregiver', icon: '❧',  color: '#D4A3B3', tagline: 'Moves through the world by nurturing',            light: 'Empathy, generosity, emotional attunement',            shadow: 'Self-neglect, over-giving, resentment when unseen' },
  seeker:    { name: 'The Seeker',    icon: '◎',  color: '#C9AE78', tagline: 'Craves discovery, freedom, and new horizons',     light: 'Curiosity, adaptability, authentic living',            shadow: 'Restlessness, avoidance of commitment, feeling never satisfied' },
  sage:      { name: 'The Sage',      icon: '◬',  color: '#A8C4D4', tagline: 'Seeks truth and understanding above all',         light: 'Wisdom, clarity, thoughtful perspective',              shadow: 'Over-analysis, emotional distance, perfectionism' },
  rebel:     { name: 'The Rebel',     icon: 'ϟ', color: '#C49FD4', tagline: 'Questions structures and catalyzes change',       light: 'Authenticity, vision, disrupting what no longer serves', shadow: 'Contrarianism for its own sake, difficulty with authority' },
};

// ── Cognitive dimension labels ──
const COG_LABELS = {
  scope:      { left: 'Big Picture', right: 'Detail First' },
  processing: { left: 'Visual & Spatial', right: 'Verbal & Analytical' },
  decisions:  { left: 'Quick & Intuitive', right: 'Careful & Deliberate' },
};

// ── Fixed 6-color palette for the radar ──
const FORCE_PALETTE = [
  '#E07A98', // rose
  '#CD7F5D', // copper
  '#FFEA70', // yellow
  '#6EBF8B', // green
  '#49DFFF', // cyan
  '#7B68EE', // violet
];

// ── Behavioral dimension definitions ──
// Each dimension has a name, tags that signal it, and whether high energy/mood boosts it.
const BEHAVIORAL_DIMENSIONS = [
  { label: 'Action',      tags: ['movement', 'productivity', 'conflict', 'career', 'eq_focused'],        energyBoost: true,  emotionBoost: false },
  { label: 'Connection',  tags: ['relationships', 'intimacy', 'social', 'family', 'eq_open'],            energyBoost: false, emotionBoost: false },
  { label: 'Vitality',    tags: ['joy', 'creativity', 'eq_hopeful', 'confidence', 'gratitude'],          energyBoost: true,  emotionBoost: false },
  { label: 'Depth',       tags: ['grief', 'anxiety', 'boundaries', 'eq_heavy', 'loneliness'],            energyBoost: false, emotionBoost: true  },
  { label: 'Stillness',   tags: ['rest', 'alone_time', 'nature', 'eq_calm', 'eq_grounded'],              energyBoost: false, emotionBoost: false },
  { label: 'Structure',   tags: ['work', 'routine', 'finances', 'health', 'screens'],                    energyBoost: false, emotionBoost: false },
];

function calculateBehavioralForces(checkIns: DailyCheckIn[]): { label: string; value: number; color: string }[] {
  const totalCI = checkIns.length;

  const energyNum = (e: DailyCheckIn['energyLevel']) =>
    e === 'high' ? 100 : e === 'medium' ? 50 : 0;
  const avgEnergy = totalCI > 0
    ? checkIns.reduce((s, c) => s + energyNum(c.energyLevel), 0) / totalCI
    : 50;
  const avgMood = totalCI > 0
    ? checkIns.reduce((s, c) => s + (c.moodScore - 1) * (100 / 9), 0) / totalCI
    : 50;

  return BEHAVIORAL_DIMENSIONS.map((dim, i) => {
    let score = 20; // baseline so nothing reads as zero

    if (totalCI > 0) {
      const relatedTags = new Set(dim.tags);
      const tagMatches = checkIns.filter(c =>
        c.tags.some(t => relatedTags.has(t as string))
      ).length;
      const tagScore = Math.min(100, Math.round((tagMatches / totalCI) * 180));

      const energyBonus = dim.energyBoost ? avgEnergy * 0.25 : 0;
      const emotionBonus = dim.emotionBoost
        ? (100 - avgMood) * 0.2  // high emotional activity → low mood signal
        : 0;

      score = Math.min(100, Math.max(10, Math.round(tagScore * 0.7 + energyBonus + emotionBonus)));
    }

    return { label: dim.label, value: score, color: FORCE_PALETTE[i] };
  });
}

export default function PsychologicalProfileScreen() {
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [selfKnowledge, setSelfKnowledge] = useState<SelfKnowledgeContext | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sk, charts] = await Promise.all([
        loadSelfKnowledgeContext(),
        localDb.getCharts(),
      ]);

      setSelfKnowledge(sk);

      if (charts.length > 0) {
        const recentCheckIns = await localDb.getCheckIns(charts[0].id, 200);
        setCheckIns(recentCheckIns);
      }
    } catch (error) {
      logger.error('[PsychologicalProfileScreen] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        if (!isActive) return;
        await loadData();
      })();
      return () => { isActive = false; };
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <SkiaDynamicCosmos />
        <ActivityIndicator size="large" color={PALETTE.gold} style={{ marginBottom: 16 }} />
        <Text style={styles.loadingText}>Reading your patterns...</Text>
      </View>
    );
  }

  const forces = calculateBehavioralForces(checkIns);
  const hasEnoughData = checkIns.length >= 3;

  const archetype = selfKnowledge?.archetypeProfile
    ? ARCHETYPES[selfKnowledge.archetypeProfile.dominant]
    : null;
  const cogStyle = selfKnowledge?.cognitiveStyle ?? null;
  const coreValues = selfKnowledge?.coreValues?.topFive ?? selfKnowledge?.coreValues?.selected?.slice(0, 5) ?? [];
  const triggers = selfKnowledge?.triggers ?? null;
  const somaticEntries = selfKnowledge?.somaticEntries ?? [];
  const reflections = selfKnowledge?.dailyReflections ?? null;

  // Dominant somatic region
  const somaticRegionCount: Record<string, number> = {};
  somaticEntries.forEach(e => {
    somaticRegionCount[e.region] = (somaticRegionCount[e.region] ?? 0) + 1;
  });
  const topSomaticRegion = Object.entries(somaticRegionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Top reflection category
  const topReflectionCategory = reflections?.byCategory
    ? Object.entries(reflections.byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    : null;

  const hasSomeProfile = archetype || cogStyle || coreValues.length > 0 || triggers;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backButton}
        >
          <MetallicIcon name="arrow-back-outline" size={20} variant="gold" />
          <MetallicText style={styles.backText} variant="gold">Blueprint</MetallicText>
        </Pressable>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Psychological Profile</Text>
            <GoldSubtitle style={styles.headerSub}>
              A portrait of your behavioral patterns, inner drives, and self-knowledge — built entirely from your own data.
            </GoldSubtitle>
          </Animated.View>

          {/* Core Force Map */}
          <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MetallicIcon name="analytics-outline" size={18} variant="gold" />
              <MetallicText style={styles.sectionTitle} variant="gold">Core Force Map</MetallicText>
            </View>
            <Text style={styles.sectionSubtitle}>
              Your six behavioral dimensions, weighted by your check-in patterns over time.
            </Text>
            {hasEnoughData ? (
              <PsychologicalForcesRadar forces={forces} size={320} />
            ) : (
              <View style={styles.emptyHint}>
                <Text style={styles.emptyHintText}>
                  Check in a few more times to see your force map take shape.
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Archetype */}
          {archetype ? (
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <LinearGradient
                colors={[`${archetype.color}18`, 'transparent']}
                style={styles.sectionCard}
              >
                <View style={styles.sectionHeader}>
                  <Text style={[styles.archetypeIcon, { color: archetype.color }]}>{archetype.icon}</Text>
                  <MetallicText style={styles.sectionTitle} variant="gold">Dominant Archetype</MetallicText>
                </View>
                <Text style={[styles.archetypeName, { color: archetype.color }]}>{archetype.name}</Text>
                <Text style={styles.archetypeTagline}>{archetype.tagline}</Text>
                <View style={styles.dualRow}>
                  <View style={styles.dualItem}>
                    <Text style={styles.dualLabel}>LIGHT</Text>
                    <Text style={styles.dualText}>{archetype.light}</Text>
                  </View>
                  <View style={styles.dualDivider} />
                  <View style={styles.dualItem}>
                    <Text style={styles.dualLabel}>SHADOW</Text>
                    <Text style={styles.dualText}>{archetype.shadow}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          ) : null}

          {/* Core Values */}
          {coreValues.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(240).duration(600)} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MetallicIcon name="diamond-outline" size={18} variant="gold" />
                <MetallicText style={styles.sectionTitle} variant="gold">Core Values</MetallicText>
              </View>
              <View style={styles.pillRow}>
                {coreValues.map((v, i) => (
                  <View key={i} style={styles.pill}>
                    <Text style={styles.pillText}>{v}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {/* Cognitive Style */}
          {cogStyle ? (
            <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MetallicIcon name="git-network-outline" size={18} variant="gold" />
                <MetallicText style={styles.sectionTitle} variant="gold">Cognitive Style</MetallicText>
              </View>
              {(['scope', 'processing', 'decisions'] as const).map(key => {
                const dim = COG_LABELS[key];
                const val = cogStyle[key]; // 1–5
                const pct = ((val - 1) / 4) * 100;
                const label = pct <= 40 ? dim.left : pct >= 60 ? dim.right : `${dim.left} / ${dim.right}`;
                return (
                  <View key={key} style={styles.cogRow}>
                    <View style={styles.cogLabelRow}>
                      <Text style={styles.cogDimLabel}>{dim.left}</Text>
                      <Text style={[styles.cogActiveLabel, { color: PALETTE.gold }]}>{label}</Text>
                      <Text style={styles.cogDimLabel}>{dim.right}</Text>
                    </View>
                    <View style={styles.cogTrack}>
                      <View style={[styles.cogFill, { width: `${pct}%` as any }]} />
                      <View style={[styles.cogThumb, { left: `${pct}%` as any }]} />
                    </View>
                  </View>
                );
              })}
            </Animated.View>
          ) : null}

          {/* Triggers */}
          {triggers && (triggers.drains.length > 0 || triggers.restores.length > 0) ? (
            <Animated.View entering={FadeInDown.delay(320).duration(600)} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MetallicIcon name="pulse-outline" size={18} variant="gold" />
                <MetallicText style={styles.sectionTitle} variant="gold">Energy Patterns</MetallicText>
              </View>
              <View style={styles.dualRow}>
                {triggers.drains.length > 0 && (
                  <View style={styles.dualItem}>
                    <Text style={[styles.dualLabel, { color: '#E07A98' }]}>DRAINS</Text>
                    {triggers.drains.slice(0, 3).map((d, i) => (
                      <Text key={i} style={styles.dualText}>· {d}</Text>
                    ))}
                  </View>
                )}
                {triggers.drains.length > 0 && triggers.restores.length > 0 && (
                  <View style={styles.dualDivider} />
                )}
                {triggers.restores.length > 0 && (
                  <View style={styles.dualItem}>
                    <Text style={[styles.dualLabel, { color: '#6EBF8B' }]}>RESTORES</Text>
                    {triggers.restores.slice(0, 3).map((r, i) => (
                      <Text key={i} style={styles.dualText}>· {r}</Text>
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>
          ) : null}

          {/* Somatic + Reflection quick stats */}
          {(topSomaticRegion || reflections) && (
            <Animated.View entering={FadeInDown.delay(360).duration(600)} style={styles.statsRow}>
              {topSomaticRegion && (
                <View style={[styles.statCard, { flex: 1 }]}>
                  <MetallicIcon name="body-outline" size={16} variant="gold" />
                  <Text style={styles.statValue}>{topSomaticRegion}</Text>
                  <Text style={styles.statLabel}>Most active body region</Text>
                </View>
              )}
              {reflections && (
                <View style={[styles.statCard, { flex: 1 }]}>
                  <MetallicIcon name="journal-outline" size={16} variant="gold" />
                  <Text style={styles.statValue}>{reflections.streak > 0 ? `${reflections.streak}d` : `${reflections.totalDays}`}</Text>
                  <Text style={styles.statLabel}>
                    {reflections.streak > 0 ? 'Reflection streak' : 'Days reflected'}
                  </Text>
                  {topReflectionCategory && (
                    <Text style={styles.statSub}>Top theme: {topReflectionCategory}</Text>
                  )}
                </View>
              )}
            </Animated.View>
          )}

          {/* Empty state — no profile data at all */}
          {!hasSomeProfile && !hasEnoughData && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <LinearGradient colors={['rgba(217, 191, 140, 0.1)', 'rgba(10, 10, 15, 0.6)']} style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Your profile is waiting</Text>
                <Text style={styles.emptySubtitle}>
                  Complete a few check-ins and explore Inner World to see your psychological portrait take shape.
                </Text>
                <View style={styles.emptyLinks}>
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); router.push('/inner-world' as Href); }}
                    style={styles.emptyButton}
                  >
                    <MetallicText style={styles.emptyButtonText} variant="gold">Inner World</MetallicText>
                  </Pressable>
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/checkin' as Href); }}
                    style={styles.emptyButton}
                  >
                    <MetallicText style={styles.emptyButtonText} variant="gold">Check In</MetallicText>
                  </Pressable>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 60 },

  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText: { fontSize: 14, color: PALETTE.gold, fontWeight: '600' },

  loadingText: { color: PALETTE.textMuted, fontStyle: 'italic', fontSize: 14, marginTop: 12 },

  header: { alignItems: 'center', marginTop: 20, marginBottom: 28 },
  title: { fontSize: 34, fontWeight: '800', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif-bold', default: 'System' }), letterSpacing: -0.5, marginBottom: 4 },
  headerSub: { fontSize: 14, textAlign: 'center' },

  sectionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  sectionSubtitle: { fontSize: 13, color: PALETTE.textMuted, alignSelf: 'flex-start', marginBottom: 16, lineHeight: 18 },

  emptyHint: { paddingVertical: 24 },
  emptyHintText: { color: PALETTE.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  archetypeIcon: { fontSize: 20 },
  archetypeName: { fontSize: 22, fontWeight: '300', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), alignSelf: 'flex-start', marginBottom: 4 },
  archetypeTagline: { fontSize: 13, color: PALETTE.textMuted, alignSelf: 'flex-start', fontStyle: 'italic', marginBottom: 16, lineHeight: 18 },

  dualRow: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  dualItem: { flex: 1, gap: 4 },
  dualDivider: { width: 1, backgroundColor: PALETTE.glassBorder },
  dualLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: PALETTE.gold, marginBottom: 4 },
  dualText: { fontSize: 13, color: PALETTE.textMuted, lineHeight: 18 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'flex-start', marginTop: 4 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(201,174,120,0.12)', borderWidth: 1, borderColor: 'rgba(201,174,120,0.25)' },
  pillText: { fontSize: 13, color: PALETTE.gold, fontWeight: '600' },

  cogRow: { alignSelf: 'stretch', marginBottom: 16 },
  cogLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cogDimLabel: { fontSize: 10, color: PALETTE.textMuted, fontWeight: '600' },
  cogActiveLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cogTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, position: 'relative' },
  cogFill: { position: 'absolute', left: 0, top: 0, height: 4, borderRadius: 2, backgroundColor: 'rgba(201,174,120,0.5)' },
  cogThumb: { position: 'absolute', top: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: PALETTE.gold, marginLeft: -6 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { borderRadius: 20, padding: 16, borderWidth: 1, borderColor: PALETTE.glassBorder, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '300', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  statLabel: { fontSize: 11, color: PALETTE.textMuted, textAlign: 'center', fontWeight: '600', letterSpacing: 0.5 },
  statSub: { fontSize: 11, color: PALETTE.gold, textAlign: 'center' },

  emptyCard: { borderRadius: 24, padding: 32, borderWidth: 1, borderColor: PALETTE.glassBorder, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  emptyTitle: { fontSize: 22, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 10, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: PALETTE.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyLinks: { flexDirection: 'row', gap: 12 },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(201,174,120,0.4)' },
  emptyButtonText: { color: PALETTE.gold, fontWeight: '700', fontSize: 13 },
});
