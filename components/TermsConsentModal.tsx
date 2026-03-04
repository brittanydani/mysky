// File: components/TermsConsentModal.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';

import { theme } from '../constants/theme';
import StarField from './ui/StarField';

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
    subtitle: 'Read the terms before continuing',
    icon: 'document-text-outline',
    route: '/terms' as Href,
  },
  {
    title: 'Privacy Policy',
    subtitle: 'How we handle your data',
    icon: 'shield-checkmark-outline',
    route: '/privacy' as Href,
  },
  {
    title: 'FAQ',
    subtitle: 'Answers to common questions',
    icon: 'help-circle-outline',
    route: '/faq' as Href,
  },
];

export default function TermsConsentModal({ visible, onConsent }: TermsConsentModalProps) {
  const router = useRouter();
  const links = useMemo(() => CONSENT_LINKS, []);

  // ✅ When navigating, we temporarily hide the modal so iOS doesn't “fight” the stack.
  const [navigateTo, setNavigateTo] = useState<Href | null>(null);

  useEffect(() => {
    if (visible) setNavigateTo(null);
  }, [visible]);

  const safeHaptic = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const handleAccept = useCallback(() => {
    safeHaptic();
    onConsent(true);
  }, [onConsent, safeHaptic]);

  const handleDecline = useCallback(() => {
    safeHaptic();
    onConsent(false);
  }, [onConsent, safeHaptic]);

  const openRoute = useCallback(
    (route: Href) => {
      safeHaptic();

      // ✅ Hide modal first to prevent “flash then disappear”
      setNavigateTo(route);

      requestAnimationFrame(() => {
        try {
          router.push(route);
        } catch {
          setNavigateTo(null);
          Alert.alert('Unable to open', 'Please try again.');
        }
      });
    },
    [router, safeHaptic]
  );

  return (
    <Modal
      visible={visible && !navigateTo}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={handleDecline}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[theme.background, theme.backgroundSecondary ?? theme.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <StarField starCount={24} />

        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="sparkles-outline" size={20} color={theme.primary} />
            </View>
            <Text style={styles.appName}>MySky</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(550)} style={styles.card}>
            <ScrollView contentContainerStyle={styles.cardContent} bounces={false} showsVerticalScrollIndicator={false}>
              <Ionicons name="document-text-outline" size={44} color={theme.primary} style={styles.mainIcon} />

              <Text style={styles.title}>Before you continue</Text>
              <Text style={styles.body}>
                Please review the Terms, Privacy Policy, and FAQ. You’ll need to accept to use the app.
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
                        <Ionicons name={l.icon} size={18} color={theme.textPrimary} />
                      </View>
                      <View style={styles.linkTextWrap}>
                        <Text style={styles.linkTitle}>{l.title}</Text>
                        <Text style={styles.linkSubtitle}>{l.subtitle}</Text>
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                  </Pressable>
                ))}
              </View>

              <View style={styles.buttonRow}>
                <Pressable
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                  onPress={handleDecline}
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryText}>Not now</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
                  onPress={handleAccept}
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={[...theme.goldGradient]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryText}>Accept</Text>
                  </LinearGradient>
                </Pressable>
              </View>

              <Text style={styles.footnote}>You can review these anytime in Settings.</Text>
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },

  header: {
    position: 'absolute',
    top: 10,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginRight: 10,
  },
  appName: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: 'rgba(13, 20, 33, 0.72)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 14 },
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
  cardContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
  },

  mainIcon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'serif',
  },
  body: {
    fontSize: 15.5,
    lineHeight: 22,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },

  linksBlock: {
    width: '100%',
    gap: 10,
    marginBottom: 18,
  },
  linkRow: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  linkIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  linkTextWrap: {
    flex: 1,
  },
  linkTitle: {
    color: theme.textPrimary,
    fontSize: 15.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  linkSubtitle: {
    color: theme.textSecondary,
    fontSize: 13,
  },

  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: theme.textSecondary,
    fontSize: 15.5,
    fontWeight: '700',
  },

  primaryBtn: {
    flex: 1.25,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryText: {
    color: '#0D1421',
    fontSize: 15.5,
    fontWeight: '800',
    fontFamily: 'serif',
  },

  footnote: {
    color: theme.textSecondary,
    fontSize: 12.5,
    textAlign: 'center',
    opacity: 0.9,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
});
