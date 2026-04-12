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

import { type AppTheme } from '../constants/theme';
import SkiaMetallicPill from './ui/SkiaMetallicPill';
import { VelvetGlassSurface } from './ui/VelvetGlassSurface';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

interface BackupPassphraseModalProps {
  visible: boolean;
  mode: 'backup' | 'restore';
  onCancel: () => void;
  onConfirm: (passphrase: string) => void | Promise<void>;
}

// ── Cinematic Palette ──
const PALETTE_DARK = {
  gold: '#D4AF37',
  silverBlue: '#A2C2E1',
  copper: '#CD7F5D',
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};
const PALETTE_LIGHT = {
  gold: '#D4AF37',
  silverBlue: '#D4AF37',
  copper: '#8C4A42',
  textMain: '#1A1815',
  glassBorder: 'rgba(0,0,0,0.04)',
  glassHighlight: 'rgba(255,255,255,0.6)',
};

export default function BackupPassphraseModal({
  visible,
  mode,
  onCancel,
  onConfirm,
}: BackupPassphraseModalProps) {
  const theme = useAppTheme();
  const PALETTE = theme.isDark ? PALETTE_DARK : PALETTE_LIGHT;
  const styles = useThemedStyles(createStyles);
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
    // Backup requires 12+ chars; restore accepts 8+ for backward compatibility
    const minLength = mode === 'backup' ? 12 : 8;
    const isTooShort = trimmed.length > 0 && trimmed.length < minLength;
    const mismatch = needsConfirm && confirm.length > 0 && trimmed !== confirm;
    const canSubmit = trimmed.length >= minLength && (!needsConfirm || (trimmed === confirm)) && !submitting;
    return { trimmed, isTooShort, mismatch, canSubmit };
  }, [passphrase, confirm, needsConfirm, submitting, mode]);

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
                <Ionicons name="close-outline" size={24} color={theme.textPrimary} />
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
                <VelvetGlassSurface
                  style={styles.contentSurface}
                  intensity={42}
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
                      placeholder={mode === 'backup' ? 'At least 12 characters' : 'Enter passphrase'}
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
                      <MetallicText color={PALETTE.copper} style={styles.warningText}>
                        Required: {mode === 'backup' ? '12' : '8'} characters minimum
                      </MetallicText>
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
                </VelvetGlassSurface>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)',
  },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },
  contentSurface: {
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  description: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.isDark ? PALETTE_DARK.gold : PALETTE_LIGHT.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
    paddingLeft: 4,
  },
  input: {
    backgroundColor: theme.inputBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: theme.textPrimary,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'rgba(205, 127, 93, 0.4)',
  },
  warningText: {
    fontSize: 12,
    color: theme.isDark ? PALETTE_DARK.copper : PALETTE_LIGHT.copper,
    marginTop: 8,
    paddingLeft: 4,
    fontWeight: '600',
  },
  ctaButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 12,
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.25)',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.isDark ? '#020817' : '#1A1815',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 32,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.14)',
  },
  helperText: {
    flex: 1,
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 19,
  },
});
