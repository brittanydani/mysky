import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import {
  loadSelfKnowledgeContext,
  SelfKnowledgeContext,
  ArchetypeKey,
} from '../../services/insights/selfKnowledgeContext';
import { usePremium } from '../../context/PremiumContext';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';

// ── Cinematic Palette ──
const PALETTE = {
  emerald: '#6EBF8B',   // Healing / Growth
  gold: '#D9BF8C',      // Core Values
  lavender: '#A89BC8',  // Archetypes
  rose: '#D4A3B3',      // Relational
  silverBlue: '#8BC4E8',// Cognitive
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.6)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#0A0A0C',
};

// ── Synthesis Logic ──
const ARCHETYPE_HEALING: Record<ArchetypeKey, { title: string; shadow: string; affirmation: string }> = {
  hero: {
    title: "The Hero's Rest",
    shadow: "Where in your life are you fighting a battle that isn't yours? What would happen if you laid down your armor today?",
    affirmation: "I am worthy of rest. I do not have to earn my place through struggle.",
  },
  caregiver: {
    title: "The Caregiver's Boundary",
    shadow: "Whose emotions are you managing right now instead of your own? What do you need that you are giving to others?",
    affirmation: "My needs are sacred. I can hold space for myself without guilt.",
  },
  seeker: {
    title: "The Seeker's Anchor",
    shadow: "What uncomfortable feeling are you trying to outrun or out-plan? Can you sit with it for three minutes?",
    affirmation: "I am safe where I am. I do not need to move to find peace.",
  },
  sage: {
    title: "The Sage's Heart",
    shadow: "Where are you analyzing a situation to avoid actually feeling the grief or anger underneath it?",
    affirmation: "My feelings contain wisdom my mind cannot access. I allow myself to feel.",
  },
  rebel: {
    title: "The Rebel's Peace",
    shadow: "Are you pushing back against something right now out of habit, or out of true necessity? Where can you soften?",
    affirmation: "I do not have to be in opposition to be authentic. I can exist in harmony.",
  },
};

const SOMATIC_RITUALS: Record<string, string> = {
  chest: "Place your right hand over your heart. Breathe in for 4 seconds, hold for 4, exhale for 6. Visualize the tension dissolving into the air.",
  throat: "Gently massage the sides of your neck. Hum a low, resonant note for 30 seconds to stimulate your vagus nerve and open your voice.",
  gut: "Place both hands on your lower belly. Notice if you are clenching. On your next exhale, intentionally let your stomach push out and soften completely.",
  head: "Close your eyes. Imagine the racing thoughts in your mind are leaves floating on a river, drifting away from your center.",
  back: "Find a wall. Lean your spine flat against it. Push your feet into the floor and feel the solid structural support holding you upright.",
  limbs: "Stand up and violently shake your hands and arms for 15 seconds. Let your nervous system physically discharge the stagnant energy.",
};

export default function HealingSpaceScreen() {
  const router = useRouter();
  const { isPremium, isReady, refreshCustomerInfo } = usePremium();
  const [context, setContext] = useState<SelfKnowledgeContext | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchContext = async () => {
        await refreshCustomerInfo().catch(() => {});
        const data = await loadSelfKnowledgeContext();
        if (isActive) {
          setContext(data);
          setLoading(false);
        }
      };
      fetchContext();
      return () => { isActive = false; };
    }, [refreshCustomerInfo])
  );

  if (loading || !isReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <SkiaDynamicCosmos />
        <ActivityIndicator size="large" color={PALETTE.emerald} style={{ marginBottom: 16 }} />
        <Text style={styles.loadingText}>Synthesizing your inner world...</Text>
      </View>
    );
  }

  const hasArchetype = !!context?.archetypeProfile;
  const hasSomatic = (context?.somaticEntries?.length ?? 0) > 0;
  const hasRelational = (context?.relationshipPatterns?.length ?? 0) > 0;
  const hasHealingInputs = hasArchetype || hasSomatic || hasRelational;

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.centered}>
            <MetallicIcon name="medical-outline" size={48} color={PALETTE.emerald} style={{ marginBottom: 16 }} />
            <Text style={styles.lockTitle}>The Healing Space</Text>
            <Text style={styles.lockSub}>Deep shadow work and somatic release rituals synthesized from your Blueprint.</Text>
            <Pressable style={styles.premiumBtn} onPress={() => router.push('/(tabs)/premium' as Href)}>
              <Ionicons name="sparkles-outline" size={16} color="#0A0A0C" />
              <Text style={styles.premiumBtnText}>Unlock Deeper Sky</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const archetypeData = hasArchetype ? ARCHETYPE_HEALING[context!.archetypeProfile!.dominant] : null;

  const topRegion = hasSomatic
    ? Object.entries(
        context!.somaticEntries.reduce((acc, entry) => {
          acc[entry.region] = (acc[entry.region] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient colors={['rgba(110, 191, 139, 0.08)', 'transparent']} style={styles.topGlow} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Pressable
          style={styles.backBtn}
          onPress={() => { Haptics.selectionAsync(); router.replace('/(tabs)/blueprint' as Href); }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MetallicIcon name="arrow-back-outline" size={20} color={PALETTE.emerald} />
          <MetallicText style={styles.backText} variant="green">Identity</MetallicText>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.headerTitle}>Healing Space</Text>
            <GoldSubtitle style={styles.headerSubtitle}>Synthesized from your active patterns</GoldSubtitle>
          </Animated.View>

          {/* 1. ARCHETYPE SHADOW WORK */}
          {hasArchetype && archetypeData && (
            <Animated.View entering={FadeInDown.delay(140).duration(600)}>
              <LinearGradient colors={['rgba(168, 155, 200, 0.1)', 'rgba(10,10,12,0.85)']} style={styles.card}>

              <View style={styles.cardHeader}>
                <MetallicIcon name="moon-outline" size={16} color={PALETTE.lavender} />
                <MetallicText style={styles.cardEyebrow} variant="lavender">SHADOW WORK</MetallicText>
              </View>

              <Text style={styles.cardTitle}>{archetypeData.title}</Text>
              <Text style={styles.promptText}>{archetypeData.shadow}</Text>

              <View style={styles.affirmationBox}>
                <Text style={styles.affirmationLabel}>ANCHOR AFFIRMATION</Text>
                <MetallicText style={styles.affirmationText} variant="gold">{'"' + archetypeData.affirmation + '"'}</MetallicText>
              </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* 2. SOMATIC RELEASE RITUAL */}
          {hasSomatic && topRegion && SOMATIC_RITUALS[topRegion] && (
            <Animated.View entering={FadeInDown.delay(220).duration(600)}>
              <LinearGradient colors={['rgba(110, 191, 139, 0.1)', 'rgba(10,10,12,0.85)']} style={styles.card}>

              <View style={styles.cardHeader}>
                <MetallicIcon name="body-outline" size={16} color={PALETTE.emerald} />
                <MetallicText style={styles.cardEyebrow} variant="green">SOMATIC RELEASE</MetallicText>
              </View>

              <Text style={styles.cardTitle}>
                {'Unlocking the ' + topRegion.charAt(0).toUpperCase() + topRegion.slice(1)}
              </Text>
              <Text style={styles.bodyText}>
                Your somatic map indicates you are storing significant energy here. Try this physical reset:
              </Text>

              <View style={[styles.affirmationBox, { borderLeftColor: PALETTE.emerald }]}>
                <Text style={[styles.affirmationText, { fontStyle: 'normal', color: PALETTE.textMain }]}>
                  {SOMATIC_RITUALS[topRegion]}
                </Text>
              </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* 3. RELATIONAL PATTERN INTERVENTION */}
          {hasRelational && (
            <Animated.View entering={FadeInDown.delay(300).duration(600)}>
              <LinearGradient colors={['rgba(212, 163, 179, 0.1)', 'rgba(10,10,12,0.85)']} style={styles.card}>

              <View style={styles.cardHeader}>
                <MetallicIcon name="git-compare-outline" size={16} color={PALETTE.rose} />
                <MetallicText style={styles.cardEyebrow} variant="rose">RELATIONAL RESET</MetallicText>
              </View>

              <Text style={styles.cardTitle}>Pattern Interrupt</Text>
              <Text style={styles.bodyText}>
                You recently logged a relational trigger. The next time this dynamic arises, do not react immediately.
              </Text>
              <MetallicText style={[styles.bodyText, { marginTop: 12, fontWeight: '700' }]} variant="rose">
                Step back. Take three breaths. Ask yourself: "Am I responding to the present moment, or protecting a past wound?"
              </MetallicText>
              </LinearGradient>
            </Animated.View>
          )}

          {!hasHealingInputs && (
            <Animated.View entering={FadeInDown.delay(300).duration(600)}>
              <LinearGradient colors={['rgba(255,255,255,0.06)', 'rgba(10,10,12,0.85)']} style={styles.card}>

              <View style={styles.cardHeader}>
                <MetallicIcon name="sparkles-outline" size={16} color={PALETTE.gold} />
                <MetallicText style={styles.cardEyebrow} variant="gold">NEXT STEP</MetallicText>
              </View>

              <Text style={styles.cardTitle}>Add Healing Inputs</Text>
              <Text style={styles.bodyText}>
                You're in. To generate Shadow Work, Somatic Release, and Relational Reset cards,
                add at least one of these: Archetypes, Somatic Map entries, or Relationship Patterns.
              </Text>

              <Pressable style={[styles.actionBtn, { marginTop: 16 }]} onPress={() => router.push('/(tabs)/blueprint' as Href)}>
                <Text style={styles.actionBtnText}>Open Blueprint</Text>
              </Pressable>
              </LinearGradient>
            </Animated.View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText: { fontSize: 14, color: PALETTE.emerald, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  header: { marginBottom: 32 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14 },

  loadingText: { color: PALETTE.textMuted, fontSize: 14 },

  lockTitle: { fontSize: 24, fontWeight: '700', color: PALETTE.textMain, marginBottom: 12, textAlign: 'center' },
  lockSub: { fontSize: 15, color: PALETTE.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PALETTE.emerald,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
  },
  premiumBtnText: { color: '#0A0A0C', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  emptyTitle: { fontSize: 24, fontWeight: '700', color: PALETTE.textMain, marginBottom: 12, textAlign: 'center' },
  emptySub: { fontSize: 15, color: PALETTE.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  actionBtn: { borderWidth: 1, borderColor: PALETTE.glassBorder, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 28 },
  actionBtnText: { color: PALETTE.textMain, fontSize: 14, fontWeight: '600' },

  card: { borderRadius: 24, borderWidth: 1, borderColor: PALETTE.glassBorder, padding: 28, marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.02)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: PALETTE.textMain, marginBottom: 12 },
  promptText: { fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 26, marginBottom: 24 },
  bodyText: { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 24 },

  affirmationBox: { marginTop: 8, paddingLeft: 16, borderLeftWidth: 2, borderLeftColor: PALETTE.lavender },
  affirmationLabel: { fontSize: 10, color: PALETTE.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  affirmationText: { fontSize: 15, color: '#FFFFFF', lineHeight: 22,  },
});

