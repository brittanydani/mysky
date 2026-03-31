// File: components/ui/ObsidianSettingsGroup.tsx

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const GROUP_W = SCREEN_W - 32;

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  /** Section title */
  title: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** Optional icon name (Ionicons) */
  icon?: string;
  /** Child elements (setting rows) */
  children: React.ReactNode;
}

// ── Component ───────────────────────────────────────────────────────────────

const ObsidianSettingsGroup = memo(function ObsidianSettingsGroup({
  title,
  subtitle,
  children,
}: Props) {
  return (
    <View style={styles.wrapper}>
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
  return <View style={styles.divider} />;
});

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    width: GROUP_W,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(201,174,120,0.10)',
    backgroundColor: 'rgba(15,18,25,0.88)',
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(201,174,120,0.06)',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  childWrap: {
    paddingBottom: 12,
  },
});
