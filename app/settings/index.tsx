import { Redirect } from "expo-router";

// All navigation uses /(tabs)/settings. Redirect preserves legacy deep-links.
export default function SettingsRedirect() {
  return <Redirect href="/(tabs)/settings" />;
}
