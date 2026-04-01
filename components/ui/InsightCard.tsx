import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { luxuryTheme } from '../../constants/luxuryTheme';
import { MetallicIcon } from './MetallicIcon';

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

const PALETTE = {
  gold: luxuryTheme.text.goldPrimary,
  silverBlue: luxuryTheme.accents.silverBlue,
  amethyst: luxuryTheme.accents.amethyst,
  textMain: luxuryTheme.text.white,
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

  const accentColor = locked ? PALETTE.amethyst : isFeatured ? PALETTE.gold : PALETTE.silverBlue;

  const backgroundColor = locked
    ? 'rgba(157, 118, 193, 0.06)'
    : isFeatured
    ? 'rgba(232, 214, 174, 0.06)'
    : 'rgba(255, 255, 255, 0.03)';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        { backgroundColor },
        locked && styles.lockedContainer,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.gradient}>
        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }]}>
              {isFeatured ? (
                <Ionicons name={icon} size={18} color={accentColor} />
              ) : (
                <MetallicIcon name={icon} size={18} color={accentColor} />
              )}
            </View>
          )}

          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: isFeatured ? PALETTE.gold : PALETTE.textMain }]}>
              {title}
            </Text>

            {locked && (
              <View style={styles.lockedBadge}>
                <MetallicIcon name="sparkles-outline" size={10} color={PALETTE.amethyst} />
                <Text style={styles.lockedText}>{lockedText}</Text>
              </View>
            )}
          </View>

          {locked ? (
            <MetallicIcon name="lock-closed-outline" size={16} color={PALETTE.amethyst} style={styles.lockIcon} />
          ) : (
            <Ionicons name="chevron-forward-outline" size={16} color={luxuryTheme.text.muted} />
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
            <MetallicIcon name="arrow-forward-outline" size={12} color={PALETTE.amethyst} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default memo(InsightCard);

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: luxuryTheme.card.border,
    borderTopColor: luxuryTheme.card.borderTop,
    marginBottom: 16,
    position: 'relative',
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
    fontWeight: '700',
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
    color: `${luxuryTheme.accents.amethyst}`,
    marginLeft: 5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    fontSize: 15,
    color: luxuryTheme.text.dim,
    lineHeight: 24,
  },
  lockedContent: {
    color: luxuryTheme.text.dim,
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
    color: `${luxuryTheme.accents.amethyst}`,
    fontWeight: '600',
  },
});
