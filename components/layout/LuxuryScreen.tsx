// File: components/layout/LuxuryScreen.tsx

import React from 'react';
import {
  DimensionValue,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LuxuryStarfieldBackground from '../ui/LuxuryStarfieldBackground';
import { luxuryTheme } from '../../constants/luxuryTheme';

type LuxuryScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  topColor?: string;
  bottomColor?: string;
  starCount?: number;
  twinkleCount?: number;
  showNebulaGlow?: boolean;
  softenCenter?: boolean;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle'>;
};

export default function LuxuryScreen({
  children,
  style,
  contentContainerStyle,
  safeAreaEdges = ['top', 'left', 'right', 'bottom'],
  scrollable = false,
  keyboardAvoiding = false,
  topColor = luxuryTheme.background.top,
  bottomColor = luxuryTheme.background.bottom,
  starCount = 50,
  twinkleCount = 10,
  showNebulaGlow = true,
  softenCenter = true,
  scrollProps,
}: LuxuryScreenProps) {
  const content = scrollable ? (
    <ScrollView
      {...scrollProps}
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentContainerStyle]}>{children}</View>
  );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <LuxuryStarfieldBackground
      style={StyleSheet.flatten([styles.flex, style])}
      topColor={topColor}
      bottomColor={bottomColor}
      starCount={starCount}
      twinkleCount={twinkleCount}
      showNebulaGlow={showNebulaGlow}
      softenCenter={softenCenter}
    >
      <SafeAreaView edges={safeAreaEdges} style={styles.safeArea}>
        {wrappedContent}
      </SafeAreaView>
    </LuxuryStarfieldBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
