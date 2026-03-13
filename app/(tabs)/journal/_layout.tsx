import { Stack } from 'expo-router';

export default function JournalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sleep-detail" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
