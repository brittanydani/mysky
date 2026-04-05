import { Redirect } from 'expo-router';

// Insights merged into Patterns screen. This redirect preserves any legacy deep-links.
export default function InsightsRedirect() {
  return <Redirect href="/(tabs)/patterns" />;
}
