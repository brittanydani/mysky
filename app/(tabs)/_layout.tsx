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
          backgroundColor: '#0A0F1A',
          borderTopWidth: 1,
          borderTopColor: 'rgba(201, 169, 98, 0.15)',
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
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="partly-sunny" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chart"
        options={{
          href: null, // Hidden - accessible from Home/You
        }}
      />
      <Tabs.Screen
        name="story"
        options={{
          href: null, // Hidden - accessible from You tab
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="journal" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="relationships"
        options={{
          href: null, // Hidden - accessible from elsewhere
        }}
      />
      <Tabs.Screen
        name="healing"
        options={{
          href: null, // Hidden - accessible from Home
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="premium"
        options={{
          href: null, // Hidden - accessible from Settings
        }}
      />
    </Tabs>
  );
}
