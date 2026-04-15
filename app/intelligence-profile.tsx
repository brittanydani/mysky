// app/intelligence-profile.tsx
// MySky — Intelligence Profile
// Based on Howard Gardner's Multiple Intelligences theory.
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged "Muddy Gold" remnants from radar paths and buttons.
// 2. Assigned vibrant Lavender & Atmosphere for the intelligence radar.
// 3. Implemented "Tactile Hardware" logic for selection pills (Recessed vs. Raised).
// 4. Anchored profile synthesis in Midnight Slate for physical presence.
// 5. Integrated "Velvet Glass" 1px directional light-catch borders globally.
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
import { Canvas, Circle, Group, Path, Skia, BlurMask, Shadow } from '@shopify/react-native-skia';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import { logger } from '../utils/logger';
import { EditorialLikertScale } from '../components/ui/EditorialLikertScale';
import { syncIntelligenceFromReflections } from '../services/insights/reflectionProfileSync';
import { keepLastWordsTogether } from '../utils/textLayout';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { ReflectionDisclaimer } from '../components/ui/ReflectionDisclaimer';

const STORAGE_KEY = '@mysky:intelligence_profile';

const PALETTE = {
  gold: '#D4AF37',          // Hardware icons
  atmosphere: '#A2C2E1', // Icy Blue
  nebula: '#A88BEB',     // Intelligence Map (Lavender)
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const size = 264;
  const center = size / 2;
  const radius = size / 2 - 42;
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

  const makePolygonPath = (score: number) => {
    const path = Skia.Path.Make();
    DIMENSIONS.forEach((_, i) => {
      const p = getPoint(score, i);
      if (i === 0) path.moveTo(p.x, p.y);
      else path.lineTo(p.x, p.y);
    });
    path.close();
    return path;
  };

  const makeAxisPath = (index: number) => {
    const path = Skia.Path.Make();
    const p = getPoint(5, index);
    path.moveTo(center, center);
    path.lineTo(p.x, p.y);
    return path;
  };

  const userPath = (() => {
    const path = Skia.Path.Make();
    DIMENSIONS.forEach((d, i) => {
      const p = getPoint(scores[d.id] ?? 3, i);
      if (i === 0) path.moveTo(p.x, p.y);
      else path.lineTo(p.x, p.y);
    });
    path.close();
    return path;
  })();

  const LABELS = ['LIN', 'LOG', 'MUS', 'SPA', 'BOD', 'INT', 'INTR', 'NAT', 'EXI'];

  return (
    <View style={styles.radarContainer}>
      <Canvas style={styles.radarCanvas}>
        <Group>
          {[5, 3, 1].map((ring) => (
            <Path
              key={ring}
              path={makePolygonPath(ring)}
              color={
                ring === 5
                  ? theme.isDark ? 'rgba(255,255,255,0.11)' : 'rgba(212, 175, 55,0.22)'
                  : theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(212, 175, 55,0.12)'
              }
              style="stroke"
              strokeWidth={1}
            />
          ))}

          {DIMENSIONS.map((_, i) => (
            <Path
              key={`axis-${i}`}
              path={makeAxisPath(i)}
              color={theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(212, 175, 55,0.16)'}
              style="stroke"
              strokeWidth={1}
            />
          ))}

          <Path path={userPath} color="rgba(168, 139, 235, 0.4)">
            <BlurMask blur={14} style="normal" />
          </Path>
          <Path
            path={userPath}
            color="rgba(168, 139, 235, 0.4)"
          />
          <Path
            path={userPath}
            color={PALETTE.gold}
            style="stroke"
            strokeWidth={2.2}
          >
            <Shadow dx={0} dy={0} blur={10} color={PALETTE.nebula} />
          </Path>
          <Path
            path={userPath}
            color={PALETTE.nebula}
            style="stroke"
            strokeWidth={1.4}
          />

          {DIMENSIONS.map((d, i) => {
            const p = getPoint(scores[d.id] ?? 3, i);
            return (
              <Group key={d.id}>
                <Circle cx={p.x} cy={p.y} r={7} color="rgba(162, 194, 225, 0.3)">
                  <BlurMask blur={10} style="solid" />
                </Circle>
                <Circle cx={p.x} cy={p.y} r={4.2} color={PALETTE.gold} />
              </Group>
            );
          })}
        </Group>
      </Canvas>

      {DIMENSIONS.map((_, i) => {
        const lp = getLabelPoint(i);
        return (
          <View
            key={`label-${LABELS[i]}`}
            style={[
              styles.radarLabelWrap,
              {
                left: lp.x - 18,
                top: lp.y - 10,
              },
            ]}
          >
            <Text style={styles.radarLabel}>{LABELS[i]}</Text>
          </View>
        );
      })}
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
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const [scores, setScores] = useState<Scores>({});
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      syncIntelligenceFromReflections({ includeDrafts: true })
        .catch((e) => logger.warn('[IntelligenceProfile] Sync failed:', e))
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
        .catch((e) => logger.warn('[IntelligenceProfile] Load failed:', e));
    }, []),
  );

  const setScore = (id: string, value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setScores((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  };

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
        colors={['rgba(168, 139, 235, 0.12)', 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={10}>
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>{keepLastWordsTogether('Intelligence Profile')}</Text>
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
            >
              <VelvetGlassSurface style={styles.synthesisCard} intensity={45}>
              <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
                <View style={styles.synthesisHeader}>
                  <MetallicIcon name="sparkles-outline" size={18} color={PALETTE.gold} />
                  <MetallicText style={styles.synthesisEyebrow} color={PALETTE.gold}>INTELLIGENCE FINGERPRINT</MetallicText>
                </View>

                <Text style={styles.synthesisTitle}>{getProfileTitle(displayScores)}</Text>

                <IntelligenceRadar scores={displayScores} />

                <Text style={styles.synthesisBody}>
                  {getProfileSummary(displayScores)}
                </Text>
              </VelvetGlassSurface>
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
                >
                  <VelvetGlassSurface style={styles.dimensionBlock} intensity={45}>
                    <View style={styles.dimInner}>
                      <View style={styles.dimHeader}>
                        <MetallicIcon name={dim.icon as any} size={20} color={PALETTE.gold} />
                        <MetallicText style={styles.dimName} color={PALETTE.gold}>{dim.name}</MetallicText>
                      </View>

                      <Text style={styles.dimQuestion}>{dim.prompt}</Text>

                      <EditorialLikertScale
                        value={currentScore ?? null}
                        onChange={(nextValue) => {
                          if (nextValue != null) {
                            setScore(dim.id, nextValue);
                          }
                        }}
                        style={styles.scaleRow}
                        buttonStyle={styles.scaleBtn}
                        selectedButtonStyle={saved ? styles.scaleBtnActive : undefined}
                        labelStyle={styles.scaleBtnText}
                        selectedLabelStyle={styles.scaleBtnTextActive}
                      />

                      <View style={styles.dimLabels}>
                        <View style={styles.dimLabelBlockLeft}>
                          <Text style={styles.dimLabelText}>{dim.lowLabel}</Text>
                        </View>
                        <View style={styles.dimLabelBlockRight}>
                          <Text style={[styles.dimLabelText, styles.dimLabelTextRight]}>{dim.highLabel}</Text>
                        </View>
                      </View>

                      {currentScore != null && (
                        <Animated.View entering={FadeIn.duration(400)}>
                          <Text style={styles.dimDescription}>{dim.description}</Text>
                        </Animated.View>
                      )}
                    </View>
                  </VelvetGlassSurface>
                </Animated.View>
              );
            })}
          </View>

          <ReflectionDisclaimer body="Based on your responses — for self-discovery, not validated professional assessment." />

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Sticky bottom seal button */}
        {anySet && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.sealBar}>
            <Pressable
              style={[styles.saveBtn, styles.velvetBorder]}
              onPress={handleSave}
              onLongPress={() => {
                if (saved) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  setSaved(false);
                }
              }}
            >
              <LinearGradient colors={['rgba(44, 54, 69, 0.95)', 'rgba(26, 30, 41, 0.60)']} style={StyleSheet.absoluteFill} />
              <Text style={[styles.saveBtnText]}>
                {saved ? '✓ Profile Sealed · Hold to Edit' : 'Seal Profile & Continue'}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 10 },
  titleArea: { paddingHorizontal: 24, paddingBottom: 14 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface, justifyContent: 'center', alignItems: 'center' },
  closeIcon: { color: theme.textPrimary, fontSize: 24, lineHeight: 28 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  headerTitle: { fontSize: 26, lineHeight: 31, color: theme.textPrimary, fontWeight: '700', letterSpacing: -0.85, marginBottom: 6, maxWidth: '88%' },
  headerSubtitle: { fontSize: 13, color: theme.textSecondary, lineHeight: 18 },

  instruction: { fontSize: 13, color: theme.textMuted, lineHeight: 21, marginBottom: 28, maxWidth: 320 },

  synthesisCard: { borderRadius: 30, padding: 24, marginBottom: 34, alignItems: 'center' },
  synthesisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 16 },
  synthesisEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  synthesisTitle: { fontSize: 28, lineHeight: 32, fontWeight: '700', color: theme.textPrimary, marginBottom: 24, alignSelf: 'flex-start', letterSpacing: -0.75 },

  radarContainer: { width: 264, height: 264, justifyContent: 'center', alignItems: 'center', marginBottom: 26, position: 'relative' },
  radarCanvas: { width: 264, height: 264 },
  radarLabelWrap: { position: 'absolute', width: 36, alignItems: 'center' },
  radarLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, color: theme.textMuted },

  synthesisBody: { fontSize: 14, color: theme.textSecondary, lineHeight: 23, textAlign: 'center', marginBottom: 4 },

  sealBar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(10,10,15,0.95)' : 'rgba(252,248,241,0.96)' },
  saveBtn: { height: 50, paddingHorizontal: 32, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.cardBorder },
  saveBtnFull: { width: '100%' },
  saveBtnDone: { borderColor: PALETTE.nebula, backgroundColor: PALETTE.nebula },
  saveBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center', color: theme.textPrimary },
  saveBtnTextDone: { color: '#0A0A0F' },

  dimensionsContainer: { gap: 16 },
  dimensionBlock: { borderRadius: 28 },
  dimInner: { padding: 24 },
  dimHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dimIcon: { width: 20, alignItems: 'center' },
  dimName: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  dimQuestion: { fontSize: 16, fontWeight: '400', color: theme.textPrimary, lineHeight: 24, marginBottom: 22 },

  scaleRow: { marginBottom: 14 },
  scaleBtn: { borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.05)' },
  scaleBtnActive: { backgroundColor: PALETTE.nebula, borderColor: PALETTE.nebula },
  scaleBtnText: { fontSize: 15, color: theme.textSecondary, fontWeight: '700' },
  scaleBtnTextActive: { fontSize: 15, fontWeight: '800', color: '#0A0A0F' },

  dimLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  dimLabelBlockLeft: { flex: 1, alignItems: 'flex-start' },
  dimLabelBlockRight: { flex: 1, alignItems: 'flex-end' },
  dimLabelText: { fontSize: 11, color: theme.textMuted, fontWeight: '600' },
  dimLabelTextRight: { textAlign: 'right' },
  dimDescription: { marginTop: 16, fontSize: 12, color: theme.textMuted, lineHeight: 19, fontStyle: 'italic' },
});
