// app/cognitive-style.tsx
// MySky — Cognitive Style Profile
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged "Muddy Gold" remnants from radar gradients and buttons.
// 2. Assigned vibrant Atmosphere (Icy Blue) for the cognitive radar map.
// 3. Implemented "Tactile Hardware" logic for spectrum buttons (Recessed vs. Raised).
// 4. Anchored content in Midnight Slate for physical depth and presence.
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
import Animated, { FadeInDown } from 'react-native-reanimated';
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
import { logger } from '../utils/logger';
import { EditorialLikertScale } from '../components/ui/EditorialLikertScale';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

const STORAGE_KEY = '@mysky:cognitive_style';
const RADAR_SIZE = 180;

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // Metallic Accent
  atmosphere: '#A2C2E1', // Cognitive Focus (Icy Blue)
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
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

type Scores = Record<'scope' | 'processing' | 'decisions', number>;

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
  const midPath = `M ${getPoint(3, 0).x} ${getPoint(3, 0).y} L ${getPoint(3, 120).x} ${getPoint(3, 120).y} L ${getPoint(3, 240).x} ${getPoint(3, 240).y} Z`;

  return (
    <View style={styles.radarContainer}>
      <Canvas style={styles.radarCanvas}>
        <Path path={outerPath} color="rgba(255,255,255,0.12)" style="stroke" strokeWidth={1} />
        <Path path={midPath} color="rgba(255,255,255,0.06)" style="stroke" strokeWidth={1} />

        <SkiaLine p1={vec(center, center)} p2={vec(outerTop.x, outerTop.y)} color="rgba(255,255,255,0.08)" strokeWidth={1} />
        <SkiaLine p1={vec(center, center)} p2={vec(outerRight.x, outerRight.y)} color="rgba(255,255,255,0.08)" strokeWidth={1} />
        <SkiaLine p1={vec(center, center)} p2={vec(outerLeft.x, outerLeft.y)} color="rgba(255,255,255,0.08)" strokeWidth={1} />

        {/* Atmosphere Map Fill */}
        <Path path={polygonPath} style="fill" opacity={0.45}>
          <RadialGradient c={vec(center, center)} r={radius} colors={["rgba(162, 194, 225, 0.45)", "rgba(162, 194, 225, 0.05)"]} />
          <BlurMask blur={15} style="normal" />
        </Path>
        
        <Path path={polygonPath} color={PALETTE.atmosphere} style="stroke" strokeWidth={2.5}>
          <Shadow dx={0} dy={0} blur={12} color={PALETTE.atmosphere} />
        </Path>

        {[p1, p2, p3].map((point, index) => (
          <React.Fragment key={`point-${index}`}>
            <SkiaCircle cx={point.x} cy={point.y} r={7} color="rgba(162, 194, 225, 0.25)"><BlurMask blur={6} style="normal" /></SkiaCircle>
            <SkiaCircle cx={point.x} cy={point.y} r={3.5} color={PALETTE.atmosphere} />
          </React.Fragment>
        ))}
      </Canvas>

      <View style={[styles.radarLabelAnchor, { top: -16, left: center - 34, width: 68, alignItems: 'center' }]}>
        <Text style={styles.radarLabel}>SCOPE</Text>
      </View>
      <View style={[styles.radarLabelAnchor, { top: outerRight.y - 8, left: outerRight.x + 10, width: 78 }]}>
        <Text style={styles.radarLabel}>PROCESS</Text>
      </View>
      <View style={[styles.radarLabelAnchor, { top: outerLeft.y - 8, left: outerLeft.x - 82, width: 78, alignItems: 'flex-end' }]}>
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
        .then(() => EncryptedAsyncStorage.getItem(STORAGE_KEY))
        .then((raw) => {
          if (raw) {
            const parsed = JSON.parse(raw);
            setScores({ scope: parsed.scope, processing: parsed.processing, decisions: parsed.decisions });
            setSaved(true);
          }
        }).catch((e) => logger.warn('[CognitiveStyle] Sync/load failed:', e));
    }, []),
  );

  const handleSave = async () => {
    try {
      const raw = await EncryptedAsyncStorage.getItem(STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...scores, manualScores: scores }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSaved(true);
    } catch {
      Alert.alert('Error', 'Could not save profile.');
    }
  };

  const displayScores: Scores = { scope: scores.scope ?? 3, processing: scores.processing ?? 3, decisions: scores.decisions ?? 3 };
  const anySet = DIMENSIONS.some(d => scores[d.id] !== undefined);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient colors={['rgba(162, 194, 225, 0.12)', 'transparent']} style={styles.topGlow} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={10}><Text style={styles.closeIcon}>×</Text></Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Cognitive Style</Text>
          <GoldSubtitle style={styles.headerSubtitle}>The internal architecture of your mind</GoldSubtitle>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {anySet && (
            <VelvetGlassSurface style={styles.synthesisCard} intensity={35} backgroundColor={theme.cardSurfaceCognitive as any}>
              <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
              <View style={styles.synthesisHeader}>
                <MetallicIcon name="git-network-outline" size={18} variant="gold" />
                <MetallicText style={styles.synthesisEyebrow} variant="gold">COGNITIVE BLUEPRINT</MetallicText>
              </View>
              <CognitiveSynthesisMap scores={displayScores} />
              <Text style={styles.synthesisBody}>
                You process via {displayScores.processing <= 2 ? 'Visual' : displayScores.processing >= 4 ? 'Analytical' : 'Adaptive'} pathways with a {displayScores.scope <= 2 ? 'Big Picture' : 'Detailed'} orientation.
              </Text>
            </VelvetGlassSurface>
          )}

          <View style={styles.dimensionsContainer}>
            {DIMENSIONS.map((dim, i) => (
              <Animated.View key={dim.id} entering={FadeInDown.delay(200 + i * 80)} style={styles.dimensionBlock}>
                <VelvetGlassSurface style={styles.dimInner} intensity={25} backgroundColor={theme.cardSurfaceCognitive as any}>
                  <Text style={styles.dimQuestion}>{dim.question}</Text>
                  <EditorialLikertScale
                    value={scores[dim.id] ?? null}
                    onChange={(v) => { if (v != null) { setScores(p => ({ ...p, [dim.id]: v })); setSaved(false); Haptics.selectionAsync(); } }}
                    style={styles.scaleRow}
                    buttonStyle={styles.scaleBtn}
                    selectedButtonStyle={styles.scaleBtnActive}
                    labelStyle={styles.scaleBtnText}
                    selectedLabelStyle={styles.scaleBtnTextActive}
                  />
                  <View style={styles.dimLabels}>
                    <View style={styles.dimLabelBlock}><Text style={styles.dimLabelTitle}>{dim.left}</Text></View>
                    <View style={[styles.dimLabelBlock, { alignItems: 'flex-end' }]}><Text style={styles.dimLabelTitle}>{dim.right}</Text></View>
                  </View>
                </VelvetGlassSurface>
              </Animated.View>
            ))}
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>

        {anySet && (
          <View style={styles.sealBar}>
            <Pressable style={[styles.saveBtn, theme.isDark && styles.velvetBorder]} onPress={handleSave}>
              <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
              <MetallicText style={styles.saveBtnText} variant="gold">{saved ? '✓ Blueprint Sealed' : 'Seal My Blueprint & Continue'}</MetallicText>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  header: { paddingHorizontal: 24, paddingVertical: 8 },
  titleArea: { paddingHorizontal: 24, paddingBottom: 8 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: theme.cardBorder, justifyContent: 'center', alignItems: 'center' },
  closeIcon: { color: theme.textPrimary, fontSize: 24 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  headerTitle: { fontSize: 32, color: theme.textPrimary, fontWeight: '800', letterSpacing: -1 },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  synthesisCard: { borderRadius: 28, padding: 24, marginBottom: 32, alignItems: 'center', overflow: 'hidden' },
  synthesisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 24 },
  synthesisEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  radarContainer: { width: RADAR_SIZE, height: RADAR_SIZE, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  radarCanvas: { width: RADAR_SIZE, height: RADAR_SIZE },
  radarLabelAnchor: { position: 'absolute' },
  radarLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2 },
  synthesisBody: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22, marginTop: 24 },
  dimensionsContainer: { gap: 16 },
  dimensionBlock: { borderRadius: 24 },
  dimInner: { padding: 24, borderRadius: 24, overflow: 'hidden' },
  dimQuestion: { fontSize: 16, fontWeight: '600', color: '#FFF', lineHeight: 24, marginBottom: 24 },
  scaleRow: { marginBottom: 16 },
  scaleBtn: { borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.05)' },
  scaleBtnActive: { backgroundColor: PALETTE.atmosphere, borderColor: PALETTE.atmosphere },
  scaleBtnText: { fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
  scaleBtnTextActive: { color: '#0A0A0F', fontWeight: '800' },
  dimLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  dimLabelBlock: { flex: 1 },
  dimLabelTitle: { fontSize: 11, fontWeight: '800', color: PALETTE.atmosphere, letterSpacing: 0.5 },
  sealBar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(10,10,15,0.9)' },
  saveBtn: { height: 56, borderRadius: 28, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});
