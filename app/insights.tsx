import { Redirect } from 'expo-router';

// All navigation uses /(tabs)/insights. This redirect preserves any legacy deep-links.
export default function InsightsRedirect() {
  return <Redirect href="/(tabs)/insights" />;
}
