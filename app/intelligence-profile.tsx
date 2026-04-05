// app/intelligence-profile.tsx
// MySky — Intelligence Profile
// Based on Howard Gardner's Multiple Intelligences theory.
// Users rate themselves on eight intelligence dimensions to discover their
// unique intelligence fingerprint. Results stored locally via EncryptedAsyncStorage.

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
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import * as Haptics from 'expo-haptics';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { syncIntelligenceFromReflections } from '../services/insights/reflectionProfileSync';

const STORAGE_KEY = '@mysky:intelligence_profile';

const PALETTE = {
  gold: '#D9BF8C',
  silverBlue: '#C9AE78',
  sage: '#8CBEAA',
  lavender: '#A89BC8',
  rose: '#C88BA8',
  teal: '#6EB5BF',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#020817',
};

interface IntelligenceDimension {
  id: string;
  name: string;
  icon: string;
  prompt: string;
  lowLabel: string;
  highLabel: string;
  description: string;
}

const DIMENSIONS: IntelligenceDimension[] = [
  {
    id: 'linguistic',
    name: 'Linguistic',
    icon: 'chatbubble-outline',
    prompt: 'How naturally do words, writing, and language come to you?',
    lowLabel: 'Not my strength',
    highLabel: 'Words flow easily',
    description: 'Sensitivity to spoken and written language — the ability to learn languages and use words to achieve goals.',
  },
  {
    id: 'logical',
    name: 'Logical-Mathematical',
    icon: 'git-network-outline',
    prompt: 'How drawn are you to patterns, systems, and logical reasoning?',
    lowLabel: 'Rarely drawn to it',
    highLabel: 'Deeply drawn to it',
    description: 'Capacity to analyze problems logically, carry out mathematical operations, and investigate issues scientifically.',
  },
  {
    id: 'musical',
    name: 'Musical',
    icon: 'musical-notes-outline',
    prompt: 'How deeply do you connect with rhythm, melody, and sound?',
    lowLabel: 'Music is background',
    highLabel: 'Music moves me deeply',
    description: 'Skill in performance, composition, and appreciation of musical patterns — sensitivity to rhythm, pitch, and tone.',
  },
  {
    id: 'spatial',
    name: 'Visual-Spatial',
    icon: 'compass-outline',
    prompt: 'How easily do you think in images, maps, and spatial relationships?',
    lowLabel: 'I think in words',
    highLabel: 'I think in pictures',
    description: 'Potential to recognize and use patterns of wide space and more confined areas — thinking in three dimensions.',
  },
  {
    id: 'kinesthetic',
    name: 'Bodily-Kinesthetic',
    icon: 'body-outline',
    prompt: 'How much do you learn and express through movement and physical skill?',
    lowLabel: 'More cerebral',
    highLabel: 'Very physical',
    description: 'Using one\'s whole body or parts of the body to solve problems, make things, or express ideas and emotions.',
  },
  {
    id: 'interpersonal',
    name: 'Interpersonal',
    icon: 'people-outline',
    prompt: 'How easily do you read, understand, and connect with other people?',
    lowLabel: 'I need space',
    highLabel: 'I read people easily',
    description: 'Capacity to understand the intentions, motivations, and desires of others — working effectively with people.',
  },
  {
    id: 'intrapersonal',
    name: 'Intrapersonal',
    icon: 'person-outline',
    prompt: 'How deeply do you understand your own emotions, motives, and inner world?',
    lowLabel: 'Still exploring',
    highLabel: 'Deep self-knowledge',
    description: 'Capacity to understand oneself — to appreciate one\'s own feelings, fears, and motivations.',
  },
  {
    id: 'naturalistic',
    name: 'Naturalistic',
    icon: 'leaf-outline',
    prompt: 'How attuned are you to the natural world — plants, animals, weather, ecosystems?',
    lowLabel: 'City-minded',
    highLabel: 'Nature is home',
    description: 'Sensitivity to features of the natural world — recognizing and classifying species and ecological patterns.',
  },
  {
    id: 'existential',
    name: 'Existential',
    icon: 'infinite-outline',
    prompt: 'How often do you contemplate life\'s big questions — meaning, mortality, purpose?',
    lowLabel: 'Rarely ponder it',
    highLabel: 'Always seeking meaning',
    description: 'Sensitivity to deep questions about human existence — why we live, why we die, and what it all means.',
  },
];

type Scores = Record<string, number>; // 1–5

// ── Octagon Radar Chart ──

const IntelligenceRadar = ({ scores }: { scores: Scores }) => {
  const size = 240;
  const center = size / 2;
  const radius = size / 2 - 30;
  const count = DIMENSIONS.length;

  const getPoint = (score: number, index: number) => {
    const angle = (360 / count) * index - 90;
    const distance = radius * ((score - 1) / 4);
    const radian = angle * (Math.PI / 180);
    return {
      x: center + distance * Math.cos(radian),
      y: center + distance * Math.sin(radian),
    };
  };

  const getLabelPoint = (index: number) => {
    const angle = (360 / count) * index - 90;
    const distance = radius + 16;
    const radian = angle * (Math.PI / 180);
    return {
      x: center + distance * Math.cos(radian),
      y: center + distance * Math.sin(radian),
    };
  };

  const makePolygon = (score: number) =>
    DIMENSIONS.map((_, i) => {
      const p = getPoint(score, i);
      return `${p.x},${p.y}`;
    }).join(' ');

  const userPolygon = DIMENSIONS.map((d, i) => {
    const p = getPoint(scores[d.id] ?? 3, i);
    return `${p.x},${p.y}`;
  }).join(' ');

  const LABELS = ['LIN', 'LOG', 'MUS', 'SPA', 'BOD', 'INT', 'INTR', 'NAT', 'EXI'];

  return (
    <View style={styles.radarContainer}>
      <Svg width={size} height={size}>
        {/* Background rings */}
        <Polygon points={makePolygon(5)} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <Polygon points={makePolygon(3)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

        {/* Axes */}
        {DIMENSIONS.map((_, i) => {
          const p = getPoint(5, i);
          return (
            <Line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          );
        })}

        {/* User polygon */}
        <Polygon points={userPolygon} fill="rgba(168,155,200,0.2)" stroke={PALETTE.lavender} strokeWidth="2" />

        {/* Data points */}
        {DIMENSIONS.map((d, i) => {
          const p = getPoint(scores[d.id] ?? 3, i);
          return <Circle key={d.id} cx={p.x} cy={p.y} r="4" fill={PALETTE.lavender} />;
        })}

        {/* Labels */}
        {DIMENSIONS.map((_, i) => {
          const lp = getLabelPoint(i);
          return (
            <SvgText
              key={i}
              x={lp.x}
              y={lp.y}
              fontSize="8"
              fontWeight="800"
              fill="rgba(255,255,255,0.4)"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {LABELS[i]}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

// ── Profile Title Logic ──

function getProfileTitle(scores: Scores): string {
  const entries = DIMENSIONS.map((d) => ({ id: d.id, score: scores[d.id] ?? 3 }));
  entries.sort((a, b) => b.score - a.score);
  const top = entries[0];
  const second = entries[1];

  const titles: Record<string, string> = {
    linguistic: 'The Wordsmith',
    logical: 'The Pattern Seeker',
    musical: 'The Resonant Mind',
    spatial: 'The Visual Thinker',
    kinesthetic: 'The Embodied Learner',
    interpersonal: 'The Empathic Bridge',
    intrapersonal: 'The Inner Cartographer',
    naturalistic: 'The Nature Attunist',
    existential: 'The Existential Seeker',
  };

  if (top.score === second.score) {
    return 'The Renaissance Mind';
  }
  return titles[top.id] ?? 'The Adaptive Mind';
}

function getProfileSummary(scores: Scores): string {
  const entries = DIMENSIONS.map((d) => ({ id: d.id, name: d.name, score: scores[d.id] ?? 3 }));
  entries.sort((a, b) => b.score - a.score);
  const top = entries.slice(0, 2);
  const developing = entries.filter((e) => e.score <= 2);

  let summary = `Your strongest intelligences are ${top[0].name} and ${top[1].name}`;
  if (developing.length > 0) {
    summary += `. ${developing.map((d) => d.name).join(' and ')} ${developing.length === 1 ? 'is' : 'are'} areas you might explore further`;
  }
  summary += '.';
  return summary;
}

// ── Screen ──

export default function IntelligenceProfileScreen() {
  const router = useRouter();
  const [scores, setScores] = useState<Scores>({});
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      syncIntelligenceFromReflections({ includeDrafts: true })
        .catch(() => {})
        .then(() => EncryptedAsyncStorage.getItem(STORAGE_KEY))
        .then((raw) => {
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as Record<string, unknown>;
              const loadedScores: Scores = {};
              for (const dim of DIMENSIONS) {
                const val = parsed[dim.id];
                if (typeof val === 'number') loadedScores[dim.id] = val;
              }
              setScores(loadedScores);
              setSaved(true);
            } catch { /* ignore */ }
          }
        })
        .catch(() => {});
    }, []),
  );

  const setScore = (id: string, value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setScores((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  };

  const allSet = DIMENSIONS.every((d) => scores[d.id] !== undefined);
  const anySet = DIMENSIONS.some((d) => scores[d.id] !== undefined);
  const displayScores: Scores = DIMENSIONS.reduce((acc, dim) => {
    acc[dim.id] = scores[dim.id] ?? 3;
    return acc;
  }, {} as Scores);

  const handleSave = async () => {
    try {
      const raw = await EncryptedAsyncStorage.getItem(STORAGE_KEY);
      const existing: Record<string, unknown> = raw ? JSON.parse(raw) : {};
      await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...existing,
        ...scores,
        manualScores: scores,
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSaved(true);
    } catch {
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    }
  };

  const handleClose = () => {
    Haptics.selectionAsync().catch(() => {});
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/inner-world');
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient
        colors={['rgba(168,155,200,0.08)', 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Intelligence Profile</Text>
          <GoldSubtitle style={styles.headerSubtitle}>How your mind is uniquely brilliant</GoldSubtitle>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Synthesis */}
          {anySet && (
            <Animated.View
              entering={FadeIn.duration(600)}
              layout={Layout.springify()}
              style={styles.synthesisCard}
            >
              <View style={styles.synthesisHeader}>
                <MetallicIcon name="sparkles-outline" size={18} color={PALETTE.lavender} />
                <MetallicText style={styles.synthesisEyebrow} color={PALETTE.lavender}>INTELLIGENCE FINGERPRINT</MetallicText>
              </View>

              <Text style={styles.synthesisTitle}>{getProfileTitle(displayScores)}</Text>

              <IntelligenceRadar scores={displayScores} />

              <Text style={styles.synthesisBody}>
                {getProfileSummary(displayScores)}
              </Text>
            </Animated.View>
          )}

          {!anySet && (
            <Animated.View entering={FadeInDown.delay(140).duration(500)}>
              <Text style={styles.instruction}>
                Rate yourself honestly on each intelligence — there are no wrong answers.
                We all have a unique mix.
              </Text>
            </Animated.View>
          )}

          {/* Dimension Cards */}
          <View style={styles.dimensionsContainer}>
            {DIMENSIONS.map((dim, i) => {
              const currentScore = scores[dim.id];
              return (
                <Animated.View
                  key={dim.id}
                  entering={FadeInDown.delay(200 + i * 60).duration(500)}
                  style={styles.dimensionBlock}
                >
                  <View style={styles.dimInner}>
                    <View style={styles.dimHeader}>
                      <MetallicIcon name={dim.icon as any} size={20} color={PALETTE.lavender} />
                      <MetallicText style={styles.dimName} color={PALETTE.lavender}>{dim.name}</MetallicText>
                    </View>

                    <Text style={styles.dimQuestion}>{dim.prompt}</Text>

                    <View style={styles.scaleRow}>
                      {[1, 2, 3, 4, 5].map((v) => {
                        const isSelected = currentScore === v;
                        return (
                          <Pressable
                            key={v}
                            style={[
                              styles.scaleBtn,
                              isSelected && styles.scaleBtnSelected,
                              isSelected && saved && styles.scaleBtnSealed,
                            ]}
                            onPress={() => setScore(dim.id, v)}
                          >
                            {isSelected ? (
                              <MetallicText
                                style={[styles.scaleBtnText, styles.scaleBtnTextSelected]}
                                color={saved ? PALETTE.gold : PALETTE.lavender}
                              >
                                {v}
                              </MetallicText>
                            ) : (
                              <Text style={styles.scaleBtnText}>{v}</Text>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.dimLabels}>
                      <Text style={styles.dimLabelText}>{dim.lowLabel}</Text>
                      <Text style={[styles.dimLabelText, { textAlign: 'right' }]}>{dim.highLabel}</Text>
                    </View>

                    {currentScore != null && (
                      <Animated.View entering={FadeIn.duration(400)}>
                        <Text style={styles.dimDescription}>{dim.description}</Text>
                      </Animated.View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Sticky bottom seal button */}
        {anySet && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.sealBar}>
            <Pressable
              style={[styles.saveBtn, styles.saveBtnFull, saved && styles.saveBtnDone]}
              onPress={handleSave}
              onLongPress={() => {
                if (saved) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  setSaved(false);
                }
              }}
            >
              <MetallicText style={styles.saveBtnText} color={saved ? PALETTE.sage : PALETTE.lavender}>
                {saved ? '✓ Profile Sealed · Hold to Edit' : 'Seal Profile'}
              </MetallicText>
            </Pressable>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea: { paddingHorizontal: 24, paddingBottom: 8 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  closeIcon: { color: '#FFF', fontSize: 24, lineHeight: 28 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  headerTitle: { fontSize: 34, color: PALETTE.textMain, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  headerSubtitle: { fontSize: 14 },

  instruction: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 20, marginBottom: 28 },

  synthesisCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(168,155,200,0.25)', padding: 28, marginBottom: 32, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  synthesisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 16 },
  synthesisEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  synthesisTitle: { fontSize: 26, fontWeight: '700', color: PALETTE.textMain, marginBottom: 24, alignSelf: 'flex-start' },

  radarContainer: { width: 240, height: 240, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },

  synthesisBody: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 22, textAlign: 'center', marginBottom: 24 },

  sealBar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(2,8,23,0.95)' },
  saveBtn: { height: 48, paddingHorizontal: 32, borderRadius: 24, borderWidth: 1, borderColor: PALETTE.lavender, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(168,155,200,0.1)' },
  saveBtnFull: { width: '100%' },
  saveBtnDone: { borderColor: PALETTE.sage, backgroundColor: 'rgba(140,190,170,0.1)' },
  saveBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },

  dimensionsContainer: { gap: 16 },
  dimensionBlock: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' },
  dimInner: { padding: 20 },
  dimHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dimIcon: { width: 20, alignItems: 'center' },
  dimName: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  dimQuestion: { fontSize: 15, fontWeight: '400', color: PALETTE.textMain, lineHeight: 22, marginBottom: 20 },

  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  scaleBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center' },
  scaleBtnSelected: { borderColor: 'rgba(168,155,200,0.6)', backgroundColor: 'rgba(168,155,200,0.15)' },
  scaleBtnSealed: { borderColor: 'rgba(217,191,140,0.85)', backgroundColor: 'rgba(217,191,140,0.22)' },
  scaleBtnText: { fontSize: 15, color: 'rgba(255,255,255,0.3)', fontWeight: '700' },
  scaleBtnTextSelected: { fontSize: 15, fontWeight: '800' },

  dimLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  dimLabelText: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  dimDescription: { marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 18, fontStyle: 'italic' },
});
