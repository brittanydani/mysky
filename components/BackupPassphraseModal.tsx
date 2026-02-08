import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../constants/theme';

interface BackupPassphraseModalProps {
  visible: boolean;
  mode: 'backup' | 'restore';
  onCancel: () => void;
  onConfirm: (passphrase: string) => void | Promise<void>;
}

export default function BackupPassphraseModal({
  visible,
  mode,
  onCancel,
  onConfirm,
}: BackupPassphraseModalProps) {
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setPassphrase('');
      setConfirm('');
      setSubmitting(false);
    }
  }, [visible]);

  const needsConfirm = mode === 'backup';

  const validation = useMemo(() => {
    const trimmed = passphrase.trim();
    const isTooShort = trimmed.length < 8;
    const mismatch = needsConfirm && trimmed !== confirm;
    const canSubmit = trimmed.length > 0 && !isTooShort && !mismatch && !submitting;
    return { trimmed, isTooShort, mismatch, canSubmit };
  }, [passphrase, confirm, needsConfirm, submitting]);

  const handleSubmit = async () => {
    if (!validation.canSubmit) return;
    try {
      setSubmitting(true);
      await onConfirm(validation.trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
            <Pressable
              style={styles.iconButton}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </Pressable>

            <Text style={styles.title} numberOfLines={1}>
              {mode === 'backup' ? 'Create Backup Passphrase' : 'Enter Backup Passphrase'}
            </Text>

            <View style={styles.iconButton} />
          </Animated.View>

          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          >
            <View style={styles.content}>
              <Text style={styles.description}>
                {mode === 'backup'
                  ? 'This passphrase encrypts your backup. Keep it safe — it is required to restore on another device.'
                  : 'Enter the passphrase used to encrypt this backup.'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Passphrase</Text>
                <TextInput
                  style={styles.input}
                  value={passphrase}
                  onChangeText={setPassphrase}
                  placeholder="At least 8 characters"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType={needsConfirm ? 'next' : 'done'}
                  onSubmitEditing={() => {
                    if (!needsConfirm) handleSubmit();
                  }}
                />
              </View>

              {needsConfirm && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Passphrase</Text>
                  <TextInput
                    style={styles.input}
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="Re-enter passphrase"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </View>
              )}

              {validation.isTooShort && (
                <Text style={styles.warningText}>Passphrase must be at least 8 characters.</Text>
              )}
              {validation.mismatch && <Text style={styles.warningText}>Passphrases do not match.</Text>}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  !validation.canSubmit && styles.primaryButtonDisabled,
                  pressed && validation.canSubmit && styles.primaryButtonPressed,
                ]}
                disabled={!validation.canSubmit}
                onPress={handleSubmit}
                accessibilityRole="button"
                accessibilityLabel={mode === 'backup' ? 'Create Backup' : 'Restore Backup'}
              >
                <Text style={styles.primaryButtonText}>
                  {submitting
                    ? mode === 'backup'
                      ? 'Creating…'
                      : 'Restoring…'
                    : mode === 'backup'
                      ? 'Create Backup'
                      : 'Restore Backup'}
                </Text>
              </Pressable>

              {mode === 'backup' && (
                <Text style={styles.helperText}>
                  Tip: Use a phrase you can remember (e.g., 3–5 random words). Don’t reuse a password you use elsewhere.
                </Text>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  description: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    color: theme.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.backgroundTertiary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.textPrimary,
    fontSize: 16,
  },
  warningText: {
    fontSize: 12,
    color: theme.warning,
    marginBottom: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1421',
  },
  helperText: {
    marginTop: theme.spacing.lg,
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 18,
  },
});
