import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import SkiaMetallicPill from '../../components/ui/SkiaMetallicPill';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

export default function OnboardingIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [name, setName] = useState('');

  const trimmedName = name.trim();

  const handleContinue = async () => {
    if (!trimmedName) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await EncryptedAsyncStorage.setItem('msky_user_name', trimmedName);
    } catch {
      // Non-blocking — name can be recovered from chart data if storage fails
    }
    router.push('/onboarding/consent');
  };

  return (
    <View style={styles.container}>
      {/* Ethereal Background Glow */}
      <SkiaDynamicCosmos />
      <LinearGradient
        colors={['rgba(217,191,140,0.1)', 'transparent']}
        style={styles.glow}
      />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            <Text style={styles.title}>What should we call you?</Text>

            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={theme.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
              selectionColor="#D9BF8C"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              maxLength={60}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
            <SkiaMetallicPill
              label="Continue"
              onPress={handleContinue}
              disabled={!trimmedName}
              height={56}
              borderRadius={28}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 34, fontWeight: '800', color: theme.textPrimary, marginBottom: 40, letterSpacing: -0.5 },
  input: { fontSize: 24, color: theme.textPrimary, borderBottomWidth: 1, borderColor: 'rgba(201,174,120,0.3)', paddingBottom: 16 },
  footer: { paddingHorizontal: 24 },
});

