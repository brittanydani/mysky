import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const THEME = {
  activeIcon: '#FFFFFF',
  inactiveIcon: 'rgba(255, 255, 255, 0.55)',
  activeLabel: '#D4B872',
  inactiveLabel: 'rgba(255, 255, 255, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  activeBg: 'rgba(255, 255, 255, 0.10)',
} as const;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  routeName: string;
  label: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}

const TAB_CONFIGS: TabConfig[] = [
  { routeName: 'home',     label: 'Today',    icon: 'sunny-outline',     iconFocused: 'sunny'     },
  { routeName: 'checkin',  label: 'Check In', icon: 'add-circle-outline', iconFocused: 'add-circle' },
  { routeName: 'growth',   label: 'Patterns', icon: 'analytics-outline', iconFocused: 'analytics' },
  { routeName: 'journal',  label: 'Journal',  icon: 'book-outline',       iconFocused: 'book'      },
  { routeName: 'settings', label: 'You',      icon: 'person-outline',     iconFocused: 'person'    },
];

// ── Props ──────────────────────────────────────────────────────────────────────
// These mirror the BottomTabBarProps passed by expo-router's Tabs tabBar prop.

interface RouteItem {
  key: string;
  name: string;
  params?: object;
}

export interface FloatingGlassDockProps {
  state: {
    routes: RouteItem[];
    index: number;
  };
  navigation: {
    navigate: (name: string, params?: object) => void;
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
  };
  insets: {
    bottom: number;
  };
}

// ── Individual Tab Button ──────────────────────────────────────────────────────

interface TabItemProps {
  config: TabConfig;
  isActive: boolean;
  onPress: () => void;
}

const TabItem = ({ config, isActive, onPress }: TabItemProps) => {
  const scale = useSharedValue(1);
  const activeProgress = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    activeProgress.value = withTiming(isActive ? 1 : 0, { duration: 250 });
  }, [isActive]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.85, { mass: 0.5, damping: 12 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { mass: 0.5, damping: 12 });
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      activeProgress.value,
      [0, 1],
      ['transparent', THEME.activeBg],
    ),
  }));

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={styles.tabButton}
      accessibilityRole="tab"
      accessibilityLabel={config.label}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.iconWrapper, animatedBgStyle]}>
        <Animated.View style={animatedIconStyle}>
          <Ionicons
            name={isActive ? config.iconFocused : config.icon}
            size={22}
            color={isActive ? THEME.activeIcon : THEME.inactiveIcon}
          />
        </Animated.View>
      </Animated.View>
      <Text style={[styles.tabLabel, isActive && styles.activeLabelStyle]}>
        {config.label}
      </Text>
    </Pressable>
  );
};

// ── The Dock ──────────────────────────────────────────────────────────────────

export const FloatingGlassDock = ({ state, navigation, insets }: FloatingGlassDockProps) => {
  const activeRouteName = state.routes[state.index]?.name;
  // Sit above the home indicator with enough breathing room
  const bottomOffset = Math.max(insets.bottom, 8) + 12;

  return (
    <View style={[styles.dockContainer, { bottom: bottomOffset }]} pointerEvents="box-none">
      <BlurView intensity={50} tint="dark" style={styles.glassPill}>
        {TAB_CONFIGS.map((config) => {
          const route = state.routes.find((r) => r.name === config.routeName);
          if (!route) return null;

          return (
            <TabItem
              key={config.routeName}
              config={config}
              isActive={activeRouteName === config.routeName}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!event.defaultPrevented) {
                  navigation.navigate(config.routeName, route.params);
                }
              }}
            />
          );
        })}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    width,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 22, 26, 0.65)',
    borderWidth: 1,
    borderColor: THEME.glassBorder,
    width: width * 0.9,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.inactiveLabel,
  },
  activeLabelStyle: {
    color: THEME.activeLabel,
  },
});
