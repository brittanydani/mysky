import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import DailyReflectionSection from '../components/DailyReflectionSection';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

export default function DailyReflectionScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Today&apos;s Questions</Text>
                <GoldSubtitle style={styles.subtitle}>A daily reflection checkpoint across your inner world</GoldSubtitle>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.back();
                }}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close-outline" size={22} color={theme.textMuted} />
              </Pressable>
            </View>
          </Animated.View>

          <DailyReflectionSection subtitle="Record each category when you are ready" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  header: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerText: { flex: 1, paddingRight: 16 },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  title: {
    fontSize: 31,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.9,
    marginBottom: 4,
    maxWidth: '88%',
  },
  subtitle: {
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.textSecondary,
  },
});