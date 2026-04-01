import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { SkiaGradient } from './SkiaGradient';

/**
 * Renders subtitle text with a champagne gold metallic gradient using MaskedView.
 * Drop-in replacement for a <Text> subtitle element.
 */

const CHAMPAGNE_GOLD = ['#FFF4D6', '#E9D9B8', '#C9AE78', '#E9D9B8', '#FFF4D6'];

interface GoldSubtitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const GoldSubtitle: React.FC<GoldSubtitleProps> = ({ children, style }) => {
  const mergedStyle = StyleSheet.flatten([styles.base, style]) as TextStyle;

  return (
    <MaskedView
      maskElement={
        <Text style={[mergedStyle, { color: 'white', backgroundColor: 'transparent' }]}>
          {children}
        </Text>
      }
    >
      <SkiaGradient
        colors={CHAMPAGNE_GOLD}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[mergedStyle, { color: 'transparent' }]}>
          {children}
        </Text>
      </SkiaGradient>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  base: {
    fontSize: 14,
  },
});
