import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { SkiaGradient } from './SkiaGradient';
import { METALLIC_GOLD, type MetallicVariant, METALLIC_VARIANTS, metallicForHex } from '../../constants/metallicPalettes';

interface MetallicTextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  /** Named metallic variant. */
  variant?: MetallicVariant;
  /** Or pass a flat hex and let metallicForHex resolve the gradient. */
  color?: string;
  /** Override gradient colors directly. */
  colors?: readonly string[];
  numberOfLines?: number;
}

/**
 * Renders text with a horizontal metallic gradient using MaskedView.
 * Drop-in replacement for <Text style={{ color: '#hex' }}>.
 */
export const MetallicText: React.FC<MetallicTextProps> = ({
  children,
  style,
  variant,
  color,
  colors: colorsProp,
  numberOfLines,
}) => {
  const gradientColors = colorsProp
    ? [...colorsProp]
    : variant
      ? [...METALLIC_VARIANTS[variant]]
      : color
        ? [...metallicForHex(color)]
        : [...METALLIC_GOLD];

  const mergedStyle = StyleSheet.flatten(style) as TextStyle;

  return (
    <MaskedView
      maskElement={
        <Text
          numberOfLines={numberOfLines}
          style={[mergedStyle, { color: 'white', backgroundColor: 'transparent' }]}
        >
          {children}
        </Text>
      }
    >
      <SkiaGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text
          numberOfLines={numberOfLines}
          style={[mergedStyle, { color: 'transparent' }]}
        >
          {children}
        </Text>
      </SkiaGradient>
    </MaskedView>
  );
};
