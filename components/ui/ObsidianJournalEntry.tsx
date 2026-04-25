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
import { MetallicIcon } from './MetallicIcon';
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
  timeLabel,
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
    : ['rgba(236, 247, 241, 0.75)', 'rgba(240, 245, 252, 0.42)'];

  const moodLabel = mood ? (MOOD_DISPLAY_LABELS[mood] ?? mood) : 'Reflective';

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={entryGradient}
        style={[styles.card, theme.isDark && styles.cardDark]}
      >
        {/* Insight-style header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <MetallicIcon name="book-outline" size={16} variant="gold" />
            <Text style={styles.headerTitle}>{dateLabel}</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={[styles.moodBadge, { borderColor: `${accent}40` }]}>
              <MetallicText style={styles.moodBadgeText} color={accent}>
                {moodLabel}
              </MetallicText>
            </View>

            {!!onOpenActions && (
              <Pressable
                onPress={onOpenActions}
                hitSlop={14}
                style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color={theme.isDark ? 'rgba(255,255,255,0.45)' : 'rgba(22,32,51,0.45)'} />
              </Pressable>
            )}
          </View>
        </View>

        {!!timeLabel && <Text style={styles.timeText}>{timeLabel}</Text>}

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
    borderColor: theme.cardBorder,
    marginBottom: 8,
  },
  cardDark: {
    borderTopColor: 'rgba(255,255,255,0.20)', // Velvet edge catch
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    marginLeft: 8,
    color: theme.isDark ? '#D4AF37' : '#1A1815',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  iconButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconButtonPressed: { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
  moodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
  },
  moodBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
  timeText: {
    color: theme.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(22,32,51,0.56)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: { fontSize: 21, fontWeight: '800', color: theme.textPrimary, marginBottom: 8, letterSpacing: -0.4 },
  body: { color: theme.isDark ? 'rgba(255,255,255,0.68)' : theme.textSecondary, fontSize: 16, lineHeight: 26, marginBottom: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(22,32,51,0.08)' },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  footerMeta: { color: theme.isDark ? 'rgba(255,255,255,0.42)' : 'rgba(22,32,51,0.5)', fontSize: 12, fontWeight: '700' },
  expandButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expandButtonPressed: { opacity: 0.7 },
  expandHint: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
