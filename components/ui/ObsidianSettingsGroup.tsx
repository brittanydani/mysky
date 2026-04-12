// File: components/ui/ObsidianSettingsGroup.tsx

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');
const GROUP_W = SCREEN_W - 32;

// ── Props ───────────────────────────────────────────────────────────────────

import { type StyleProp, type ViewStyle } from 'react-native';

interface Props {
  /** Section title */
  title: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** Optional icon name (Ionicons) */
  icon?: string;
  /** Child elements (setting rows) */
  children: React.ReactNode;
  /** Optional additional style */
  style?: StyleProp<ViewStyle>;
}

// ── Component ───────────────────────────────────────────────────────────────

const ObsidianSettingsGroup = memo(function ObsidianSettingsGroup({
  title,
  subtitle,
  children,
  style,
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.wrapper, style]}>
      <BlurView intensity={40} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.glassFill]} />
      {/* Top light-catch edge */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.borderOverlay]} />
      {/* Section header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Children (setting rows) */}
      <View style={styles.childWrap}>
        {children}
      </View>
    </View>
  );
});

export default ObsidianSettingsGroup;

// ── Divider sub-component ───────────────────────────────────────────────────

export const ObsidianDivider = memo(function ObsidianDivider() {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.divider} />;
});

// ── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) => StyleSheet.create({
  wrapper: {
    width: GROUP_W,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0,
  },
  glassFill: {
    backgroundColor: theme.isDark ? 'rgba(8, 10, 18, 0.55)' : 'rgba(255, 252, 247, 0.78)',
    borderRadius: 24,
  },
  borderOverlay: {
    borderRadius: 24,
    borderWidth: 1,
    borderTopColor: theme.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.70)',
    borderLeftColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(181, 138, 58, 0.14)',
    borderRightColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(181, 138, 58, 0.10)',
    borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(181, 138, 58, 0.08)',
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: theme.isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(181, 138, 58, 0.10)',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  childWrap: {
    paddingBottom: 12,
  },
});
