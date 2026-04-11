import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import { SkiaGradient } from './SkiaGradient';
import { type MetallicVariant, resolveMetallicGradient } from '../../constants/metallicPalettes';
import { useAppTheme } from '../../context/ThemeContext';

interface MetallicIconProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  style?: ViewStyle;
  /** Named metallic variant. */
  variant?: MetallicVariant;
  /** Or pass a flat hex and let metallicForHex resolve the gradient. */
  color?: string;
  /** Override gradient colors directly. */
  colors?: readonly string[];
}

/**
 * Renders an Ionicon with a metallic gradient.
 * Drop-in replacement for <Ionicons name={…} color="#hex" />.
 */
export const MetallicIcon: React.FC<MetallicIconProps> = ({
  name,
  size = 24,
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
        maskElement={
          <Ionicons name={name} size={size} color="white" style={styles.resetLayout} />
        }
      >
        <SkiaGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={name} size={size} color="transparent" style={styles.resetLayout} />
        </SkiaGradient>
      </MaskedView>
    </View>
  );
};

const styles = StyleSheet.create({
  maskedView: { flexDirection: 'row' },
  resetLayout: { margin: 0, padding: 0 },
});
