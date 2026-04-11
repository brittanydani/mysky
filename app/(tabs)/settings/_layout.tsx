import { Stack } from 'expo-router';
import { useAppTheme } from '../../../context/ThemeContext';

export default function SettingsLayout() {
  const theme = useAppTheme();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="calibration" />
    </Stack>
  );
}
