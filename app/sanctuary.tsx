import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform, Keyboard, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardStickyView } from '../components/keyboard/KeyboardControllerCompat';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { MetallicText } from '../components/ui/MetallicText';
import { localDb } from '../services/storage/localDb';
import { generateId } from '../services/storage/models';
import * as Haptics from 'expo-haptics';
import { logger } from '../utils/logger';
import { toLocalDateString } from '../utils/dateUtils';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

export default function SanctuaryWorkspace() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const [entryText, setEntryText] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Keyboard listeners for clean UI transitions
  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Subtle auto-save animation trigger
  useEffect(() => {
    if (entryText.length > 10) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 2000, delay: 1000, useNativeDriver: true })
      ]).start();
    }
  }, [entryText, fadeAnim]);

  const wordCount = entryText.trim().split(/\s+/).filter(w => w.length > 0).length;

  const handleSeal = async () => {
    if (!entryText.trim()) {
      Keyboard.dismiss();
      router.back();
      return;
    }
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const now = new Date().toISOString();
      await localDb.saveJournalEntry({
        id: generateId(),
        date: toLocalDateString(),
        mood: 'calm',
        moonPhase: 'waning',
        content: entryText.trim(),
        title: 'Sanctuary',
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      });
    } catch (e) {
      logger.error('Failed to seal sanctuary entry:', e);
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Header controls fade out when typing for focus */}
      <View style={styles.header}>
        <Pressable onPress={() => { Haptics.selectionAsync(); router.replace('/(tabs)/identity'); }} style={styles.iconButton} hitSlop={10}>
          <Text style={styles.iconText}>×</Text>
        </Pressable>
        <Pressable onPress={handleSeal} style={[styles.iconButton, { marginRight: 8 }]} hitSlop={10}>
          <MetallicText style={styles.sealIconText} color="#D9BF8C">⚲</MetallicText>
        </Pressable>
      </View>
      <View style={[styles.titleArea, isKeyboardVisible && { opacity: 0.3 }]}>
        <Text style={styles.headerTitle}>Sanctuary</Text>
      </View>

      </SafeAreaView>
      <View style={styles.editorContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="What is present for you right now?"
          placeholderTextColor={theme.textMuted}
          multiline
          autoFocus
          value={entryText}
          onChangeText={setEntryText}
          selectionColor="#D9BF8C"
          textAlignVertical="top"
        />

        {/* Footer Toolkit */}
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              {wordCount > 0 && (
                <Text style={styles.wordCount}>{wordCount} words</Text>
              )}
              <Animated.View style={{ opacity: fadeAnim }}>
                <MetallicText style={styles.autoSaveText} color="#8CBEAA">
                  Encrypted locally...
                </MetallicText>
              </Animated.View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.aiPromptButton, pressed && { opacity: 0.7 }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <MetallicText style={styles.aiPromptIcon} color="#D9BF8C">✧</MetallicText>
              <MetallicText style={styles.aiPromptText} color="#D9BF8C">Prompt Me</MetallicText>
            </Pressable>
          </View>
        </KeyboardStickyView>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 0 },
  ambientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea: { paddingHorizontal: 24, paddingBottom: 16 },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : theme.pillSurface, borderRadius: 22 },
  iconText: { color: theme.textPrimary, fontSize: 24, lineHeight: 28 },
  sealIconText: { color: theme.textGold, fontSize: 20, transform: [{ rotate: '45deg' }] },
  headerTitle: { fontSize: 32, color: theme.textPrimary, fontWeight: '800', letterSpacing: -1, marginBottom: 4 },

  editorContainer: { flex: 1, paddingHorizontal: 24 },
  textInput: { flex: 1, fontSize: 18, color: theme.textPrimary, lineHeight: 28, paddingTop: 20 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: theme.cardBorder },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordCount: { color: theme.textMuted, fontSize: 12 },
  autoSaveText: { color: '#8CBEAA', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },

  aiPromptButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  aiPromptIcon: { color: theme.textGold, fontSize: 14, marginRight: 6 },
  aiPromptText: { color: theme.textGold, fontSize: 12, fontWeight: '600' }
});
