// app/core-values.tsx
// MySky — ore Values Inventory
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged legacy "Muddy Gold" tints and generic brownish fills.
// 2. Implemented "Midnight Slate" anchor for heavy data cards (Constellation & Paradox).
// 3. Implemented "Tactile Hardware" logic for Value Chips (Recessed Voids vs. Raised Glass).
// 4. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 5. Assigned Atmosphere Blue for the Constellation Map and secondary active states.

import React, { useCallback, useState, useMemo } from 'react';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import type { AppTheme } from '../constants/theme';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, Line, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import {
  loadReflections,
  loadReflectionDrafts,
  ReflectionAnswer,
  ReflectionDraftAnswer,
} from '../services/insights/dailyReflectionService';
import {
  VALUES_THEME_MAP,
  syncCoreValuesFromReflections,
} from '../services/insights/reflectionProfileSync';

const STORAGE_KEY = '@mysky:core_values';
const MAX_TOP = 5;
const DYNAMIC_MAP_WINDOW_DAYS = 21;
const MAP_TOP_ANCHOR_WEIGHTS = [4.6, 4.1, 3.6, 3.1, 2.6];
const MAP_SELECTED_WEIGHT = 0.35;

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // Metallic Accent
  atmosphere: '#A2C2E1', // Values Focus (Icy Blue)
  copper: '#CD7F5D',     // Paradox Tensions
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
};

const ALL_VALUES = [
  'Autonomy',    'Creativity',   'Connection',  'Growth',
  'Security',    'Adventure',    'Honesty',     'Loyalty',
  'Achievement', 'Compassion',   'Solitude',    'Freedom',
  'Purpose',     'Play',         'Stability',   'Courage',
  'Integrity',   'Curiosity',    'Presence',    'Balance',
  'Wisdom',      'Service',      'Family',      'Nature',
  'Justice',     'Excellence',   'Belonging',   'Expression',
  'Mastery',     'Health',       'Simplicity',  'Leadership',
  'Humor',       'Abundance',    'Faith',
];

const VALUE_PARADOXES = [
  { pair: ['Security', 'Adventure'], name: "The Explorer's Paradox", desc: "A deep pull between the need for a safe harbor and the call of the unknown." },
  { pair: ['Autonomy', 'Connection'], name: "The Intimacy Paradox", desc: "Balancing the fierce need for independence with the profound desire to belong." },
  { pair: ['Stability', 'Growth'], name: "The Evolution Paradox", desc: "The tension between preserving the foundation you've built and dismantling it to evolve." },
  { pair: ['Achievement', 'Play'], name: "The Presence Paradox", desc: "Striving tirelessly for future goals while trying to remain joyful in the current moment." },
  { pair: ['Honesty', 'Compassion'], name: "The Truth Paradox", desc: "Navigating the razor edge between radical candor and protecting the feelings of those you love." },
  { pair: ['Solitude', 'Connection'], name: "The Hermit's Paradox", desc: "Recharging in isolation while craving the warmth of being deeply seen by others." },
  { pair: ['Excellence', 'Simplicity'], name: "The Perfection Paradox", desc: "The relentless drive to be exceptional while longing for an uncomplicated, unencumbered life." },
  { pair: ['Leadership', 'Belonging'], name: "The Authority Paradox", desc: "Stepping into a role that sets you apart from the very community you want to belong to." },
  { pair: ['Mastery', 'Humor'], name: "The Lightness Paradox", desc: "The pull between taking your craft with total seriousness and not taking life too seriously at all." },
  { pair: ['Freedom', 'Family'], name: "The Roots Paradox", desc: "The longing for open horizons in tension with the pull of belonging to something rooted and permanent." },
];

interface State {
  selected: string[];
  topFive: string[];
  customValues?: string[];
}

type ValueReflectionAnswer = ReflectionAnswer | ReflectionDraftAnswer;

function buildReflectionAnswerKey(answer: Pick<ValueReflectionAnswer, 'category' | 'date' | 'questionId'>): string {
  return `${answer.date}:${answer.category}:${answer.questionId}`;
}

function mergeValueReflectionAnswers(sealedAnswers: ReflectionAnswer[], draftAnswers: ReflectionDraftAnswer[]): ValueReflectionAnswer[] {
  const merged = new Map<string, ValueReflectionAnswer>();
  for (const answer of sealedAnswers) { if (answer.category === 'values') merged.set(buildReflectionAnswerKey(answer), answer); }
  for (const answer of draftAnswers) { if (answer.category === 'values') merged.set(buildReflectionAnswerKey(answer), answer); }
  return [...merged.values()];
}

function buildDynamicMapValues(allValues: string[], selected: string[], topFive: string[], answers: ValueReflectionAnswer[]): string[] {
  const scoreByValue = new Map<string, number>();
  for (const value of allValues) {
    let score = selected.includes(value) ? MAP_SELECTED_WEIGHT : 0;
    const topIndex = topFive.indexOf(value);
    if (topIndex >= 0) score += MAP_TOP_ANCHOR_WEIGHTS[topIndex] ?? 2.6;
    scoreByValue.set(value, score);
  }
  return allValues
    .map((value, baseIndex) => ({ value, score: scoreByValue.get(value) ?? 0, topIndex: topFive.indexOf(value), selectedIndex: selected.indexOf(value), baseIndex }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => (right.score !== left.score) ? (right.score - left.score) : (left.topIndex - right.topIndex))
    .slice(0, MAX_TOP)
    .map((entry) => entry.value);
}

const CoreValuesConstellation = ({ mapValues, activeParadoxes }: { mapValues: string[]; activeParadoxes: typeof VALUE_PARADOXES; }) => {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const size = 280;
  const center = size / 2;
  const orbitRadius = 96;

  const points = mapValues.map((value, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(mapValues.length, MAX_TOP) - Math.PI / 2;
    return {
      value, rank: index + 1,
      x: center + Math.cos(angle) * orbitRadius,
      y: center + Math.sin(angle) * orbitRadius,
      labelX: center + Math.cos(angle) * (orbitRadius + 28),
      labelY: center + Math.sin(angle) * (orbitRadius + 28),
      textAnchor: (center + Math.cos(angle) * (orbitRadius + 28) > center + 10 ? 'start' : center + Math.cos(angle) * (orbitRadius + 28) < center - 10 ? 'end' : 'middle') as any,
    };
  });

  const pointMap = new Map(points.map(p => [p.value, p]));
  const paradoxLines = activeParadoxes.map(p => {
    const start = pointMap.get(p.pair[0]);
    const end = pointMap.get(p.pair[1]);
    return start && end ? { key: p.name, start, end } : null;
  }).filter(Boolean);

  return (
    <VelvetGlassSurface style={styles.constellationCard} intensity={45} backgroundColor={theme.cardSurfaceValues as any}>
      <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
      <View style={styles.constellationHeader}>
        <MetallicIcon name="analytics-outline" size={18} variant="gold" color={PALETTE.gold} />
        <MetallicText style={styles.constellationTitle} variant="gold">VALUES MAP</MetallicText>
      </View>
      <View style={styles.constellationFrame}>
        <Svg width={size} height={size}>
          <Defs>
            <SvgLinearGradient id="constellationGlow" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="rgba(162, 194, 225, 0.45)" />
              <Stop offset="1" stopColor="rgba(162, 194, 225, 0.10)" />
            </SvgLinearGradient>
          </Defs>
          {[0, 1, 2].map((i) => <Circle key={i} cx={center} cy={center} r={32 + i * 26} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}
          {points.map(p => <Line key={p.value} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />)}
          {paradoxLines.map(l => <Line key={l!.key} x1={l!.start.x} y1={l!.start.y} x2={l!.end.x} y2={l!.end.y} stroke="rgba(205, 127, 93, 0.65)" strokeWidth="2" />)}
          <Circle cx={center} cy={center} r={26} fill="rgba(255,255,255,0.04)" stroke="rgba(162, 194, 225, 0.22)" strokeWidth="1" />
          <SvgText x={center} y={center - 2} fontSize="8" fontWeight="800" fill="rgba(255,255,255,0.6)" textAnchor="middle">NORTH</SvgText>
          <SvgText x={center} y={center + 10} fontSize="8" fontWeight="800" fill="rgba(255,255,255,0.6)" textAnchor="middle">STAR</SvgText>
          {points.map(p => (
            <React.Fragment key={p.value}>
              <Circle cx={p.x} cy={p.y} r={14} fill="url(#constellationGlow)" stroke="rgba(162, 194, 225, 0.8)" strokeWidth="1" />
              <SvgText x={p.x} y={p.y + 3.5} fontSize="10" fontWeight="900" fill={'#0A0A0F'} textAnchor="middle">{String(p.rank)}</SvgText>
              <SvgText x={p.labelX} y={p.labelY} fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.85)" textAnchor={p.textAnchor}>{p.value.toUpperCase()}</SvgText>
            </React.Fragment>
          ))}
        </Svg>
      </View>
      <Text style={styles.constellationHint}>Your North Star anchors the map, and reflections shift it day to day. Copper links mark paradoxes in tension.</Text>
    </VelvetGlassSurface>
  );
};

export default function CoreValuesScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const [state, setState] = useState<State>({ selected: [], topFive: [] });
  const [saved, setSaved] = useState(false);
  const [valueReflectionAnswers, setValueReflectionAnswers] = useState<ValueReflectionAnswer[]>([]);
  const [customValueInput, setCustomValueInput] = useState('');
  const [showCustomValueInput, setShowCustomValueInput] = useState(false);

  useFocusEffect(
    useCallback(() => {
      syncCoreValuesFromReflections({ includeDrafts: true })
        .then(() => EncryptedAsyncStorage.getItem(STORAGE_KEY))
        .then((raw) => {
          if (raw) {
            const parsed = JSON.parse(raw);
            setState({ selected: parsed.selected || [], topFive: (parsed.topFive || []).slice(0, MAX_TOP), customValues: parsed.customValues || [] });
            setSaved(true);
          }
        }).catch(() => {});
      Promise.all([loadReflections(), loadReflectionDrafts()]).then(([refl, draft]) => {
        setValueReflectionAnswers(mergeValueReflectionAnswers(refl.answers, draft));
      }).catch(() => {});
    }, []),
  );

  const handleSave = async () => {
    try {
      await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSaved(true);
    } catch { Alert.alert('Error', 'Could not save.'); }
  };

  const allValueOptions = useMemo(() => [...ALL_VALUES, ...(state.customValues ?? []).filter(v => !ALL_VALUES.includes(v))], [state.customValues]);
  const mapValues = useMemo(() => buildDynamicMapValues(allValueOptions, state.selected, state.topFive, valueReflectionAnswers), [allValueOptions, state.selected, state.topFive, valueReflectionAnswers]);
  const activeParadoxes = useMemo(() => VALUE_PARADOXES.filter(p => mapValues.includes(p.pair[0]) && mapValues.includes(p.pair[1])), [mapValues]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient colors={['rgba(162, 194, 225, 0.12)', 'transparent']} style={styles.topGlow} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={10}><Text style={styles.closeIcon}>×</Text></Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Core Values</Text>
          <GoldSubtitle style={styles.headerSubtitle}>The internal architecture of your choices</GoldSubtitle>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {state.topFive.length > 0 && <Animated.View entering={FadeInDown.delay(80)}><CoreValuesConstellation mapValues={mapValues} activeParadoxes={activeParadoxes} /></Animated.View>}

          <Text style={styles.sectionLabel}>TAP TO SELECT · HOLD BUILT-INS TO MARK TOP 5</Text>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.chipsWrap}>
            {allValueOptions.map((value) => {
              const isSelected = state.selected.includes(value);
              const isTop = state.topFive.includes(value);
              return (
                <Pressable
                  key={value}
                  style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected, isTop && styles.chipTop]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setState(prev => {
                      const sel = isSelected ? prev.selected.filter(v => v !== value) : [...prev.selected, value];
                      return { ...prev, selected: sel, topFive: prev.topFive.filter(v => sel.includes(v)) };
                    });
                    setSaved(false);
                  }}
                  onLongPress={() => {
                    if (!isSelected) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setState(prev => {
                      const top = isTop ? prev.topFive.filter(v => v !== value) : prev.topFive.length < MAX_TOP ? [...prev.topFive, value] : prev.topFive;
                      return { ...prev, topFive: top };
                    });
                    setSaved(false);
                  }}
                >
                  {isTop && <Ionicons name="star" size={10} color={'#0A0A0F'} style={{ marginRight: 6 }} />}
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected, isTop && styles.chipTextTop]}>{value}</Text>
                </Pressable>
              );
            })}
            <Pressable style={[styles.chip, styles.addCustomChip]} onPress={() => setShowCustomValueInput(true)}>
              <Ionicons name="add-outline" size={14} color={PALETTE.gold} style={{ marginRight: 6 }} />
              <MetallicText style={styles.chipText} color={PALETTE.gold}>Custom value</MetallicText>
            </Pressable>
          </Animated.View>

          {mapValues.length > 0 && (
            <VelvetGlassSurface style={styles.summaryCard} intensity={45} backgroundColor={theme.cardSurfaceValues as any}>
              <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
              <View style={styles.summaryHeaderRow}>
                <MetallicIcon name="compass-outline" size={18} color={PALETTE.gold} />
                <MetallicText style={styles.summaryTitle} color={PALETTE.gold}>LIVE VALUES RANKING ({mapValues.length}/{MAX_TOP})</MetallicText>
              </View>
              <View style={styles.topList}>
                {mapValues.map((v, i) => (
                  <View key={v} style={styles.topItemRow}>
                    <View style={styles.topNumberBadge}><MetallicText style={styles.topNumberText} color={PALETTE.gold}>{String(i + 1)}</MetallicText></View>
                    <Text style={styles.topItemText}>{v}</Text>
                  </View>
                ))}
              </View>
            </VelvetGlassSurface>
          )}

          {activeParadoxes.map((p, i) => (
            <VelvetGlassSurface key={p.name} style={styles.paradoxCard} intensity={42} backgroundColor={theme.cardSurfaceValues as any}>
              <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
              <View style={styles.paradoxHeader}>
                <MetallicIcon name="git-compare-outline" size={16} color={PALETTE.copper} />
                <MetallicText style={styles.paradoxEyebrow} color={PALETTE.copper}>CORE PARADOX DETECTED</MetallicText>
              </View>
              <Text style={styles.paradoxTitle}>{p.name}</Text>
              <Text style={styles.paradoxBody}>{p.desc}</Text>
            </VelvetGlassSurface>
          ))}
          <View style={{ height: 120 }} />
        </ScrollView>

        {state.topFive.length > 0 && (
          <View style={styles.sealBar}>
            <Pressable style={[styles.saveBtn, styles.velvetBorder]} onPress={handleSave}>
              <LinearGradient colors={['rgba(44, 54, 69, 0.95)', 'rgba(26, 30, 41, 0.60)']} style={StyleSheet.absoluteFill} />
              <MetallicText style={styles.saveBtnText} color={PALETTE.gold}>{saved ? '✓ Values Sealed' : 'Seal My Values & Continue'}</MetallicText>
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
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 340 },
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
  closeIcon: { color: '#FFF', fontSize: 24 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  headerTitle: { fontSize: 32, color: '#FFF', fontWeight: '800', letterSpacing: -1 },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  sectionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, fontWeight: '800', marginVertical: 16 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, borderWidth: 1 },
  chipUnselected: { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.05)' },
  chipSelected: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  chipTop: { backgroundColor: PALETTE.gold, borderColor: PALETTE.gold },
  addCustomChip: { backgroundColor: 'transparent', borderColor: 'rgba(212,175,55,0.3)', borderStyle: 'dashed' },
  chipText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  chipTextSelected: { color: '#0A0A0F', fontWeight: '800' },
  chipTextTop: { color: '#0A0A0F', fontWeight: '800' },
  constellationCard: { borderRadius: 28, padding: 24, marginBottom: 24, overflow: 'hidden' },
  constellationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  constellationTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  constellationFrame: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  constellationHint: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 18 },
  summaryCard: { borderRadius: 28, padding: 24, marginBottom: 20, overflow: 'hidden' },
  summaryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  summaryTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  topList: { gap: 10 },
  topItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  topNumberBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(162, 194, 225, 0.15)', justifyContent: 'center', alignItems: 'center' },
  topNumberText: { fontSize: 10, fontWeight: '800' },
  topItemText: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' },
  paradoxCard: { borderRadius: 28, padding: 28, marginBottom: 20, overflow: 'hidden' },
  paradoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  paradoxEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  paradoxTitle: { fontSize: 22, color: '#FFFFFF', fontWeight: '800', marginBottom: 8 },
  paradoxBody: { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 24 },
  sealBar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(10,10,15,0.9)' },
  saveBtn: { height: 56, borderRadius: 28, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});
