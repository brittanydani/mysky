import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface InsightCardProps {
  title: string;
  content: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  locked?: boolean;
  lockedText?: string;
  lockedHint?: string;
  variant?: 'default' | 'featured';
}

// ── Cinematic Palette ──
const PALETTE = {
  gold: theme.textGold,
  silverBlue: theme.growth,
  amethyst: theme.archetypes.shadow.main,
  textMain: theme.textPrimary,
  glassBorder: theme.cardBorder,
  glassHighlight: theme.glass.highlight,
};

function InsightCard({
  title,
  content,
  icon,
  onPress,
  locked = false,
  lockedText = 'Deeper Sky',
  lockedHint,
  variant = 'default',
}: InsightCardProps) {
  const isFeatured = variant === 'featured';

  // Determine accent color based on state
  const accentColor = locked ? PALETTE.amethyst : isFeatured ? PALETTE.gold : PALETTE.silverBlue;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        locked && styles.lockedContainer,
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={
          locked
            ? [...theme.amethystGradient]
            : isFeatured
            ? ['rgba(232,214,174,0.10)', 'rgba(2,8,23,0.60)']
            : [...theme.obsidianGradient]
        }
        style={styles.gradient}
      >
        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }]}>
              <Ionicons
                name={icon}
                size={18}
                color={accentColor}
              />
            </View>
          )}

          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: isFeatured ? PALETTE.gold : PALETTE.textMain }]}>
              {title}
            </Text>

            {locked && (
              <View style={styles.lockedBadge}>
                <Ionicons name="sparkles" size={10} color={PALETTE.amethyst} />
                <Text style={styles.lockedText}>{lockedText}</Text>
              </View>
            )}
          </View>

          {locked ? (
            <Ionicons name="lock-closed-outline" size={16} color={PALETTE.amethyst} style={styles.lockIcon} />
          ) : (
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          )}
        </View>

        <Text 
          style={[styles.content, locked && styles.lockedContent]} 
          numberOfLines={locked ? 2 : undefined}
        >
          {content}
        </Text>

        {locked && (
          <View style={styles.lockedHintRow}>
            <Text style={styles.lockedHintText}>
              {lockedHint || 'Tap to unlock this insight'}
            </Text>
            <Ionicons name="arrow-forward" size={12} color={PALETTE.amethyst} />
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export default memo(InsightCard);

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  lockedContainer: {
    borderColor: 'rgba(157, 118, 193, 0.22)',
    borderTopColor: 'rgba(157, 118, 193, 0.38)',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: 0.3,
  },
  lockIcon: {
    marginLeft: 8,
    opacity: 0.8,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lockedText: {
    fontSize: 10,
    color: PALETTE.amethyst,
    marginLeft: 5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
  },
  lockedContent: {
    color: theme.textMuted,
    fontStyle: 'italic',
    opacity: 0.82,
  },
  lockedHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  lockedHintText: {
    fontSize: 13,
    color: PALETTE.amethyst,
    fontWeight: '600',
  },
});
