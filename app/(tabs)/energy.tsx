// File: app/(tabs)/energy.tsx
// MySky — Energy Screen: standalone tab wrapper around EnergyScrollContent.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { EnergyScrollContent } from '../../components/screens/EnergyScrollContent';

/* ════════════════════════════════════════════════
   MAIN SCREEN
   ════════════════════════════════════════════════ */
export default function EnergyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/home' as Href);
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back-outline" size={24} color={theme.textPrimary} />
        </Pressable>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <Text style={styles.title}>Energy</Text>
            <GoldSubtitle style={styles.subtitle}>Somatic awareness & energetic weather</GoldSubtitle>
          </Animated.View>
          <EnergyScrollContent />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ════════════════════════════════════════════════
   STYLES — shell only (content styles live in EnergyScrollContent)
   ════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    padding: 4,
    paddingHorizontal: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  scroll: {
    flex: 1,
  },
  header: {
    marginTop: 20,
    marginBottom: 28,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: 34,
    fontWeight: '300',
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
});
