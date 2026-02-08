import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

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
      accessibilityRole="button"
      accessibilityState={{ disabled: false }}
      style={({ pressed }) => [styles.container, style, pressed && styles.pressed]}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
    >
      <LinearGradient
        colors={
          isLocked
            ? ['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']
            : ['rgba(201, 169, 98, 0.12)', 'rgba(201, 169, 98, 0.04)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.chapter}>{chapter}</Text>
          {isLocked && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={12} color={theme.textMuted} />
              <Text style={styles.lockText}>Locked for Premium</Text>
            </View>
          )}
        </View>

        <Text style={[styles.title, isLocked && styles.lockedTitle]}>{title}</Text>

        <Text
          style={[styles.content, isLocked && styles.lockedContent]}
          numberOfLines={isLocked ? 2 : undefined}
        >
          {displayText}
        </Text>

        {/* Reflection + Affirmation when expanded */}
        {expanded && reflection ? (
          <View style={styles.reflectionBox}>
            <Text style={styles.reflectionLabel}>Reflection</Text>
            <Text style={styles.reflectionText}>{reflection}</Text>
          </View>
        ) : null}

        {expanded && affirmation ? (
          <View style={styles.affirmationBox}>
            <Text style={styles.affirmationText}>{affirmation}</Text>
          </View>
        ) : null}

        {/* Toggle text for long unlocked content */}
        {isLong && (
          <Text style={styles.readMore}>
            {expanded ? 'Show less' : 'Continue reading…'}
          </Text>
        )}

      </LinearGradient>
    </Pressable>
  );
}

export default ChapterCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginBottom: theme.spacing.lg,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  gradient: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  chapter: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockText: {
    fontSize: 10,
    color: theme.textMuted,
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginBottom: theme.spacing.md,
  },
  lockedTitle: {
    color: theme.textSecondary,
  },
  content: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
  },
  lockedContent: {
    color: theme.textMuted,
  },
  readMore: {
    fontSize: 14,
    color: theme.primary,
    marginTop: theme.spacing.md,
    fontWeight: '500',
  },
  reflectionBox: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(201, 169, 98, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
  },
  reflectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  reflectionText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  affirmationBox: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(201, 169, 98, 0.06)',
    alignItems: 'center',
  },
  affirmationText: {
    fontSize: 15,
    color: theme.primary,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  lockedCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  lockedCtaText: {
    fontSize: 13,
    color: theme.primary,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },
});
