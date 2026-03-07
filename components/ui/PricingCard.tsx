import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
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

// ── Cinematic Palette ──
const PALETTE = {
  gold: theme.textGold,
  silverBlue: theme.growth,
  amethyst: theme.archetypes.shadow.main,
  textMain: theme.textPrimary,
  glassBorder: theme.cardBorder,
  glassHighlight: theme.glass.highlight,
};

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
    >
      {popular && (
        <View style={styles.popularBadgeContainer}>
          <LinearGradient
            colors={[...theme.goldGradient]}
            style={styles.popularBadge}
          >
            <Ionicons name="sparkles" size={10} color="#0B1220" />
            <Text style={styles.popularText}>Most Popular</Text>
          </LinearGradient>
        </View>
      )}

      <LinearGradient
        colors={
          selected
            ? ['rgba(232,214,174,0.10)', 'rgba(2,8,23,0.60)']
            : [...theme.obsidianGradient]
        }
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={[styles.name, selected && styles.selectedName]}>{name}</Text>
          {selected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark" size={14} color="#0B1220" />
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
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
    marginBottom: 16,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  selectedContainer: {
    borderColor: 'rgba(232,214,174,0.28)',
    borderTopColor: 'rgba(255,248,220,0.42)',
    borderWidth: 1.5,
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
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: PALETTE.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#020817',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gradient: {
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
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  selectedName: {
    color: PALETTE.gold,
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PALETTE.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PALETTE.gold,
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: '700',
  },
  selectedPrice: {
    color: PALETTE.textMain,
  },
  period: {
    fontSize: 15,
    color: theme.textMuted,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 21,
  },
});
