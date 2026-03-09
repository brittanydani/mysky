
import { Redirect } from 'expo-router';

// Default tab index — redirect to primary tab (Mood)
export default function Index() {
  return <Redirect href="/(tabs)/mood" />;
}
