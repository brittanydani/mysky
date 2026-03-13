/**
 * GlassDock — Floating glassmorphism navigation pill
 *
 * Replaces the system tab bar with a floating, blurred, champagne-gold-rimmed
 * pill dock. Content scrolls freely underneath. Active tab gets a subtle warm
 * glow. Uses expo-blur for the frosted glass effect.
 */

import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';

import { Ionicons } from '@expo/vector-icons';
import MetallicTabIcon from '../skia/MetallicTabIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

// ── Tab definitions ──────────────────────────────────────────────────────────

interface TabConfig {
  label: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}

const VISIBLE_TABS: Record<string, TabConfig> = {
  home:     { label: 'Today',     icon: 'sunny-outline', iconFocused: 'sunny' },
  growth:   { label: 'Patterns',  icon: 'analytics-outline', iconFocused: 'analytics' },
  journal:  { label: 'Archive',   icon: 'archive-outline', iconFocused: 'archive' },
  chart:    { label: 'Blueprint', icon: 'compass-outline', iconFocused: 'compass' },
  settings: { label: 'Settings',  icon: 'settings-outline', iconFocused: 'settings' },
};

const DOCK_HEIGHT = 62;

// ── Tab Button ────────────────────────────────────────────────────────────────

interface TabButtonProps {
  route: { key: string; name: string; params?: object };
  isFocused: boolean;
  cfg: TabConfig;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}

const TabButton = memo(function TabButton({ isFocused, cfg, onPress, onLayout }: TabButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.85, { mass: 0.5, damping: 12 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { mass: 0.5, damping: 12 });
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onLayout={onLayout}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={cfg.label}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
    >
      <Animated.View style={animatedIconStyle}>
        <MetallicTabIcon name={isFocused ? cfg.iconFocused : cfg.icon} focused={isFocused} size={22} />
      </Animated.View>

      <Text
        style={[
          styles.label,
          isFocused ? styles.labelActive : styles.labelInactive,
        ]}
        numberOfLines={1}
      >
        {cfg.label}
      </Text>

      {/* Active indicator dot */}
      {isFocused && (
        <View style={styles.indicatorDot} />
      )}
    </Pressable>
  );
});

// ── Component ────────────────────────────────────────────────────────────────

export default function GlassDock({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Float the pill higher — give safe-area devices extra clearance above the
  // home indicator, and non-indicator devices a generous lift too.
  const bottomOffset = insets.bottom > 0 ? insets.bottom + 12 : 28;

  // Only render the five named visible tabs; hidden routes (href: null) are
  // excluded by checking against the VISIBLE_TABS whitelist.
  const visibleRoutes = state.routes.filter((r) => r.name in VISIBLE_TABS);
  const activeRouteName = state.routes[state.index]?.name ?? '';

  // ── Sliding indicator ──────────────────────────────────────────────────────
  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const isInitialLayout = useRef(true);

  useEffect(() => {
    const layout = tabLayouts[activeRouteName];
    if (!layout) return;
    if (isInitialLayout.current) {
      // Snap to position without animation on first render
      indicatorX.value = layout.x;
      indicatorWidth.value = layout.width;
      isInitialLayout.current = false;
    } else {
      indicatorX.value = withSpring(layout.x, { mass: 0.8, damping: 15, stiffness: 150 });
      indicatorWidth.value = layout.width;
    }
  }, [activeRouteName, tabLayouts]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(200).springify().damping(18)}
      style={[styles.wrapper, { paddingBottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      {/* Outer glow ring — champagne aura */}
      <View style={styles.outerGlow} />

      <BlurView
        intensity={Platform.OS === 'android' ? 20 : 40}
        tint="dark"
        style={styles.dock}
      >
        {/* Dark navy tint over the blur */}
        <View style={styles.glassTint} />

        {/* Champagne-gold rim */}
        <View style={styles.goldRim} />

        {/* Inner top highlight — faint white edge */}
        <View style={styles.topHighlight} />

        <View style={styles.row}>
          {/* Sliding gold background — rendered first so it sits under icons */}
          {Object.keys(tabLayouts).length === visibleRoutes.length && (
            <Animated.View style={[styles.activeIndicator, animatedIndicatorStyle]} />
          )}

          {visibleRoutes.map((route) => {
            const isFocused = state.routes[state.index]?.name === route.name;
            const cfg = VISIBLE_TABS[route.name]!;

            const handlePress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                Haptics.selectionAsync().catch(() => {});
                navigation.navigate(route.name as never);
              }
            };

            return (
              <TabButton
                key={route.key}
                route={route}
                isFocused={isFocused}
                cfg={cfg}
                onPress={handlePress}
                onLayout={(e) => {
                  const { x, width: w } = e.nativeEvent.layout;
                  setTabLayouts((prev) => ({ ...prev, [route.name]: { x, width: w } }));
                }}
              />
            );
          })}
        </View>
      </BlurView>
    </Animated.View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    // Allow touches to pass through the transparent area above the dock
    pointerEvents: 'box-none',
  },

  // Soft ambient glow ring behind the pill
  outerGlow: {
    position: 'absolute',
    bottom: 0,
    left: '4%',
    right: '4%',
    height: DOCK_HEIGHT + 30,
    borderRadius: 36,
    backgroundColor: 'rgba(232, 214, 174, 0.04)',
    shadowColor: 'rgba(232, 214, 174, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 0,
  },

  dock: {
    borderRadius: 34,
    overflow: 'hidden',
    height: DOCK_HEIGHT,
    width: SCREEN_WIDTH * 0.92,
    // Elevation shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 24,
  },

  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 8, 23, 0.58)',
  },

  goldRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(255, 244, 214, 0.16)',
  },

  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 1,
  },

  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
    position: 'relative',
  },

  // Active indicator dot below label
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4B872',
    marginTop: 1,
  },

  // Shared sliding indicator — spring-physics pill behind the active tab
  activeIndicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 0,
    backgroundColor: 'rgba(212, 184, 114, 0.14)',
    borderRadius: 22,
    zIndex: 0,
  },

  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#D4B872',
  },
  labelInactive: {
    color: 'rgba(255, 255, 255, 0.35)',
  },
});
