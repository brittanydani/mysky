import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Keyboard, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { MetallicText } from '../components/ui/MetallicText';
import { localDb } from '../services/storage/localDb';
import { generateId } from '../services/storage/models';
import * as Haptics from 'expo-haptics';

export default function SanctuaryWorkspace() {
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
        date: now.split('T')[0],
        mood: 'calm',
        moonPhase: 'waning',
        content: entryText.trim(),
        title: 'Sanctuary',
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      });
    } catch (e) {
      console.error('Failed to seal sanctuary entry:', e);
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Deep, calming background */}
      <LinearGradient colors={['rgba(85, 65, 115, 0.08)', 'transparent']} style={styles.ambientTop} />

      {/* Header controls fade out when typing for focus */}
      <View style={styles.header}>
        <Pressable onPress={() => { Haptics.selectionAsync(); router.replace('/(tabs)/blueprint'); }} style={styles.iconButton}>
          <Text style={styles.iconText}>×</Text>
        </Pressable>
        <Pressable onPress={handleSeal} style={[styles.iconButton, { marginRight: 8 }]}>
          <MetallicText style={styles.sealIconText} color="#C5B5A1">⚲</MetallicText>
        </Pressable>
      </View>
      <View style={[styles.titleArea, isKeyboardVisible && { opacity: 0.3 }]}>
        <Text style={styles.headerTitle}>Sanctuary</Text>
      </View>

      <KeyboardAvoidingView style={styles.editorContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TextInput
          style={styles.textInput}
          placeholder="What is present for you right now?"
          placeholderTextColor="rgba(255,255,255,0.2)"
          multiline
          autoFocus
          value={entryText}
          onChangeText={setEntryText}
          selectionColor="#C5B5A1"
          textAlignVertical="top"
        />

        {/* Footer Toolkit */}
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
            <MetallicText style={styles.aiPromptIcon} color="#C5B5A1">✧</MetallicText>
            <MetallicText style={styles.aiPromptText} color="#C5B5A1">Prompt Me</MetallicText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  ambientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea: { paddingHorizontal: 24, paddingBottom: 16 },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 22 },
  iconText: { color: '#FFF', fontSize: 24, lineHeight: 28 },
  sealIconText: { color: '#C5B5A1', fontSize: 20, transform: [{ rotate: '45deg' }] },
  headerTitle: { fontSize: 34, letterSpacing: -0.5, color: '#F5F5F7',  fontWeight: '800', marginBottom: 8 },

  editorContainer: { flex: 1, paddingHorizontal: 24 },
  textInput: { flex: 1, fontSize: 18, color: '#FFF',  lineHeight: 28, paddingTop: 20 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordCount: { color: 'rgba(255,255,255,0.3)', fontSize: 12,  fontStyle: 'italic' },
  autoSaveText: { color: '#8CBEAA', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },

  aiPromptButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(217, 191, 140, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  aiPromptIcon: { color: '#C5B5A1', fontSize: 14, marginRight: 6 },
  aiPromptText: { color: '#C5B5A1', fontSize: 12, fontWeight: '600' }
});
