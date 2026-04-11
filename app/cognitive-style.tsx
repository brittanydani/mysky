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
import {
  BlurMask,
  Canvas,
  Circle as SkiaCircle,
  Line as SkiaLine,
  Path,
  RadialGradient,
  Shadow,
  vec,
} from '@shopify/react-native-skia';
import { syncCognitiveStyleFromReflections } from '../services/insights/reflectionProfileSync';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import { EditorialLikertScale } from '../components/ui/EditorialLikertScale';
import { keepLastWordsTogether } from '../utils/textLayout';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

const STORAGE_KEY = '@mysky:cognitive_style';
const RADAR_SIZE = 180;

const PALETTE = {
  silverBlue: '#C9AE78',
  gold: '#D4AF37',
  sage: '#8CBEAA',
  textMain: '#FFFFFF',
  textMuted: 'rgba(226,232,240,0.45)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#0A0A0F',
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
  const styles = useThemedStyles(createStyles);
  const center = RADAR_SIZE / 2;
  const radius = RADAR_SIZE / 2 - 20;

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

  const outerTop = getPoint(5, 0);
  const outerRight = getPoint(5, 120);
  const outerLeft = getPoint(5, 240);
  const polygonPath = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} Z`;
  const outerPath = `M ${outerTop.x} ${outerTop.y} L ${outerRight.x} ${outerRight.y} L ${outerLeft.x} ${outerLeft.y} Z`;
  const midTop = getPoint(3, 0);
  const midRight = getPoint(3, 120);
  const midLeft = getPoint(3, 240);
  const midPath = `M ${midTop.x} ${midTop.y} L ${midRight.x} ${midRight.y} L ${midLeft.x} ${midLeft.y} Z`;

  const labelPoints = {
    scope: { x: outerTop.x, y: outerTop.y - 16 },
    process: { x: outerRight.x + 10, y: outerRight.y - 8 },
    decide: { x: outerLeft.x - 82, y: outerLeft.y - 8 },
  };

  return (
    <View style={styles.radarContainer}>
      <Canvas style={styles.radarCanvas}>
        <Path path={outerPath} color="rgba(255,255,255,0.10)" style="stroke" strokeWidth={1} />
        <Path path={midPath} color="rgba(255,255,255,0.05)" style="stroke" strokeWidth={1} />

        <SkiaLine p1={vec(center, center)} p2={vec(outerTop.x, outerTop.y)} color="rgba(255,255,255,0.1)" strokeWidth={1} />
        <SkiaLine p1={vec(center, center)} p2={vec(outerRight.x, outerRight.y)} color="rgba(255,255,255,0.1)" strokeWidth={1} />
        <SkiaLine p1={vec(center, center)} p2={vec(outerLeft.x, outerLeft.y)} color="rgba(255,255,255,0.1)" strokeWidth={1} />

        <Path path={polygonPath} style="fill" opacity={0.42}>
          <RadialGradient c={vec(center, center)} r={radius} colors={["rgba(217,191,140,0.55)", "rgba(217,191,140,0.08)"]} />
          <BlurMask blur={18} style="normal" />
        </Path>
        <Path path={polygonPath} style="fill">
          <RadialGradient c={vec(center, center)} r={radius} colors={["rgba(217,191,140,0.32)", "rgba(217,191,140,0.06)"]} />
        </Path>
        <Path path={polygonPath} color={PALETTE.gold} style="stroke" strokeWidth={2.5}>
          <Shadow dx={0} dy={0} blur={15} color="#D4AF37" />
        </Path>

        {[p1, p2, p3].map((point, index) => (
          <React.Fragment key={`point-${index}`}>
            <SkiaCircle cx={point.x} cy={point.y} r={8} color="rgba(217,191,140,0.28)">
              <BlurMask blur={8} style="normal" />
            </SkiaCircle>
            <SkiaCircle cx={point.x} cy={point.y} r={4} color={PALETTE.gold} />
          </React.Fragment>
        ))}
      </Canvas>

      <View style={[styles.radarLabelAnchor, { top: labelPoints.scope.y, left: labelPoints.scope.x - 34, width: 68, alignItems: 'center' }]}>
        <Text style={styles.radarLabel}>SCOPE</Text>
      </View>
      <View style={[styles.radarLabelAnchor, { top: labelPoints.process.y, left: labelPoints.process.x, width: 78, alignItems: 'flex-start' }]}>
        <Text style={styles.radarLabel}>PROCESS</Text>
      </View>
      <View style={[styles.radarLabelAnchor, { top: labelPoints.decide.y, left: labelPoints.decide.x, width: 78, alignItems: 'flex-end' }]}>
        <Text style={styles.radarLabel}>DECIDE</Text>
      </View>
    </View>
  );
};

export default function CognitiveStyleScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
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

  const anySet = DIMENSIONS.some((d) => scores[d.id] !== undefined);
  const displayScores: Scores = {
    scope: scores.scope ?? 3,
    processing: scores.processing ?? 3,
    decisions: scores.decisions ?? 3,
  };

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
    const s = displayScores;
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
            hitSlop={10}
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

          {/* Profile Synthesis — appears once any live score exists */}
          {anySet && (
            <Animated.View
              entering={FadeIn.duration(600)}
              layout={Layout.springify()}
            >
              <VelvetGlassSurface style={styles.synthesisCard} intensity={30} backgroundColor={theme.isDark ? 'rgba(12, 15, 24, 0.34)' : 'rgba(255, 255, 255, 0.72)'}>
              <View style={styles.synthesisHeader}>
                <MetallicIcon name="git-network-outline" size={18} color={PALETTE.silverBlue} />
                <MetallicText style={styles.synthesisEyebrow} color={PALETTE.silverBlue}>COGNITIVE BLUEPRINT</MetallicText>
              </View>

              <Text style={styles.synthesisTitle}>{keepLastWordsTogether(getProfileTitle())}</Text>

              <CognitiveSynthesisMap scores={displayScores} />

              <Text style={styles.synthesisBody}>
                {keepLastWordsTogether(`You tend to approach challenges from a ${displayScores.scope <= 2 ? 'big-picture' : displayScores.scope >= 4 ? 'detail-oriented' : 'balanced'} lens, process information most naturally through ${displayScores.processing <= 2 ? 'visual' : displayScores.processing >= 4 ? 'analytical' : 'multimodal'} means, and make decisions in a ${displayScores.decisions <= 2 ? 'quick, intuitive' : displayScores.decisions >= 4 ? 'careful, deliberate' : 'adaptive'} way.`)}
              </Text>
              </VelvetGlassSurface>
            </Animated.View>
          )}

          {!anySet && (
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
                  <VelvetGlassSurface style={styles.dimInner} intensity={28} backgroundColor={theme.isDark ? 'rgba(12, 15, 24, 0.30)' : 'rgba(255, 255, 255, 0.70)'}>
                    <Text style={styles.dimQuestion}>{keepLastWordsTogether(dim.question)}</Text>

                    <EditorialLikertScale
                      value={currentScore ?? null}
                      onChange={(nextValue) => {
                        if (nextValue != null) {
                          setScore(dim.id, nextValue);
                        }
                      }}
                      style={styles.scaleRow}
                      buttonStyle={styles.scaleBtn}
                      selectedButtonStyle={saved ? styles.scaleBtnSealed : undefined}
                      labelStyle={styles.scaleBtnText}
                      selectedLabelStyle={styles.scaleBtnTextSelected}
                    />

                    <View style={styles.dimLabels}>
                      <View style={[styles.dimLabelBlock, styles.dimLabelBlockLeft]}>
                        <Text style={styles.dimLabelTitle}>{dim.left}</Text>
                        <Text style={styles.dimLabelDetail}>{keepLastWordsTogether(dim.leftDetail)}</Text>
                      </View>
                      <View style={[styles.dimLabelBlock, styles.dimLabelBlockRight]}>
                        <Text style={styles.dimLabelTitle}>{dim.right}</Text>
                        <Text style={[styles.dimLabelDetail, styles.dimLabelDetailRight]}>{keepLastWordsTogether(dim.rightDetail)}</Text>
                      </View>
                    </View>
                  </VelvetGlassSurface>
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
              <Text style={[styles.saveBtnText, saved && styles.saveBtnTextDone]}>
                {saved ? '✓ Blueprint Sealed · Hold to Edit' : 'Seal Blueprint & Continue'}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  header:      { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea:   { paddingHorizontal: 24, paddingBottom: 8 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface, borderWidth: 1, borderColor: theme.cardBorder, justifyContent: 'center', alignItems: 'center' },
  closeIcon:   { color: theme.textPrimary, fontSize: 24, lineHeight: 28 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  headerTitle: { fontSize: 34, color: theme.textPrimary, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  headerSubtitle: { fontSize: 14 },

  instruction: { fontSize: 13, color: theme.textMuted, lineHeight: 20, marginBottom: 28 },

  synthesisCard: { borderRadius: 24, padding: 24, marginBottom: 32, alignItems: 'center' },
  synthesisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 16 },
  synthesisEyebrow: { fontSize: 11, color: PALETTE.silverBlue, fontWeight: '800', letterSpacing: 1.5 },
  synthesisTitle: { fontSize: 26, fontWeight: '700', color: theme.textPrimary, marginBottom: 24, alignSelf: 'flex-start' },

  radarContainer: { position: 'relative', width: 220, height: 220, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  radarCanvas: { width: RADAR_SIZE, height: RADAR_SIZE },
  radarLabelAnchor: { position: 'absolute' },
  radarLabel: { fontSize: 9, fontWeight: '800', color: theme.textMuted, letterSpacing: 1 },

  synthesisBody: { fontSize: 14, color: theme.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 8 },

  sealBar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(2,8,23,0.88)' : 'rgba(245,239,228,0.95)' },
  saveBtn: { height: 48, paddingHorizontal: 32, borderRadius: 24, borderWidth: 1, borderColor: theme.cardBorder, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : theme.pillSurface },
  saveBtnFull: { width: '100%' },
  saveBtnDone: { borderColor: '#D4AF37', backgroundColor: '#D4AF37' },
  saveBtnText: { fontSize: 13, color: theme.textPrimary, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },
  saveBtnTextDone: { color: '#0A0A0F' },

  dimensionsContainer: { gap: 16 },
  dimensionBlock: { borderRadius: 24 },
  dimInner: { padding: 24, borderRadius: 24 },
  dimQuestion: { fontSize: 15, fontWeight: '400', color: theme.textPrimary, lineHeight: 22, marginBottom: 20 },

  scaleRow: { marginBottom: 16 },
  scaleBtn: { borderRadius: 12 },
  scaleBtnSealed: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  scaleBtnText: { fontSize: 15, color: theme.textSecondary, fontWeight: '700' },
  scaleBtnTextSelected: { fontSize: 15, fontWeight: '800', color: '#0A0A0F' },

  dimLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginTop: 12 },
  dimLabelBlock: { flex: 1, maxWidth: '48%' },
  dimLabelBlockLeft: { alignItems: 'flex-start' },
  dimLabelBlockRight: { alignItems: 'flex-end' },
  dimLabelTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4, color: theme.textPrimary },
  dimLabelDetail: { fontSize: 12, color: theme.textMuted, lineHeight: 17 },
  dimLabelDetailRight: { textAlign: 'right' },
});
