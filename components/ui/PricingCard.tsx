import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  popular?: boolean;
  selected?: boolean;
  onPress?: () => void;
}

function PricingCard({
  name,
  price,
  period,
  description,
  popular = false,
  selected = false,
  onPress,
}: PricingCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        selected && styles.selectedContainer,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
    >
      {popular && (
        <View style={styles.popularBadgeContainer}>
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        </View>
      )}

      <LinearGradient
        colors={
          selected
            ? ['rgba(201, 169, 98, 0.2)', 'rgba(201, 169, 98, 0.08)']
            : ['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']
        }
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={[styles.name, selected && styles.selectedName]}>{name}</Text>
          {selected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark" size={14} color={theme.background} />
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={[styles.price, selected && styles.selectedPrice]}>{price}</Text>
          <Text style={styles.period}>{period}</Text>
        </View>

        <Text style={styles.description}>{description}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export default memo(PricingCard);

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  selectedContainer: {
    borderColor: theme.primary,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  popularBadgeContainer: {
    position: 'absolute',
    top: -1,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  popularBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.background,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
    fontFamily: 'serif',
  },
  selectedName: {
    color: theme.primary,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.xs,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  selectedPrice: {
    color: theme.primary,
  },
  period: {
    fontSize: 14,
    color: theme.textMuted,
    marginLeft: theme.spacing.sm,
  },
  description: {
    fontSize: 13,
    color: theme.textMuted,
  },
});
