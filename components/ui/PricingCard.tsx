import React, { memo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, LayoutChangeEvent } from 'react-native';
import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import { luxuryTheme } from '../../constants/luxuryTheme';
import { SkiaGlassSurface } from './skia/SkiaGlassSurface';

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
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setW(e.nativeEvent.layout.width);
    setH(e.nativeEvent.layout.height);
  }, []);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        selected && styles.selectedContainer,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {w > 0 && h > 0 && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {selected ? (
            <Canvas style={StyleSheet.absoluteFillObject}>
              <RoundedRect x={0} y={0} width={w} height={h} r={20}>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(0, h)}
                  colors={['rgba(232,214,174,0.15)', 'rgba(2,8,23,0.80)']}
                />
              </RoundedRect>
            </Canvas>
          ) : (
            <SkiaGlassSurface width={w} height={h} borderRadius={20} />
          )}
        </View>
      )}

      {popular && (
        <View style={styles.popularBadgeContainer}>
          <View style={styles.popularBadge}>
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <Canvas style={StyleSheet.absoluteFillObject}>
                <RoundedRect x={0} y={0} width={120} height={30} r={0}>
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(120, 30)}
                    colors={luxuryTheme.gradients.goldSoft}
                  />
                </RoundedRect>
              </Canvas>
            </View>
            <Ionicons name="sparkles" size={10} color={luxuryTheme.text.onGold} />
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, selected && styles.selectedName]}>{name}</Text>
          {selected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark" size={14} color={luxuryTheme.text.onGold} />
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
    shadowColor: luxuryTheme.shadow.glowGold,
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
    color: luxuryTheme.text.white,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
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
