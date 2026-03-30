/**
 * BackupPassphraseModal
 * * Handles passphrase creation for backups and entry for restores.
 * Obsidian glass aesthetic with high-precision validation feedback.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MetallicText } from './ui/MetallicText';
import { MetallicIcon } from './ui/MetallicIcon';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../constants/theme';
import SkiaMetallicPill from './ui/SkiaMetallicPill';

interface BackupPassphraseModalProps {
  visible: boolean;
  mode: 'backup' | 'restore';
  onCancel: () => void;
  onConfirm: (passphrase: string) => void | Promise<void>;
}

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  textMain: '#F0EAD6',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

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
    const isTooShort = trimmed.length > 0 && trimmed.length < 8;
    const mismatch = needsConfirm && confirm.length > 0 && trimmed !== confirm;
    const canSubmit = trimmed.length >= 8 && (!needsConfirm || (trimmed === confirm)) && !submitting;
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
            
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
              <Pressable style={styles.iconButton} onPress={onCancel}>
                <Ionicons name="close-outline" size={24} color={PALETTE.textMain} />
              </Pressable>
              <Text style={styles.title}>
                {mode === 'backup' ? 'Create Passphrase' : 'Unlock Backup'}
              </Text>
              <View style={styles.iconButton} />
            </Animated.View>

            <KeyboardAvoidingView
              style={styles.flex}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                <Text style={styles.description}>
                  {mode === 'backup'
                    ? 'This passphrase encrypts your data. MySky cannot recover it—store it in a secure location.'
                    : 'Enter the passphrase used to secure this backup file.'}
                </Text>

                <View style={styles.inputGroup}>
                  <MetallicText color={PALETTE.gold} style={styles.label}>Passphrase</MetallicText>
                  <TextInput
                    style={[styles.input, validation.isTooShort && styles.inputError]}
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
                  {validation.isTooShort && (
                    <MetallicText color={PALETTE.copper} style={styles.warningText}>Required: 8 characters minimum</MetallicText>
                  )}
                </View>

                {needsConfirm && (
                  <View style={styles.inputGroup}>
                    <MetallicText color={PALETTE.gold} style={styles.label}>Verify Passphrase</MetallicText>
                    <TextInput
                      style={[styles.input, validation.mismatch && styles.inputError]}
                      value={confirm}
                      onChangeText={setConfirm}
                      placeholder="Repeat passphrase"
                      placeholderTextColor={theme.textMuted}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                    {validation.mismatch && (
                      <MetallicText color={PALETTE.copper} style={styles.warningText}>Passphrases do not match</MetallicText>
                    )}
                  </View>
                )}

                <SkiaMetallicPill
                  label={submitting ? 'Processing…' : mode === 'backup' ? 'Confirm & Backup' : 'Confirm & Restore'}
                  onPress={handleSubmit}
                  disabled={!validation.canSubmit || submitting}
                />

                {mode === 'backup' && (
                  <View style={styles.securityNote}>
                    <MetallicIcon name="shield-checkmark-outline" size={16} color={PALETTE.silverBlue} />
                    <Text style={styles.helperText}>
                      We recommend using a phrase of 4+ random words. This encryption happens entirely on your device.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  description: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
    marginBottom: 32,
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
    paddingLeft: 4,
  },
  input: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: PALETTE.textMain,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'rgba(205, 127, 93, 0.4)',
  },
  warningText: {
    fontSize: 12,
    color: PALETTE.copper,
    marginTop: 8,
    paddingLeft: 4,
    fontWeight: '600',
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.25)',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#020817',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 32,
    backgroundColor: 'rgba(139, 196, 232, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 196, 232, 0.1)',
  },
  helperText: {
    flex: 1,
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 19,
  },
});
