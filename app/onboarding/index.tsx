import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import SkiaMetallicPill from '../../components/ui/SkiaMetallicPill';

export default function OnboardingIndex() {
  const router = useRouter();
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Ethereal Background Glow */}
      <LinearGradient
        colors={['rgba(217,191,140,0.1)', 'transparent']}
        style={styles.glow}
      />

      <View style={styles.content}>
        <Text style={styles.title}>What should we call you?</Text>

        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="rgba(255,255,255,0.2)"
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

      <View style={styles.footer}>
        <SkiaMetallicPill
          label="Continue"
          onPress={handleContinue}
          disabled={!trimmedName}
          height={56}
          borderRadius={28}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 34, fontWeight: '800', color: '#FFF', marginBottom: 40, fontFamily: Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif-bold', default: 'System' }), letterSpacing: -0.5 },
  input: { fontSize: 32, color: '#D9BF8C', borderBottomWidth: 1, borderColor: 'rgba(217,191,140,0.3)', paddingBottom: 16, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) },
  footer: { paddingHorizontal: 32, paddingBottom: 60 },

});

