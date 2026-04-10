import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { SkiaGradient } from './SkiaGradient';
import { METALLIC_GOLD, type MetallicVariant, METALLIC_VARIANTS, metallicForHex } from '../../constants/metallicPalettes';

interface MetallicLucideIconProps {
  /** The Lucide icon component (e.g. Home, Activity) */
  icon: React.ComponentType<{ color: string; size: number; strokeWidth?: number }>;
  size?: number;
  strokeWidth?: number;
  style?: ViewStyle;
  /** Named metallic variant. */
  variant?: MetallicVariant;
  /** Or pass a flat hex and let metallicForHex resolve the gradient. */
  color?: string;
  /** Override gradient colors directly. */
  colors?: readonly string[];
}

/**
 * Renders a Lucide icon with a metallic gradient.
 * Works with any lucide-react-native icon component.
 */
export const MetallicLucideIcon: React.FC<MetallicLucideIconProps> = ({
  icon: Icon,
  size = 24,
  strokeWidth = 1.5,
  style,
  variant,
  color,
  colors: colorsProp,
}) => {
  const gradientColors = colorsProp
    ? [...colorsProp]
    : variant
      ? [...METALLIC_VARIANTS[variant]]
      : color
        ? [...metallicForHex(color)]
        : [...METALLIC_GOLD];

  return (
    <View style={style}>
      <MaskedView
        style={styles.maskedView}
        maskElement={<Icon color="white" size={size} strokeWidth={strokeWidth} />}
      >
        <SkiaGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon color="transparent" size={size} strokeWidth={strokeWidth} />
        </SkiaGradient>
      </MaskedView>
    </View>
  );
};

const styles = StyleSheet.create({
  maskedView: { flexDirection: 'row' },
});
