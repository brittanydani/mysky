// File: components/ui/ObsidianJournalEntry.tsx
// MySky — Subconscious Ink Updates
//
// High-End "Lunar Sky" & "Velvet Glass" Aesthetic:
// 1. Purged matte dark fills; implemented sheer Atmosphere Wash (Icy Blue).
// 2. Refined directional "Velvet Glass" borders for physical depth.
// 3. Elevated interaction typography (Read more/less) to Metallic Gold.

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { type AppTheme } from '../../constants/theme';
import { MetallicText } from './MetallicText';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

type ArchetoneTone = 'reflective' | 'energised' | 'heavy' | 'calm' | 'stormy' | 'neutral';

function toneFromMood(mood?: string): ArchetoneTone {
  if (!mood) return 'neutral';
  const map: Record<string, ArchetoneTone> = {
    calm: 'calm',
    soft: 'reflective',
    okay: 'neutral',
    heavy: 'heavy',
    stormy: 'stormy',
  };
  return map[mood] ?? 'neutral';
}

const MOOD_DISPLAY_LABELS: Record<string, string> = {
  calm: 'Calm',
  soft: 'Soft',
  okay: 'Okay',
  heavy: 'Heavy',
  stormy: 'Stormy',
};

function toneColor(tone: ArchetoneTone): string {
  const map: Record<ArchetoneTone, string> = {
    reflective: '#A2C2E1', // Atmosphere
    energised: '#D4AF37',  // Gold
    heavy: '#CD7F5D',      // Copper
    calm: '#6B9080',       // Sage
    stormy: '#DC5050',     // Ember
    neutral: '#D4AF37',
  };
  return map[tone];
}

function buildPreviewContent(title: string | undefined, content: string): string {
  const trimmedContent = content.trim();
  const trimmedTitle = title?.trim();
  if (!trimmedTitle) return trimmedContent;
  if (trimmedContent.toLowerCase().startsWith(trimmedTitle.toLowerCase())) {
    const stripped = trimmedContent.slice(trimmedTitle.length).replace(/^[:\-.–—\s]+/, '').trim();
    return stripped || trimmedContent;
  }
  return trimmedContent;
}

interface Props {
  title?: string;
  content: string;
  dateLabel: string;
  timeLabel: string;
  mood?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onOpenActions?: () => void;
  wordCount?: number;
  stabilityDelta?: number;
}

const ObsidianJournalEntry = memo(function ObsidianJournalEntry({
  title,
  content,
  dateLabel,
  mood,
  isExpanded = false,
  onToggleExpand,
  onOpenActions,
  wordCount,
  stabilityDelta,
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const tone = toneFromMood(mood);
  const accent = toneColor(tone);
  const previewContent = buildPreviewContent(title, content);

  // Atmosphere Wash for Journal entries
  const entryGradient: [string, string] = theme.isDark
    ? ['rgba(162, 194, 225, 0.12)', 'rgba(162, 194, 225, 0.03)']
    : ['rgba(217,191,140,0.12)', theme.cardSurfaceStrong];

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={entryGradient}
        style={[styles.card, theme.isDark && styles.cardDark]}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.dateText}>{dateLabel}</Text>
          </View>
          <Pressable
            onPress={onOpenActions}
            hitSlop={14}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.4)" />
          </Pressable>
        </View>

        {/* Title */}
        {!!title && (
          <Text style={styles.title} numberOfLines={isExpanded ? undefined : 2}>
            {title}
          </Text>
        )}

        {/* Body */}
        <Text style={styles.body} numberOfLines={isExpanded ? undefined : 3}>
          {previewContent}
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {wordCount != null && (
              <Text style={styles.footerMeta}>{wordCount} words</Text>
            )}
            
            <Pressable
              onPress={onToggleExpand}
              hitSlop={8}
              style={({ pressed }) => [styles.expandButton, pressed && styles.expandButtonPressed]}
            >
              <MetallicText style={styles.expandHint} variant="gold">
                {isExpanded ? 'Read less' : 'Read more'}
              </MetallicText>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#D4AF37"
              />
            </Pressable>
          </View>
          
          <View style={[styles.toneBadge, { borderColor: `${accent}40` }]}>
            <MetallicText style={styles.toneBadgeText} color={accent}>
              {mood ? (MOOD_DISPLAY_LABELS[mood] ?? mood) : tone}
            </MetallicText>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
});

export default ObsidianJournalEntry;

const createStyles = (theme: AppTheme) => StyleSheet.create({
  wrapper: { marginBottom: 16 },
  card: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardDark: {
    borderTopColor: 'rgba(255,255,255,0.20)', // Velvet edge catch
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerText: { flex: 1 },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconButtonPressed: { backgroundColor: 'rgba(255,255,255,0.06)' },
  dateText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 21, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, letterSpacing: -0.4 },
  body: { color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 26, marginBottom: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  footerMeta: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '700' },
  expandButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expandButtonPressed: { opacity: 0.7 },
  expandHint: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  toneBadge: { backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  toneBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
});
