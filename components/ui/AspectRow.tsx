// File: components/ui/AspectRow.tsx
//
// High-end, glassmorphic synastry aspect row for MySky.
// Upgraded with subtle gradients, glowing nodes, and cinematic typography hierarchy.
// 
// Requires: expo-linear-gradient

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

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
  chemistry:  { color: '#C9AE78', gradient: ['#FFF0B3', '#9A7B1C'], label: 'Chemistry' },
  growth:     { color: '#8BC4E8', gradient: ['#BEE0F5', '#4A87A8'], label: 'Growth' },
  challenge:  { color: '#C87878', gradient: ['#E8A9A9', '#8A3A3A'], label: 'Challenge' }, // Fixed label
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
          <LinearGradient
            colors={cfg.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nodeCore}
          />
        </View>
        
        {/* Fading Connector Line */}
        <LinearGradient
          colors={[`${cfg.color}80`, 'rgba(255,255,255,0)']}
          style={styles.connector}
        />
      </View>

      {/* ── Glassmorphic Content Card ── */}
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardGlow}
        >
          {/* Card Border Highlight (Top/Left light catch) */}
          <View style={styles.cardInner}>
            
            {/* Aspect Formula */}
            <Text style={styles.formula}>{description}</Text>

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
                <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              
              {/* Strength Badge */}
              {strength === 'strong' && (
                <View style={[styles.badge, styles.strongBadge]}>
                  <Text style={[styles.badgeText, styles.strongBadgeText]}>Strong</Text>
                </View>
              )}
            </View>

          </View>
        </LinearGradient>
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
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    // Android Shadow
    elevation: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
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
  formula: {
    fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif' }),
    fontSize: 12,
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 18,
    color: '#F0EAD6',
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
    backgroundColor: 'rgba(232, 214, 174, 0.1)',
    borderColor: 'rgba(232,214,174,0.18)',
  },
  strongBadgeText: {
    color: '#C9AE78', // Gold
  },
});
