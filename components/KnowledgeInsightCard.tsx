import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GeneratedInsight } from '../services/insights/types/knowledgeEngine';
import { VelvetGlassSurface } from './ui/VelvetGlassSurface';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import { MetallicText } from './ui/MetallicText';
import { MetallicIcon } from './ui/MetallicIcon';
import { useAppTheme } from '../context/ThemeContext';

interface KnowledgeInsightCardProps {
  insight: GeneratedInsight;
  showActiveWeeklyTheme?: boolean;
}

const TEXT_SCALE_PROPS = {
  maxFontSizeMultiplier: 1.15,
  android_hyphenationFrequency: 'none' as const,
  lineBreakStrategyIOS: 'none' as const,
  textBreakStrategy: 'simple' as const,
};

function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function stripTerminalPunctuation(text: string): string {
  return text.trim().replace(/[.!?]+$/, '');
}

function readsLikeCompleteSentence(text: string): boolean {
  const trimmed = text.trim();
  return /^[A-Z]/.test(trimmed) && /[.!?]$/.test(trimmed);
}

function lowerFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function capitalizeFirst(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function stripShamePrefix(text: string): string {
  return stripTerminalPunctuation(text)
    .replace(/^this does not read as\s+/i, '')
    .replace(/^this is not\s+/i, '')
    .trim();
}

function stripClarityPrefix(text: string): string {
  return stripTerminalPunctuation(text)
    .replace(/^it reads as\s+/i, '')
    .replace(/^this reads as\s+/i, '')
    .trim();
}

function claritySentence(text: string): string {
  const clarity = stripClarityPrefix(text);
  if (!clarity) return '';
  if (readsLikeCompleteSentence(text) && !/^it reads as\b/i.test(text)) {
    return ensureSentence(text);
  }
  if (/^(this|it|you|your)\b/i.test(clarity)) {
    return ensureSentence(clarity);
  }
  const gerund = clarity.match(/^(.+?)\s+(becoming|asking|speaking|recognizing|learning|trying|holding|making|finding|protecting|showing|tracking|searching|moving|looking|giving)\b(.+)$/i);
  if (gerund) {
    const [, subject, verb, rest] = gerund;
    return ensureSentence(`${capitalizeFirst(subject)} is ${verb.toLowerCase()}${rest}`);
  }
  return ensureSentence(`This is ${lowerFirst(clarity)}`);
}

function inlineClarity(text: string): string {
  return lowerFirst(stripClarityPrefix(text))
    .replace(/^(it|this)\s+is\s+/i, '');
}

export function buildReframeText(reframe: GeneratedInsight['reframe']): string {
  const shameText = reframe.shame.trim();
  const clarityText = reframe.clarity.trim();
  const shame = stripShamePrefix(shameText);
  const clarity = claritySentence(clarityText);

  if (!shame) return clarity;
  if (!clarity) return ensureSentence(`This is not ${shame}`);

  const variant = (shame.length + clarityText.length) % 3;
  if (variant === 0) {
    return `This is not ${shame}. ${clarity}`;
  }
  if (variant === 1) {
    return clarity;
  }
  return ensureSentence(`The clearer read: ${inlineClarity(clarityText)}`);
}

export const KnowledgeInsightCard: React.FC<KnowledgeInsightCardProps> = ({
  insight,
  showActiveWeeklyTheme = true,
}) => {
  useAppTheme();

  const movementLabelMap: Record<string, string> = {
    new: 'NEW PATTERN',
    emerging: 'EMERGING SIGNAL',
    repeating: 'STILL PRESENT',
    intensifying: 'STRONGER TODAY',
    softening: 'SOFTER TODAY',
    returning: 'RETURNING',
  };

  const movementLabel = movementLabelMap[insight.movement] || 'ARCHIVE ECHO';
  const eyebrowLabel = insight.slotLabel ?? movementLabel;
  const confidenceLabelMap: Record<string, string> = {
    veryStrong: 'VERY STRONG',
    strong: 'STRONG',
    moderate: 'MODERATE',
    emerging: 'EMERGING',
  };
  const confidenceLabel = confidenceLabelMap[insight.confidence] ?? insight.confidence.toUpperCase();
  const activeWeeklyTheme = insight.activeWeeklyTheme?.trim();

  return (
    <VelvetGlassSurface style={styles.card} intensity={20}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(168, 139, 235, 0.20)', 'rgba(168, 139, 235, 0.05)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.padding}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MetallicIcon name="sparkles-outline" size={16} variant="gold" />
            <MetallicText style={styles.eyebrow} variant="gold">
              {eyebrowLabel}
            </MetallicText>
          </View>
          <View style={styles.confidenceBadge}>
            <Text {...TEXT_SCALE_PROPS} style={styles.confidenceText}>{confidenceLabel}</Text>
          </View>
        </View>

        <Text {...TEXT_SCALE_PROPS} style={styles.title}>{insight.title}</Text>
        {showActiveWeeklyTheme && activeWeeklyTheme ? (
          <View style={styles.activeThemeContainer}>
            <Text {...TEXT_SCALE_PROPS} style={styles.activeThemeLabel}>ACTIVE WEEKLY THEME</Text>
            <Text {...TEXT_SCALE_PROPS} style={styles.activeThemeText}>{activeWeeklyTheme}</Text>
          </View>
        ) : null}
        <Text {...TEXT_SCALE_PROPS} style={styles.body}>{`${insight.observation} ${insight.pattern}`}</Text>

        <View style={styles.reframeContainer}>
          <View style={styles.reframeHeader}>
            <Ionicons name="sparkles-outline" size={14} color="rgba(212,175,55,0.72)" />
            <Text {...TEXT_SCALE_PROPS} style={styles.reframeLabel}>CLEARER READ</Text>
          </View>
          <Text {...TEXT_SCALE_PROPS} style={styles.reframeText}>{buildReframeText(insight.reframe)}</Text>
        </View>

        <View style={styles.promptContainer}>
          <View style={styles.promptHeader}>
            <Ionicons name="help-circle-outline" size={14} color="rgba(212,175,55,0.6)" />
            <Text {...TEXT_SCALE_PROPS} style={styles.promptLabel}>QUESTION TO KEEP</Text>
          </View>
          <Text {...TEXT_SCALE_PROPS} style={styles.promptText}>{insight.prompt}</Text>
        </View>
      </View>
    </VelvetGlassSurface>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  padding: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  confidenceText: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  title: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.76)',
    lineHeight: 21,
    marginBottom: 16,
  },
  activeThemeContainer: {
    backgroundColor: 'rgba(168,139,235,0.10)',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(168,139,235,0.22)',
  },
  activeThemeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(212,175,55,0.72)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  activeThemeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.86)',
    lineHeight: 18,
    fontWeight: '600',
  },
  reframeContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(212,175,55,0.3)',
  },
  reframeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reframeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(212,175,55,0.72)',
    letterSpacing: 1,
  },
  reframeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 19,
    fontWeight: '600',
  },
  promptContainer: {
    marginTop: 8,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  promptLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(212,175,55,0.6)',
    letterSpacing: 1,
  },
  promptText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
});
