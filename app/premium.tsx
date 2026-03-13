import { Redirect } from 'expo-router';

// All navigation uses /(tabs)/premium. Redirect preserves legacy deep-links.
export default function PremiumRedirect() {
  return <Redirect href="/(tabs)/premium" />;
}
