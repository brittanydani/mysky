import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import DailyReflectionSection from '../components/DailyReflectionSection';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { type AppTheme } from '../constants/theme';
import { useThemedStyles } from '../context/ThemeContext';

export default function DailyReflectionScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        {/* Hardware Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.back();
            }}
            style={styles.closeButton}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <MetallicIcon name="close-outline" size={24} color="#FFF" />
          </Pressable>
        </View>

        {/* Cinematic Title Area */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>Today's Questions</Text>
          <GoldSubtitle style={styles.subtitle}>A daily reflection checkpoint across your inner world</GoldSubtitle>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            {/* Note: The actual cards and inputs are rendered inside DailyReflectionSection. 
              Ensure that component is also updated to use the Velvet Glass and Midnight Slate styles. 
            */}
            <DailyReflectionSection subtitle="Record each category when you are ready" />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  glowOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.5 },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 12, 
    paddingHorizontal: 24, 
  },
  closeButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  titleArea: { 
    paddingHorizontal: 24, 
    marginVertical: 32 
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
  },

  scrollContent: { 
    paddingHorizontal: 24, 
    paddingBottom: 140 
  },
});