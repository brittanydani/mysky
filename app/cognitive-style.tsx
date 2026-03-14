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
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';

const STORAGE_KEY = '@mysky:cognitive_style';

const PALETTE = {
  silverBlue: '#C9AE78',
  gold: '#D9BF8C',
  sage: '#8CBEAA',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#0A0A0C',
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
      AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        if (raw) {
          try {
            setScores(JSON.parse(raw));
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
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
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

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient
        colors={['rgba(139,196,232,0.08)', 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Pressable
          style={styles.backBtn}
          onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
        >
          <Ionicons name="arrow-back" size={20} color={PALETTE.silverBlue} />
          <Text style={styles.backText}>Inner World</Text>
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.headerTitle}>Cognitive Style</Text>
            <GoldSubtitle style={styles.headerSubtitle}>How your mind naturally works</GoldSubtitle>
          </Animated.View>

          {/* Profile Synthesis — appears at top once all dimensions are set */}
          {allSet && (
            <Animated.View
              entering={FadeIn.duration(600)}
              layout={Layout.springify()}
              style={styles.synthesisCard}
            >
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.synthesisHeader}>
                <Ionicons name="git-network-outline" size={18} color={PALETTE.silverBlue} />
                <Text style={styles.synthesisEyebrow}>COGNITIVE BLUEPRINT</Text>
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
              >
                <Text style={[styles.saveBtnText, saved && { color: PALETTE.sage }]}>
                  {saved ? '✓ Blueprint Sealed' : 'Seal Blueprint'}
                </Text>
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
                  <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={styles.dimInner}>
                    <Text style={styles.dimQuestion}>{dim.question}</Text>

                    <View style={styles.scaleRow}>
                      {[1, 2, 3, 4, 5].map((v) => {
                        const isSelected = currentScore === v;
                        return (
                          <Pressable
                            key={v}
                            style={[styles.scaleBtn, isSelected && styles.scaleBtnSelected]}
                            onPress={() => setScore(dim.id, v)}
                          >
                            <Text style={[styles.scaleBtnText, isSelected && styles.scaleBtnTextSelected]}>
                              {v}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.dimLabels}>
                      <View style={styles.dimLabelBlock}>
                        <Text style={[styles.dimLabelTitle, { color: PALETTE.silverBlue }]}>{dim.left}</Text>
                        <Text style={styles.dimLabelDetail}>{dim.leftDetail}</Text>
                      </View>
                      <View style={[styles.dimLabelBlock, { alignItems: 'flex-end' }]}>
                        <Text style={[styles.dimLabelTitle, { color: PALETTE.gold }]}>{dim.right}</Text>
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

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText: { fontSize: 14, color: PALETTE.silverBlue, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  header: { marginBottom: 32 },
  headerTitle: { fontSize: 34, color: PALETTE.textMain, fontFamily: 'Georgia', fontWeight: '300', marginBottom: 8 },
  headerSubtitle: { fontSize: 14, color: PALETTE.textMuted, fontStyle: 'italic' },

  instruction: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 20, fontStyle: 'italic', marginBottom: 28 },

  synthesisCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(139,196,232,0.25)', padding: 24, marginBottom: 32, alignItems: 'center' },
  synthesisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 16 },
  synthesisEyebrow: { fontSize: 11, color: PALETTE.silverBlue, fontWeight: '800', letterSpacing: 1.5 },
  synthesisTitle: { fontSize: 26, fontFamily: 'Georgia', color: PALETTE.textMain, marginBottom: 24, alignSelf: 'flex-start' },

  radarContainer: { position: 'relative', width: 220, height: 220, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  radarLabel: { position: 'absolute', fontSize: 9, fontWeight: '800', color: PALETTE.textMuted, letterSpacing: 1 },

  synthesisBody: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 22, textAlign: 'center', marginBottom: 24 },

  saveBtn: { height: 48, paddingHorizontal: 32, borderRadius: 24, borderWidth: 1, borderColor: PALETTE.silverBlue, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(201,174,120,0.1)' },
  saveBtnDone: { borderColor: PALETTE.sage, backgroundColor: 'rgba(140,190,170,0.1)' },
  saveBtnText: { fontSize: 13, color: PALETTE.silverBlue, fontWeight: '700', letterSpacing: 0.5 },

  dimensionsContainer: { gap: 16 },
  dimensionBlock: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  dimInner: { padding: 20 },
  dimQuestion: { fontSize: 15, color: PALETTE.textMain, fontFamily: 'Georgia', lineHeight: 22, marginBottom: 20 },

  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 },
  scaleBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center' },
  scaleBtnSelected: { borderColor: 'rgba(139,196,232,0.6)', backgroundColor: 'rgba(139,196,232,0.15)' },
  scaleBtnText: { fontSize: 15, color: 'rgba(255,255,255,0.3)', fontWeight: '700' },
  scaleBtnTextSelected: { color: PALETTE.silverBlue },

  dimLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  dimLabelBlock: { flex: 1 },
  dimLabelTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  dimLabelDetail: { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 16 },
});
