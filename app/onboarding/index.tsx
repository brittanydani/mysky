import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { saveDisplayName } from '../../services/storage/userProfileService';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import SkiaMetallicPill from '../../components/ui/SkiaMetallicPill';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

const APP_EXPLAINER_POINTS = [
  'Daily check-ins, journal entries, sleep, dreams, and relationship reflections become one private self-knowledge map.',
  'Your birth chart gives symbolic context, but the app is grounded in what you actually log over time.',
  'MySky is for reflection and pattern awareness. It is not therapy, diagnosis, medical advice, or prediction.',
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
              MySky is a private self-reflection app that turns your moods, sleep, dreams, journal entries, relationships, and birth chart into daily guidance and long-term pattern insight.
            </Text>

            <View style={styles.explainerList}>
              {APP_EXPLAINER_POINTS.map((point) => (
                <View key={point} style={styles.explainerRow}>
                  <View style={styles.explainerDot} />
                  <Text style={styles.explainerText}>{point}</Text>
                </View>
              ))}
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
  explainerList: {
    gap: 14,
    marginBottom: 34,
  },
  explainerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  explainerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
    backgroundColor: theme.textGold,
  },
  explainerText: {
    flex: 1,
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 21,
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
