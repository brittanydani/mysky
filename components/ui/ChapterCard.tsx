import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle, Platform, LayoutChangeEvent } from 'react-native';
import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { luxuryTheme } from '../../constants/luxuryTheme';
import { MetallicText } from './MetallicText';
import { MetallicIcon } from './MetallicIcon';

// Mappings for Archetypal Forces to their corresponding aura colors
const FORCE_COLORS: Record<string, string> = {
  'Core vitality': '#C9AE78',       // Champagne Gold (Sun)
  'Emotional body': '#8BC4E8',      // Silver-Blue (Moon)
  'Activating force': '#CD7F5D',    // Copper (Mars)
  'Relational force': '#F4C2C2',    // Soft Pink (Venus)
  'Structural force': '#A9A9A9',    // Steel Gray (Saturn)
  'Expansion force': '#9370DB',     // Medium Purple (Jupiter)
  'Cognitive influence': '#FFEA70', // Pale Yellow (Mercury)
  'Transformational force': '#9D76C1', // Amethyst (Pluto)
  'Diffuse influence': '#48D1CC',   // Medium Turquoise (Neptune)
  'Disruptive force': '#FF8C00',    // Dark Orange (Uranus)
  'Healing archetype': '#98FB98',   // Pale Green (Chiron)
  'Outward expression': '#FFDAB9',  // Peach Puff (Ascendant)
};

interface ChapterCardProps {
  chapter: string;
  title: string;
  content?: string;
  preview?: string;
  reflection?: string;
  affirmation?: string;
  isLocked?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  amethyst: '#9D76C1',
  textMain: '#F0EAD6',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

function ChapterCard({
  chapter,
  title,
  content,
  preview,
  reflection,
  affirmation,
  isLocked = false,
  onPress,
  style,
}: ChapterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);

  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    setW(e.nativeEvent.layout.width);
    setH(e.nativeEvent.layout.height);
  }, []);
  const displayText = isLocked ? preview ?? '' : content ?? '';
  const isLong = !isLocked && !!content && content.length > 200;

  // Determine the dominant force to set the specular edge color
  let dominantColor = PALETTE.gold; 
  const titleLower = title?.toLowerCase() ?? '';
  const displayLower = displayText?.toLowerCase() ?? '';

  for (const [force, auraColor] of Object.entries(FORCE_COLORS)) {
    const forceLower = force.toLowerCase();
    if (titleLower.includes(forceLower) || displayLower.includes(forceLower)) {
      dominantColor = auraColor;
      break;
    }
  }

  const handlePress = () => {
    if (isLocked) {
      onPress?.();
    } else if (isLong) {
      setExpanded(prev => !prev);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.container,
        {
          borderColor: `${dominantColor}55`,
          borderTopColor: `${dominantColor}88`,
        },
        style,
        pressed && styles.pressed,
      ]}
    >
      {w > 0 && h > 0 && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFillObject}>
            <RoundedRect x={0} y={0} width={w} height={h} r={24}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, h)}
                colors={
          isLocked
            ? ['rgba(25, 30, 45, 0.4)', 'rgba(15, 20, 30, 0.6)'] // Deeper cool for locked
            : ['rgba(18,32,64,0.48)', 'rgba(2,8,23,0.66)']
        }
              />
            </RoundedRect>
          </Canvas>
        </View>
      )}
      <View style={styles.gradient}>
        {/* Header Row */}
        <View style={styles.header}>
          {isLocked ? (
            <Text style={[styles.chapterLabel, { color: theme.textMuted }]}>
              {chapter}
            </Text>
          ) : (
            <MetallicText style={styles.chapterLabel} color={PALETTE.gold}>
              {chapter}
            </MetallicText>
          )}
          {isLocked && (
            <View style={styles.lockBadge}>
              <MetallicIcon name="sparkles-outline" size={10} color={PALETTE.gold} />
              <MetallicText style={styles.lockBadgeText} color={PALETTE.gold}>Deeper Sky</MetallicText>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, isLocked && styles.lockedTitle]}>{title}</Text>

        {/* Main Content */}
        <Text
          style={[styles.content, isLocked && styles.lockedContent]}
          numberOfLines={isLocked ? 3 : isLong && !expanded ? 5 : undefined}
        >
          {displayText}
        </Text>

        {/* Locked Teaser CTA */}
        {isLocked && (
          <View style={styles.lockedCta}>
            <MetallicText style={styles.lockedCtaText} color={PALETTE.gold}>Unlock the full narrative</MetallicText>
            <MetallicIcon name="arrow-forward-outline" size={14} color={PALETTE.gold} />
          </View>
        )}

        {/* Reflection Section */}
        {expanded && reflection ? (
          <View style={styles.reflectionBox}>
            <View style={styles.reflectionHeader}>
              <MetallicIcon name="journal-outline" size={12} color={PALETTE.gold} />
              <MetallicText style={styles.reflectionLabel} color={PALETTE.gold}>Reflection</MetallicText>
            </View>
            <Text style={styles.reflectionText}>{reflection}</Text>
          </View>
        ) : null}

        {/* Affirmation Section */}
        {expanded && affirmation ? (
          <View style={styles.affirmationBox}>
            <Text style={styles.affirmationText}>"{affirmation}"</Text>
          </View>
        ) : null}

        {/* Read More Toggle */}
        {isLong && (
          <View style={styles.readMoreRow}>
            <MetallicText style={styles.readMoreText} color={PALETTE.gold}>
              {expanded ? 'Show less' : 'Continue reading'}
            </MetallicText>
            <MetallicIcon 
              name={expanded ? 'chevron-up' : 'chevron-down'} 
              size={14} 
              color={PALETTE.gold} 
            />
          </View>
        )}

      </View>
    </Pressable>
  );
}

export default memo(ChapterCard);

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  gradient: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chapterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.gold,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.24)',
  },
  lockBadgeText: {
    fontSize: 10,
    color: PALETTE.gold,
    marginLeft: 5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 21,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 16,
    lineHeight: 27,
  },
  lockedTitle: {
    color: theme.textSecondary,
    opacity: 0.72,
  },
  content: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
  },
  lockedContent: {
    color: theme.textMuted,
    fontStyle: 'italic',
    opacity: 0.9,
  },
  lockedCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  lockedCtaText: {
    fontSize: 14,
    color: PALETTE.gold,
    fontWeight: '600',
  },
  reflectionBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderLeftWidth: 3,
    borderLeftColor: PALETTE.gold,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reflectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reflectionText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  affirmationBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  affirmationText: {
    fontSize: 15,
    color: PALETTE.textMain,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    justifyContent: 'center',
  },
  readMoreText: {
    fontSize: 13,
    color: PALETTE.gold,
    fontWeight: '600',
  },
});
