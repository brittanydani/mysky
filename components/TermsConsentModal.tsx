// File: components/TermsConsentModal.tsx

import React, { useCallback } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { MetallicIcon } from './ui/MetallicIcon';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';

import { theme } from '../constants/theme';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import SkiaMetallicPill from './ui/SkiaMetallicPill';

// ── Cinematic Palette ──
const PALETTE = {
  gold: theme.textGold,
  silverBlue: theme.growth,
  textMain: theme.textPrimary,
  glassBorder: theme.cardBorder,
  glassHighlight: theme.glass.highlight,
};

interface TermsConsentModalProps {
  visible: boolean;
  onConsent: (granted: boolean) => void;
}

type ConsentLink = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: Href;
};

const CONSENT_LINKS: ConsentLink[] = [
  {
    title: 'Terms of Service',
    subtitle: 'Review our service agreement',
    icon: 'document-text-outline',
    route: '/terms' as Href,
  },
  {
    title: 'Privacy Policy',
    subtitle: 'How we secure your chart data',
    icon: 'shield-checkmark-outline',
    route: '/privacy' as Href,
  },
  {
    title: 'FAQ',
    subtitle: 'Common technical questions',
    icon: 'help-circle-outline',
    route: '/faq' as Href,
  },
];

export default function TermsConsentModal({ visible, onConsent }: TermsConsentModalProps) {
  const router = useRouter();
  const links = CONSENT_LINKS;

  const handleAccept = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onConsent(true);
  }, [onConsent]);

  const handleDecline = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onConsent(false);
  }, [onConsent]);

  const openRoute = useCallback(
    (route: Href) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      try {
        router.navigate(route);
      } catch {
        Alert.alert('Unable to open', 'Please try again.');
      }
    },
    [router]
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={handleDecline}
      transparent
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[theme.backgroundSecondary, theme.background]}
          style={StyleSheet.absoluteFill}
        />
        <SkiaDynamicCosmos />

        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="sparkles-outline" size={18} color={PALETTE.gold} />
            </View>
            <Text style={styles.appName}>MySky</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(700)} style={styles.card}>
            <ScrollView contentContainerStyle={styles.cardContent} bounces={false} showsVerticalScrollIndicator={false}>
              
              <Text style={styles.title}>Before you continue</Text>
              <Text style={styles.body}>
                To provide personalized insights, we need you to review and accept our data framework.
              </Text>

              <View style={styles.linksBlock}>
                {links.map((l) => (
                  <Pressable
                    key={l.title}
                    onPress={() => openRoute(l.route)}
                    accessibilityRole="link"
                    style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
                  >
                    <View style={styles.linkLeft}>
                      <View style={styles.linkIcon}>
                        <MetallicIcon name={l.icon} size={18} color={PALETTE.silverBlue} />
                      </View>
                      <View style={styles.linkTextWrap}>
                        <Text style={styles.linkTitle}>{l.title}</Text>
                        <Text style={styles.linkSubtitle}>{l.subtitle}</Text>
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                  </Pressable>
                ))}
              </View>

              <View style={styles.buttonRow}>
                <Pressable
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                  onPress={handleDecline}
                >
                  <Text style={styles.secondaryText}>Not now</Text>
                </Pressable>

                <View style={styles.primaryBtn}>
                  <SkiaMetallicPill
                    label="I Agree"
                    onPress={handleAccept}
                    borderRadius={16}
                  />
                </View>
              </View>

              <Text style={styles.footnote}>You can view these anytime in Settings.</Text>
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  safeArea: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },

  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginRight: 12,
  },
  appName: { 
    color: PALETTE.textMain, 
    fontSize: 18, 
    fontWeight: '700', 
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },

  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    ...Platform.select({
      ios: { },
      android: { },
    }),
  },
  cardContent: { padding: 24, alignItems: 'center' },

  title: {
    fontSize: 24,
    color: PALETTE.textMain,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: 0.3,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },

  linksBlock: { width: '100%', gap: 12, marginBottom: 24 },
  linkRow: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: 'transparent',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  linkIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  linkTextWrap: { flex: 1 },
  linkTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  linkSubtitle: { color: theme.textMuted, fontSize: 13 },

  buttonRow: { width: '100%', flexDirection: 'row', gap: 14, marginTop: 8, marginBottom: 16 },
  secondaryBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },

  primaryBtn: { flex: 1.4, borderRadius: 16, overflow: 'hidden' },

  footnote: { color: theme.textMuted, fontSize: 12, textAlign: 'center', fontStyle: 'italic' },

  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
});
