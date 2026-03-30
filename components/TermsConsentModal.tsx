// File: components/TermsConsentModal.tsx

import React, { useCallback } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';
import { BlurView } from 'expo-blur';

import { LEGAL_URL } from '../constants/config';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';

// ── Desert Titanium & Velvet Tech Palette ──
const PREMIUM = {
  bgOled: '#000000',
  titanium: '#C5B5A1', // Sophisticated, high-tech desaturated gold
  glassBorder: 'rgba(197, 181, 161, 0.3)', // Crisp inner glass edge
  glassFill: 'rgba(15, 15, 15, 0.4)', // Deep frosted glass
  textMain: '#F5F5F7',
  textMuted: '#86868B',
};

const DISPLAY = Platform.select({ ios: 'SFProDisplay-Regular', android: 'sans-serif', default: 'System' });
const DISPLAY_SEMIBOLD = Platform.select({ ios: 'SFProDisplay-Semibold', android: 'sans-serif-medium', default: 'System' });
const DISPLAY_BOLD = Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif-bold', default: 'System' });

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
    title: 'Terms of Use (EULA)',
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
      // Terms and Privacy open the hosted page; FAQ navigates in-app
      if (route === '/terms' || route === '/privacy') {
        Linking.openURL(LEGAL_URL).catch(() => {
          try { router.navigate(route); } catch {}
        });
      } else {
        try {
          router.navigate(route);
        } catch {
          Alert.alert('Unable to open', 'Please try again.');
        }
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
        {/* Layer 1: Deep Space Background with Nebula Blur */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: PREMIUM.bgOled }]}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        </View>
        
        {/* Layer 2: Stars on top so they're not erased by the blur */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <SkiaDynamicCosmos fill="transparent" />
        </View>

        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="scan-outline" size={18} color={PREMIUM.titanium} />
            </View>
            <Text style={styles.appName}>MySky Security</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(700)} style={styles.cardWrapper}>
            <BlurView intensity={30} tint="dark" style={styles.card}>
              <ScrollView contentContainerStyle={styles.cardContent} bounces={false} showsVerticalScrollIndicator={false}>
                
                {/* Editorial Left-Aligned Headers */}
                <View style={styles.textHeaderGroup}>
                  <Text style={styles.title}>Data & Privacy</Text>
                  <Text style={styles.body}>
                    To provide highly personalized insights and pattern recognition, we require your consent to our data and privacy framework. All active journaling remains encrypted on-device.
                  </Text>
                </View>

                <View style={styles.linksBlock}>
                  {links.map((l) => (
                    <Pressable
                      key={l.title}
                      onPress={() => openRoute(l.route)}
                      accessibilityRole="link"
                      style={({ pressed }) => [styles.linkRowWrapper, pressed && styles.pressed]}
                    >
                      <View style={styles.linkRow}>
                        <View style={styles.linkLeft}>
                          <View style={styles.linkIcon}>
                            <Ionicons name={l.icon} size={18} color={PREMIUM.titanium} />
                          </View>
                          <View style={styles.linkTextWrap}>
                            <Text style={styles.linkTitle}>{l.title}</Text>
                            <Text style={styles.linkSubtitle}>{l.subtitle}</Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward-outline" size={18} color={PREMIUM.textMuted} />
                      </View>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.buttonRow}>
                  <Pressable
                    style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                    onPress={handleDecline}
                  >
                    <Text style={styles.secondaryText}>Decline</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                    onPress={handleAccept}
                  >
                    <Text style={styles.primaryText}>I Agree</Text>
                    <Ionicons name="shield-checkmark-outline" size={18} color={PREMIUM.titanium} style={{ marginLeft: 8 }} />
                  </Pressable>
                </View>

                <Text style={styles.footnote}>Permissions can be managed anytime in Settings.</Text>
              </ScrollView>
            </BlurView>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PREMIUM.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
    marginRight: 12,
  },
  appName: { 
    color: PREMIUM.textMain, 
    fontSize: 16, 
    fontWeight: '700', 
    letterSpacing: 0.5,
    fontFamily: DISPLAY_BOLD,
  },

  cardWrapper: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PREMIUM.glassBorder,
    shadowColor: PREMIUM.titanium,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  card: {
    width: '100%',
    backgroundColor: PREMIUM.glassFill,
  },
  cardContent: { padding: 32, alignItems: 'flex-start' },

  textHeaderGroup: {
    width: '100%',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: PREMIUM.textMain,
    textAlign: 'left',
    marginBottom: 12,
    fontFamily: DISPLAY_BOLD,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: PREMIUM.textMuted,
    textAlign: 'left',
    fontFamily: DISPLAY,
  },

  linksBlock: { width: '100%', gap: 12, marginBottom: 32 },
  linkRowWrapper: {
    width: '100%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
    backgroundColor: PREMIUM.glassFill,
    overflow: 'hidden',
  },
  linkRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  linkTextWrap: { flex: 1 },
  linkTitle: { 
    color: PREMIUM.textMain, 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 2,
    fontFamily: DISPLAY_SEMIBOLD,
  },
  linkSubtitle: { 
    color: PREMIUM.textMuted, 
    fontSize: 14,
    fontFamily: DISPLAY,
  },

  buttonRow: { width: '100%', flexDirection: 'row', gap: 12, marginBottom: 20 },
  secondaryBtn: {
    flex: 1,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
    backgroundColor: PREMIUM.glassFill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { 
    color: PREMIUM.textMain, 
    fontSize: 16, 
    fontWeight: '600',
    fontFamily: DISPLAY_SEMIBOLD,
  },

  // ── Edge-Lit Titanium Primary Button ──
  primaryBtn: { 
    flex: 1.5, 
    flexDirection: 'row',
    borderRadius: 24, 
    backgroundColor: PREMIUM.glassFill,
    borderWidth: 1,
    borderColor: PREMIUM.titanium,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PREMIUM.titanium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  primaryText: {
    color: PREMIUM.titanium,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: DISPLAY_BOLD,
  },

  footnote: { 
    color: PREMIUM.textMuted, 
    fontSize: 13, 
    textAlign: 'center', 
    width: '100%',
    fontFamily: DISPLAY,
  },

  pressed: { 
    opacity: 0.8, 
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(197, 181, 161, 0.1)', 
  },
});
