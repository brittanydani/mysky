import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ConfigErrorScreenProps = {
  message: string;
};

export function ConfigErrorScreen({ message }: ConfigErrorScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Startup check failed</Text>
        <Text style={styles.title}>Configuration Error</Text>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.hint}>
          MySky could not start because required production settings are missing or invalid.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default ConfigErrorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020817',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 14,
  },
  message: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Courier',
    marginBottom: 18,
  },
  hint: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 13,
    lineHeight: 19,
  },
});
