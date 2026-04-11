import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../../context/ThemeContext';

export default function OnboardingLayout() {
  const theme = useAppTheme();

  return (
    <>
      <StatusBar style={theme.statusBarStyle} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="consent" />
        <Stack.Screen name="birth" />
        <Stack.Screen name="restore" />
      </Stack>
    </>
  );
}
