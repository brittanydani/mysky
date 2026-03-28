/**
 * JournalSanctuaryScreen — Distraction-free focused writing environment.
 *
 * Auto-saves to encrypted local storage with a debounced 1.5s write. A
 * breathing green dot signals that the entry is secured. After 50 characters
 * of focused typing, the chrome fades away so nothing interrupts the flow.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { localDb } from '../../services/storage/localDb';
import { JournalEntry, generateId } from '../../services/storage/models';
import { analyzeJournalContent } from '../../services/journal/nlp';
import { logger } from '../../utils/logger';

type SaveStatus = 'draft' | 'saving' | 'saved';

export const JournalSanctuaryScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('draft');

  // Stable ref to the in-progress entry id so updates patch the same row
  const entryRef = useRef<JournalEntry | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savePulse = useSharedValue(0.3);
  const uiOpacity = useSharedValue(1);

  // Breathing animation while there is content to save
  const hasText = text.length > 0;
  useEffect(() => {
    if (hasText) {
      savePulse.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      savePulse.value = withTiming(0.3, { duration: 400 });
    }
  }, [hasText]);

  // Fade non-essential chrome when deeply focused
  const inFocusMode = isFocused && text.length > 50;
  useEffect(() => {
    uiOpacity.value = withTiming(inFocusMode ? 0.3 : 1, { duration: 500 });
  }, [inFocusMode]);

  // Persist entry to encrypted local storage
  const saveEntry = useCallback(async (content: string) => {
    try {
      const nowIso = new Date().toISOString();
      const nlp = analyzeJournalContent(content);
      const nlpFields = {
        contentKeywords: JSON.stringify(nlp.keywords),
        contentEmotions: JSON.stringify(nlp.emotions),
        contentSentiment: JSON.stringify(nlp.sentiment),
        contentWordCount: nlp.wordCount,
        contentReadingMinutes: nlp.readingMinutes,
      };

      if (entryRef.current) {
        const updated: JournalEntry = {
          ...entryRef.current,
          content,
          updatedAt: nowIso,
          ...nlpFields,
        };
        await localDb.updateJournalEntry(updated);
        entryRef.current = updated;
      } else {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const newEntry: JournalEntry = {
          id: generateId(),
          title: '',
          content,
          mood: 'okay',
          moonPhase: 'new',
          date: dateStr as JournalEntry['date'],
          createdAt: nowIso,
          updatedAt: nowIso,
          isDeleted: false,
          ...nlpFields,
        };
        await localDb.addJournalEntry(newEntry);
        entryRef.current = newEntry;
      }

      setSaveStatus('saved');
    } catch (err) {
      logger.error('[Sanctuary] Save failed:', err);
      setSaveStatus('draft');
    }
  }, []);

  // Debounced write — fires 1.5 s after the user stops typing
  useEffect(() => {
    if (!text.trim()) return;

    setSaveStatus('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void saveEntry(text);
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, saveEntry]);

  // Flush any pending save synchronously before navigating back
  const handleBack = useCallback(async () => {
    try { await Haptics.selectionAsync(); } catch {}

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (text.trim()) await saveEntry(text);

    router.back();
  }, [text, saveEntry, router]);

  const wordCount = text.trim().split(/\s+/).filter((w) => w.length > 0).length;

  const animatedSaveDot = useAnimatedStyle(() => ({ opacity: savePulse.value }));
  const animatedUI = useAnimatedStyle(() => ({ opacity: uiOpacity.value }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 12 }, animatedUI]}>
        <Pressable
          onPress={() => void handleBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to journal"
        >
          <Ionicons name="chevron-back-outline" color="#FFFFFF" size={28} />
        </Pressable>

        <View style={styles.saveContainer}>
          {saveStatus !== 'draft' && (
            <Animated.View style={[styles.saveDot, animatedSaveDot]} />
          )}
          <Text style={styles.saveText}>
            {saveStatus === 'saved'
              ? 'Encrypted & Saved'
              : saveStatus === 'saving'
              ? 'Saving…'
              : 'Draft'}
          </Text>
        </View>
      </Animated.View>

      {/* Writing canvas */}
      <TextInput
        style={styles.editor}
        multiline
        autoFocus
        placeholder="Let ink carry the first draft…"
        placeholderTextColor="#4A4A5A"
        value={text}
        onChangeText={setText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        selectionColor="#D4B872"
        keyboardAppearance="dark"
        textAlignVertical="top"
      />

      {/* Keyboard accessory bar */}
      {isFocused && (
        <BlurView intensity={60} tint="dark" style={styles.accessoryBar}>
          <View style={styles.accessoryTools}>
            <Pressable
              style={styles.toolBtn}
              onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              accessibilityLabel="Add tag"
            >
              <Ionicons name="pricetag-outline" color="#8E8E93" size={20} />
            </Pressable>
            <Pressable
              style={styles.toolBtn}
              onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              accessibilityLabel="Moon phase"
            >
              <Ionicons name="moon-outline" color="#8E8E93" size={20} />
            </Pressable>
            <Pressable
              style={styles.toolBtn}
              onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              accessibilityLabel="Attach"
            >
              <Ionicons name="attach-outline" color="#8E8E93" size={20} />
            </Pressable>
          </View>
          <Text style={styles.wordCount}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </Text>
        </BlurView>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  saveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  saveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7FE5A9',
    marginRight: 6,
  },
  saveText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  editor: {
    flex: 1,
    color: '#E5E5EA',
    fontSize: 18,
    lineHeight: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  accessoryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  accessoryTools: {
    flexDirection: 'row',
    gap: 16,
  },
  toolBtn: {
    padding: 4,
  },
  wordCount: {
    color: '#8E8E93',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
