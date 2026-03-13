import { Tabs } from 'expo-router';
import GlassDock from '../../components/layout/GlassDock';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassDock {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      {/* ── 5 Navigation Hubs — icons/labels managed by GlassDock ── */}
      <Tabs.Screen name="home"     options={{ title: 'Today' }} />
      <Tabs.Screen name="growth"   options={{ title: 'Patterns' }} />
      <Tabs.Screen name="journal"  options={{ title: 'Archive' }} />
      <Tabs.Screen name="chart"    options={{ title: 'Blueprint' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />

      {/* ── Hidden routes — accessible via router.push from within hubs ── */}
      <Tabs.Screen name="index"   options={{ href: null }} />
      <Tabs.Screen name="today"   options={{ href: null }} />
      <Tabs.Screen name="checkin" options={{ href: null }} />
      <Tabs.Screen name="mood"    options={{ href: null }} />
      <Tabs.Screen name="sleep"   options={{ href: null }} />
      <Tabs.Screen name="energy"  options={{ href: null }} />
      <Tabs.Screen name="story" options={{ href: null }} />
      <Tabs.Screen name="relationships" options={{ href: null }} />
      <Tabs.Screen name="healing" options={{ href: null }} />
      <Tabs.Screen name="insights" options={{ href: null }} />
      <Tabs.Screen name="premium" options={{ href: null }} />
      <Tabs.Screen name="sanctuary" options={{ href: null }} />
    </Tabs>
  );
}
