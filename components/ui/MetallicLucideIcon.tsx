import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { SkiaGradient } from './SkiaGradient';
import { type MetallicVariant, resolveMetallicGradient } from '../../constants/metallicPalettes';
import { useAppTheme } from '../../context/ThemeContext';

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
