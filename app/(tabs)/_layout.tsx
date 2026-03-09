import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MetallicTabIcon from '../../components/skia/MetallicTabIcon';
import { mySkyText } from '../../constants/mySkyText';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(2, 8, 23, 0.8)',
          borderTopWidth: 0,
          elevation: 0,
          position: 'absolute' as const,
          height: Platform.select({
            ios: insets.bottom + 66,
            android: insets.bottom + 66,
            default: 76,
          }),
          paddingTop: 8,
          paddingBottom: Platform.select({
            ios: insets.bottom + 14,
            android: insets.bottom + 14,
            default: 14,
          }),
        },
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: mySkyText.tabActive,
        tabBarInactiveTintColor: mySkyText.tabInactive,
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
          tabBarIcon: ({ focused }) => <MetallicTabIcon name="pulse" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="mood"
        options={{
          title: 'Weather',
          tabBarIcon: ({ focused }) => <MetallicTabIcon name="cloudy" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="sleep"
        options={{
          title: 'Rest',
          tabBarIcon: ({ focused }) => <MetallicTabIcon name="moon" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="journal"
        options={{
          title: 'Archive',
          tabBarIcon: ({ focused }) => <MetallicTabIcon name="document-text" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <MetallicTabIcon name="options" focused={focused} />,
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
      <Tabs.Screen name="insights" options={{ href: null }} />

      <Tabs.Screen name="premium" options={{ href: null }} />
    </Tabs>
  );
}
