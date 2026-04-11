import { View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

// Intentionally empty — AppShell in _layout.tsx handles initial routing:
// - OnboardingModal (auth step) when user has no session/onboarding
// - router.replace('/(tabs)/home') once session + onboarding are confirmed
export default function Index() {
  const theme = useAppTheme();
  return <View style={{ flex: 1, backgroundColor: theme.background }} />;
}
