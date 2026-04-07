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
import {
  completePasswordRecovery,
  requestPasswordRecoveryCode,
} from '../services/auth/passwordRecovery';

interface Props {
  visible: boolean;
}

export default function AuthRequiredModal({ visible }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryCodeSent, setRecoveryCodeSent] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-up');

  const resetRecoveryState = () => {
    setRecoveryOpen(false);
    setRecoveryCodeSent(false);
    setRecoveryCode('');
    setRecoveryPassword('');
    setRecoveryConfirmPassword('');
    setShowRecoveryPassword(false);
  };

  const openRecoveryFlow = () => {
    setRecoveryEmail(email.trim());
    setRecoveryCode('');
    setRecoveryPassword('');
    setRecoveryConfirmPassword('');
    setShowRecoveryPassword(false);
    setRecoveryCodeSent(false);
    setRecoveryOpen(true);
  };

  const handleSendRecoveryCode = async () => {
    const trimmedEmail = recoveryEmail.trim();

    if (!trimmedEmail) {
      Alert.alert('Email required', 'Enter your email address to receive a recovery code.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordRecoveryCode(trimmedEmail);
      setRecoveryCodeSent(true);
      Alert.alert(
        'Check your email',
        'If an account exists for this email, we sent a 6-digit recovery code.',
      );
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Password recovery is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRecovery = async () => {
    const trimmedEmail = recoveryEmail.trim();

    if (!trimmedEmail) {
      Alert.alert('Email required', 'Enter your email address to reset your password.');
      return;
    }
    if (!recoveryCode.trim()) {
      Alert.alert('Code required', 'Enter the 6-digit recovery code from your email.');
      return;
    }
    if (recoveryPassword.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }
    if (recoveryPassword !== recoveryConfirmPassword) {
      Alert.alert('Passwords do not match', 'Re-enter your new password so both fields match.');
      return;
    }

    setLoading(true);
    try {
      await completePasswordRecovery({
        email: trimmedEmail,
        code: recoveryCode,
        newPassword: recoveryPassword,
      });
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: recoveryPassword,
      });
      if (error) throw error;

      setEmail(trimmedEmail);
      setPassword(recoveryPassword);
      resetRecoveryState();
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not reset password right now.');
    } finally {
      setLoading(false);
    }
  };

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
                {recoveryOpen ? 'Reset your password' : mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
              </Text>
              <Text style={styles.subtitle}>
                {recoveryOpen
                  ? recoveryCodeSent
                    ? 'Enter the code from your email and choose a new password.'
                    : 'We will email you a one-time recovery code.'
                  : 'Your account keeps your reflections\nsafe and synced across devices.'}
              </Text>
            </View>

            <View style={styles.form}>
              {recoveryOpen ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={recoveryEmail}
                    onChangeText={setRecoveryEmail}
                    accessibilityLabel="Recovery email address"
                  />
                  {recoveryCodeSent && (
                    <>
                      <TextInput
                        style={styles.input}
                        placeholder="6-digit code"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="number-pad"
                        value={recoveryCode}
                        onChangeText={setRecoveryCode}
                        accessibilityLabel="Recovery code"
                        maxLength={6}
                      />
                      <View style={styles.passwordRow}>
                        <TextInput
                          style={[styles.input, styles.passwordInput]}
                          placeholder="New password"
                          placeholderTextColor={theme.textMuted}
                          secureTextEntry={!showRecoveryPassword}
                          value={recoveryPassword}
                          onChangeText={setRecoveryPassword}
                          accessibilityLabel="New password"
                        />
                        <Pressable
                          onPress={() => setShowRecoveryPassword((current) => !current)}
                          accessibilityRole="button"
                          accessibilityLabel={showRecoveryPassword ? 'Hide new password' : 'Show new password'}
                          style={styles.eyeButton}
                        >
                          <Ionicons
                            name={showRecoveryPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={theme.textMuted}
                          />
                        </Pressable>
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm new password"
                        placeholderTextColor={theme.textMuted}
                        secureTextEntry={!showRecoveryPassword}
                        value={recoveryConfirmPassword}
                        onChangeText={setRecoveryConfirmPassword}
                        accessibilityLabel="Confirm new password"
                        returnKeyType="done"
                        onSubmitEditing={handleCompleteRecovery}
                      />
                    </>
                  )}

                  <Pressable
                    onPress={recoveryCodeSent ? handleCompleteRecovery : handleSendRecoveryCode}
                    disabled={loading}
                    style={styles.btnWrap}
                    accessibilityRole="button"
                    accessibilityLabel={recoveryCodeSent ? 'Reset Password' : 'Email Me a Code'}
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
                          {recoveryCodeSent ? 'Reset Password' : 'Email Me a Code'}
                        </Text>
                      )}
                    </LinearGradient>
                  </Pressable>

                  {recoveryCodeSent && (
                    <Pressable
                      onPress={handleSendRecoveryCode}
                      accessibilityRole="button"
                      accessibilityLabel="Resend code"
                      style={styles.inlineLinkButton}
                    >
                      <Text style={styles.forgotPasswordText}>Resend code</Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <>
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
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Password"
                      placeholderTextColor={theme.textMuted}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      accessibilityLabel="Password"
                      returnKeyType="done"
                      onSubmitEditing={handleAuth}
                    />
                    <Pressable
                      onPress={() => setShowPassword((current) => !current)}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={theme.textMuted}
                      />
                    </Pressable>
                  </View>

                  {mode === 'sign-in' && (
                    <Pressable
                      onPress={openRecoveryFlow}
                      accessibilityRole="button"
                      accessibilityLabel="Forgot password"
                      style={styles.forgotPasswordButton}
                    >
                      <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </Pressable>
                  )}

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
                </>
              )}
            </View>

            {recoveryOpen ? (
              <Pressable
                style={styles.toggleRow}
                onPress={resetRecoveryState}
                accessibilityRole="button"
                accessibilityLabel="Back to sign in"
              >
                <Text style={styles.toggleLink}>Back to sign in</Text>
              </Pressable>
            ) : (
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
            )}
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundTertiary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  eyeButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -theme.spacing.xs,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  inlineLinkButton: {
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
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
