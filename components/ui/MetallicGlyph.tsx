import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';

import { SkiaGradient } from './SkiaGradient';
import { useAppTheme } from '../../context/ThemeContext';
import { resolveMetallicGradient, type MetallicVariant } from '../../constants/metallicPalettes';

interface MetallicGlyphProps {
  glyph: string;
  size?: number;
  style?: TextStyle;
  containerStyle?: ViewStyle;
  variant?: MetallicVariant;
  color?: string;
  colors?: readonly string[];
}

export const MetallicGlyph: React.FC<MetallicGlyphProps> = ({
  glyph,
  size = 20,
  style,
  containerStyle,
  variant,
  color,
  colors: colorsProp,
}) => {
  const theme = useAppTheme();
  const gradientColors = [
    ...resolveMetallicGradient({
      variant,
      color,
      colors: colorsProp,
      isDark: theme.isDark,
    }),
  ];

  return (
    <View style={containerStyle}>
      <MaskedView
        style={styles.maskedView}
        maskElement={<Text style={[styles.glyph, { fontSize: size }, style]}>{glyph}</Text>}
      >
        <SkiaGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={[styles.glyph, styles.transparentGlyph, { fontSize: size }, style]}>{glyph}</Text>
        </SkiaGradient>
      </MaskedView>
    </View>
  );
};

const styles = StyleSheet.create({
  maskedView: {
    flexDirection: 'row',
  },
  glyph: {
    color: '#FFFFFF',
    margin: 0,
    padding: 0,
    includeFontPadding: false,
    textAlign: 'center',
  },
  transparentGlyph: {
    color: 'transparent',
  },
});