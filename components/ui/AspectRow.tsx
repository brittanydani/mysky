// File: components/ui/AspectRow.tsx
//
// High-end, glassmorphic synastry aspect row for MySky.
// Upgraded with subtle gradients, glowing nodes, and cinematic typography hierarchy.
// 
// Uses: @shopify/react-native-skia directly, NO expo-linear-gradient.

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { MetallicText } from './MetallicText';

export type AspectCategory = 'connection' | 'chemistry' | 'growth' | 'challenge';

interface AspectRowProps {
  /** e.g. "Your Sun ☉ trine their Moon ☽" */
  description: string;
  /** Human-friendly title like "Instant understanding" */
  title: string;
  category: AspectCategory;
  strength: 'strong' | 'moderate' | 'subtle';
  /** Optional longer description shown below */
  detail?: string;
}

// Cinematic jewel-tone palette with gradient maps for 3D nodes
const CATEGORY_CONFIG: Record<AspectCategory, { color: string; gradient: readonly [string, string]; label: string }> = {
  connection: { color: '#D4A3B3', gradient: ['#F2D4DF', '#A86C82'], label: 'Harmony' },
  chemistry:  { color: '#FFFFFF', gradient: ['#FFF0B3', '#9A7B1C'], label: 'Chemistry' },
  growth:     { color: '#8BC4E8', gradient: ['#BEE0F5', '#4A87A8'], label: 'Growth' },
  challenge:  { color: '#C87878', gradient: ['#E8A9A9', '#8A3A3A'], label: 'Challenge' }, // Fixed label
};


const renderZodiacText = (text: string) => {
  const ZODIAC_FAMILY = Platform.select({ ios: 'Apple Symbols', android: 'Noto Sans Symbols 2', default: 'Zodiac' });
  if (typeof text !== 'string') return text;
  const RE_ZODIAC = /([☉☽☿♀♂♃♄♅♆♇☊☋⚷☌☍△▢⚹⚸]+)/g;
  return text.split(RE_ZODIAC).map((part, i) => {
    if (i % 2 === 1) {
      return (
        <MetallicText key={i} style={{ fontFamily: ZODIAC_FAMILY, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' }} color="#E8D6AE">
          {part}
        </MetallicText>
      );
    }
    return <Text key={i} style={{ fontSize: 12, letterSpacing: 0.5, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{part}</Text>;
  });
};

export default function AspectRow({
  description,
  title,
  category,
  strength,
  detail,
}: AspectRowProps) {
  const cfg = CATEGORY_CONFIG[category];

  return (
    <View style={styles.row}>
      {/* ── Timeline Node & Connector ── */}
      <View style={styles.timelineColumn}>
        {/* Glowing Node */}
        <View style={[styles.glowHalo, { backgroundColor: `${cfg.color}30` }]}>
          <View style={[styles.nodeCore, { overflow: 'hidden' }]}>
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <Canvas style={StyleSheet.absoluteFillObject}>
                  <RoundedRect x={0} y={0} width={8} height={8} r={4}>
                    <LinearGradient start={vec(0, 0)} end={vec(8, 8)} colors={cfg.gradient.map(String)} />
                  </RoundedRect>
                </Canvas>
              </View>
            </View>
        </View>
        
        {/* Fading Connector Line */}
        <View style={[styles.connector, { overflow: 'hidden' }]}>
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFillObject}>
              <RoundedRect x={0} y={0} width={1.5} height={100} r={1}>
                <LinearGradient start={vec(0, 0)} end={vec(0, 100)} colors={[`${cfg.color}80`, 'rgba(255,255,255,0)']} />
              </RoundedRect>
            </Canvas>
          </View>
        </View>
      </View>

      {/* ── Glassmorphic Content Card ── */}
      <View style={styles.cardContainer}>
        <View style={styles.cardGlow}>
          <View style={[StyleSheet.absoluteFillObject, { borderRadius: 16, overflow: 'hidden' }]} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFillObject}>
              <RoundedRect x={0} y={0} width={400} height={600} r={16}>
                <LinearGradient start={vec(0, 0)} end={vec(0, 600)} colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} />
              </RoundedRect>
            </Canvas>
          </View>
          {/* Card Border Highlight (Top/Left light catch) */}
          <View style={styles.cardInner}>
            
            {/* Aspect Formula */}
            <View style={styles.formulaRow}>{renderZodiacText(description)}</View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Detail */}
            {detail ? (
              <Text style={styles.detail} numberOfLines={3}>{detail}</Text>
            ) : null}

            {/* Badges */}
            <View style={styles.badgeRow}>
              {/* Category Badge */}
              <View style={[styles.badge, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}30` }]}>
              {category !== 'chemistry' ? (
                <MetallicText style={styles.badgeText} color={cfg.color}>{cfg.label}</MetallicText>
              ) : (
                <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              )}
              </View>
              
              {/* Strength Badge */}
              {strength === 'strong' && (
                <View style={[styles.badge, styles.strongBadge]}>
                  <Text style={[styles.badgeText, styles.strongBadgeText]}>Strong</Text>
                </View>
              )}
            </View>

          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingHorizontal: 16,
    gap: 16,
  },
  // ── Timeline Styles ──
  timelineColumn: {
    alignItems: 'center',
    width: 16,
    marginTop: 4,
  },
  glowHalo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // iOS Shadow
    // Android Shadow
  },
  nodeCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connector: {
    width: 1.5,
    flex: 1,
    marginTop: 6,
    borderRadius: 1,
  },
  
  // ── Card Styles ──
  cardContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden', // Contain the gradient background
    // Drop shadow for the entire card
  },
  cardGlow: {
    flex: 1,
  },
  cardInner: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderTopColor: 'rgba(255,255,255,0.12)', // Top highlight
    borderLeftColor: 'rgba(255,255,255,0.08)', // Left highlight
    borderRadius: 16,
  },
  
  // ── Typography ──
  formulaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  detail: {
    fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif' }),
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 20,
    marginBottom: 12,
  },
  
  // ── Badges ──
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  strongBadge: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(232,214,174,0.18)',
  },
  strongBadgeText: {
    color: '#FFFFFF', // Gold
  },
});
