import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePremium } from '../../context/PremiumContext';
import { localDb } from '../../services/storage/localDb';
import { theme } from '../../constants/theme';
import { logger } from '../../utils/logger';

interface StorageIndicatorProps {
  compact?: boolean;
  onPress?: () => void;
}

function StorageIndicator({ compact = false, onPress }: StorageIndicatorProps) {
  const { isPremium } = usePremium();
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const settings = await localDb.getSettings();
        if (mounted && settings?.lastBackupAt) setLastBackupAt(settings.lastBackupAt);
      } catch (error) {
        // Safe to log; does not crash UI
        logger.error('Failed to load storage settings:', error);
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const status =
    isPremium && lastBackupAt
      ? { text: 'Backed Up', icon: 'cloud-done' as const, color: theme.success }
      : { text: 'Local', icon: 'phone-portrait' as const, color: theme.textMuted };

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [styles.compactContainer, pressed && styles.pressed]}
        onPress={onPress}
        accessibilityRole="button"
        android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
      >
        <Ionicons name={status.icon} size={16} color={status.color} />
        <Text style={[styles.compactText, { color: status.color }]}>{status.text}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${status.color}20` }]}>
          <Ionicons name={status.icon} size={18} color={status.color} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.statusText}>{status.text}</Text>

          {lastBackupAt && isPremium ? (
            <Text style={styles.lastSyncText}>
              Last backup: {new Date(lastBackupAt).toLocaleDateString()}
            </Text>
          ) : null}

          {!isPremium ? <Text style={styles.upgradeText}>Tap to upgrade</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

export default memo(StorageIndicator);

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.backgroundTertiary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: theme.spacing.md,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundTertiary,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  lastSyncText: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  upgradeText: {
    fontSize: 12,
    color: theme.primary,
    marginTop: 2,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
});