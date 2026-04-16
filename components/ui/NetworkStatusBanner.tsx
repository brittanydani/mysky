import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

/**
 * A slim banner that slides in from the top when the device has no internet
 * access. Disappears automatically once connectivity is restored.
 *
 * Mount this once inside the root layout, below SafeAreaProvider.
 */
export default function NetworkStatusBanner() {
  const online = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const isOffline = online === false;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOffline ? 0 : -80,
      useNativeDriver: true,
      bounciness: 2,
      speed: 14,
    }).start();
  }, [isOffline, slideAnim]);

  // Don't mount at all while the initial probe hasn't resolved yet
  if (online === null) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: insets.top, transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityLabel={isOffline ? 'You are offline. Some features may be unavailable.' : undefined}
    >
      <View style={styles.row}>
        <Text style={styles.icon}>⚡</Text>
        <Text style={styles.text}>
          You're offline · Reflections will sync when you reconnect
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(10, 10, 15, 0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 200, 80, 0.35)',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 13,
  },
  text: {
    fontSize: 12,
    color: 'rgba(255, 200, 80, 0.85)',
    fontWeight: '600',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
});
