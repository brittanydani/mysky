/**
 * AuthRequiredModal
 *
 * Full-screen modal gate rendered when the user has completed onboarding
 * but does not yet have a Supabase session. Cannot be dismissed — sign-in
 * or sign-up is required to proceed. On success, AuthContext fires
 * SIGNED_IN → session becomes truthy → modal hides automatically.
 */

import React, { useState } from 'react';
import {
  Modal,
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
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../lib/supabase';
import { theme } from '../constants/theme';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';

interface Props {
  visible: boolean;
}

export default function AuthRequiredModal({ visible }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-up');

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'sign-up') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (!data.session) {
          // Email confirmation required — prompt user to check inbox
          Alert.alert(
            'Check your email',
            'We sent you a confirmation link. Tap it, then come back and sign in.',
          );
          setMode('sign-in');
        }
        // If data.session exists, AuthContext SIGNED_IN fires and modal closes automatically
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // AuthContext SIGNED_IN event fires → session updates → modal hides automatically
      }
    } catch (err: unknown) {
      // Avoid leaking Supabase error details (e.g. "Invalid login credentials"
      // vs "Email not confirmed") which would enable email enumeration.
      const message = mode === 'sign-in'
        ? 'Sign-in failed. Please check your email and password.'
        : (err instanceof Error ? err.message : 'Something went wrong');
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
          <SkiaDynamicCosmos />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inner}
          >
            <View style={styles.header}>
              <Ionicons name="sparkles-outline" size={32} color={theme.primary} />
              <Text style={styles.title}>
                {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
              </Text>
              <Text style={styles.subtitle}>
                Your account keeps your reflections{'\n'}safe and synced across devices.
              </Text>
            </View>

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
                accessibilityLabel="Email address"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                accessibilityLabel="Password"
                returnKeyType="done"
                onSubmitEditing={handleAuth}
              />

              <Pressable onPress={handleAuth} disabled={loading} style={styles.btnWrap}
                accessibilityRole="button"
                accessibilityLabel={mode === 'sign-in' ? 'Sign In' : 'Create Account'}
              >
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

            <Pressable
              style={styles.toggleRow}
              onPress={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
              accessibilityRole="button"
              accessibilityLabel={mode === 'sign-in' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            >
              <Text style={styles.toggleText}>
                {mode === 'sign-in' ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <Text style={styles.toggleLink}>
                {mode === 'sign-in' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Pressable>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </Modal>
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
    color: theme.primary,
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
