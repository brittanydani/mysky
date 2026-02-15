import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { useRouter, Href } from 'expo-router';

export default function PremiumRequiredScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Ionicons name="star" size={48} color={theme.primary} style={styles.icon} />
      <Text style={styles.title}>Premium Feature</Text>
      <Text style={styles.description}>
        This feature is available with a Deeper Sky subscription.
      </Text>
      <Pressable
        style={styles.upgradeButton}
        onPress={() => router.push('/(tabs)/premium' as Href)}
      >
        <Ionicons name="sparkles" size={16} color={theme.background} />
        <Text style={styles.upgradeButtonText}>Unlock Deeper Sky</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Go Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
    padding: 32,
  },
  icon: { marginBottom: 24 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.primary,
    marginBottom: 12,
    fontFamily: 'serif',
  },
  description: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: theme.background,
    fontWeight: '700',
    fontSize: 16,
  },
  button: {
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  buttonText: {
    color: theme.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
});
