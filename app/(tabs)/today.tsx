import { Redirect } from 'expo-router';

// Astrology content has moved to /astrology-context (stack route).
// This file is kept for Expo Router tab registration (hidden via href: null).
export default function TodayScreen() {
  return <Redirect href="/astrology-context" />;
}
