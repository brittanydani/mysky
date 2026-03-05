import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 1,
          borderTopColor: 'rgba(197, 180, 147, 0.15)',
          height: Platform.select({
            ios: insets.bottom + 60,
            android: insets.bottom + 60,
            default: 70,
          }),
          paddingTop: 8,
          paddingBottom: Platform.select({
            ios: insets.bottom + 8,
            android: insets.bottom + 8,
            default: 8,
          }),
        },
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      {/* ── Visible tabs (exactly 5) ── */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Balance',
          tabBarIcon: ({ color }) => <Ionicons name="pulse" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="mood"
        options={{
          title: 'Weather',
          tabBarIcon: ({ color }) => <Ionicons name="cloudy" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="sleep"
        options={{
          title: 'Rest',
          tabBarIcon: ({ color }) => <Ionicons name="moon" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="journal"
        options={{
          title: 'Archive',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="options" size={22} color={color} />,
        }}
      />

      {/* ── Hidden routes — still accessible via router.push ── */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="today" options={{ href: null }} />
      <Tabs.Screen name="energy" options={{ href: null }} />
      <Tabs.Screen name="chart" options={{ href: null }} />
      <Tabs.Screen name="story" options={{ href: null }} />
      <Tabs.Screen name="growth" options={{ href: null }} />
      <Tabs.Screen name="relationships" options={{ href: null }} />
      <Tabs.Screen name="healing" options={{ href: null }} />
      <Tabs.Screen name="premium" options={{ href: null }} />
      <Tabs.Screen name="insights" options={{ href: null }} />
    </Tabs>
  );
}
