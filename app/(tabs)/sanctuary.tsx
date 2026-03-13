import { Redirect } from 'expo-router';

// Sanctuary has moved to a root-level full-screen modal (app/sanctuary.tsx).
// This redirect preserves any existing /(tabs)/sanctuary deep-links.
export default function SanctuaryTabRedirect() {
  return <Redirect href="/sanctuary" />;
}
