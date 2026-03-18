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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';

const STORAGE_KEY = '@mysky:archetype_profile';

const PALETTE = {
  lavender: '#A89BC8',
  gold: '#D9BF8C',
  rose: '#D4A3B3',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#0A0A0C',
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
    color: '#D4A3B3',
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
    icon: '⚡',
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
  completedAt: string;
}

export default function ArchetypesScreen() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, ArchetypeKey>>({});
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [showResult, setShowResult] = useState(false);

  useFocusEffect(
    useCallback(() => {
      EncryptedAsyncStorage.getItem(STORAGE_KEY).then((raw) => {
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
    const profile: SavedProfile = { dominant, scores, completedAt: new Date().toISOString() };
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

  const dominant = savedProfile ? ARCHETYPES[savedProfile.dominant] : null;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient
        colors={['rgba(168,155,200,0.07)', 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Pressable
          style={styles.backBtn}
          onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
        >
          <Text style={styles.backText}>← Inner World</Text>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.headerTitle}>Archetypes</Text>
            <GoldSubtitle style={styles.headerSubtitle}>Your dominant inner patterns</GoldSubtitle>
          </Animated.View>

          {/* Result view */}
          {showResult && dominant && savedProfile ? (
            <Animated.View entering={FadeIn.duration(600)}>
              <View style={[styles.resultCard, { borderColor: `${dominant.color}40` }]}>
                <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={[`${dominant.color}18`, 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <MetallicText style={styles.resultIcon} color={dominant.color}>{dominant.icon}</MetallicText>
                <MetallicText style={styles.resultName} color={dominant.color}>{dominant.name}</MetallicText>
                <Text style={styles.resultTagline}>{dominant.tagline}</Text>

                <View style={styles.divider} />

                <Text style={styles.traitLabel}>GIFTS</Text>
                <Text style={styles.traitText}>{dominant.light}</Text>

                <View style={styles.dividerThin} />

                <Text style={styles.traitLabel}>GROWTH EDGE</Text>
                <Text style={styles.traitText}>{dominant.shadow}</Text>
              </View>

              {/* Score breakdown */}
              <View style={styles.scoresCard}>
                <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
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
                              { width: `${(score / PROMPTS.length) * 100}%`, backgroundColor: a.color },
                            ]}
                          />
                        </View>
                        <Text style={styles.scoreNum}>{score}</Text>
                      </View>
                    );
                  })}
              </View>

              <Pressable style={styles.retakeBtn} onPress={retake}>
                <Text style={styles.retakeBtnText}>Retake Reflection</Text>
              </Pressable>
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
                    <MetallicText style={styles.submitBtnText} color={PALETTE.lavender}>Reveal My Archetype</MetallicText>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },

  backBtn: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText: { fontSize: 14, color: 'rgba(168,155,200,0.7)', fontWeight: '600' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  header: { marginBottom: 32 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '300',
    marginBottom: 8,
  },
  headerSubtitle: { fontSize: 14 },

  instruction: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 20,
    fontStyle: 'italic',
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
    color: PALETTE.textMain,
    fontFamily: 'Georgia',
    marginBottom: 14,
    lineHeight: 22,
  },
  optionsList: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  optionText: { fontSize: 13, color: PALETTE.textMuted, flex: 1, lineHeight: 18 },
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
  submitBtnText: { fontSize: 15, color: PALETTE.lavender, fontWeight: '700' },

  // Result
  resultCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 28,
    marginBottom: 20,
    alignItems: 'center',
  },
  resultIcon: { fontSize: 48, marginBottom: 12 },
  resultName: { fontSize: 26, fontFamily: 'Georgia', fontWeight: '400', marginBottom: 6 },
  resultTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 20 },
  dividerThin: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 14 },
  traitLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  traitText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 20, alignSelf: 'flex-start' },

  scoresCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 20,
    marginBottom: 20,
    gap: 12,
  },
  scoresTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 4,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  scoreName: { fontSize: 13, color: PALETTE.textMuted, width: 100 },
  scoreBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  scoreBarFill: { height: '100%', borderRadius: 2 },
  scoreNum: { fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 16, textAlign: 'right' },

  retakeBtn: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 8,
  },
  retakeBtnText: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
});
