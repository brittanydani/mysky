import { Redirect } from "expo-router";

// All navigation uses /(tabs)/relationships. Redirect preserves legacy deep-links.
export default function RelationshipsRedirect() {
  return <Redirect href="/(tabs)/relationships" />;
}
