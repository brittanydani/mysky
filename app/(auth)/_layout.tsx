import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#020817' },
        animation: 'slide_from_bottom',
        presentation: 'modal',
      }}
    />
  );
}
