import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { luxuryTheme } from '../../constants/luxuryTheme';

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
        selected ? styles.selectedContainer : styles.unselectedContainer,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {popular && (
        <View style={styles.popularBadgeContainer}>
          <View style={styles.popularBadge}>
            <Ionicons name="sparkles-outline" size={10} color={luxuryTheme.text.onGold} />
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, selected && styles.selectedName]}>{name}</Text>
          {selected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-outline" size={14} color={luxuryTheme.text.onGold} />
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={[styles.price, selected && styles.selectedPrice]}>{price}</Text>
          <Text style={styles.period}>{period}</Text>
        </View>

        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

export default memo(PricingCard);

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: luxuryTheme.card.border,
    borderTopColor: luxuryTheme.card.borderTop,
    marginBottom: 16,
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  unselectedContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  selectedContainer: {
    borderColor: 'rgba(232,214,174,0.28)',
    borderTopColor: 'rgba(255,248,220,0.42)',
    borderWidth: 1.5,
    backgroundColor: 'rgba(232, 214, 174, 0.08)',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  popularBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 20,
    zIndex: 2,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 26,
    minWidth: 110,
    backgroundColor: luxuryTheme.text.goldPrimary,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#020817',
    textTransform: 'uppercase',
    letterSpacing: 1,
    zIndex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: luxuryTheme.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  selectedName: {
    color: luxuryTheme.text.goldPrimary,
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: luxuryTheme.text.goldPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    color: luxuryTheme.text.white,
    fontWeight: '700',
  },
  selectedPrice: {
    color: luxuryTheme.text.white,
  },
  period: {
    fontSize: 15,
    color: luxuryTheme.text.dim,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 14,
    color: luxuryTheme.text.muted,
    lineHeight: 21,
  },
});
