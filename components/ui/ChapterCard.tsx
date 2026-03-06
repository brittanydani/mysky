import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

import { applyStoryLabels } from '../../constants/storyLabels';

// Mappings for Archetypal Forces to their corresponding aura colors
const FORCE_COLORS: Record<string, string> = {
  'Core vitality': '#C9AE78',       // Champagne Gold (Sun)
  'Emotional body': '#8BC4E8',      // Silver-Blue (Moon)
  'Activating force': '#CD7F5D',    // Copper (Mars)
  'Relational force': '#F4C2C2',    // Soft Pink (Venus)
  'Structural force': '#A9A9A9',    // Steel Gray (Saturn)
  'Expansion force': '#9370DB',     // Medium Purple (Jupiter)
  'Cognitive influence': '#FFEA70', // Pale Yellow (Mercury)
  'Transformational force': '#9D76C1', // Amethyst (Pluto)
  'Diffuse influence': '#48D1CC',   // Medium Turquoise (Neptune)
  'Disruptive force': '#FF8C00',    // Dark Orange (Uranus)
  'Healing archetype': '#98FB98',   // Pale Green (Chiron)
  'Outward expression': '#FFDAB9',  // Peach Puff (Ascendant)
};

interface ChapterCardProps {
  chapter: string;
  title: string;
  content?: string;
  preview?: string;
  reflection?: string;
  affirmation?: string;
  isLocked?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  amethyst: '#9D76C1',
  textMain: '#F0EAD6',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

function ChapterCard({
  chapter,
  title,
  content,
  preview,
  reflection,
  affirmation,
  isLocked = false,
  onPress,
  style,
}: ChapterCardProps) {
  const [expanded, setExpanded] = useState(true);
  const displayText = isLocked ? preview ?? '' : content ?? '';
  const isLong = !isLocked && !!content && content.length > 200;

  // Determine the dominant force to set the specular edge color
  let dominantColor = PALETTE.glassBorder; 
  for (const [force, auraColor] of Object.entries(FORCE_COLORS)) {
    if (title?.includes(force) || displayText?.includes(force)) {
      dominantColor = auraColor;
      break; // Pick the first matched force
    }
  }

  const handlePress = () => {
    if (isLocked) {
      onPress?.();
    } else if (isLong) {
      setExpanded(prev => !prev);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.container, { shadowColor: dominantColor, elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, borderColor: dominantColor, borderTopColor: dominantColor }, style, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={
          isLocked
            ? ['rgba(25, 30, 45, 0.4)', 'rgba(15, 20, 30, 0.6)'] // Deeper cool for locked
            : ['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']  // Frosted for unlocked
        }
        style={styles.gradient}
      >
        {/* Header Row */}
        <View style={styles.header}>
          <Text style={[styles.chapterLabel, isLocked && { color: theme.textMuted }]}>
            {chapter}
          </Text>
          {isLocked && (
            <View style={styles.lockBadge}>
              <Ionicons name="sparkles" size={10} color={PALETTE.gold} />
              <Text style={styles.lockBadgeText}>Deeper Sky</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, isLocked && styles.lockedTitle]}>{title}</Text>

        {/* Main Content */}
        <Text
          style={[styles.content, isLocked && styles.lockedContent]}
          numberOfLines={isLocked ? 3 : undefined}
        >
          {displayText}
        </Text>

        {/* Locked Teaser CTA */}
        {isLocked && (
          <View style={styles.lockedCta}>
            <Text style={styles.lockedCtaText}>Unlock the full narrative</Text>
            <Ionicons name="arrow-forward" size={14} color={PALETTE.gold} />
          </View>
        )}

        {/* Reflection Section */}
        {expanded && reflection ? (
          <View style={styles.reflectionBox}>
            <View style={styles.reflectionHeader}>
              <Ionicons name="journal-outline" size={12} color={PALETTE.gold} />
              <Text style={styles.reflectionLabel}>Reflection</Text>
            </View>
            <Text style={styles.reflectionText}>{reflection}</Text>
          </View>
        ) : null}

        {/* Affirmation Section */}
        {expanded && affirmation ? (
          <View style={styles.affirmationBox}>
            <Text style={styles.affirmationText}>"{affirmation}"</Text>
          </View>
        ) : null}

        {/* Read More Toggle */}
        {isLong && (
          <View style={styles.readMoreRow}>
            <Text style={styles.readMoreText}>
              {expanded ? 'Show less' : 'Continue reading...'}
            </Text>
            <Ionicons 
              name={expanded ? 'chevron-up' : 'chevron-down'} 
              size={14} 
              color={PALETTE.gold} 
            />
          </View>
        )}

      </LinearGradient>
    </Pressable>
  );
}

export default ChapterCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  gradient: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chapterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.gold,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 214, 174, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.18)',
  },
  lockBadgeText: {
    fontSize: 10,
    color: PALETTE.gold,
    marginLeft: 5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 16,
    lineHeight: 28,
  },
  lockedTitle: {
    color: theme.textSecondary,
    opacity: 0.8,
  },
  content: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
  },
  lockedContent: {
    color: theme.textMuted,
    fontStyle: 'italic',
  },
  lockedCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  lockedCtaText: {
    fontSize: 14,
    color: PALETTE.gold,
    fontWeight: '600',
  },
  reflectionBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderLeftWidth: 3,
    borderLeftColor: PALETTE.gold,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reflectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reflectionText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  affirmationBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
  },
  affirmationText: {
    fontSize: 15,
    color: PALETTE.textMain,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    justifyContent: 'center',
  },
  readMoreText: {
    fontSize: 13,
    color: PALETTE.gold,
    fontWeight: '600',
  },
});
