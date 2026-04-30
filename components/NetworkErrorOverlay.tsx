import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function NetworkErrorOverlay() {
  const isConnected = useNetworkStatus();

  if (isConnected !== false) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.banner}>
        <Text style={styles.text}>No Connection</Text>
        <Text style={styles.subtext}>Changes will sync when you're back online</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  banner: {
    backgroundColor: '#DC5050',
    padding: 12,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
  },
  subtext: {
    color: '#ffcccc',
    fontSize: 12,
    marginTop: 4,
  },
});
