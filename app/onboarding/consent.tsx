// File: app/onboarding/consent.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter, Href } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { type AppTheme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaMetallicPill from '../../components/ui/SkiaMetallicPill';
import { PrivacyComplianceManager } from '../../services/privacy/privacyComplianceManager';
import { logger } from '../../utils/logger';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

const TERMS_VERSION = '2026-03-30';

export default function OnboardingConsentScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();

  const mode = params?.mode === 'restore' ? 'restore' : 'normal';

  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const nextRoute = useMemo(() => {
    return mode === 'restore' ? ('/onboarding/restore' as Href) : ('/onboarding/birth' as Href);
  }, [mode]);

  const openTerms = useCallback(() => router.navigate('/terms' as Href), [router]);
  const openPrivacy = useCallback(() => router.navigate('/privacy' as Href), [router]);
  const openFaq = useCallback(() => router.navigate('/faq' as Href), [router]);

  const accept = useCallback(async () => {
    if (!checked || saving) return;
    setSaving(true);
    Haptics.selectionAsync().catch(() => {});
    try {
      await SecureStore.setItemAsync('terms_consent', 'true');

      // Record consent through the privacy compliance system so SecureStore,
      // the lawful-basis audit trail, and consent history all stay in sync.
      try {
        const compliance = new PrivacyComplianceManager();
        await compliance.recordConsent({
          granted: true,
          policyVersion: TERMS_VERSION,
          timestamp: new Date().toISOString(),
          method: 'explicit',
          lawfulBasis: 'consent',
          purpose: 'astrology_personalization',
        });
      } catch (e) {
        logger.error('[Consent] Failed to record consent in compliance system:', e);
      }

      router.replace(nextRoute);
    } finally {
      setSaving(false);
    }
  }, [checked, nextRoute, router, saving]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
          <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
        </View>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.headerBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : undefined)}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back-outline" size={24} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Before you continue</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Glassmorphic Card */}
          <LinearGradient 
            colors={[theme.cardGradientStart, theme.cardGradientEnd]} 
            style={[styles.card, styles.velvetBorder]}
          >
            <Text style={styles.title}>Accept Terms & Privacy</Text>
            <Text style={styles.body}>
              To use MySky, please review and accept the Terms of Use and Privacy Policy.
              Your data stays on your device by default, with encryption at rest.
            </Text>

            <View style={styles.linkRow}>
              <Pressable style={styles.linkBtn} onPress={openTerms}>
                <Ionicons name="ribbon-outline" size={16} color={theme.textGold} />
                <Text style={styles.linkText}>View Terms</Text>
              </Pressable>

              <Pressable style={styles.linkBtn} onPress={openPrivacy}>
                <Ionicons name="shield-half-outline" size={16} color={theme.textGold} />
                <Text style={styles.linkText}>View Privacy</Text>
              </Pressable>

              <Pressable style={styles.linkBtn} onPress={openFaq}>
                <Ionicons name="diamond-outline" size={16} color={theme.textGold} />
                <Text style={styles.linkText}>View FAQ</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.checkRow}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setChecked(v => !v); }}
              accessibilityRole="checkbox"
              accessibilityLabel="I agree to the Terms of Use and Privacy Policy"
              accessibilityState={{ checked }}
            >
              <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                {checked && <Ionicons name="checkmark-outline" size={16} color={theme.textInk} />}
              </View>
              <Text style={styles.checkText}>
                I agree to the Terms of Use and Privacy Policy.
              </Text>
            </Pressable>

            <SkiaMetallicPill
              label={saving ? 'Saving...' : 'Accept & Continue'}
              onPress={accept}
              disabled={!checked || saving}
              icon={!saving ? <Ionicons name="arrow-forward-outline" size={18} color={theme.textInk} /> : undefined}
            />

            <Text style={styles.note}>
              Last updated: March 30, 2026
            </Text>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingHorizontal: 24, paddingBottom: 8 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -1,
  },
  
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface,
    padding: 28,
  },
  
  title: { 
    fontSize: 24, 
    color: theme.textPrimary, 
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  body: { 
    fontSize: 15, 
    color: theme.textSecondary, 
    lineHeight: 24, 
    marginBottom: 24 
  },
  
  linkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  linkText: { color: theme.textPrimary, fontSize: 13, fontWeight: '600' },
  
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, paddingRight: 10 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(212, 175, 55, 0.22)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxOn: { backgroundColor: theme.textGold, borderColor: theme.textGold },
  checkText: { flex: 1, color: theme.textPrimary, fontSize: 15, lineHeight: 22 },
  
  note: { marginTop: 20, textAlign: 'center', color: theme.textMuted, fontSize: 12,  },
});
