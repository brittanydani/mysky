// File: components/ui/BlueprintChapterCard.tsx
//
// Blueprint — Chapter Card ("The Tome" design)
//
// Layout per spec:
//   - Background Number: Large Skia Text "01" at 0.04 white opacity
//   - Title: Gold Serif text in ALL CAPS (e.g. "THE CORE SELF")
//   - Chapter Summary: 2 lines at 0.6 opacity (SF Pro / sans-serif)
//   - Dynamic Marker: Glowing Red Dot when NLP engine flags this domain
//   - Haptic feedback on press: ImpactFeedbackStyle.Medium

import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { Canvas, Text as SkiaText, matchFont } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';

// ─────────────────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_WIDTH           = SCREEN_W - 40;

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string;
const GOLD  = '#D4AF37';

// Chapter domain keyword sets — driving the NLP active marker
// Each array contains low-level stems/roots that extractKeywords might return
export const CHAPTER_DOMAINS: string[][] = [
  // Ch 1: Identity / Core Self
  ['self', 'identit', 'authentic', 'who', 'am', 'personalit', 'core', 'exist'],
  // Ch 2: Emotional Body
  ['feel', 'emotion', 'mood', 'anxi', 'sad', 'fear', 'heart', 'sens', 'overwhe'],
  // Ch 3: Activating Force / Drive
  ['conflict', 'fight', 'anger', 'push', 'drive', 'action', 'stress', 'frustrat'],
  // Ch 4: Relational Force / Attraction
  ['love', 'attract', 'connect', 'desir', 'partner', 'romanc', 'intimat', 'bond'],
  // Ch 5: Creative Expression / Joy
  ['creat', 'art', 'express', 'joy', 'play', 'fun', 'imagin', 'inspir'],
  // Ch 6: Daily Structure / Habit
  ['routin', 'work', 'health', 'habit', 'structur', 'organiz', 'plan', 'disciplin'],
  // Ch 7: Relational Domain / Trust
  ['friend', 'trust', 'balanc', 'social', 'peopl', 'relat', 'communic', 'fair'],
  // Ch 8: Shadow Work / Hidden Patterns
  ['shadow', 'hidden', 'secret', 'control', 'power', 'transform', 'deep', 'trauma'],
  // Ch 9: Growth Direction / Purpose
  ['grow', 'expand', 'learn', 'believ', 'futur', 'purpos', 'mean', 'evolv'],
  // Ch 10: Life Mission / Legacy
  ['legaci', 'career', 'mission', 'achiev', 'public', 'ambition', 'vision', 'leader'],
];

// ─────────────────────────────────────────────────────────────────────────────

export interface BlueprintChapterCardProps {
  index: number;
  title: string;
  summary: string;
  isUnlocked: boolean;
  isPremium: boolean;
  accentColor: string;
  isNlpActive?: boolean; // glowing red dot if chapter domain is active in journals
  onPress: () => void;
}

const BlueprintChapterCard = memo(function BlueprintChapterCard({
  index,
  title,
  summary,
  isUnlocked,
  isPremium,
  accentColor,
  isNlpActive = false,
  onPress,
}: BlueprintChapterCardProps) {
  const chapterNum = String(index + 1).padStart(2, '0');

  // Font for the large background number in Skia Canvas
  const bgFont = useMemo(
    () => matchFont({ fontFamily: SERIF, fontSize: 140, fontWeight: '900' }),
    [],
  );

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Chapter ${index + 1}: ${isUnlocked ? title : 'Locked Pattern'}`}
    >
      {/* Glass card surface */}
      <View style={[styles.cardInner, { borderColor: `${accentColor}20` }]}>

        {/* Background number — large, 0.04 opacity white, sits behind everything */}
        {bgFont ? (
          <Canvas
            style={styles.bgNumberCanvas}
            pointerEvents="none"
          >
            <SkiaText
              x={CARD_WIDTH * 0.52}
              y={110}
              text={chapterNum}
              font={bgFont}
              color="rgba(255,255,255,0.04)"
            />
          </Canvas>
        ) : null}

        {/* ── Content row ── */}
        <View style={styles.contentRow}>
          {/* Left: accent stripe */}
          <View style={[styles.accentStripe, { backgroundColor: isUnlocked ? accentColor : 'rgba(255,255,255,0.12)' }]} />

          {/* Main text */}
          <View style={styles.textBlock}>
            {/* Chapter label */}
            <Text style={[styles.chapterLabel, isUnlocked && { color: accentColor }]}>
              CHAPTER {chapterNum}
            </Text>

            {/* Title */}
            <Text
              style={[styles.chapterTitle, !isUnlocked && styles.lockedText]}
              numberOfLines={2}
            >
              {isUnlocked ? title.toUpperCase() : 'LOCKED PATTERN'}
            </Text>

            {/* Summary */}
            <Text
              style={[styles.summaryText, !isUnlocked && { opacity: 0.3 }]}
              numberOfLines={2}
            >
              {isUnlocked
                ? summary
                : isPremium
                  ? summary
                  : 'Unlock with Deeper Sky to reveal this dimension of your architecture.'}
            </Text>

            {/* Premium badge */}
            {!isPremium && !isUnlocked && (
              <View style={styles.premiumTag}>
                <Text style={styles.premiumTagText}>DEEPER SKY</Text>
              </View>
            )}
          </View>

          {/* Right: NLP active dot or chevron */}
          <View style={styles.rightCol}>
            {isNlpActive && isUnlocked ? (
              <View style={styles.nlpDotWrap}>
                {/* Outer glow ring */}
                <View style={styles.nlpGlow} />
                {/* Inner dot */}
                <View style={styles.nlpDot} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
});

export default BlueprintChapterCard;

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  cardInner: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 112,
    position: 'relative',
  },
  bgNumberCanvas: {
    position: 'absolute',
    top: -10,
    right: -20,
    width: CARD_WIDTH,
    height: 130,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 112,
    paddingRight: 16,
  },
  accentStripe: {
    width: 3,
    borderRadius: 1.5,
    marginLeft: 0,
    marginVertical: 16,
  },
  textBlock: {
    flex: 1,
    paddingLeft: 16,
    paddingVertical: 16,
    paddingRight: 8,
  },
  chapterLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 6,
  },
  chapterTitle: {
    fontSize: 18,
    fontFamily: SERIF,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.8,
    marginBottom: 6,
    lineHeight: 24,
  },
  summaryText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.60)',
    lineHeight: 19,
    fontWeight: '400',
  },
  lockedText: {
    opacity: 0.45,
  },
  premiumTag: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.30)',
  },
  premiumTagText: {
    color: GOLD,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  rightCol: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // NLP active marker — glowing red dot
  nlpDotWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nlpGlow: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,60,60,0.25)',
  },
  nlpDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3C3C',
    shadowColor: '#FF3C3C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },
});
