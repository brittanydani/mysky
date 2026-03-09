/**
 * DreamPatternCard
 * Card Type B — Dream Log
 *
 * Renders a single SleepEntry as a glowing "Dream Tablet":
 *   • Lavender border (#A286F2) with inner glow
 *   • Date in Gold Serif
 *   • Quality displayed as moon glyphs (1–5)
 *   • "Extracted Symbols" — keywords matched against DREAM_SYMBOLS,
 *     shown with archetype labels and emoji
 *   • One-line dream text excerpt (dimmed, italic)
 *
 * Requires: @shopify/react-native-skia 2.x
 */

import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  BlurMask,
  Rect,
  vec,
  Group,
} from '@shopify/react-native-skia';
import { DREAM_SYMBOLS } from '../../constants/dreamSymbols';
import type { SleepEntry } from '../../services/storage/models';

// ─── Layout ───────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;
const CARD_H = 148;
const BORDER_R = 16;

// ─── Palette ──────────────────────────────────────────────────────────────────

const LAVENDER = '#A286F2';
const LAVENDER_DIM = 'rgba(162,134,242,0.12)';
const LAVENDER_MID = 'rgba(162,134,242,0.22)';
const GOLD = '#C9AE78';
const WHITE = '#FFFFFF';
const MUTED = 'rgba(255,255,255,0.45)';
const GLASS = 'rgba(255,255,255,0.03)';

// ─── Symbol emoji map ─────────────────────────────────────────────────────────

const SYMBOL_EMOJI: Record<string, string> = {
  water: '🌊',
  house: '🏠',
  falling: '🌀',
  flying: '🕊️',
  chase: '🌑',
  stranger: '👤',
  death: '🌙',
  snake: '🐍',
  dog: '🐕',
  fire: '🔥',
  forest: '🌲',
  ocean: '🌊',
  mountain: '⛰️',
  door: '🚪',
  mirror: '🪞',
  bridge: '🌉',
  road: '🛤️',
  light: '✨',
  darkness: '🌑',
  baby: '🌱',
  child: '👶',
  mother: '🌸',
  father: '⚡',
  teeth: '💎',
  blood: '🌹',
  war: '⚔️',
  ship: '🚢',
  rain: '🌧️',
  storm: '⛈️',
  sun: '☀️',
  moon: '🌙',
};

function emojiFor(key: string): string {
  return SYMBOL_EMOJI[key] ?? '◈';
}

// ─── Symbol extraction ────────────────────────────────────────────────────────

interface ExtractedSymbol {
  key: string;
  label: string;
  archetype: string;
  emoji: string;
}

function extractSymbols(dreamText: string): ExtractedSymbol[] {
  if (!dreamText) return [];
  const lower = dreamText.toLowerCase();
  const found: ExtractedSymbol[] = [];
  for (const [key, symbol] of Object.entries(DREAM_SYMBOLS)) {
    if (lower.includes(key) && found.length < 4) {
      found.push({
        key,
        label: symbol.label,
        archetype: symbol.archetype,
        emoji: emojiFor(key),
      });
    }
  }
  return found;
}

// ─── Moon quality display ─────────────────────────────────────────────────────

function moonGlyphs(quality: number): string {
  const q = Math.max(1, Math.min(5, Math.round(quality)));
  return '◐'.repeat(q) + '○'.repeat(5 - q);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  entry: SleepEntry;
  onPress?: () => void;
}

const DreamPatternCard = memo(function DreamPatternCard({ entry, onPress }: Props) {
  const symbols = useMemo(() => extractSymbols(entry.dreamText ?? ''), [entry.dreamText]);

  const dateLabel = useMemo(() => {
    try {
      const [y, m, d] = entry.date.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return entry.date;
    }
  }, [entry.date]);

  const excerpt = useMemo(() => {
    const text = entry.dreamText ?? '';
    return text.length > 100 ? text.slice(0, 100) + '…' : text;
  }, [entry.dreamText]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.wrapper}
      accessibilityRole="button"
      accessibilityLabel={`Dream log: ${dateLabel}`}
    >
      {/* ── Skia glass layer ─────────────────────────────────── */}
      <Canvas style={styles.canvas}>
        <Group>
          {/* Glass surface */}
          <RoundedRect x={0} y={0} width={CARD_W} height={CARD_H} r={BORDER_R} color={GLASS} />

          {/* Lavender inner glow */}
          <RoundedRect x={0} y={0} width={CARD_W} height={CARD_H} r={BORDER_R} color={LAVENDER_DIM}>
            <BlurMask blur={20} style="normal" />
          </RoundedRect>

          {/* Top specular */}
          <RoundedRect x={1} y={1} width={CARD_W - 2} height={CARD_H * 0.35} r={BORDER_R}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, CARD_H * 0.35)}
              colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.0)']}
            />
          </RoundedRect>

          {/* Lavender border */}
          <RoundedRect
            x={0.5}
            y={0.5}
            width={CARD_W - 1}
            height={CARD_H - 1}
            r={BORDER_R}
            color={LAVENDER_MID}
            style="stroke"
            strokeWidth={1}
          />

          {/* Left accent edge */}
          <Rect x={0} y={20} width={2.5} height={CARD_H - 40} color={LAVENDER}>
            <BlurMask blur={4} style="outer" />
          </Rect>
        </Group>
      </Canvas>

      {/* ── Content layer ────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.typeLabel}>DREAM LOG</Text>
            <Text style={styles.dateText}>{dateLabel}</Text>
          </View>
          {entry.quality != null && (
            <Text style={styles.moonGlyphs}>{moonGlyphs(entry.quality)}</Text>
          )}
        </View>

        {/* Dream excerpt */}
        {!!excerpt && (
          <Text style={styles.excerpt} numberOfLines={2}>
            {excerpt}
          </Text>
        )}

        {/* Extracted symbols */}
        {symbols.length > 0 ? (
          <View style={styles.symbolsRow}>
            {symbols.map((sym) => (
              <View key={sym.key} style={styles.symbolPill}>
                <Text style={styles.symbolEmoji}>{sym.emoji}</Text>
                <Text style={styles.symbolLabel}>{sym.label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noSymbols}>No symbols detected</Text>
        )}
      </View>
    </Pressable>
  );
});

export default DreamPatternCard;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_W,
    height: CARD_H,
    marginBottom: 14,
    alignSelf: 'center',
    position: 'relative',
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
    width: CARD_W,
    height: CARD_H,
    borderRadius: BORDER_R,
    overflow: 'hidden',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    paddingTop: 14,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  typeLabel: {
    color: LAVENDER,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dateText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  moonGlyphs: {
    color: LAVENDER,
    fontSize: 13,
    letterSpacing: 2,
  },
  excerpt: {
    color: MUTED,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    flex: 1,
    marginTop: 6,
  },
  symbolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  symbolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(162,134,242,0.12)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(162,134,242,0.22)',
  },
  symbolEmoji: {
    fontSize: 11,
  },
  symbolLabel: {
    color: 'rgba(212,195,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
  },
  noSymbols: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
