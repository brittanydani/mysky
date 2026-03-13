import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';

export default function OnboardingIndex() {
  const router = useRouter();
  const [name, setName] = useState('');

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem('msky_user_name', name.trim());
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
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            !name && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          disabled={!name}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050507' },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 36, fontWeight: '300', color: '#FFF', marginBottom: 40, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), letterSpacing: 1 },
  input: { fontSize: 32, color: '#D9BF8C', borderBottomWidth: 1, borderColor: 'rgba(217,191,140,0.3)', paddingBottom: 16, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) },
  footer: { paddingHorizontal: 32, paddingBottom: 60 },
  button: { backgroundColor: '#D9BF8C', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#D9BF8C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  buttonDisabled: { opacity: 0.3, shadowOpacity: 0 },
  buttonPressed: { transform: [{ scale: 0.98 }] },
  buttonText: { color: '#050507', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});

