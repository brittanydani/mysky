/**
 * Insights tab — now merged into Patterns screen (growth tab).
 * This file remains as a redirect for any deep-link or notification routes.
 */

import { Redirect } from 'expo-router';

export default function InsightsRedirect() {
  return <Redirect href="/(tabs)/growth" />;
}
