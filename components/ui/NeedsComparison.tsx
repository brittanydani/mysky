// File: components/ui/NeedsComparison.tsx
// MySky — Side-by-side "What Each Person Needs" card for Relationships

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { MetallicText } from './MetallicText';
import { MetallicIcon } from './MetallicIcon';

interface NeedsComparisonProps {
  person1Name: string;
  person1Needs: string[];
  person2Name: string;
  person2Needs: string[];
}

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#C9AE78',
  textMain: '#FFFFFF',
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
        <View style={[styles.column, { borderColor: `${PALETTE.gold}20` }]}>
          <View style={[StyleSheet.absoluteFillObject, { borderRadius: 20, overflow: 'hidden' }]} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFillObject}>
              <RoundedRect x={0} y={0} width={400} height={600} r={20}>
                <LinearGradient start={vec(0, 0)} end={vec(0, 600)} colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} />
              </RoundedRect>
            </Canvas>
          </View>
          <View style={styles.nameRow}>
            <View style={[styles.avatar, { backgroundColor: 'transparent' }]}>
              <MetallicIcon name="person-outline" size={12} color={PALETTE.gold} />
            </View>
            <MetallicText style={styles.name} numberOfLines={1} color={PALETTE.gold}>{person1Name}</MetallicText>
          </View>
          <View style={styles.needsList}>
            {person1Needs.slice(0, 3).length > 0 ? (
              person1Needs.slice(0, 3).map((need, i) => (
                <View key={i} style={styles.needRow}>
                  <View style={[styles.needDot, { backgroundColor: PALETTE.gold }]} />
                  <Text style={styles.needText}>{need}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Needs still unfolding</Text>
            )}
          </View>
        </View>

        {/* Floating Connection Centerpiece */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerIcon}>
            <MetallicIcon name="heart-outline" size={10} color={PALETTE.gold} />
          </View>
          <View style={styles.dividerLine} />
        </View>

        {/* Person 2 - Silver/Blue Profile */}
        <View style={[styles.column, { borderColor: `${PALETTE.silverBlue}20` }]}>
          <View style={[StyleSheet.absoluteFillObject, { borderRadius: 20, overflow: 'hidden' }]} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFillObject}>
              <RoundedRect x={0} y={0} width={400} height={600} r={20}>
                <LinearGradient start={vec(0, 0)} end={vec(0, 600)} colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} />
              </RoundedRect>
            </Canvas>
          </View>
          <View style={styles.nameRow}>
            <View style={[styles.avatar, { backgroundColor: 'rgba(201, 174, 120, 0.15)' }]}>
              <MetallicIcon name="person-outline" size={12} color={PALETTE.silverBlue} />
            </View>
            <MetallicText style={styles.name} numberOfLines={1} color={PALETTE.silverBlue}>
              {person2Name}
            </MetallicText>
          </View>
          <View style={styles.needsList}>
            {person2Needs.slice(0, 3).length > 0 ? (
              person2Needs.slice(0, 3).map((need, i) => (
                <View key={i} style={styles.needRow}>
                  <View style={[styles.needDot, { backgroundColor: PALETTE.silverBlue }]} />
                  <Text style={styles.needText}>{need}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Needs still unfolding</Text>
            )}
          </View>
        </View>

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
    minHeight: 150,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  needsList: {
    gap: 10,
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
    color: 'rgba(226,232,240,0.82)',
    lineHeight: 19,
    flex: 1,
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(240, 234, 214, 0.45)',
    lineHeight: 18,
  },
  dividerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    marginHorizontal: 4,
  },
  dividerLine: {
    flex: 1,
    width: 1,
    backgroundColor: 'transparent',
  },
  dividerIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
});
