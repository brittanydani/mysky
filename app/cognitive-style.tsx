// app/cognitive-style.tsx
// MySky — Cognitive Style Profile
// Three spectrum assessments reveal how your mind processes and decides.
// Results stored locally via AsyncStorage.

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
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import { syncCognitiveStyleFromReflections } from '../services/insights/reflectionProfileSync';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';

const STORAGE_KEY = '@mysky:cognitive_style';

const PALETTE = {
  silverBlue: '#C9AE78',
  gold: '#D9BF8C',
  sage: '#8CBEAA',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#020817',
};

interface Dimension {
  id: 'scope' | 'processing' | 'decisions';
  question: string;
  left: string;
  right: string;
  leftDetail: string;
  rightDetail: string;
}

const DIMENSIONS: Dimension[] = [
  {
    id: 'scope',
    question: 'When tackling something new, you prefer to...',
    left: 'Big Picture',
    right: 'Detail First',
    leftDetail: 'Start with the whole, fill in details later',
    rightDetail: 'Understand each piece before building up',
  },
  {
    id: 'processing',
    question: 'You take in information best when it is...',
    left: 'Visual & Spatial',
    right: 'Verbal & Analytical',
    leftDetail: 'Diagrams, images, spatial relationships',
    rightDetail: 'Words, logic, structured reasoning',
  },
  {
    id: 'decisions',
    question: 'You make important decisions...',
    left: 'Quick & Intuitive',
    right: 'Careful & Deliberate',
    leftDetail: 'Trust the first clear feeling',
    rightDetail: 'Research, weigh, then commit',
  },
];

type Scores = Record<'scope' | 'processing' | 'decisions', number>; // 1–5

interface StoredCognitiveProfile extends Partial<Scores> {
  manualScores?: Partial<Scores>;
  reflectionScores?: Partial<Scores>;
}

// --- Radar Chart Component ---
const CognitiveSynthesisMap = ({ scores }: { scores: Scores }) => {
  const size = 180;
  const center = size / 2;
  const radius = size / 2 - 20;

  const getPoint = (score: number, angle: number) => {
    const distance = radius * ((score - 1) / 4);
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: center + distance * Math.cos(radian),
      y: center + distance * Math.sin(radian),
    };
  };

  const p1 = getPoint(scores.scope || 3, 0);
  const p2 = getPoint(scores.processing || 3, 120);
  const p3 = getPoint(scores.decisions || 3, 240);

  const polygonPath = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
  const outerPath = `${getPoint(5, 0).x},${getPoint(5, 0).y} ${getPoint(5, 120).x},${getPoint(5, 120).y} ${getPoint(5, 240).x},${getPoint(5, 240).y}`;
  const midPath = `${getPoint(3, 0).x},${getPoint(3, 0).y} ${getPoint(3, 120).x},${getPoint(3, 120).y} ${getPoint(3, 240).x},${getPoint(3, 240).y}`;

  return (
    <View style={styles.radarContainer}>
      <Svg width={size} height={size}>
        {/* Background Grid */}
        <Polygon points={outerPath} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <Polygon points={midPath} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

        {/* Axes */}
        <Line x1={center} y1={center} x2={getPoint(5, 0).x} y2={getPoint(5, 0).y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <Line x1={center} y1={center} x2={getPoint(5, 120).x} y2={getPoint(5, 120).y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <Line x1={center} y1={center} x2={getPoint(5, 240).x} y2={getPoint(5, 240).y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* User Data Polygon */}
        <Polygon points={polygonPath} fill="rgba(201,174,120,0.2)" stroke={PALETTE.silverBlue} strokeWidth="2" />

        {/* Data Points */}
        <Circle cx={p1.x} cy={p1.y} r="4" fill={PALETTE.silverBlue} />
        <Circle cx={p2.x} cy={p2.y} r="4" fill={PALETTE.silverBlue} />
        <Circle cx={p3.x} cy={p3.y} r="4" fill={PALETTE.silverBlue} />
      </Svg>

      {/* Axis Labels */}
      <Text style={[styles.radarLabel, { top: 0, left: center - 20 }]}>SCOPE</Text>
      <Text style={[styles.radarLabel, { bottom: 10, right: 10 }]}>PROCESS</Text>
      <Text style={[styles.radarLabel, { bottom: 10, left: 10 }]}>DECIDE</Text>
    </View>
  );
};

export default function CognitiveStyleScreen() {
  const router = useRouter();
  const [scores, setScores] = useState<Partial<Scores>>({});
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      syncCognitiveStyleFromReflections({ includeDrafts: true })
        .catch(() => {})
        .then(() => EncryptedAsyncStorage.getItem(STORAGE_KEY))
        .then((raw) => {
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as StoredCognitiveProfile;
              setScores({
                scope: parsed.scope,
                processing: parsed.processing,
                decisions: parsed.decisions,
              });
              setSaved(true);
            } catch {}
          }
        });
    }, []),
  );

  const setScore = (id: keyof Scores, value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setScores((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  };

  const allSet = DIMENSIONS.every((d) => scores[d.id] !== undefined);

  const handleSave = async () => {
    try {
      const raw = await EncryptedAsyncStorage.getItem(STORAGE_KEY);
      const existing: StoredCognitiveProfile = raw ? JSON.parse(raw) : {};
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

  const getProfileTitle = () => {
    if (!allSet) return 'Synthesizing...';
    const s = scores as Scores;
    const isVisionary = s.scope <= 2 && s.decisions <= 2;
    const isArchitect = s.scope >= 4 && s.processing >= 4;
    const isTactician = s.scope >= 4 && s.decisions >= 4;

    if (isVisionary) return 'The Intuitive Visionary';
    if (isArchitect) return 'The Structural Architect';
    if (isTactician) return 'The Deliberate Tactician';
    return 'The Adaptive Synthesizer';
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
        colors={['rgba(201,174,120,0.08)', 'transparent']}
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
          <Text style={styles.headerTitle}>Cognitive Style</Text>
          <GoldSubtitle style={styles.headerSubtitle}>How your mind naturally works</GoldSubtitle>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Profile Synthesis — appears at top once all dimensions are set */}
          {allSet && (
            <Animated.View
              entering={FadeIn.duration(600)}
              layout={Layout.springify()}
              style={styles.synthesisCard}
            >
              <View style={styles.synthesisHeader}>
                <MetallicIcon name="git-network-outline" size={18} color={PALETTE.silverBlue} />
                <MetallicText style={styles.synthesisEyebrow} color={PALETTE.silverBlue}>COGNITIVE BLUEPRINT</MetallicText>
              </View>

              <Text style={styles.synthesisTitle}>{getProfileTitle()}</Text>

              <CognitiveSynthesisMap scores={scores as Scores} />

              <Text style={styles.synthesisBody}>
                You tend to approach challenges from a {scores.scope! <= 2 ? 'big-picture' : scores.scope! >= 4 ? 'detail-oriented' : 'balanced'} lens,{' '}
                process information most naturally through {scores.processing! <= 2 ? 'visual' : scores.processing! >= 4 ? 'analytical' : 'multimodal'} means,{' '}
                and make decisions in a {scores.decisions! <= 2 ? 'quick, intuitive' : scores.decisions! >= 4 ? 'careful, deliberate' : 'adaptive'} way.
              </Text>

              <Pressable
                style={[styles.saveBtn, saved && styles.saveBtnDone]}
                onPress={handleSave}
                onLongPress={() => {
                  if (saved) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    setSaved(false);
                  }
                }}
              >
                <MetallicText style={styles.saveBtnText} color={saved ? PALETTE.sage : PALETTE.silverBlue}>
                  {saved ? '✓ Blueprint Sealed · Hold to Edit' : 'Seal Blueprint'}
                </MetallicText>
              </Pressable>
            </Animated.View>
          )}

          {!allSet && (
            <Animated.View entering={FadeInDown.delay(140).duration(500)}>
              <Text style={styles.instruction}>
                Choose where you genuinely land on each spectrum — not where you wish you were.
              </Text>
            </Animated.View>
          )}

          {/* Assessment Dimensions */}
          <View style={styles.dimensionsContainer}>
            {DIMENSIONS.map((dim, i) => {
              const currentScore = scores[dim.id];
              return (
                <Animated.View
                  key={dim.id}
                  entering={FadeInDown.delay(200 + i * 80).duration(500)}
                  style={styles.dimensionBlock}
                >
                  <View style={styles.dimInner}>
                    <Text style={styles.dimQuestion}>{dim.question}</Text>

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
                                color={saved ? PALETTE.gold : PALETTE.silverBlue}
                              >
                                {v}
                              </MetallicText>
                            ) : (
                              <Text style={styles.scaleBtnText}>
                                {v}
                              </Text>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.dimLabels}>
                      <View style={styles.dimLabelBlock}>
                        <MetallicText style={styles.dimLabelTitle} color={PALETTE.silverBlue}>{dim.left}</MetallicText>
                        <Text style={styles.dimLabelDetail}>{dim.leftDetail}</Text>
                      </View>
                      <View style={[styles.dimLabelBlock, { alignItems: 'flex-end' }]}>
                        <MetallicText style={styles.dimLabelTitle} color={PALETTE.gold}>{dim.right}</MetallicText>
                        <Text style={[styles.dimLabelDetail, { textAlign: 'right' }]}>{dim.rightDetail}</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>

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

  header:      { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea:   { paddingHorizontal: 24, paddingBottom: 8 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  closeIcon:   { color: '#FFF', fontSize: 24, lineHeight: 28 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  headerTitle: { fontSize: 34, color: PALETTE.textMain, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  headerSubtitle: { fontSize: 14 },

  instruction: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 20, marginBottom: 28 },

  synthesisCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(201,174,120,0.25)', padding: 28, marginBottom: 32, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  synthesisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 16 },
  synthesisEyebrow: { fontSize: 11, color: PALETTE.silverBlue, fontWeight: '800', letterSpacing: 1.5 },
  synthesisTitle: { fontSize: 26, fontWeight: '700', color: PALETTE.textMain, marginBottom: 24, alignSelf: 'flex-start' },

  radarContainer: { position: 'relative', width: 220, height: 220, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  radarLabel: { position: 'absolute', fontSize: 9, fontWeight: '800', color: PALETTE.textMuted, letterSpacing: 1 },

  synthesisBody: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 22, textAlign: 'center', marginBottom: 24 },

  saveBtn: { height: 48, paddingHorizontal: 32, borderRadius: 24, borderWidth: 1, borderColor: PALETTE.silverBlue, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(201,174,120,0.1)' },
  saveBtnDone: { borderColor: PALETTE.sage, backgroundColor: 'rgba(140,190,170,0.1)' },
  saveBtnText: { fontSize: 13, color: PALETTE.silverBlue, fontWeight: '700', letterSpacing: 0.5 },

  dimensionsContainer: { gap: 16 },
  dimensionBlock: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' },
  dimInner: { padding: 20 },
  dimQuestion: { fontSize: 15, fontWeight: '400', color: PALETTE.textMain, lineHeight: 22, marginBottom: 20 },

  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 },
  scaleBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center' },
  scaleBtnSelected: { borderColor: 'rgba(201,174,120,0.6)', backgroundColor: 'rgba(201,174,120,0.15)' },
  scaleBtnSealed: { borderColor: 'rgba(217,191,140,0.85)', backgroundColor: 'rgba(217,191,140,0.22)' },
  scaleBtnText: { fontSize: 15, color: 'rgba(255,255,255,0.3)', fontWeight: '700' },
  scaleBtnTextSelected: { fontSize: 15, fontWeight: '800' },

  dimLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  dimLabelBlock: { flex: 1 },
  dimLabelTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  dimLabelDetail: { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 16 },
});
