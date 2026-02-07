import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
  variant?: 'default' | 'featured';
}

function InsightCard({
  title,
  content,
  icon,
  onPress,
  locked = false,
  lockedText = 'Locked for Premium',
  variant = 'default',
}: InsightCardProps) {
  const isFeatured = variant === 'featured';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        isFeatured && styles.featuredContainer,
        pressed && styles.pressed,
      ]}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
    >
      <LinearGradient
        colors={
          isFeatured
            ? ['rgba(201, 169, 98, 0.2)', 'rgba(201, 169, 98, 0.08)']
            : ['rgba(30, 45, 71, 0.8)', 'rgba(26, 39, 64, 0.6)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconContainer, isFeatured && styles.featuredIcon]}>
              <Ionicons
                name={icon}
                size={18}
                color={isFeatured ? theme.primary : theme.textSecondary}
              />
            </View>
          )}

          <View style={styles.titleContainer}>
            <Text style={[styles.title, isFeatured && styles.featuredTitle]}>{title}</Text>

            {locked && (
              <View style={styles.lockedBadge}>
                <Ionicons name="lock-closed" size={12} color={theme.textMuted} />
                <Text style={styles.lockedText}>{lockedText}</Text>
              </View>
            )}
          </View>

          {locked && <Ionicons name="lock-closed" size={16} color={theme.textMuted} />}
        </View>

        <Text style={[styles.content, locked && styles.lockedContent]} numberOfLines={locked ? 2 : undefined}>
          {content}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

export default memo(InsightCard);

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: theme.spacing.md,
  },
  featuredContainer: {
    borderColor: theme.cardBorder,
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
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  featuredIcon: {
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  featuredTitle: {
    color: theme.primary,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lockedText: {
    fontSize: 11,
    color: theme.textMuted,
    marginLeft: 4,
  },
  content: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 21,
  },
  lockedContent: {
    color: theme.textMuted,
  },
});
