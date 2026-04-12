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
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

export default function DailyReflectionScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient colors={['rgba(162, 194, 225, 0.12)', 'transparent']} style={styles.topGlow} />

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
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 8, 
    paddingHorizontal: 24, 
    paddingBottom: 8 
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
    paddingBottom: 16 
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },

  scrollContent: { 
    paddingHorizontal: 24, 
    paddingTop: 16, 
    paddingBottom: 140 
  },
});