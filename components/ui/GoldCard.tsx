import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface GoldCardProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  locked?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

function GoldCard({
  title,
  subtitle,
  icon,
  onPress,
  locked = false,
  children,
  style,
}: GoldCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: false }}
      style={({ pressed }) => [styles.container, style, pressed && styles.pressed]}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
    >
      <LinearGradient
        colors={['rgba(201, 169, 98, 0.15)', 'rgba(201, 169, 98, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {icon && (
            <View style={styles.iconContainer}>
              <Ionicons name={icon} size={20} color={theme.primary} />
            </View>
          )}

          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          {locked && (
            <View style={styles.lockContainer}>
              <Ionicons name="lock-closed" size={16} color={theme.textMuted} />
            </View>
          )}
        </View>

        {children}
      </LinearGradient>
    </Pressable>
  );
}

export default memo(GoldCard);

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  gradient: {
    padding: theme.spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  lockContainer: {
    padding: theme.spacing.sm,
  },
});
