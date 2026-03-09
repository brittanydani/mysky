/**
 * Dream Engine Screen
 * Subconscious Patterns — "Dream Frequency"
 *
 * A sub-screen pushed from the Journal tab header. It reveals the hidden
 * architecture between waking journals and dream states.
 *
 * Sections:
 *   1. Symbol Frequency — horizontal "Glow Capsules" (lavender, rounded, inner glow)
 *   2. Day/Night Venn Diagram — two overlapping Skia circles
 *      Left  = themes from waking Journal entries
 *      Right = themes from Dreams
 *      Overlap = "Subconscious Bridge" — keywords found in both states
 *
 * Requires: @shopify/react-native-skia 2.x, expo-haptics
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
  Path,
  Skia,
  LinearGradient,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/core';

import NebulaBackground from '../../components/ui/NebulaBackground';
import { localDb } from '../../services/storage/localDb';
import { tokenize } from '../../services/journal/nlp';
import { extractDreamKeywords } from '../../services/insights/themeNormalization';
import { DREAM_SYMBOLS } from '../../constants/dreamSymbols';
import type { JournalEntry, SleepEntry } from '../../services/storage/models';
import { logger } from '../../utils/logger';

// ─── Layout ───────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const CONTENT_W = SCREEN_W - 40;

// ─── Palette ──────────────────────────────────────────────────────────────────

const LAVENDER = '#A286F2';
const LAVENDER_DIM = 'rgba(162,134,242,0.15)';
const CYAN = '#7DEBDB';
const GOLD = '#C9AE78';
const DREAM_BLUE = 'rgba(100,130,200,0.55)';
const JOURNAL_GOLD = 'rgba(220,185,110,0.55)';
const BRIDGE_COLOR = 'rgba(200,160,255,0.65)';

// ─── Dream Symbol frequency helpers ──────────────────────────────────────────

interface SymbolFreqItem {
  key: string;
  label: string;
  emoji: string;
  count: number;
}

const SYMBOL_EMOJI: Record<string, string> = {
  water: '🌊', house: '🏠', falling: '🌀', flying: '🕊️', chase: '🌑',
  stranger: '👤', death: '🌙', snake: '🐍', dog: '🐕', fire: '🔥',
  forest: '🌲', ocean: '🌊', mountain: '⛰️', door: '🚪', mirror: '🪞',
  rain: '🌧️', storm: '⛈️', sun: '☀️', moon: '🌙', light: '✨',
};

function computeSymbolFrequency(sleepEntries: SleepEntry[]): SymbolFreqItem[] {
  const counts: Record<string, number> = {};
  for (const entry of sleepEntries) {
    const text = entry.dreamText ?? '';
    if (!text) continue;
    const lower = text.toLowerCase();
    for (const [key, sym] of Object.entries(DREAM_SYMBOLS)) {
      if (lower.includes(key)) {
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, count]) => ({
      key,
      label: DREAM_SYMBOLS[key]?.label ?? key,
      emoji: SYMBOL_EMOJI[key] ?? '◈',
      count,
    }));
}

// ─── Venn Diagram helpers ─────────────────────────────────────────────────────

interface VennData {
  journalWords: string[];   // top waking-journal keywords
  dreamWords: string[];     // top dream-text keywords
  bridge: string[];         // intersection — the "subconscious bridge"
}

function computeVennData(entries: JournalEntry[], sleepEntries: SleepEntry[]): VennData {
  // Journal keywords
  const jFreq: Record<string, number> = {};
  for (const e of entries.slice(0, 60)) {
    if (!e.contentKeywords) continue;
    try {
      const kw: { top?: Array<{ w: string; c: number }> } = JSON.parse(e.contentKeywords);
      for (const { w, c } of kw.top ?? []) {
        jFreq[w] = (jFreq[w] ?? 0) + c;
      }
    } catch {}
  }

  // Dream keywords
  const dFreq: Record<string, number> = {};
  for (const e of sleepEntries.slice(0, 60)) {
    const text = e.dreamText ?? '';
    if (!text) continue;
    const tokens = tokenize(text);
    for (const t of tokens) {
      if (t.length >= 4) dFreq[t] = (dFreq[t] ?? 0) + 1;
    }
    // Also check dream symbols
    const lower = text.toLowerCase();
    for (const key of Object.keys(DREAM_SYMBOLS)) {
      if (lower.includes(key)) dFreq[key] = (dFreq[key] ?? 0) + 2;
    }
  }

  const topJournal = Object.entries(jFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w);

  const topDream = Object.entries(dFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w);

  const jSet = new Set(topJournal);
  const dSet = new Set(topDream);
  const bridge = topJournal.filter(w => dSet.has(w)).slice(0, 6);

  return {
    journalWords: topJournal.slice(0, 8),
    dreamWords: topDream.slice(0, 8),
    bridge,
  };
}

// ─── Glow Capsules (Symbol Bar Chart) ────────────────────────────────────────

const CAPSULE_H = 32;
const CAPSULE_TRACK_W = CONTENT_W - 90;

function GlowCapsules({ items }: { items: SymbolFreqItem[] }) {
  const max = Math.max(...items.map(i => i.count), 1);

  return (
    <View style={cStyles.container}>
      <Text style={cStyles.sectionTitle}>Symbol Frequency</Text>
      <Text style={cStyles.sectionSubtitle}>DREAM ARCHETYPES · MOST RECURRING</Text>
      {items.map((item) => {
        const fillRatio = item.count / max;
        const fillW = Math.max(0.06, fillRatio) * CAPSULE_TRACK_W;

        return (
          <View key={item.key} style={cStyles.row}>
            <Text style={cStyles.emoji}>{item.emoji}</Text>
            <Text style={cStyles.label}>{item.label}</Text>
            <View style={cStyles.track}>
              {/* Glow capsule fill */}
              <Canvas style={{ width: CAPSULE_TRACK_W, height: CAPSULE_H }}>
                {/* Track background */}
                <RoundedRect
                  x={0}
                  y={4}
                  width={CAPSULE_TRACK_W}
                  height={CAPSULE_H - 8}
                  r={(CAPSULE_H - 8) / 2}
                  color="rgba(255,255,255,0.05)"
                />
                {/* Glow bloom */}
                <RoundedRect
                  x={0}
                  y={0}
                  width={fillW + 16}
                  height={CAPSULE_H}
                  r={CAPSULE_H / 2}
                  color={LAVENDER}
                  opacity={0.18}
                >
                  <BlurMask blur={10} style="normal" />
                </RoundedRect>
                {/* Filled capsule */}
                <RoundedRect
                  x={0}
                  y={4}
                  width={fillW}
                  height={CAPSULE_H - 8}
                  r={(CAPSULE_H - 8) / 2}
                  color={LAVENDER}
                  opacity={0.55}
                >
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(fillW, 0)}
                    colors={['rgba(180,140,255,0.8)', LAVENDER_DIM]}
                  />
                </RoundedRect>
                {/* Inner shine line */}
                <RoundedRect
                  x={2}
                  y={5}
                  width={Math.max(0, fillW - 4)}
                  height={4}
                  r={2}
                  color="rgba(255,255,255,0.25)"
                />
              </Canvas>
              <Text style={cStyles.count}>{item.count}×</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const cStyles = StyleSheet.create({
  container: { marginBottom: 32 },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: LAVENDER,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  emoji: { fontSize: 16, width: 24 },
  label: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    width: 56,
    fontWeight: '500',
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  count: {
    color: 'rgba(162,134,242,0.7)',
    fontSize: 10,
    fontWeight: '700',
    width: 20,
  },
});

// ─── Venn Diagram ─────────────────────────────────────────────────────────────

const VENN_W = CONTENT_W;
const VENN_H = 220;
const CIRCLE_R = 80;
const OVERLAP = 40; // how much circles overlap
const LEFT_CX = VENN_W / 2 - CIRCLE_R + OVERLAP / 2;
const RIGHT_CX = VENN_W / 2 + CIRCLE_R - OVERLAP / 2;
const CIRCLE_CY = VENN_H / 2;

function VennDiagram({ data }: { data: VennData }) {
  const hasData = data.journalWords.length > 0 || data.dreamWords.length > 0;

  return (
    <View style={vStyles.container}>
      <Text style={vStyles.sectionTitle}>Day / Night Bridge</Text>
      <Text style={vStyles.sectionSubtitle}>
        SUBCONSCIOUS ARCHITECTURE · SHARED THEMES
      </Text>

      {!hasData ? (
        <View style={vStyles.emptyBox}>
          <Text style={vStyles.emptyText}>
            Write journal entries and dream logs to reveal the bridge between your conscious and subconscious mind
          </Text>
        </View>
      ) : (
        <>
          <Canvas style={{ width: VENN_W, height: VENN_H }}>
            {/* ── Left circle: Journal ── */}
            <Circle cx={LEFT_CX} cy={CIRCLE_CY} r={CIRCLE_R} color={JOURNAL_GOLD}>
              <BlurMask blur={18} style="normal" />
            </Circle>
            <Circle
              cx={LEFT_CX}
              cy={CIRCLE_CY}
              r={CIRCLE_R}
              color={JOURNAL_GOLD}
              style="stroke"
              strokeWidth={1.5}
              opacity={0.6}
            />

            {/* ── Right circle: Dreams ── */}
            <Circle cx={RIGHT_CX} cy={CIRCLE_CY} r={CIRCLE_R} color={DREAM_BLUE}>
              <BlurMask blur={18} style="normal" />
            </Circle>
            <Circle
              cx={RIGHT_CX}
              cy={CIRCLE_CY}
              r={CIRCLE_R}
              color={DREAM_BLUE}
              style="stroke"
              strokeWidth={1.5}
              opacity={0.6}
            />

            {/* ── Bridge glow (overlap zone) ── */}
            <Circle
              cx={VENN_W / 2}
              cy={CIRCLE_CY}
              r={OVERLAP + 4}
              color={BRIDGE_COLOR}
            >
              <BlurMask blur={20} style="normal" />
            </Circle>
          </Canvas>

          {/* ── Labels overlay ── */}
          <View style={vStyles.labelsOverlay}>
            {/* Left label */}
            <View style={[vStyles.sideLabel, vStyles.leftLabel]}>
              <Text style={vStyles.sideLabelTitle}>Waking</Text>
              {data.journalWords.slice(0, 4).map(w => (
                <Text key={w} style={[vStyles.word, { color: 'rgba(220,185,110,0.85)' }]}>{w}</Text>
              ))}
            </View>

            {/* Center bridge */}
            <View style={vStyles.centerLabel}>
              <Text style={vStyles.bridgeTitle}>Bridge</Text>
              {data.bridge.slice(0, 3).map(w => (
                <Text key={w} style={vStyles.bridgeWord}>{w}</Text>
              ))}
              {data.bridge.length === 0 && (
                <Text style={vStyles.noBridge}>—</Text>
              )}
            </View>

            {/* Right label */}
            <View style={[vStyles.sideLabel, vStyles.rightLabel]}>
              <Text style={vStyles.sideLabelTitle}>Dreams</Text>
              {data.dreamWords.slice(0, 4).map(w => (
                <Text key={w} style={[vStyles.word, { color: 'rgba(100,160,230,0.85)' }]}>{w}</Text>
              ))}
            </View>
          </View>

          {data.bridge.length > 0 && (
            <View style={vStyles.bridgeInsight}>
              <Text style={vStyles.bridgeInsightText}>
                ✦ Themes found in both states:{' '}
                <Text style={vStyles.bridgeInsightWords}>
                  {data.bridge.slice(0, 3).join(', ')}
                </Text>
                {'. These recurring elements may form the bridge between your '}
                <Text style={vStyles.bridgeInsightEmphasis}>conscious concerns</Text>
                {' and '}
                <Text style={vStyles.bridgeInsightEmphasis}>subconscious processing</Text>
                {'.'}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const vStyles = StyleSheet.create({
  container: { marginBottom: 32 },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: LAVENDER,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  emptyBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 24,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  labelsOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -VENN_H + 16,
    height: VENN_H - 16,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  sideLabel: {
    width: (VENN_W - OVERLAP * 2) / 2 - 8,
    alignItems: 'center',
  },
  leftLabel: { alignItems: 'flex-start', paddingLeft: 8 },
  rightLabel: { alignItems: 'flex-end', paddingRight: 8 },
  sideLabelTitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  word: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
  centerLabel: {
    width: OVERLAP * 2 + 16,
    alignItems: 'center',
  },
  bridgeTitle: {
    color: 'rgba(200,160,255,0.8)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  bridgeWord: {
    color: 'rgba(220,200,255,0.9)',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'center',
  },
  noBridge: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 16,
  },
  bridgeInsight: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(162,134,242,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(162,134,242,0.18)',
  },
  bridgeInsightText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 20,
  },
  bridgeInsightWords: {
    color: LAVENDER,
    fontWeight: '600',
  },
  bridgeInsightEmphasis: {
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DreamEngineScreen() {
  const router = useRouter();
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [sleepEntries, setSleepEntries] = React.useState<SleepEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const charts = await localDb.getCharts();
      const primaryChart = charts[0];
      if (!primaryChart) { setLoading(false); return; }

      const [j, s] = await Promise.all([
        localDb.getJournalEntriesPaginated(90),
        localDb.getSleepEntries(primaryChart.id, 60),
      ]);
      setEntries(Array.isArray(j) ? j : []);
      setSleepEntries(Array.isArray(s) ? s : []);
    } catch (e) {
      logger.error('[DreamEngine] loadData failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const symbolFrequency = useMemo(() => computeSymbolFrequency(sleepEntries), [sleepEntries]);
  const vennData = useMemo(() => computeVennData(entries, sleepEntries), [entries, sleepEntries]);

  return (
    <View style={styles.container}>
      <NebulaBackground mood={3} energy={6} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* ── Header ───────────────────────────────────────── */}
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              router.back();
            }}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
          </Pressable>
          <View style={styles.headerTextBlock}>
            <Text style={styles.screenTitle}>Dream Engine</Text>
            <Text style={styles.screenSubtitle}>Subconscious Pattern Analysis</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>Reading the subconscious field…</Text>
            </View>
          ) : (
            <>
              {/* ── Intro ── */}
              <Animated.View entering={FadeInDown.delay(60).duration(600)}>
                <Text style={styles.poeticIntro}>
                  Where your dreams and your journals overlap, the subconscious bridge becomes visible.
                </Text>
              </Animated.View>

              {/* ── Symbol Frequency (Glow Capsules) ── */}
              <Animated.View entering={FadeInDown.delay(120).duration(600)}>
                {symbolFrequency.length > 0 ? (
                  <GlowCapsules items={symbolFrequency} />
                ) : (
                  <View style={styles.emptySection}>
                    <Ionicons name="moon-outline" size={28} color="rgba(162,134,242,0.4)" />
                    <Text style={styles.emptySectionText}>
                      Log dreams to see which archetypes visit you most
                    </Text>
                  </View>
                )}
              </Animated.View>

              {/* ── Venn Diagram ── */}
              <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                <VennDiagram data={vennData} />
              </Animated.View>

              {/* ── Stats footer ── */}
              <Animated.View entering={FadeInDown.delay(260).duration(600)} style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{sleepEntries.length}</Text>
                  <Text style={styles.statLabel}>Dream Logs</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{symbolFrequency.length}</Text>
                  <Text style={styles.statLabel}>Symbols Found</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: LAVENDER }]}>
                    {vennData.bridge.length}
                  </Text>
                  <Text style={styles.statLabel}>Bridge Words</Text>
                </View>
              </Animated.View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#02040D' },
  safeArea: { flex: 1 },

  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBlock: { flex: 1 },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  screenSubtitle: {
    color: LAVENDER,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },

  poeticIntro: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 28,
    textAlign: 'center',
  },

  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    fontStyle: 'italic',
  },

  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
    marginBottom: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(162,134,242,0.12)',
  },
  emptySectionText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
  },
  statValue: {
    color: GOLD,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 3,
  },
});
