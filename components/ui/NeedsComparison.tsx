// File: components/ui/NeedsComparison.tsx
// MySky — Side-by-side "What Each Person Needs" card for Relationships

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface NeedsComparisonProps {
  person1Name: string;
  person1Needs: string[];
  person2Name: string;
  person2Needs: string[];
}

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',
  silverBlue: '#8BC4E8',
  textMain: '#FDFBF7',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

export default function NeedsComparison({
  person1Name,
  person1Needs,
  person2Name,
  person2Needs,
}: NeedsComparisonProps) {
  return (
    <View style={styles.container}>
      <View style={styles.columns}>
        
        {/* Person 1 - Gold Profile */}
        <LinearGradient
          colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']}
          style={[styles.column, { borderColor: `${PALETTE.gold}20` }]}
        >
          <View style={styles.nameRow}>
            <View style={[styles.avatar, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
              <Ionicons name="person" size={12} color={PALETTE.gold} />
            </View>
            <Text style={[styles.name, { color: PALETTE.gold }]} numberOfLines={1}>{person1Name}</Text>
          </View>
          <View style={styles.needsList}>
            {person1Needs.slice(0, 3).map((need, i) => (
              <View key={i} style={styles.needRow}>
                <View style={[styles.needDot, { backgroundColor: PALETTE.gold }]} />
                <Text style={styles.needText}>{need}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Floating Connection Centerpiece */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerIcon}>
            <Ionicons name="heart" size={10} color={PALETTE.gold} />
          </View>
          <View style={styles.dividerLine} />
        </View>

        {/* Person 2 - Silver/Blue Profile */}
        <LinearGradient
          colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']}
          style={[styles.column, { borderColor: `${PALETTE.silverBlue}20` }]}
        >
          <View style={styles.nameRow}>
            <View style={[styles.avatar, { backgroundColor: 'rgba(139, 196, 232, 0.15)' }]}>
              <Ionicons name="person" size={12} color={PALETTE.silverBlue} />
            </View>
            <Text style={[styles.name, { color: PALETTE.silverBlue }]} numberOfLines={1}>
              {person2Name}
            </Text>
          </View>
          <View style={styles.needsList}>
            {person2Needs.slice(0, 3).map((need, i) => (
              <View key={i} style={styles.needRow}>
                <View style={[styles.needDot, { backgroundColor: PALETTE.silverBlue }]} />
                <Text style={styles.needText}>{need}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  column: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderTopColor: PALETTE.glassHighlight,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    flex: 1,
  },
  needsList: {
    gap: 12,
  },
  needRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  needDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 7,
    flexShrink: 0,
    opacity: 0.8,
  },
  needText: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  dividerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 12,
  },
  dividerLine: {
    flex: 1,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
});
