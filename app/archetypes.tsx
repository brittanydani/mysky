// app/archetypes.tsx
// MySky — Jungian Archetype Profile
// 5 reflection prompts surface the user's dominant archetype.
// All results stored locally via AsyncStorage.

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
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

const STORAGE_KEY = '@mysky:archetype_profile';

const ACCENT = {
  lavender: '#A89BC8',
  gold: '#D4AF37',
  rose: '#D4A3B3',
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
    color: '#E8C97A',
    tagline: 'Driven to prove strength and overcome',
    light: 'Courage, determination, protection of others',
    shadow: 'Overextension, fear of weakness, difficulty receiving help',
  },
  caregiver: {
    key: 'caregiver',
    name: 'The Caregiver',
    icon: '❧',
    color: '#C9AE78',
    tagline: 'Moves through the world by nurturing',
    light: 'Empathy, generosity, emotional attunement',
    shadow: 'Self-neglect, over-giving, resentment when unseen',
  },
  seeker: {
    key: 'seeker',
    name: 'The Seeker',
    icon: '◎',
    color: '#C9AE78',
    tagline: 'Craves discovery, freedom, and new horizons',
    light: 'Curiosity, adaptability, authentic living',
    shadow: 'Restlessness, avoidance of commitment, feeling never satisfied',
  },
  sage: {
    key: 'sage',
    name: 'The Sage',
    icon: '◬',
    color: '#C9AE78',
    tagline: 'Seeks truth and understanding above all',
    light: 'Wisdom, clarity, thoughtful perspective',
    shadow: 'Over-analysis, emotional distance, perfectionism',
  },
  rebel: {
    key: 'rebel',
    name: 'The Rebel',
    icon: 'ϟ',
    color: '#C9AE78',
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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [answers, setAnswers] = useState<Record<number, ArchetypeKey>>({});
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [showResult, setShowResult] = useState(false);

  useFocusEffect(
    useCallback(() => {
      syncArchetypeProfileFromReflections({ includeDrafts: true })
        .catch(() => {})
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

  const allAnswered = Object.keys(answers).length === PROMPTS.length;

  const computeAndSave = async () => {
    const scores: Record<ArchetypeKey, number> = {
      hero: 0, caregiver: 0, seeker: 0, sage: 0, rebel: 0,
    };
    Object.values(answers).forEach((a) => { scores[a]++; });
    const dominant = (Object.keys(scores) as ArchetypeKey[]).reduce(
      (a, b) => (scores[a] >= scores[b] ? a : b),
    );
    const profile: SavedProfile = {
      dominant,
      scores,
      quizScores: scores,
      completedAt: new Date().toISOString(),
    };
    try {
      await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      Alert.alert('Error', 'Could not save your profile. Please try again.');
      return;
    }
    setSavedProfile(profile);
    setShowResult(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const retake = () => {
    setAnswers({});
    setShowResult(false);
    setSavedProfile(null);
    EncryptedAsyncStorage.removeItem(STORAGE_KEY);
  };

  const handleClose = () => {
    Haptics.selectionAsync().catch(() => {});
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/inner-world');
  };

  const dominant = savedProfile ? ARCHETYPES[savedProfile.dominant] : null;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient
        colors={['rgba(168,155,200,0.07)', 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Archetypes</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Your dominant inner patterns</GoldSubtitle>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Result view */}
          {showResult && dominant && savedProfile ? (
            <Animated.View entering={FadeIn.duration(600)}>
              {(() => {
                const scoreCeiling = Math.max(...Object.values(savedProfile.scores), 1);
                return (
                  <>
              <VelvetGlassSurface style={[styles.resultCard, { borderColor: `${dominant.color}40` }]} intensity={45} backgroundColor={theme.isDark ? 'rgba(18, 18, 24, 0.62)' : 'rgba(255, 255, 255, 0.82)'}> 
                <MetallicText style={styles.resultIcon} color={dominant.color}>{dominant.icon}</MetallicText>
                <MetallicText style={styles.resultName} color={dominant.color}>{dominant.name}</MetallicText>
                <Text style={styles.resultTagline}>{dominant.tagline}</Text>

                <View style={styles.divider} />

                <Text style={styles.traitLabel}>GIFTS</Text>
                <Text style={styles.traitText}>{dominant.light}</Text>

                <View style={styles.dividerThin} />

                <Text style={styles.traitLabel}>GROWTH EDGE</Text>
                <Text style={styles.traitText}>{dominant.shadow}</Text>
              </VelvetGlassSurface>

              {/* Score breakdown */}
              <VelvetGlassSurface style={styles.scoresCard} intensity={42} backgroundColor={theme.isDark ? 'rgba(18, 18, 24, 0.56)' : 'rgba(255, 255, 255, 0.82)'}>
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
                        <View style={styles.scoreBarBg}>
                          <View
                            style={[
                              styles.scoreBarFill,
                              { width: `${(score / scoreCeiling) * 100}%`, backgroundColor: a.color },
                            ]}
                          />
                        </View>
                        <Text style={styles.scoreNum}>{score}</Text>
                      </View>
                    );
                  })}
              </VelvetGlassSurface>

              {/* Reflection evolution nudge */}
              {(() => {
                const refScores = (savedProfile as any).reflectionScores as Record<ArchetypeKey, number> | undefined;
                if (!refScores) return null;
                const refDominant = (Object.entries(refScores) as [ArchetypeKey, number][])
                  .reduce<[ArchetypeKey, number]>(
                    (best, curr) => curr[1] > best[1] ? curr : best,
                    ['hero', -1],
                  )[0];
                const totalRefVotes = Object.values(refScores).reduce((a, b) => a + b, 0);
                if (totalRefVotes < 6 || refDominant === savedProfile.dominant) return null;
                const arc = ARCHETYPES[refDominant];
                return (
                  <VelvetGlassSurface style={[styles.evolutionCard, { borderColor: `${arc.color}30` }]} intensity={38} backgroundColor={theme.isDark ? 'rgba(18, 18, 24, 0.52)' : 'rgba(255, 255, 255, 0.82)'}> 
                    <MetallicText style={styles.evolutionIcon} color={arc.color}>{arc.icon}</MetallicText>
                    <View style={styles.evolutionText}>
                      <Text style={[styles.evolutionTitle, { color: arc.color }]}>
                        Your reflections are trending {arc.name}
                      </Text>
                      <Text style={styles.evolutionBody}>
                        Your daily answers are showing a growing pattern toward {arc.name.replace('The ', '')} energy. Retake the quiz when this feels true.
                      </Text>
                    </View>
                  </VelvetGlassSurface>
                );
              })()}

              <Pressable style={styles.retakeBtn} onPress={retake}>
                <Text style={styles.retakeBtnText}>Retake Reflection</Text>
              </Pressable>
                  </>
                );
              })()}
            </Animated.View>
          ) : (
            /* Quiz view */
            <>
              <Animated.View entering={FadeInDown.delay(140).duration(500)}>
                <Text style={styles.instruction}>
                  Choose the option that resonates most honestly — not the person you aspire to be.
                </Text>
              </Animated.View>

              {PROMPTS.map((prompt, pi) => (
                <Animated.View
                  key={pi}
                  entering={FadeInDown.delay(160 + pi * 60).duration(500)}
                  style={styles.promptBlock}
                >
                  <Text style={styles.promptNum}>0{pi + 1}</Text>
                  <Text style={styles.promptQuestion}>{prompt.question}</Text>
                  <View style={styles.optionsList}>
                    {prompt.options.map((opt) => {
                      const isSelected = answers[pi] === opt.archetype;
                      const archColor = ARCHETYPES[opt.archetype].color;
                      return (
                        <Pressable
                          key={opt.archetype}
                          style={[
                            styles.option,
                            isSelected && { borderColor: `${archColor}60`, backgroundColor: `${archColor}12` },
                          ]}
                          onPress={() => pickAnswer(pi, opt.archetype)}
                        >
                          {isSelected ? (
                            <MetallicText style={styles.optionText} color={archColor}>
                              {opt.label}
                            </MetallicText>
                          ) : (
                            <Text style={styles.optionText}>
                              {opt.label}
                            </Text>
                          )}
                          {isSelected && (
                            <MetallicText style={styles.optionCheck} color={archColor}>✓</MetallicText>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              ))}

              {allAnswered && (
                <Animated.View entering={FadeIn.duration(400)} style={styles.submitRow}>
                  <Pressable style={styles.submitBtn} onPress={computeAndSave}>
                    <LinearGradient
                      colors={['rgba(168,155,200,0.35)', 'rgba(168,155,200,0.12)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <MetallicText style={styles.submitBtnText} color={ACCENT.lavender}>Reveal My Archetype</MetallicText>
                  </Pressable>
                </Animated.View>
              )}
            </>
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
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },

  header:      { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea:   { paddingHorizontal: 24, paddingBottom: 8 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface, borderWidth: 1, borderColor: theme.cardBorder, justifyContent: 'center', alignItems: 'center' },
  closeIcon:   { color: theme.textPrimary, fontSize: 24, lineHeight: 28 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  headerTitle: {
    fontSize: 30,
    color: theme.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: 6,
    maxWidth: '88%',
  },
  headerSubtitle: { fontSize: 12, color: theme.textSecondary },

  instruction: {
    fontSize: 13,
    color: theme.textMuted,
    lineHeight: 21,
    marginBottom: 28,
  },

  // Prompts
  promptBlock: { marginBottom: 28 },
  promptNum: {
    fontSize: 11,
    color: 'rgba(168,155,200,0.5)',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  promptQuestion: {
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '700',
    marginBottom: 14,
    lineHeight: 22,
  },
  optionsList: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : theme.pillSurface,
  },
  optionText: { fontSize: 13, color: theme.textSecondary, flex: 1, lineHeight: 18 },
  optionCheck: { fontSize: 14, fontWeight: '700', marginLeft: 8 },

  submitRow: { marginTop: 8, marginBottom: 24, alignItems: 'center' },
  submitBtn: {
    height: 52,
    paddingHorizontal: 44,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(168,155,200,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: { fontSize: 15, color: '#A89BC8', fontWeight: '700' },

  // Result
  resultCard: { borderRadius: 28, padding: 28, marginBottom: 20, alignItems: 'center' },
  resultIcon: { fontSize: 48, marginBottom: 12 },
  resultName: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  resultTagline: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  divider: { width: '100%', height: 1, backgroundColor: theme.cardBorder, marginVertical: 20 },
  dividerThin: { width: '100%', height: 1, backgroundColor: theme.cardBorder, marginVertical: 14 },
  traitLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: theme.textMuted,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  traitText: { fontSize: 14, color: theme.textSecondary, lineHeight: 20, alignSelf: 'flex-start' },

  scoresCard: { borderRadius: 28, padding: 28, marginBottom: 20, gap: 12 },
  scoresTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: theme.textMuted,
    marginBottom: 4,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  scoreName: { fontSize: 13, color: theme.textSecondary, width: 100 },
  scoreBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.cardBorder,
    overflow: 'hidden',
  },
  scoreBarFill: { height: '100%', borderRadius: 2 },
  scoreNum: { fontSize: 12, color: theme.textMuted, width: 16, textAlign: 'right' },

  retakeBtn: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginBottom: 8,
  },
  retakeBtnText: { fontSize: 13, color: theme.textMuted },

  evolutionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 20,
    borderRadius: 20,
    marginTop: 12,
    marginBottom: 4,
  },
  evolutionIcon: { fontSize: 28, marginTop: 2 },
  evolutionText: { flex: 1, gap: 4 },
  evolutionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  evolutionBody: { fontSize: 13, color: theme.textMuted, lineHeight: 19 },
});
