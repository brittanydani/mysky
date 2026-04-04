import { View } from 'react-native';

// Intentionally empty — AppShell in _layout.tsx handles initial routing:
// - OnboardingModal (auth step) when user has no session/onboarding
// - router.replace('/(tabs)/home') once session + onboarding are confirmed
export default function Index() {
  return <View style={{ flex: 1, backgroundColor: '#020817' }} />;
}
