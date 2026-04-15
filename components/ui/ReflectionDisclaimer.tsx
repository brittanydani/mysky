import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type AppTheme } from '../../constants/theme';
import { useThemedStyles } from '../../context/ThemeContext';

interface ReflectionDisclaimerProps {
  /** Override default body text */
  body?: string;
  /** Override default label */
  label?: string;
  style?: object;
}

/**
 * Subtle "for reflection, not diagnosis" framing callout.
 * Place at the bottom of any screen that shows AI-generated,
 * pattern-derived, or psychology-adjacent content.
 */
export function ReflectionDisclaimer({
  body = 'This content is for self-reflection and personal exploration — not diagnosis, therapy, or medical advice.',
  label = 'Gentle read',
  style,
}: ReflectionDisclaimerProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Ionicons name="compass-outline" size={13} color="#6B9080" />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const createStyles = (_theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginTop: 24,
      padding: 16,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    label: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFFFFF',
      textTransform: 'uppercase',
    },
    body: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.5)',
      lineHeight: 20,
    },
  });
