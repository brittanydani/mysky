import { Redirect } from "expo-router";

// Check-in is handled by the root-level modal at /checkin.
// This redirect preserves any /(tabs)/checkin deep-links.
export default function CheckInTabRedirect() {
  return <Redirect href="/checkin" />;
}
