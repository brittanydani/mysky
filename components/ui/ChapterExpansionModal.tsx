// File: components/ui/ChapterExpansionModal.tsx
//
// Blueprint — Chapter Expansion Modal ("Insight Depth")
//
// A full-screen modal that unfolds when a chapter card is tapped:
//   - Dark Skia canvas starfield background
//   - Justified, high-end text presentation
//   - "Healing Polaroids" — horizontal scroll of Insight Cards
//       • Inner Child: visualizes childhood Safety Pattern
//       • Fear Pattern: visualizes primary Avoidance mechanism
//   - Insight Card 3D flip (rotateY) via Reanimated revealing a Journal Prompt
//   - Haptics on card tap

import React, { useState, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GeneratedChapter } from '../../services/premium/fullNatalStory';
import { applyStoryLabels } from '../../constants/storyLabels';
import { SkiaDynamicCosmos } from './SkiaDynamicCosmos';

// ─────────────────────────────────────────────────────────────────────────────

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const GOLD        = '#D4AF37';
const SILVER      = '#C0C0C0';
const CARD_W      = SCREEN_W * 0.70;
const CARD_H      = 220;
const SERIF       = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string;

// ─────────────────────────────────────────────────────────────────────────────
// Insight Card — 3D flip polaroid

interface InsightCard {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  frontTagline: string;
  frontDescription: string;
  backTitle: string;
  backPrompt: string;
}

function buildInsightCards(chapter: GeneratedChapter | null): InsightCard[] {
  if (!chapter) return [];

  const safeReflection = chapter.reflection ? applyStoryLabels(chapter.reflection) : '';
  const safeAffirmation = chapter.affirmation ? applyStoryLabels(chapter.affirmation) : '';

  return [
    {
      id: 'inner-child',
      label: 'INNER CHILD',
      icon: 'heart-outline',
      iconColor: '#F4A8C0',
      frontTagline: 'Safety Pattern',
      frontDescription:
        'The protective strategy your younger self built to feel safe in the world.',
      backTitle: 'Journal Prompt',
      backPrompt:
        safeReflection ||
        'What did you need most as a child that you are still searching for today? Write without filtering.',
    },
    {
      id: 'fear-pattern',
      label: 'FEAR PATTERN',
      icon: 'eye-off-outline',
      iconColor: '#9D76C1',
      frontTagline: 'Avoidance Mechanism',
      frontDescription:
        'The primary way your nervous system deflects perceived threats to your core identity.',
      backTitle: 'Depth Prompt',
      backPrompt:
        safeAffirmation ||
        'Describe the last time you avoided something important. What were you protecting? What would happen if you did not protect it?',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// FlipCard sub-component

interface FlipCardProps {
  card: InsightCard;
}

function FlipCard({ card }: FlipCardProps) {
  const flipProgress = useSharedValue(0); // 0 = front, 1 = back
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const next = isFlipped ? 0 : 1;
    flipProgress.value = withTiming(next, {
      duration: 480,
      easing: Easing.inOut(Easing.cubic),
    });
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipProgress]);

  // Front side: 0–90° visible, then hidden
  const frontAnimStyle = {
    transform: [
      {
        rotateY: useDerivedValue(() => {
          const deg = interpolate(flipProgress.value, [0, 1], [0, 180], Extrapolation.CLAMP);
          return `${deg}deg`;
        }).value,
      },
    ],
    backfaceVisibility: 'hidden' as const,
    opacity: useDerivedValue(() =>
      interpolate(flipProgress.value, [0, 0.45, 0.5, 1], [1, 1, 0, 0], Extrapolation.CLAMP),
    ).value,
  };

  // Back side: hidden until 90° then rotates 90–0
  const backAnimStyle = {
    transform: [
      {
        rotateY: useDerivedValue(() => {
          const deg = interpolate(flipProgress.value, [0, 1], [180, 360], Extrapolation.CLAMP);
          return `${deg}deg`;
        }).value,
      },
    ],
    backfaceVisibility: 'hidden' as const,
    opacity: useDerivedValue(() =>
      interpolate(flipProgress.value, [0, 0.45, 0.5, 1], [0, 0, 1, 1], Extrapolation.CLAMP),
    ).value,
  };

  return (
    <Pressable onPress={handleFlip} style={styles.polaroidWrapper}>
      {/* Front face */}
      <Animated.View style={[styles.polaroidCard, frontAnimStyle]}>
        <View style={styles.polaroidLabelRow}>
          <Text style={styles.polaroidLabel}>{card.label}</Text>
          <Ionicons name={card.icon} size={14} color={card.iconColor} />
        </View>
        <View style={styles.polaroidIconArea}>
          <View style={[styles.polaroidIconCircle, { backgroundColor: `${card.iconColor}18` }]}>
            <Ionicons name={card.icon} size={36} color={card.iconColor} />
          </View>
        </View>
        <Text style={styles.polaroidTagline}>{card.frontTagline}</Text>
        <Text style={styles.polaroidDesc} numberOfLines={2}>
          {card.frontDescription}
        </Text>
        <View style={styles.tapHint}>
          <Text style={styles.tapHintText}>Tap to reveal</Text>
          <Ionicons name="refresh-outline" size={10} color="rgba(255,255,255,0.25)" />
        </View>
      </Animated.View>

      {/* Back face (Journal Prompt) */}
      <Animated.View style={[styles.polaroidCard, styles.polaroidBack, backAnimStyle]}>
        <Text style={styles.backTitle}>{card.backTitle}</Text>
        <View style={styles.backDivider} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.backPrompt}>{card.backPrompt}</Text>
        </ScrollView>
        <View style={styles.tapHint}>
          <Text style={styles.tapHintText}>Tap to close</Text>
          <Ionicons name="arrow-back-outline" size={10} color="rgba(255,255,255,0.25)" />
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main modal

interface ChapterExpansionModalProps {
  chapter: GeneratedChapter | null;
  chapterIndex: number;
  accentColor: string;
  visible: boolean;
  onClose: () => void;
}

export function ChapterExpansionModal({
  chapter,
  chapterIndex,
  accentColor,
  visible,
  onClose,
}: ChapterExpansionModalProps) {
  const insightCards = useMemo(() => buildInsightCards(chapter), [chapter]);

  const chapterNum = String(chapterIndex + 1).padStart(2, '0');
  const safeTitle   = chapter ? applyStoryLabels(chapter.title) : '';
  const safeContent = chapter ? applyStoryLabels(chapter.content) : '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Starfield backdrop */}
        <SkiaDynamicCosmos />

        <SafeAreaView style={styles.safeArea}>
          {/* Header bar */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalChapterNum, { color: accentColor }]}>
              {chapterNum}
            </Text>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              {safeTitle.toUpperCase()}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Gold accent underline */}
            <View style={[styles.titleUnderline, { backgroundColor: accentColor }]} />

            {/* Chapter body text — justified */}
            {safeContent ? (
              <Text style={styles.chapterBody}>{safeContent}</Text>
            ) : null}

            {/* Healing Polaroids section */}
            {insightCards.length > 0 ? (
              <View style={styles.polaroidsSection}>
                <Text style={styles.polaroidsHeading}>HEALING POLAROIDS</Text>
                <Text style={styles.polaroidsSubheading}>
                  Tap a card to reveal your journal prompt
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.polaroidsScroll}
                  decelerationRate="fast"
                  snapToInterval={CARD_W + 16}
                  snapToAlignment="start"
                >
                  {insightCards.map(card => (
                    <FlipCard key={card.id} card={card} />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Reflection quote */}
            {chapter?.reflection ? (
              <View style={styles.reflectionBlock}>
                <View style={[styles.reflectionAccent, { backgroundColor: accentColor }]} />
                <Text style={styles.reflectionText}>
                  {applyStoryLabels(chapter.reflection)}
                </Text>
              </View>
            ) : null}

            {/* Affirmation */}
            {chapter?.affirmation ? (
              <Text style={styles.affirmationText}>
                "{applyStoryLabels(chapter.affirmation)}"
              </Text>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#02040D',
  },
  safeArea: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  modalChapterNum: {
    fontSize: 22,
    fontFamily: SERIF,
    fontWeight: '900',
    letterSpacing: 0.5,
    minWidth: 36,
  },
  modalHeaderTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: SERIF,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.80)',
    letterSpacing: 1.2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    paddingTop: 8,
  },
  titleUnderline: {
    height: 1,
    width: 48,
    borderRadius: 1,
    marginBottom: 24,
    opacity: 0.7,
  },
  chapterBody: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 26,
    textAlign: 'justify',
    fontFamily: Platform.select({ ios: undefined, android: undefined }),
    marginBottom: 32,
  },
  // Healing Polaroids
  polaroidsSection: {
    marginBottom: 32,
  },
  polaroidsHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    color: GOLD,
    marginBottom: 4,
  },
  polaroidsSubheading: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.40)',
    marginBottom: 16,
  },
  polaroidsScroll: {
    paddingRight: 20,
    gap: 16,
  },
  polaroidWrapper: {
    width: CARD_W,
    height: CARD_H,
    perspective: 800,
  },
  polaroidCard: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 18,
  },
  polaroidBack: {
    backgroundColor: 'rgba(14,24,48,0.90)',
    borderColor: `${GOLD}30`,
  },
  polaroidLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  polaroidLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.35)',
  },
  polaroidIconArea: {
    alignItems: 'center',
    marginBottom: 12,
  },
  polaroidIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  polaroidTagline: {
    fontSize: 15,
    fontFamily: SERIF,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
    textAlign: 'center',
  },
  polaroidDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.50)',
    lineHeight: 17,
    textAlign: 'center',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 'auto',
    paddingTop: 8,
  },
  tapHintText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.20)',
    fontStyle: 'italic',
  },
  // Back face
  backTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: GOLD,
    marginBottom: 8,
  },
  backDivider: {
    height: 1,
    backgroundColor: `${GOLD}25`,
    marginBottom: 12,
  },
  backPrompt: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // Reflection block
  reflectionBlock: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    paddingLeft: 4,
  },
  reflectionAccent: {
    width: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
  reflectionText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.60)',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // Affirmation
  affirmationText: {
    fontSize: 15,
    fontFamily: SERIF,
    color: GOLD,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
});
