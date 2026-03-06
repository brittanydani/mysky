import React, { memo, ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { MYSTIC } from '../../constants/theme';

interface LuxuryCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Override border color (e.g. for semantic accent cards) */
  borderColor?: string;
  /** Remove padding — useful when child handles its own padding */
  noPadding?: boolean;
}

/**
 * Transparent luxury card with subtle champagne-gold outline.
 * Matches the MySky premium celestial aesthetic.
 */
function LuxuryCard({ children, style, borderColor, noPadding }: LuxuryCardProps) {
  return (
    <View
      style={[
        styles.card,
        noPadding && { padding: 0 },
        borderColor ? { borderColor } : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MYSTIC.cardBg,
    borderWidth: 1,
    borderColor: MYSTIC.cardBorder,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
});

export default memo(LuxuryCard);
