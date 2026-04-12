/**
 * EditorialInsightCard
 *
 * The primary card primitive for the "Insight Triad" architecture:
 *   Micro-Header → Hero Metric → Body Prose → Nested Takeaway
 *
 * Visual system: Semantic Glass wash (expo-blur + translucent tint) paired
 * with the Deep Espresso ink hierarchy from constants/ink.ts.
 *
 * Usage
 * ─────
 * import { EditorialInsightCard } from '@/components/ui/EditorialInsightCard';
 * import { useAppTheme } from '@/context/ThemeContext';
 *
 * const theme = useAppTheme();
 *
 * <EditorialInsightCard
 *   category="SOMATIC"
 *   categoryIcon="activity"
 *   metric="12"
 *   metricLabel="HEAVY DAYS"
 *   glassWash={theme.cardSurfaceSomatic}
 *   prose={
 *     <Text>
 *       When your internal weather turns stormy, your nervous system stores
 *       tension in your <Text style={styles.highlight}>belly</Text> first.
 *     </Text>
 *   }
 *   takeaway="Place a hand on your stomach before you journal tonight."
 * />
 *
 * Highlight helper (use inline inside prose):
 *   import { useInkStyles } from '@/components/ui/EditorialInsightCard';
 *   const { highlight } = useInkStyles();
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VelvetGlassSurface } from './VelvetGlassSurface';
import { getInk } from '../../constants/ink';
import { useAppTheme } from '../../context/ThemeContext';

// ── Types ────────────────────────────────────────────────────────────────────

export interface EditorialInsightCardProps {
  /** Small-caps category label, e.g. "SOMATIC" */
  category: string;
  /** Ionicons icon name shown beside the category label */
  categoryIcon?: keyof typeof Ionicons.glyphMap;
  /** Large hero number or value, e.g. "12" */
  metric?: string;
  /** Unit label beside the metric, e.g. "HEAVY DAYS" */
  metricLabel?: string;
  /**
   * Body prose. Pass a plain string or a <Text> tree with inline
   * <Text style={highlight}> spans for dynamic data emphasis.
   */
  prose?: React.ReactNode;
  /** Optional nested "Inquiry / Takeaway" box beneath the prose. */
  takeaway?: string;
  /** Semantic glass wash color, e.g. theme.cardSurfaceSomatic */
  glassWash?: string;
  /** Blur intensity passed to VelvetGlassSurface (default 45) */
  blurIntensity?: number;
  /** Optional footer metadata string (date, source, etc.) */
  metadata?: string;
  /** Override container style */
  style?: StyleProp<ViewStyle>;
}

// ── Component ────────────────────────────────────────────────────────────────

export function EditorialInsightCard({
  category,
  categoryIcon,
  metric,
  metricLabel,
  prose,
  takeaway,
  glassWash,
  blurIntensity = 45,
  metadata,
  style,
}: EditorialInsightCardProps) {
  const theme = useAppTheme();
  const ink = getInk(theme.isDark);

  const resolvedGlassWash = glassWash ?? theme.cardSurface;

  return (
    <VelvetGlassSurface
      style={[cardStyles.card, style]}
      intensity={blurIntensity}
      backgroundColor={resolvedGlassWash}
      topEdgeColor={theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)'}
      leftEdgeColor={theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)'}
      rightEdgeColor={theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}
      bottomEdgeColor={theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'}
    >
      <View style={cardStyles.content}>

        {/* ── Micro-Header ── */}
        <View style={cardStyles.headerRow}>
          {categoryIcon && (
            <Ionicons
              name={categoryIcon}
              size={12}
              color={ink.secondary}
              style={cardStyles.headerIcon}
            />
          )}
          <Text style={[cardStyles.cardHeader, { color: ink.secondary }]}>
            {category}
          </Text>
        </View>

        {/* ── Hero Metric ── */}
        {(metric || metricLabel) && (
          <View style={cardStyles.metricRow}>
            {metric && (
              <Text style={[cardStyles.metricValue, { color: ink.primary }]}>
                {metric}
              </Text>
            )}
            {metricLabel && (
              <Text style={[cardStyles.metricLabel, { color: ink.secondary }]}>
                {metricLabel}
              </Text>
            )}
          </View>
        )}

        {/* ── Body Prose ── */}
        {prose && (
          <Text style={[cardStyles.bodyProse, { color: ink.secondary }]}>
            {prose}
          </Text>
        )}

        {/* ── Nested Takeaway Box ── */}
        {takeaway && (
          <View style={cardStyles.nestedBox}>
            <View style={cardStyles.nestedHeaderRow}>
              <Ionicons name="compass-outline" size={12} color={ink.primary} />
              <Text style={[cardStyles.cardHeader, { marginBottom: 0, color: ink.primary }]}>
                Inquiry
              </Text>
            </View>
            <Text
              style={[
                cardStyles.bodyProse,
                { marginBottom: 0, fontStyle: 'italic', fontSize: 15, lineHeight: 24, color: ink.secondary },
              ]}
            >
              {takeaway}
            </Text>
          </View>
        )}

        {/* ── Metadata Footer ── */}
        {metadata && (
          <Text style={[cardStyles.metadata, { color: ink.tertiary }]}>
            {metadata}
          </Text>
        )}

      </View>
    </VelvetGlassSurface>
  );
}

// ── useInkStyles ─────────────────────────────────────────────────────────────
/**
 * Returns theme-aware inline text styles for use inside prose.
 *
 * Example:
 *   const { highlight } = useInkStyles();
 *   <Text>Your <Text style={highlight}>belly</Text> stores tension first.</Text>
 */
export function useInkStyles() {
  const theme = useAppTheme();
  const ink = getInk(theme.isDark);

  return StyleSheet.create({
    highlight: {
      fontWeight: '700',
      color: ink.primary,
    } as TextStyle,
    muted: {
      color: ink.tertiary,
    } as TextStyle,
  });
}

// ── Styles ───────────────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 16,
  },
  content: {
    padding: 24,
  },

  // Micro-Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    marginRight: 6,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Hero Metric
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Body Prose
  bodyProse: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
    marginBottom: 20,
  },

  // Nested Takeaway Box
  nestedBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
  },
  nestedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },

  // Metadata Footer
  metadata: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 16,
  },
});
