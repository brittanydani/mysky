// File: app/log/_layout.tsx
// Logging modal stack — presented as a modal over the tab bar.
// index (LogSelectorModal) slides up; inner screens push right.

import { Stack } from 'expo-router';

export default function LogModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="internal-weather" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="sleep" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
