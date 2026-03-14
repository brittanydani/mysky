import { Tabs } from 'expo-router';
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Home, Activity, BookText, Fingerprint, Settings } from 'lucide-react-native';

const VISIBLE_TABS = new Set(['home', 'growth', 'journal', 'blueprint', 'settings']);

/**
 * CUSTOM TAB BAR COMPONENT
 * Floating glassmorphic container with gold active indicators.
 */
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((r: any) => VISIBLE_TABS.has(r.name));

  // Hide the tab bar entirely on non-navigational routes (e.g. premium paywall,
  // modals pushed into the tab stack) so the floating bar doesn't overlay content.
  const currentRouteName = state.routes[state.index]?.name;
  if (!VISIBLE_TABS.has(currentRouteName)) return null;

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }]}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.glassHighlight} />
      </BlurView>

      <View style={styles.tabItemsRow}>
        {visibleRoutes.map((route: any) => {
          const { options } = descriptors[route.key];
          const isFocused = state.routes[state.index]?.name === route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name);
            }
          };

          const color = isFocused ? '#D9BF8C' : 'rgba(255,255,255,0.3)';
          const size = 22;
          const sw = 1.5;

          const icon = (() => {
            switch (route.name) {
              case 'home':      return <Home color={color} size={size} strokeWidth={sw} />;
              case 'growth':    return <Activity color={color} size={size} strokeWidth={sw} />;
              case 'journal':   return <BookText color={color} size={size} strokeWidth={sw} />;
              case 'blueprint': return <Fingerprint color={color} size={size} strokeWidth={sw} />;
              case 'settings':  return <Settings color={color} size={size} strokeWidth={sw} />;
              default:          return null;
            }
          })();

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
              <View style={styles.iconWrapper}>
                {icon}
                {isFocused && <View style={styles.activeIndicator} />}
              </View>
              <Text style={[styles.tabLabel, { color: isFocused ? '#FFF' : 'rgba(255,255,255,0.4)' }]}>
                {options.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const renderTabBar = useCallback((props: any) => <CustomTabBar {...props} />, []);
  return (
    <Tabs tabBar={renderTabBar} screenOptions={{ headerShown: false }}>
      {/* ── 5 visible navigation hubs ── */}
      <Tabs.Screen name="home"      options={{ title: 'Today' }} />
      <Tabs.Screen name="growth"    options={{ title: 'Patterns' }} />
      <Tabs.Screen name="journal"   options={{ title: 'Archive' }} />
      <Tabs.Screen name="blueprint" options={{ title: 'Identity' }} />
      <Tabs.Screen name="settings"  options={{ title: 'Settings' }} />

      {/* ── Hidden routes — accessible via router.push from within hubs ── */}
      <Tabs.Screen name="chart"         options={{ href: null }} />
      <Tabs.Screen name="checkin"       options={{ href: null }} />
      <Tabs.Screen name="index"         options={{ href: null }} />
      <Tabs.Screen name="today"         options={{ href: null }} />
      <Tabs.Screen name="mood"          options={{ href: null }} />
      <Tabs.Screen name="sleep"         options={{ href: null }} />
      <Tabs.Screen name="energy"        options={{ href: null }} />
      <Tabs.Screen name="story"         options={{ href: null }} />
      <Tabs.Screen name="relationships" options={{ href: null }} />
      <Tabs.Screen name="healing"       options={{ href: null }} />
      <Tabs.Screen name="insights"      options={{ href: null }} />
      <Tabs.Screen name="premium"       options={{ href: null }} />
      <Tabs.Screen name="sanctuary"     options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 90, overflow: 'hidden',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  glassHighlight: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.02)' },
  tabItemsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', flex: 1, paddingHorizontal: 10 },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 12 },
  iconWrapper: { height: 30, justifyContent: 'center', alignItems: 'center' },
  activeIndicator: {
    position: 'absolute', bottom: -8,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#D9BF8C',
    shadowColor: '#D9BF8C', shadowRadius: 4, shadowOpacity: 0.8,
  },
  tabLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 8 },
});
