import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { localDb } from '../services/storage/localDb';
import { generateId } from '../services/storage/models';
import type { JournalEntry } from '../services/storage/models';

import {
  getArchetypeProfile,
  getArchetypePrompt,
  type ArchetypeProfile,
  type ArchetypeJournalPrompt,
} from '../services/journal/archetypeIntegration';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';

type MoodKey = 'calm' | 'soft' | 'okay' | 'heavy' | 'stormy';

const MOODS: { id: MoodKey; label: string; icon: string; color: string }[] = [
  { id: 'calm',   label: 'Calm',   icon: 'water-outline',       color: '#6EBF8B' },
  { id: 'soft',   label: 'Soft',   icon: 'leaf-outline',        color: '#8BC4E8' },
  { id: 'okay',   label: 'Okay',   icon: 'remove-outline',      color: '#D9BF8C' },
  { id: 'heavy',  label: 'Heavy',  icon: 'cloud-outline',       color: '#A89BC8' },
  { id: 'stormy', label: 'Stormy', icon: 'thunderstorm-outline', color: '#D4A3B3' },
];

const PALETTE = {
  bg: '#0A0A0C',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

export default function NewJournalEntryScreen() {
  const router = useRouter();

  const [mood, setMood] = useState<MoodKey | null>(null);
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState<ArchetypeProfile | null>(null);
  const [prompt, setPrompt] = useState<ArchetypeJournalPrompt | null>(null);

  // Load the user's archetype profile on mount
  useEffect(() => {
    (async () => {
      const p = await getArchetypeProfile();
      setProfile(p);
    })();
  }, []);

  // Update the contextual prompt whenever the mood changes
  useEffect(() => {
    if (mood && profile) {
      setPrompt(getArchetypePrompt(profile, mood));
    }
  }, [mood, profile]);

  const handleSelectMood = (selectedMood: MoodKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMood(selectedMood);
    Keyboard.dismiss();
  };

  const handleUsePrompt = () => {
    if (!prompt) return;
    Haptics.selectionAsync();
    setText((prev) => {
      const spacing = prev.length > 0 && !prev.endsWith('\n\n') ? '\n\n' : '';
      return prev + spacing + prompt.question + '\n';
    });
  };

  const handleSeal = async () => {
    if (!mood && !text.trim()) return;
    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const now = new Date().toISOString();
      const entry: JournalEntry = {
        id: generateId(),
        date: now.split('T')[0],
        mood: mood ?? 'okay',
        moonPhase: 'waning',
        content: text.trim(),
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      };
      await localDb.saveJournalEntry(entry);
    } catch (e) {
      console.error('Failed to seal entry:', e);
    }

    setTimeout(() => {
      router.back();
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.closeBtn}
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
          >
            <Ionicons name="close-outline" size={24} color={PALETTE.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={styles.headerTitle}>Inner Weather</Text>
            <GoldSubtitle style={styles.headerSubtitle}>How is your system feeling right now?</GoldSubtitle>
          </Animated.View>

          {/* 1. Mood Selector */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(500)}
            style={styles.moodContainer}
          >
            {MOODS.map((m) => {
              const isSelected = mood === m.id;
              const isFaded = mood !== null && !isSelected;
              return (
                <Pressable
                  key={m.id}
                  style={[
                    styles.moodBtn,
                    isSelected && { borderColor: m.color, backgroundColor: `${m.color}15` },
                    isFaded && { opacity: 0.3 },
                  ]}
                  onPress={() => handleSelectMood(m.id)}
                >
                  {isSelected ? (
                    <MetallicIcon
                      name={m.icon as any}
                      size={24}
                      color={m.color}
                    />
                  ) : (
                    <Ionicons
                      name={m.icon as any}
                      size={24}
                      color={PALETTE.textMuted}
                    />
                  )}
                  {isSelected ? (
                    <MetallicText
                      style={[styles.moodLabel, { fontWeight: '700' }]}
                      color={m.color}
                    >
                      {m.label}
                    </MetallicText>
                  ) : (
                    <Text style={styles.moodLabel}>
                      {m.label}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </Animated.View>

          {/* 2. Archetype Prompt (revealed on mood select) */}
          {mood && prompt && (
            <Animated.View
              entering={FadeInDown.duration(500)}
              layout={Layout.springify()}
              style={styles.promptWrapper}
            >
              <Pressable
                onPress={handleUsePrompt}
                style={({ pressed }) => [pressed && { opacity: 0.8 }]}
              >
                <LinearGradient
                  colors={[`${prompt.archetypeColor}15`, 'rgba(10,10,15,0.8)']}
                  style={[styles.promptCard, { borderColor: `${prompt.archetypeColor}40` }]}
                >
                  <View style={styles.promptHeader}>
                    <MetallicIcon name="sparkles-outline" size={14} color={prompt.archetypeColor} />
                    <MetallicText style={styles.promptContext} color={prompt.archetypeColor}>
                      {prompt.context}
                    </MetallicText>
                  </View>
                  <Text style={styles.promptQuestion}>"{prompt.question}"</Text>
                  <View style={styles.promptFooter}>
                    <Text style={styles.promptFooterText}>Tap to insert into entry</Text>
                    <Ionicons name="arrow-down-outline" size={12} color={PALETTE.textMuted} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* 3. Journal Input */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            layout={Layout.springify()}
            style={styles.inputSection}
          >
            <View style={styles.inputGlass}>
              <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
              <TextInput
                style={styles.textInput}
                placeholder="Write freely. The Archive is secure..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={text}
                onChangeText={setText}
                multiline
                textAlignVertical="top"
                autoFocus={false}
                selectionColor={prompt?.archetypeColor ?? '#D9BF8C'}
              />
            </View>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Seal Button */}
        {(mood || text.trim().length > 0) && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.fabContainer}>
            <Pressable
              style={[styles.sealBtn, isSaving && styles.sealBtnDisabled]}
              onPress={handleSeal}
              disabled={isSaving}
            >
              <LinearGradient
                colors={['rgba(217, 191, 140, 0.25)', 'rgba(217, 191, 140, 0.05)']}
                style={StyleSheet.absoluteFill}
              />
              <MetallicText style={styles.sealBtnText} color="#D9BF8C">{isSaving ? 'SEALING...' : 'SEAL RECORD'}</MetallicText>
            </Pressable>
          </Animated.View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  closeBtn: { padding: 4 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },

  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '300',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 32,
  },

  // Mood Selector
  moodContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  moodBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  moodLabel: { fontSize: 10, color: PALETTE.textMuted, marginTop: 8, letterSpacing: 0.5 },

  // Archetype Prompt Card
  promptWrapper: { marginBottom: 24 },
  promptCard: { borderRadius: 20, padding: 20, borderWidth: 1, overflow: 'hidden' },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  promptContext: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  promptQuestion: {
    fontSize: 18,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    lineHeight: 26,
    marginBottom: 16,
  },
  promptFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  promptFooterText: { fontSize: 11, color: PALETTE.textMuted, fontStyle: 'italic' },

  // Input Area
  inputSection: { flex: 1, minHeight: 250 },
  inputGlass: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  textInput: {
    flex: 1,
    padding: 20,
    color: PALETTE.textMain,
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    lineHeight: 26,
  },

  // FAB
  fabContainer: { position: 'absolute', bottom: 32, left: 24, right: 24 },
  sealBtn: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(217, 191, 140, 0.4)',
  },
  sealBtnDisabled: { opacity: 0.5 },
  sealBtnText: {
    color: '#D9BF8C',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
