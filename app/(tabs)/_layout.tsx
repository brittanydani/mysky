import { Tabs } from 'expo-router';
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Home, TrendingUp, BookOpen, User, LayoutGrid } from 'lucide-react-native';
import { MetallicLucideIcon } from '../../components/ui/MetallicLucideIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import { SkiaGradient } from '../../components/ui/SkiaGradient';
import { metallicFillColors, metallicFillPositions } from '../../constants/mySkyMetallic';

const VISIBLE_TABS = new Set(['home', 'growth', 'journal', 'blueprint', 'settings']);

const LUCIDE_MAP: Record<string, React.ComponentType<any>> = {
  home: Home, growth: TrendingUp, journal: BookOpen,
  blueprint: User, settings: LayoutGrid,
};

// ── OPTICAL NUDGES ──
// translateY / scale: Adjusts JUST the icon inside its bounding box
// tabTranslateY: Nudges the ENTIRE tab (Icon + Text + Dot) up or down
const OPTICAL_ADJUSTMENTS: Record<string, { translateY?: number; translateX?: number; scale?: number; tabTranslateY?: number }> = {
  home:      { translateY: 0,  scale: 1,    tabTranslateY: 0 },
  growth:    { translateY: 1,  scale: 1.05, tabTranslateY: 0 }, 
  journal:   { translateY: 0,  scale: 1,    tabTranslateY: 0 },
  blueprint: { translateY: -1, scale: 1.1,  tabTranslateY: 0 },  
  settings:  { translateY: 0,  scale: 0.95, tabTranslateY: -1 }, // <-- Sub-pixel nudge for perfect optical alignment
};

/**
 * CUSTOM TAB BAR COMPONENT
 * Floating glassmorphic container with gold active indicators and strict mathematical alignment.
 */
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((r) => VISIBLE_TABS.has(r.name));

  const currentRouteName = state.routes[state.index]?.name;
  if (!VISIBLE_TABS.has(currentRouteName)) return null;

  const safeBottom = insets.bottom > 0 ? insets.bottom : 20;
  const BAR_HEIGHT = 65 + safeBottom; 

  return (
    <View style={[styles.tabBarContainer, { height: BAR_HEIGHT, paddingBottom: safeBottom }]}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.glassHighlight} />
      </BlurView>

      <View style={styles.tabItemsRow}>
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const isFocused = state.routes[state.index]?.name === route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name);
            }
          };

          const inactiveColor = 'rgba(255,255,255,0.3)';
          const size = 22;
          const sw = 1.5;

          const IconComponent = LUCIDE_MAP[route.name];

          const icon = IconComponent
            ? isFocused
              ? <MetallicLucideIcon icon={IconComponent} size={size} strokeWidth={sw} />
              : <IconComponent color={inactiveColor} size={size} strokeWidth={sw} />
            : null;

          const nudge = OPTICAL_ADJUSTMENTS[route.name] || {};

          return (
            <Pressable 
              key={route.key} 
              onPress={onPress} 
              style={[
                styles.tabItem, 
                { transform: [{ translateY: nudge.tabTranslateY || 0 }] }
              ]}
            >
              <View style={styles.iconWrapper}>
                
                {/* ── INTERNAL ICON NUDGES ── */}
                <View style={{ 
                  transform: [
                    { translateY: nudge.translateY || 0 }, 
                    { translateX: nudge.translateX || 0 }, 
                    { scale: nudge.scale || 1 }
                  ] 
                }}>
                  {icon}
                </View>

                {isFocused && (
                  <View style={styles.activeIndicator}>
                    <SkiaGradient
                      colors={[...metallicFillColors]}
                      locations={[...metallicFillPositions]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </View>
                )}
              </View>
              
              {isFocused ? (
                <MetallicText style={styles.tabLabel}>{options.title}</MetallicText>
              ) : (
                <Text style={[styles.tabLabel, { color: 'rgba(255,255,255,0.4)' }]}>
                  {options.title}
                </Text>
              )}
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
      <Tabs.Screen name="home"      options={{ title: 'Today' }} />
      <Tabs.Screen name="growth"    options={{ title: 'Patterns' }} />
      <Tabs.Screen name="journal"   options={{ title: 'Archive' }} />
      <Tabs.Screen name="blueprint" options={{ title: 'Identity' }} />
      <Tabs.Screen name="settings"  options={{ title: 'Settings' }} />

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
      <Tabs.Screen name="inner-tensions" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    overflow: 'hidden',
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  glassHighlight: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(255,255,255,0.02)' 
  },
  tabItemsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    flex: 1, 
    paddingHorizontal: 10,
    paddingTop: 12, 
  },
  tabItem: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    flex: 1,
    height: '100%', 
  },
  iconWrapper: { 
    width: 28, 
    height: 28, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 10, 
  },
  activeIndicator: {
    position: 'absolute', 
    bottom: -7, 
    width: 4, 
    height: 4, 
    borderRadius: 2,
    overflow: 'hidden',
    shadowColor: '#D9BF8C', 
    shadowRadius: 4, 
    shadowOpacity: 0.8,
  },
  tabLabel: { 
    fontSize: 9, 
    fontWeight: '700', 
    letterSpacing: 1, 
    textTransform: 'uppercase', 
    lineHeight: 10, 
    textAlign: 'center',
  },
});
