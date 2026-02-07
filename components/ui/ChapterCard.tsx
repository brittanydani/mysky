import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface ChapterCardProps {
  chapter: string;
  title: string;
  content?: string;
  preview?: string;
  isLocked?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

function ChapterCard({
  chapter,
  title,
  content,
  preview,
  isLocked = false,
  onPress,
  style,
}: ChapterCardProps) {
  const displayText = isLocked ? preview ?? '' : content ?? '';

  return (
    <Pressable
      onPress={isLocked ? undefined : onPress}
      disabled={isLocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: isLocked }}
      style={({ pressed }) => [styles.container, style, pressed && !isLocked && styles.pressed]}
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

        <Text style={[styles.content, isLocked && styles.lockedContent]} numberOfLines={isLocked ? 2 : 6}>
          {displayText}
        </Text>

        {!isLocked && content && content.length > 200 && (
          <Text style={styles.readMore}>Continue reading…</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export default memo(ChapterCard);

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
});
