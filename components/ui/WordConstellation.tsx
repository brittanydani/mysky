/**
 * WordConstellation
 *
 * System 1 — Word Cloud Intelligence
 * Aggregates keywords from all journal entries and renders them as
 * a constellation layout where:
 *   • size       = word frequency (more mentions = larger font)
 *   • color      = weighted sentiment (gold=positive, copper=negative, muted=neutral)
 *   • brightness = word opacity tracks sentiment (positive words glow; negative dim)
 *   • glow       = Skia Canvas layer renders soft radiance behind each word
 *   • tap        = "star pull" — selected word pulses; constellation lines connect
 *                  to 3 nearest neighbours; onWordPress filters the feed below
 *
 * Architecture: React Native TouchableOpacity nodes on top for gesture capture;
 * a Skia Canvas positioned behind for all glow / line / nebula effects.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { JournalEntry } from '../../services/storage/models';

// ─── Palette ─────────────────────────────────────────────────────────────────

const PALETTE = {
  positive: '#C9AE78',      // gold
  negative: '#CD7F5D',      // copper
  neutral: 'rgba(240,234,214,0.35)',
  active: '#FFFFFF',
  card: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.06)',
  borderTop: 'rgba(255,255,255,0.10)',
  title: '#FFFFFF',
  subtitle: '#C9AE78',
  muted: 'rgba(240,234,214,0.45)',
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CLOUD_WIDTH = SCREEN_WIDTH - 48;
const CLOUD_HEIGHT = 180;

// ─── Types ────────────────────────────────────────────────────────────────────

interface WordNode {
  word: string;
  count: number;
  sentiment: number; // -1 to +1
  x: number;
  y: number;
  fontSize: number;
}

interface Props {
  entries: JournalEntry[];
  onWordPress?: (word: string) => void;
  activeWord?: string | null;
}

// ─── Placement (deterministic spiral jitter) ─────────────────────────────────

function placeWords(words: { word: string; count: number; sentiment: number }[]): WordNode[] {
  const placed: WordNode[] = [];
  const maxCount = Math.max(...words.map(w => w.count), 1);

  // Seed positions with golden-ratio spiral
  const goldenAngle = 2.399963; // ~137.5 degrees in radians
  const centerX = CLOUD_WIDTH / 2;
  const centerY = CLOUD_HEIGHT / 2;

  words.slice(0, 20).forEach((w, i) => {
    const normalizedRank = i / Math.max(words.length - 1, 1);
    const r = 20 + normalizedRank * (Math.min(CLOUD_WIDTH, CLOUD_HEIGHT) / 2 - 28);
    const angle = i * goldenAngle;
    // jitter by word character sum for determinism
    const charSum = w.word.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    const jitter = (charSum % 20) - 10;

    const x = Math.min(CLOUD_WIDTH - 40, Math.max(10, centerX + r * Math.cos(angle) + jitter));
    const y = Math.min(CLOUD_HEIGHT - 24, Math.max(8, centerY + r * Math.sin(angle)));

    const fontSize = Math.round(10 + (w.count / maxCount) * 12);

    placed.push({ word: w.word, count: w.count, sentiment: w.sentiment, x, y, fontSize });
  });

  return placed;
}

// ─── Skia glow helpers ────────────────────────────────────────────────────────

function glowColor(sentiment: number): string {
  if (sentiment > 0.15) return PALETTE.positive;
  if (sentiment < -0.15) return PALETTE.negative;
  return 'rgba(200,195,220,0.6)';
}

/** Build constellation lines from selectedNode to its 3 nearest neighbours */
function buildConstellationPath(
  selected: WordNode,
  all: WordNode[],
): ReturnType<typeof Skia.Path.Make> {
  const path = Skia.Path.Make();
  const others = all
    .filter(n => n.word !== selected.word)
    .map(n => ({
      node: n,
      dist: Math.hypot(n.x - selected.x, n.y - selected.y),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3);

  for (const { node } of others) {
    path.moveTo(selected.x + selected.fontSize * 0.4, selected.y + selected.fontSize * 0.4);
    path.lineTo(node.x + node.fontSize * 0.4, node.y + node.fontSize * 0.4);
  }
  return path;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WordConstellation({ entries, onWordPress, activeWord }: Props) {
  const [localActive, setLocalActive] = useState<string | null>(null);
  const selected = activeWord !== undefined ? activeWord : localActive;

  // Pulse animation for the selected word's glow ring
  const pulseRadius = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);

  const triggerPulse = useCallback(() => {
    pulseRadius.value = 0;
    pulseOpacity.value = 0.7;
    pulseRadius.value = withTiming(30, { duration: 800 });
    pulseOpacity.value = withTiming(0, { duration: 800 });
  }, [pulseRadius, pulseOpacity]);

  const wordNodes = useMemo(() => {
    if (entries.length === 0) return [];

    // Aggregate word frequencies + weighted sentiment
    const freq: Record<string, { count: number; sentimentSum: number }> = {};

    for (const entry of entries) {
      if (!entry.contentKeywords) continue;
      let parsed: { top?: { w: string; c: number }[] } = {};
      try {
        parsed = JSON.parse(entry.contentKeywords);
      } catch {
        continue;
      }

      const words = parsed.top ?? [];
      let entrySentiment = 0;
      if (entry.contentSentiment) {
        try {
          const s = JSON.parse(entry.contentSentiment);
          entrySentiment = s.sentiment ?? 0;
        } catch {
          // ignore
        }
      }

      for (const { w, c } of words) {
        if (w.length < 3) continue;
        if (!freq[w]) freq[w] = { count: 0, sentimentSum: 0 };
        freq[w].count += c;
        freq[w].sentimentSum += entrySentiment * c;
      }
    }

    const sorted = Object.entries(freq)
      .map(([word, { count, sentimentSum }]) => ({
        word,
        count,
        sentiment: count > 0 ? sentimentSum / count : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return placeWords(sorted);
  }, [entries]);

  // Constellation lines from selected to 3 nearest neighbours
  const constellationPath = useMemo(() => {
    if (!selected) return null;
    const selNode = wordNodes.find(n => n.word === selected);
    if (!selNode) return null;
    return buildConstellationPath(selNode, wordNodes);
  }, [selected, wordNodes]);

  const selectedNode = useMemo(
    () => wordNodes.find(n => n.word === selected) ?? null,
    [selected, wordNodes],
  );

  if (wordNodes.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Word Constellation</Text>
          <Text style={styles.subtitle}>JOURNAL THEMES</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Write journal entries to see your personal word landscape emerge
          </Text>
        </View>
      </View>
    );
  }

  const maxCount = Math.max(...wordNodes.map(n => n.count), 1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Word Constellation</Text>
        <Text style={styles.subtitle}>SUBCONSCIOUS FIELD · TAP TO FILTER</Text>
      </View>

      {/* ── Cloud container: Skia layer + RN text layer ──────────── */}
      <View style={styles.cloudContainer}>

        {/* ── Skia canvas — glow & pull effects (behind text) ─── */}
        <Canvas
          style={[StyleSheet.absoluteFill, { width: CLOUD_WIDTH, height: CLOUD_HEIGHT }]}
        >
          {/* Per-word glow blobs */}
          {wordNodes.map((node, i) => {
            const isActive = selected === node.word;
            const intensity = node.count / maxCount;
            const cx = node.x + node.fontSize * 0.4;
            const cy = node.y + node.fontSize * 0.4;
            const color = glowColor(node.sentiment);
            return (
              <Group key={i}>
                <Circle
                  cx={cx}
                  cy={cy}
                  r={node.fontSize * 1.4 + (isActive ? 6 : 0)}
                  color={color}
                  opacity={isActive ? 0.55 : 0.12 + intensity * 0.18}
                >
                  <BlurMask blur={isActive ? 14 : 8} style="normal" />
                </Circle>
              </Group>
            );
          })}

          {/* Constellation lines to nearest neighbours */}
          {constellationPath && (
            <Path
              path={constellationPath}
              style="stroke"
              strokeWidth={1}
              color={selectedNode ? glowColor(selectedNode.sentiment) : PALETTE.positive}
              opacity={0.28}
              strokeCap="round"
            >
              <BlurMask blur={2} style="normal" />
            </Path>
          )}

          {/* Pulse ring on selected word (animated) */}
          {selectedNode && (
            <Circle
              cx={selectedNode.x + selectedNode.fontSize * 0.4}
              cy={selectedNode.y + selectedNode.fontSize * 0.4}
              r={pulseRadius}
              color={glowColor(selectedNode.sentiment)}
              opacity={pulseOpacity}
              style="stroke"
              strokeWidth={1.5}
            >
              <BlurMask blur={6} style="normal" />
            </Circle>
          )}
        </Canvas>

        {/* ── React Native text nodes (in front, for tap) ───────── */}
        <View style={styles.cloud}>
          {wordNodes.map(node => {
            const isActive = selected === node.word;
            const intensity = node.count / maxCount;
            let color = PALETTE.neutral;
            if (node.sentiment > 0.15) color = PALETTE.positive;
            else if (node.sentiment < -0.15) color = PALETTE.negative;

            // Positive words glow brighter; negative words are dimmer
            const sentimentOpacity = node.sentiment > 0.15
              ? 0.6 + intensity * 0.4
              : node.sentiment < -0.15
              ? 0.3 + intensity * 0.3
              : 0.45 + intensity * 0.35;
            const opacity = isActive ? 1 : sentimentOpacity;

            return (
              <TouchableOpacity
                key={node.word}
                activeOpacity={0.75}
                onPress={() => {
                  const next = selected === node.word ? null : node.word;
                  setLocalActive(next);
                  if (next) triggerPulse();
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (onWordPress) onWordPress(next ?? '');
                }}
                style={[styles.wordWrapper, { left: node.x, top: node.y }]}
              >
                <Text
                  style={[
                    styles.wordText,
                    {
                      fontSize: node.fontSize,
                      color: isActive ? PALETTE.active : color,
                      opacity,
                      textShadowColor: isActive
                        ? 'rgba(255,255,255,0.7)'
                        : node.sentiment > 0.15
                        ? 'rgba(201,174,120,0.45)'
                        : node.sentiment < -0.15
                        ? 'rgba(205,127,93,0.35)'
                        : 'transparent',
                      textShadowRadius: isActive ? 10 : intensity * 6,
                      textShadowOffset: { width: 0, height: 0 },
                      fontWeight: isActive ? '700' : node.count > 3 ? '600' : '500',
                      transform: [{ scale: isActive ? 1.12 : 1 }],
                    },
                  ]}
                >
                  {node.word}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selected && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterText}>Filtering by "{selected}"</Text>
          <TouchableOpacity
            onPress={() => {
              setLocalActive(null);
              if (onWordPress) onWordPress('');
            }}
          >
            <Text style={styles.filterClear}>✕ Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: PALETTE.card,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderTopColor: PALETTE.borderTop,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    color: PALETTE.title,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  subtitle: {
    color: PALETTE.subtitle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  cloudContainer: {
    width: CLOUD_WIDTH,
    height: CLOUD_HEIGHT,
    position: 'relative',
  },
  cloud: {
    width: CLOUD_WIDTH,
    height: CLOUD_HEIGHT,
    position: 'relative',
  },
  wordWrapper: {
    position: 'absolute',
  },
  wordText: {
    letterSpacing: 0.2,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(201,174,120,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,174,120,0.18)',
  },
  filterText: {
    color: 'rgba(240,234,214,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  filterClear: {
    color: PALETTE.subtitle,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: PALETTE.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 240,
  },
});
