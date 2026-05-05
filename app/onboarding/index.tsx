import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { saveDisplayName } from '../../services/storage/userProfileService';
import SkiaMetallicPill from '../../components/ui/SkiaMetallicPill';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

const FREE_FEATURES = [
  'Daily mood, energy, sleep, dream, journal, and relationship logging.',
  'Core birth chart context, daily reflection prompts, affirmations, and Today insights.',
  'A private archive with basic patterns, weekly averages, and your saved entries.',
];

const PREMIUM_FEATURES = [
  'Deeper pattern readings across sleep, mood, journal, dreams, relationships, and your chart.',
  'Up to 10 relationship charts, richer dream reflections, weekly threads, and advanced journal patterns.',
  'Full Personal Story chapters, PDF export, backup and restore, and deeper healing/chart layers.',
];

export default function OnboardingIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [name, setName] = useState('');

  const trimmedName = name.trim();

  const handleContinue = async () => {
    if (!trimmedName) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await saveDisplayName(trimmedName);
    } catch {
      // Non-blocking — name can be recovered from chart data if storage fails
    }
    router.push('/onboarding/consent');
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
      </View>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.brandLabel}>MYSKY</Text>
            <Text style={styles.title}>Understand your patterns over time.</Text>
            <Text style={styles.subtitle}>
              MySky is a private self-reflection app you can use for free. Premium adds deeper analysis when you want more context from your history.
            </Text>

            <View style={styles.planList}>
              <View style={styles.planSection}>
                <Text style={styles.planLabel}>Included free</Text>
                {FREE_FEATURES.map((point) => (
                  <View key={point} style={styles.planRow}>
                    <View style={styles.planDot} />
                    <Text style={styles.planText}>{point}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.planSection, styles.premiumSection]}>
                <Text style={[styles.planLabel, styles.premiumLabel]}>Premium adds</Text>
                {PREMIUM_FEATURES.map((point) => (
                  <View key={point} style={styles.planRow}>
                    <View style={[styles.planDot, styles.premiumDot]} />
                    <Text style={styles.planText}>{point}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.nameLabel}>What should we call you?</Text>

            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={theme.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
              selectionColor="#D9BF8C"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              maxLength={60}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
            <SkiaMetallicPill
              label="Continue"
              onPress={handleContinue}
              disabled={!trimmedName}
              height={56}
              borderRadius={28}
            />
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  brandLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.textGold,
    letterSpacing: 0,
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: 0,
    lineHeight: 40,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  planList: {
    gap: 14,
    marginBottom: 30,
  },
  planSection: {
    gap: 10,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  premiumSection: {
    borderColor: 'rgba(212,175,55,0.20)',
    backgroundColor: 'rgba(212,175,55,0.05)',
  },
  planLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textSecondary,
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  premiumLabel: {
    color: theme.textGold,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  planDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
    backgroundColor: theme.textSecondary,
  },
  premiumDot: {
    backgroundColor: theme.textGold,
  },
  planText: {
    flex: 1,
    fontSize: 13,
    color: theme.textMuted,
    lineHeight: 19,
  },
  nameLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 16,
  },
  input: { fontSize: 22, color: theme.textPrimary, borderBottomWidth: 1, borderColor: 'rgba(212, 175, 55,0.3)', paddingBottom: 14 },
  footer: { paddingHorizontal: 24 },
});
