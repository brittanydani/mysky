// File: components/ui/AspectRow.tsx
// MySky — Compact, colourful synastry aspect row with category dot + label
// Used in the Relationships detail view for a cleaner visual than plain text cards

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

const CATEGORY_CONFIG: Record<AspectCategory, { color: string; label: string }> = {
  connection: { color: '#E07A98', label: 'Harmony' },
  chemistry:  { color: '#E0B07A', label: 'Chemistry' },
  growth:     { color: '#8BC4E8', label: 'Growth' },
  challenge:  { color: '#E07A7A', label: 'Growth' },
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
      {/* Category dot */}
      <View style={styles.dotColumn}>
        <View style={[styles.dot, { backgroundColor: cfg.color }]} />
        {/* Subtle vertical connector line (purely decorative) */}
        <View style={[styles.connector, { backgroundColor: cfg.color }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Planet formula line */}
        <Text style={styles.planets}>{description}</Text>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Detail (optional) */}
        {detail ? (
          <Text style={styles.detail} numberOfLines={2}>{detail}</Text>
        ) : null}

        {/* Footer badges */}
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: `${cfg.color}18` }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {strength === 'strong' && (
            <View style={[styles.badge, { backgroundColor: 'rgba(201,169,98,0.15)' }]}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>Strong</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  dotColumn: {
    alignItems: 'center',
    paddingTop: 4,
    width: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connector: {
    width: 1.5,
    flex: 1,
    opacity: 0.15,
    marginTop: 4,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  planets: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  detail: {
    fontSize: 12.5,
    color: theme.textMuted,
    lineHeight: 18,
    marginBottom: 6,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
