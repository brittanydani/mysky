import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import MetallicTabIcon from '../../components/skia/MetallicTabIcon';
import { mySkyText } from '../../constants/mySkyText';

/** Elevated glowing orb icon for the central Check-In tab */
function CheckInTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={ciStyles.wrapper}>
      {focused && <View style={ciStyles.glow} />}
      <View style={[ciStyles.orb, focused && ciStyles.orbActive]}>
        <MetallicTabIcon name="add" focused={focused} size={26} />
      </View>
    </View>
  );
}

const ciStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', width: 56, height: 56, marginBottom: 8 },
  glow: {
    position: 'absolute', width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(110, 191, 139, 0.18)',
  },
  orb: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(110, 191, 139, 0.15)',
    borderWidth: 1.5, borderColor: 'rgba(110, 191, 139, 0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  orbActive: {
    backgroundColor: 'rgba(110, 191, 139, 0.25)',
    borderColor: 'rgba(110, 191, 139, 0.55)',
  },
});

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
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
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint="dark"
            style={StyleSheet.absoluteFill}
          >
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 8, 23, 0.55)' }} />
          </BlurView>
        ),
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
      {/* ── 1. Today — daily dashboard ── */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <MetallicTabIcon name="sunny" focused={focused} />,
        }}
      />

      {/* ── 2. Blueprint — deep psychology hub ── */}
      <Tabs.Screen
        name="blueprint"
        options={{
          title: 'Blueprint',
          tabBarIcon: ({ focused }) => <MetallicTabIcon name="compass" focused={focused} />,
        }}
      />

      {/* ── 3. [ + ] — central action button ── */}
      <Tabs.Screen
        name="checkin"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <CheckInTabIcon focused={focused} />,
        }}
      />

      {/* ── 4. Journal — analytics & history ── */}
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ focused }) => <MetallicTabIcon name="document-text" focused={focused} />,
        }}
      />

      {/* ── 5. Settings — calibration & astrological engine ── */}
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
      <Tabs.Screen name="mood" options={{ href: null }} />
      <Tabs.Screen name="sleep" options={{ href: null }} />
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
