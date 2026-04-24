
import { Redirect } from 'expo-router';

// Default tab index — redirect to primary tab (Today)
export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}
