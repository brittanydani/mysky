// app/archetypes.tsx
// MySky — Jungian Archetype Profile
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged "Muddy Gold" remnants from ARCHETYPES and result panels.
// 2. Assigned vibrant semantic colors (Gold, Sage, Atmosphere, Stratosphere, Ember).
// 3. Implemented "Tactile Hardware" quiz options (Recessed Voids vs. Raised Glass).
// 4. Anchored result view in Midnight Slate for physical presence.
// 5. Integrated "Velvet Glass" 1px directional light-catch borders globally.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import * as Haptics from 'expo-haptics';
import { syncArchetypeProfileFromReflections } from '../services/insights/reflectionProfileSync';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import { logger } from '../utils/logger';
import { type AppTheme } from '../constants/theme';
import { useThemedStyles } from '../context/ThemeContext';

const STORAGE_KEY = '@mysky:archetype_profile';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // The Hero
  sage: '#6B9080',       // The Caregiver
  atmosphere: '#A2C2E1', // The Seeker
  stratosphere: '#5C7CAA', // The Sage
  ember: '#DC5050',      // The Rebel
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
};

type ArchetypeKey = 'hero' | 'caregiver' | 'seeker' | 'sage' | 'rebel';

interface Archetype {
  key: ArchetypeKey;
  name: string;
  icon: string;
  color: string;
  tagline: string;
  light: string;
  shadow: string;
}

const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  hero: {
    key: 'hero',
    name: 'The Hero',
    icon: '⚔',
    color: PALETTE.gold,
    tagline: 'Driven to prove strength and overcome',
    light: 'Courage, determination, protection of others',
    shadow: 'Overextension, fear of weakness, difficulty receiving help',
  },
  caregiver: {
    key: 'caregiver',
    name: 'The Caregiver',
    icon: '❧',
    color: PALETTE.sage,
    tagline: 'Moves through the world by nurturing',
    light: 'Empathy, generosity, emotional attunement',
    shadow: 'Self-neglect, over-giving, resentment when unseen',
  },
  seeker: {
    key: 'seeker',
    name: 'The Seeker',
    icon: '◎',
    color: PALETTE.atmosphere,
    tagline: 'Craves discovery, freedom, and new horizons',
    light: 'Curiosity, adaptability, authentic living',
    shadow: 'Restlessness, avoidance of commitment, feeling never satisfied',
  },
  sage: {
    key: 'sage',
    name: 'The Sage',
    icon: '◬',
    color: PALETTE.stratosphere,
    tagline: 'Seeks truth and understanding above all',
    light: 'Wisdom, clarity, thoughtful perspective',
    shadow: 'Over-analysis, emotional distance, perfectionism',
  },
  rebel: {
    key: 'rebel',
    name: 'The Rebel',
    icon: 'ϟ',
    color: PALETTE.ember,
    tagline: 'Questions structures and catalyzes change',
    light: 'Authenticity, vision, disrupting what no longer serves',
    shadow: 'Contrarianism for its own sake, difficulty with authority',
  },
};

interface Prompt {
  question: string;
  options: { label: string; archetype: ArchetypeKey }[];
}

const PROMPTS: Prompt[] = [
  {
    question: 'In a group, you naturally tend to...',
    options: [
      { label: 'Take charge and lead the way', archetype: 'hero' },
      { label: 'Check in and support everyone', archetype: 'caregiver' },
      { label: 'Bring new ideas and angles', archetype: 'seeker' },
      { label: 'Offer perspective and depth', archetype: 'sage' },
      { label: 'Question the existing approach', archetype: 'rebel' },
    ],
  },
  {
    question: 'Your deepest motivation is...',
    options: [
      { label: 'To achieve and prove my worth', archetype: 'hero' },
      { label: 'To protect and care for others', archetype: 'caregiver' },
      { label: 'To experience and discover freely', archetype: 'seeker' },
      { label: 'To understand and share truth', archetype: 'sage' },
      { label: 'To shake up what feels wrong', archetype: 'rebel' },
    ],
  },
  {
    question: 'What you fear most being seen as...',
    options: [
      { label: 'Weak or a failure', archetype: 'hero' },
      { label: 'Selfish or uncaring', archetype: 'caregiver' },
      { label: 'Trapped or conformist', archetype: 'seeker' },
      { label: 'Ignorant or naive', archetype: 'sage' },
      { label: 'Controlled or silenced', archetype: 'rebel' },
    ],
  },
  {
    question: 'When stressed, you typically...',
    options: [
      { label: 'Push harder and try to fix it', archetype: 'hero' },
      { label: 'Over-give until burned out', archetype: 'caregiver' },
      { label: 'Escape, travel, or keep moving', archetype: 'seeker' },
      { label: 'Retreat to think it through alone', archetype: 'sage' },
      { label: 'Withdraw or push back hard', archetype: 'rebel' },
    ],
  },
  {
    question: 'You most admire people who...',
    options: [
      { label: 'Overcome enormous obstacles', archetype: 'hero' },
      { label: 'Give without asking for anything back', archetype: 'caregiver' },
      { label: 'Live fully and on their own terms', archetype: 'seeker' },
      { label: 'Hold quiet, hard-won wisdom', archetype: 'sage' },
      { label: 'Speak uncomfortable truths', archetype: 'rebel' },
    ],
  },
];

interface SavedProfile {
  dominant: ArchetypeKey;
  scores: Record<ArchetypeKey, number>;
  quizScores?: Partial<Record<ArchetypeKey, number>>;
  reflectionScores?: Partial<Record<ArchetypeKey, number>>;
  completedAt: string;
}

export default function ArchetypesScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const [answers, setAnswers] = useState<Record<number, ArchetypeKey>>({});
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [showResult, setShowResult] = useState(false);

  useFocusEffect(
    useCallback(() => {
      syncArchetypeProfileFromReflections({ includeDrafts: true })
        .catch((e) => logger.warn('[Archetypes] Sync failed:', e))
        .then(() => EncryptedAsyncStorage.getItem(STORAGE_KEY))
        .then((raw) => {
          if (raw) {
            try {
              const profile: SavedProfile = JSON.parse(raw);
              setSavedProfile(profile);
              setShowResult(true);
            } catch {}
          }
        });
    }, []),
  );

  const pickAnswer = (promptIndex: number, archetype: ArchetypeKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAnswers((prev) => ({ ...prev, [promptIndex]: archetype }));
  };

  const computeAndSave = async () => {
    const scores: Record<ArchetypeKey, number> = { hero: 0, caregiver: 0, seeker: 0, sage: 0, rebel: 0 };
    Object.values(answers).forEach((a) => { scores[a]++; });
    const dominant = (Object.keys(scores) as ArchetypeKey[]).reduce((a, b) => (scores[a] >= scores[b] ? a : b));
    const profile: SavedProfile = { dominant, scores, quizScores: scores, completedAt: new Date().toISOString() };
    try {
      await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setSavedProfile(profile);
      setShowResult(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Alert.alert('Error', 'Could not save profile.');
    }
  };

  const retake = () => {
    setAnswers({});
    setShowResult(false);
    setSavedProfile(null);
    EncryptedAsyncStorage.removeItem(STORAGE_KEY);
  };

  const dominant = savedProfile ? ARCHETYPES[savedProfile.dominant] : null;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back"><Text style={styles.closeIcon}>×</Text></Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Archetypes</Text>
          <GoldSubtitle style={styles.headerSubtitle}>The recurring patterns of your psyche</GoldSubtitle>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {showResult && dominant && savedProfile ? (
            <Animated.View entering={FadeIn.duration(600)}>
              <VelvetGlassSurface style={styles.resultCard} intensity={45}>
                <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
                <MetallicText style={styles.resultIcon} color={dominant.color}>{dominant.icon}</MetallicText>
                <Text style={styles.resultName}>{dominant.name}</Text>
                <Text style={styles.resultTagline}>{dominant.tagline}</Text>
                <View style={styles.divider} />
                <Text style={styles.traitLabel}>CORE STRENGTHS</Text>
                <Text style={styles.traitText}>{dominant.light}</Text>
                <View style={styles.dividerThin} />
                <Text style={styles.traitLabel}>GROWTH EDGE</Text>
                <Text style={styles.traitText}>{dominant.shadow}</Text>
              </VelvetGlassSurface>

              <VelvetGlassSurface style={styles.scoresCard} intensity={40}>
                <LinearGradient colors={['rgba(44, 54, 69, 0.6)', 'rgba(26, 30, 41, 0.3)']} style={StyleSheet.absoluteFill} />
                <Text style={styles.scoresTitle}>SCORE BREAKDOWN</Text>
                {(Object.keys(savedProfile.scores) as ArchetypeKey[])
                  .sort((a, b) => savedProfile.scores[b] - savedProfile.scores[a])
                  .map((key) => {
                    const a = ARCHETYPES[key];
                    const score = savedProfile.scores[key];
                    return (
                      <View key={key} style={styles.scoreRow}>
                        <MetallicText style={styles.scoreIcon} color={a.color}>{a.icon}</MetallicText>
                        <Text style={styles.scoreName}>{a.name}</Text>
                        <View style={styles.scoreBarBg}><View style={[styles.scoreBarFill, { width: `${(score / 5) * 100}%`, backgroundColor: a.color }]} /></View>
                        <Text style={styles.scoreNum}>{score}</Text>
                      </View>
                    );
                  })}
              </VelvetGlassSurface>

              <Pressable style={styles.retakeBtn} onPress={retake} accessibilityRole="button" accessibilityLabel="Retake reflection">
                <Text style={styles.retakeBtnText}>Retake Reflection</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <>
              <Text style={styles.instruction}>Choose the internal posture that resonates most honestly today.</Text>
              {PROMPTS.map((prompt, pi) => (
                <Animated.View key={pi} entering={FadeInDown.delay(160 + pi * 60)} style={styles.promptBlock}>
                  <Text style={styles.promptNum}>0{pi + 1}</Text>
                  <Text style={styles.promptQuestion}>{prompt.question}</Text>
                  <View style={styles.optionsList}>
                    {prompt.options.map((opt) => {
                      const isSelected = answers[pi] === opt.archetype;
                      const archColor = ARCHETYPES[opt.archetype].color;
                      return (
                        <Pressable
                          key={opt.archetype}
                          style={[styles.option, isSelected ? { borderColor: `${archColor}60`, backgroundColor: `${archColor}15`, transform: [{translateY: -1}] } : styles.optionRecessed]}
                          onPress={() => pickAnswer(pi, opt.archetype)}
                        >
                          {isSelected ? (
                            <MetallicText style={styles.optionText} color={archColor}>{opt.label}</MetallicText>
                          ) : (
                            <Text style={styles.optionText}>{opt.label}</Text>
                          )}
                          {isSelected && <MetallicText style={styles.optionCheck} color={archColor}>✓</MetallicText>}
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              ))}

              {Object.keys(answers).length === PROMPTS.length && (
                <Animated.View entering={FadeIn} style={styles.submitRow}>
                  <Pressable style={[styles.submitBtn, styles.velvetBorder]} onPress={computeAndSave} accessibilityRole="button" accessibilityLabel="Reveal my archetype">
                    <LinearGradient colors={['rgba(44, 54, 69, 0.95)', 'rgba(26, 30, 41, 0.60)']} style={StyleSheet.absoluteFill} />
                    <MetallicText style={styles.submitBtnText} variant="gold">Reveal My Archetype</MetallicText>
                  </Pressable>
                </Animated.View>
              )}
            </>
          )}
          {showResult && dominant && savedProfile && (
            <Pressable
              onPress={() => router.push('/(tabs)/premium' as any)}
              style={{ marginTop: 28, marginBottom: 8, padding: 20, borderRadius: 20, backgroundColor: 'rgba(212,175,55,0.07)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)', alignItems: 'center', gap: 6 }}
            >
              <Text style={{ color: 'rgba(212,175,55,0.9)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>DEEPER SKY</Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                Your archetype is just the beginning — discover how it shapes your emotional patterns and relationships.
              </Text>
              <Text style={{ color: 'rgba(212,175,55,0.8)', fontSize: 12, fontWeight: '600', marginTop: 4 }}>Explore Premium →</Text>
            </Pressable>
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
  glowOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.5 },
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  header: { paddingHorizontal: 24, paddingTop: 12 },
  titleArea: { paddingHorizontal: 24, marginVertical: 32 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  closeIcon: { color: theme.textPrimary, fontSize: 24 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  headerTitle: { fontSize: 32, color: theme.textPrimary, fontWeight: '800', letterSpacing: -1 },
  headerSubtitle: { fontSize: 12, fontWeight: '600' },
  instruction: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 21, marginBottom: 28 },

  promptBlock: { marginBottom: 32 },
  promptNum: { fontSize: 11, color: PALETTE.atmosphere, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  promptQuestion: { fontSize: 18, color: theme.textPrimary, fontWeight: '700', marginBottom: 16, lineHeight: 24 },
  optionsList: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 24, borderWidth: 1 },
  optionRecessed: { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.05)' },
  optionText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  optionCheck: { fontSize: 16, fontWeight: '800' },

  submitRow: { marginTop: 12, alignItems: 'center' },
  submitBtn: { height: 56, paddingHorizontal: 40, borderRadius: 28, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },

  resultCard: { borderRadius: 28, padding: 32, marginBottom: 24, alignItems: 'center', overflow: 'hidden' },
  resultIcon: { fontSize: 52, marginBottom: 16 },
  resultName: { fontSize: 28, fontWeight: '800', color: theme.textPrimary, marginBottom: 8 },
  resultTagline: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 },
  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 24 },
  dividerThin: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  traitLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: 'rgba(255,255,255,0.3)', marginBottom: 8, alignSelf: 'flex-start' },
  traitText: { fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 22, alignSelf: 'flex-start' },

  scoresCard: { borderRadius: 24, padding: 28, marginBottom: 24, gap: 14, overflow: 'hidden' },
  scoresTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: 'rgba(255,255,255,0.3)', marginBottom: 6 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scoreIcon: { fontSize: 16, width: 22 },
  scoreName: { fontSize: 14, color: 'rgba(255,255,255,0.6)', width: 90, fontWeight: '600' },
  scoreBarBg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 2 },
  scoreNum: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '700', width: 20, textAlign: 'right' },
  retakeBtn: { alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  retakeBtnText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
});
