import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#050507' },
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
