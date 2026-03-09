// File: app/onboarding/consent.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter, Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaMetallicPill from '../../components/ui/SkiaMetallicPill';
import { PrivacyComplianceManager } from '../../services/privacy/privacyComplianceManager';
import { logger } from '../../utils/logger';

const TERMS_KEY = 'msky_termsAccepted_v1';
const TERMS_VERSION = '2026-03-03';

// ── Cinematic Palette ──
const PALETTE = {
  gold: theme.textGold,
  textMain: theme.textPrimary,
  glassBorder: theme.cardBorder,
  glassHighlight: theme.glass.highlight,
};

export default function OnboardingConsentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();

  const mode = params?.mode === 'restore' ? 'restore' : 'normal';

  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const nextRoute = useMemo(() => {
    return mode === 'restore' ? ('/onboarding/restore' as Href) : ('/onboarding/birth' as Href);
  }, [mode]);

  const openTerms = useCallback(() => router.push('/terms' as Href), [router]);
  const openPrivacy = useCallback(() => router.push('/privacy' as Href), [router]);
  const openFaq = useCallback(() => router.push('/faq' as Href), [router]);

  const accept = useCallback(async () => {
    if (!checked || saving) return;
    setSaving(true);
    Haptics.selectionAsync().catch(() => {});
    try {
      await AsyncStorage.setItem(TERMS_KEY, JSON.stringify({ accepted: true, version: TERMS_VERSION, at: new Date().toISOString() }));

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
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.headerBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/onboarding' as Href))}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Your space. Your data.</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Data Sovereignty Pledge ── */}
          <LinearGradient 
            colors={[theme.cardGradientStart, theme.cardGradientEnd]} 
            style={styles.card}
          >
            <Text style={styles.title}>Data Sovereignty</Text>
            <Text style={styles.body}>
              MySky is a private mirror — built to reflect your inner world, for your eyes only.
            </Text>

            <View style={styles.pledgeList}>
              <View style={styles.pledgeRow}>
                <View style={styles.pledgeIcon}>
                  <Ionicons name="lock-closed-outline" size={18} color="#6EBF8B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pledgeTitle}>Locally Encrypted</Text>
                  <Text style={styles.pledgeBody}>Your journal entries and check-ins never leave your device.</Text>
                </View>
              </View>

              <View style={styles.pledgeRow}>
                <View style={styles.pledgeIcon}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#8BC4E8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pledgeTitle}>Zero Tracking</Text>
                  <Text style={styles.pledgeBody}>No advertising IDs, no third-party profiling, no data sales.</Text>
                </View>
              </View>

              <View style={styles.pledgeRow}>
                <View style={styles.pledgeIcon}>
                  <Ionicons name="eye-off-outline" size={18} color="#9D76C1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pledgeTitle}>A Private Mirror</Text>
                  <Text style={styles.pledgeBody}>This app is a tool for self-reflection — no social features, no sharing.</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* ── Legal Agreement ── */}
          <LinearGradient 
            colors={[theme.cardGradientStart, theme.cardGradientEnd]} 
            style={[styles.card, { marginTop: 20 }]}
          >
            <Text style={styles.legalTitle}>Terms & Privacy</Text>
            <Text style={styles.body}>
              By creating your internal weather space, you agree to our Terms of Service and Privacy Policy.
            </Text>

            <View style={styles.linkRow}>
              <Pressable style={styles.linkBtn} onPress={openTerms}>
                <Ionicons name="document-text-outline" size={16} color={theme.textGold} />
                <Text style={styles.linkText}>View Terms</Text>
              </Pressable>

              <Pressable style={styles.linkBtn} onPress={openPrivacy}>
                <Ionicons name="shield-checkmark-outline" size={16} color={theme.textGold} />
                <Text style={styles.linkText}>View Privacy</Text>
              </Pressable>

              <Pressable style={styles.linkBtn} onPress={openFaq}>
                <Ionicons name="help-circle-outline" size={16} color={theme.textGold} />
                <Text style={styles.linkText}>View FAQ</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.checkRow}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setChecked(v => !v); }}
              accessibilityRole="checkbox"
              accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
              accessibilityState={{ checked }}
            >
              <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                {checked && <Ionicons name="checkmark" size={16} color="#0B1220" />}
              </View>
              <Text style={styles.checkText}>
                I agree to the Terms of Service and Privacy Policy.
              </Text>
            </Pressable>

            <SkiaMetallicPill
              label={saving ? 'Saving...' : 'Accept & Continue'}
              onPress={accept}
              disabled={!checked || saving}
              icon={!saving ? <Ionicons name="arrow-forward" size={18} color="#020817" /> : undefined}
            />

            <Text style={styles.note}>
              Last updated: March 3, 2026
            </Text>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: theme.textPrimary, 
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) 
  },
  
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
    padding: 24,
  },
  
  title: { 
    fontSize: 24, 
    color: theme.textPrimary, 
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), 
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
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxOn: { backgroundColor: theme.textGold, borderColor: theme.textGold },
  checkText: { flex: 1, color: theme.textPrimary, fontSize: 15, lineHeight: 22 },
  
  note: { marginTop: 20, textAlign: 'center', color: theme.textMuted, fontSize: 12, fontStyle: 'italic' },

  // Data Sovereignty pledge
  pledgeList: { gap: 20, marginTop: 4 },
  pledgeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  pledgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  pledgeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  pledgeBody: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  legalTitle: {
    fontSize: 18,
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 10,
    letterSpacing: 0.3,
  },
});
