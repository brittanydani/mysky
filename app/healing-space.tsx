// app/healing-space.tsx
// MySky — The Healing Space
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged legacy "Muddy Gold" and generic flat backgrounds.
// 2. Implemented "Midnight Slate" for heavy anchor elements (Ritual Cards).
// 3. Implemented "Nebula", "Sage", and "Ember" washes for deep therapeutic immersion.
// 4. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 5. Unified the lock screen with the high-vibrancy Emerald premium palette.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import {
  loadSelfKnowledgeContext,
  SelfKnowledgeContext,
  ArchetypeKey,
} from '../services/insights/selfKnowledgeContext';
import { usePremium } from '../context/PremiumContext';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { MetallicText } from '../components/ui/MetallicText';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

// ── Cinematic Palette ──
const PALETTE = {
  emerald: '#6EBF8B',   // Healing / Somatic (Green)
  gold: '#D4AF37',      // Primary Accent
  nebula: '#A88BEB',    // Shadow Work (Amethyst)
  rose: '#D4A3B3',      // Relational Reset
  sage: '#6B9080',      // Secure Growth
  slateMid: '#2C3645',  // Anchor Slate Top
  slateDeep: '#1A1E29', // Anchor Slate Bottom
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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { isPremium, isReady, refreshCustomerInfo } = usePremium();
  const [context, setContext] = useState<SelfKnowledgeContext | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchContext = async () => {
        try {
          await refreshCustomerInfo().catch(() => {});
          const data = await loadSelfKnowledgeContext();
          if (isActive) {
            setContext(data);
            setLoading(false);
          }
        } catch {
          if (isActive) setLoading(false);
        }
      };
      fetchContext().catch(() => {});
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

  const SECURE_TAG_IDS = new Set(['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10']);
  const relationalCategories = (() => {
    if (!context?.relationshipPatterns?.length) return { hasSecure: false, hasStruggle: false };
    let hasSecure = false;
    let hasStruggle = false;
    for (const entry of context.relationshipPatterns) {
      for (const tagId of entry.tags) {
        if (SECURE_TAG_IDS.has(tagId)) hasSecure = true;
        else if (tagId.startsWith('t')) hasStruggle = true;
      }
    }
    return { hasSecure, hasStruggle };
  })();

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.centered}>
            <MetallicIcon name="medical-outline" size={56} color={PALETTE.emerald} />
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

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(110, 191, 139, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.08)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => { Haptics.selectionAsync(); router.replace('/(tabs)/identity' as Href); }}
            accessibilityRole="button"
          >
            <MetallicIcon name="chevron-back-outline" size={24} color={PALETTE.emerald} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.headerTitle}>Healing Space</Text>
            <GoldSubtitle style={styles.headerSubtitle}>Synthesized from your active patterns</GoldSubtitle>
          </Animated.View>

          {/* 1. ARCHETYPE SHADOW WORK */}
          {hasArchetype && archetypeData && (
            <Animated.View entering={FadeInDown.delay(140).duration(600)}>
              <VelvetGlassSurface style={styles.card} intensity={45} backgroundColor={theme.cardSurfaceValues}>
              <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['rgba(168, 139, 235, 0.20)', 'transparent']} style={StyleSheet.absoluteFill} />

              <View style={styles.cardHeader}>
                <MetallicIcon name="moon-outline" size={16} color={PALETTE.nebula} />
                <MetallicText style={styles.cardEyebrow} color={PALETTE.nebula}>SHADOW WORK</MetallicText>
              </View>

              <Text style={styles.cardTitle}>{archetypeData.title}</Text>
              <Text style={styles.promptText}>{archetypeData.shadow}</Text>

              <View style={[styles.affirmationBox, { borderLeftColor: PALETTE.nebula }]}>
                <Text style={styles.affirmationLabel}>ANCHOR AFFIRMATION</Text>
                <MetallicText style={styles.affirmationText} variant="gold">{'"' + archetypeData.affirmation + '"'}</MetallicText>
              </View>
              </VelvetGlassSurface>
            </Animated.View>
          )}

          {/* 2. SOMATIC RELEASE RITUAL */}
          {hasSomatic && topRegion && SOMATIC_RITUALS[topRegion] && (
            <Animated.View entering={FadeInDown.delay(220).duration(600)}>
              <VelvetGlassSurface style={styles.card} intensity={45} backgroundColor={theme.cardSurfaceValues}>
              <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['rgba(110, 191, 139, 0.15)', 'transparent']} style={StyleSheet.absoluteFill} />

              <View style={styles.cardHeader}>
                <MetallicIcon name="body-outline" size={16} color={PALETTE.emerald} />
                <MetallicText style={styles.cardEyebrow} color={PALETTE.emerald}>SOMATIC RELEASE</MetallicText>
              </View>

              <Text style={styles.cardTitle}>
                {'Unlocking the ' + topRegion.charAt(0).toUpperCase() + topRegion.slice(1)}
              </Text>
              <Text style={styles.bodyText}>
                Your somatic map indicates you are storing significant energy here. Try this physical reset:
              </Text>

              <View style={[styles.affirmationBox, { borderLeftColor: PALETTE.emerald }]}>
                <Text style={[styles.affirmationText, { fontStyle: 'normal', color: '#FFF' }]}>
                  {SOMATIC_RITUALS[topRegion]}
                </Text>
              </View>
              </VelvetGlassSurface>
            </Animated.View>
          )}

          {/* 3. RELATIONAL PATTERN INTERVENTION */}
          {hasRelational && relationalCategories.hasStruggle && (
            <Animated.View entering={FadeInDown.delay(300).duration(600)}>
              <VelvetGlassSurface style={styles.card} intensity={45} backgroundColor={theme.cardSurfaceValues}>
              <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['rgba(212, 163, 179, 0.15)', 'transparent']} style={StyleSheet.absoluteFill} />

              <View style={styles.cardHeader}>
                <MetallicIcon name="git-compare-outline" size={16} color={PALETTE.rose} />
                <MetallicText style={styles.cardEyebrow} color={PALETTE.rose}>RELATIONAL RESET</MetallicText>
              </View>

              <Text style={styles.cardTitle}>Pattern Interrupt</Text>
              <Text style={styles.bodyText}>
                You recently logged a relational trigger. The next time this dynamic arises, do not react immediately.
              </Text>
              <MetallicText style={[styles.bodyText, { marginTop: 12, fontWeight: '700' }]} color={PALETTE.rose}>
                Step back. Take three breaths. Ask yourself: "Am I responding to the present moment, or protecting a past wound?"
              </MetallicText>
              </VelvetGlassSurface>
            </Animated.View>
          )}

          {/* 3b. SECURE GROWTH ACKNOWLEDGEMENT */}
          {hasRelational && relationalCategories.hasSecure && (
            <Animated.View entering={FadeInDown.delay(relationalCategories.hasStruggle ? 380 : 300).duration(600)}>
              <VelvetGlassSurface style={styles.card} intensity={45} backgroundColor={theme.cardSurfaceValues}>
              <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['rgba(107, 144, 128, 0.15)', 'transparent']} style={StyleSheet.absoluteFill} />

              <View style={styles.cardHeader}>
                <MetallicIcon name="leaf-outline" size={16} color={PALETTE.sage} />
                <MetallicText style={styles.cardEyebrow} color={PALETTE.sage}>SECURE GROWTH</MetallicText>
              </View>

              <Text style={styles.cardTitle}>You Are Already Changing</Text>
              <Text style={styles.bodyText}>
                You have logged moments of regulated, grounded connection. This is not small — it is evidence of real integration.
              </Text>
              <MetallicText style={[styles.bodyText, { marginTop: 12, fontWeight: '700' }]} color={PALETTE.sage}>
                Notice what was true in those moments. That version of you is not an accident — it is who you are becoming.
              </MetallicText>
              </VelvetGlassSurface>
            </Animated.View>
          )}

          {/* EMPTY STATE */}
          {!hasHealingInputs && (
            <Animated.View entering={FadeInDown.delay(300).duration(600)}>
              <VelvetGlassSurface style={styles.card} intensity={45} backgroundColor={theme.cardSurfaceValues}>
              <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['rgba(212, 175, 55, 0.08)', 'transparent']} style={StyleSheet.absoluteFill} />

              <View style={styles.cardHeader}>
                <MetallicIcon name="sparkles-outline" size={16} variant="gold" />
                <MetallicText style={styles.cardEyebrow} variant="gold">NEXT STEP</MetallicText>
              </View>

              <Text style={styles.cardTitle}>Add Healing Inputs</Text>
              <Text style={styles.bodyText}>
                You're in. To generate Shadow Work, Somatic Release, and Relational Reset cards,
                add at least one of these: Archetypes, Somatic Map entries, or Relationship Patterns.
              </Text>

              <Pressable style={styles.actionBtn} onPress={() => router.push('/(tabs)/identity' as Href)}>
                <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
                <MetallicText style={styles.actionBtnText} variant="gold">Open Blueprint</MetallicText>
              </Pressable>
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
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  safeArea: { flex: 1 },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  headerRow: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  header: { marginBottom: 36 },
  headerTitle: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' },

  lockTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 },
  lockSub: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22, marginBottom: 32, maxWidth: 280 },
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

  actionBtn: { marginTop: 24, height: 56, borderRadius: 28, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  actionBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },

  card: { borderRadius: 28, padding: 32, marginBottom: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 12, letterSpacing: -0.5 },
  promptText: { fontSize: 16, color: '#FFF', lineHeight: 26, marginBottom: 24, fontWeight: '600' },
  bodyText: { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 24 },

  affirmationBox: { marginTop: 12, paddingLeft: 16, borderLeftWidth: 2 },
  affirmationLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  affirmationText: { fontSize: 16, lineHeight: 24, fontStyle: 'italic', fontWeight: '700' },
});