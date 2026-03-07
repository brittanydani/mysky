/**
 * Sign-In screen — minimal, on-brand.
 *
 * Supports email + password (sign up or sign in).
 * Extend later with Apple / Google / Magic Link as needed.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        Alert.alert(
          'Check your email',
          'We sent you a confirmation link. Tap it, then come back and sign in.',
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // Auth state change is picked up by AuthContext — dismiss modal
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/growth');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <SafeAreaView style={styles.container}>
      <SkiaDynamicCosmos />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        {/* Close button */}
        <Pressable style={styles.closeBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/growth')}>
          <Ionicons name="close" size={24} color={theme.textSecondary} />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="sparkles" size={32} color={theme.primary} />
          <Text style={styles.title}>
            {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
          </Text>
          <Text style={styles.subtitle}>
            Sign in to unlock AI-generated reflections{'\n'}written just for you.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable onPress={handleAuth} disabled={loading} style={styles.btnWrap}>
            <LinearGradient
              colors={[theme.primary, theme.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.btnText, { color: theme.background }]}>  
                  {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Toggle sign-in / sign-up */}
        <Pressable
          style={styles.toggleRow}
          onPress={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
        >
          <Text style={styles.toggleText}>
            {mode === 'sign-in'
              ? "Don't have an account? "
              : 'Already have an account? '}
          </Text>
          <Text style={styles.toggleLink}>
            {mode === 'sign-in' ? 'Sign Up' : 'Sign In'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.xl,
    zIndex: 10,
    padding: theme.spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: theme.primary, // Use app's gold accent color
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  form: {
    gap: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.backgroundTertiary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  btnWrap: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  btn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  toggleText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
});
