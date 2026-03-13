import { Redirect } from "expo-router";

// All navigation uses /(tabs)/settings/calibration. Redirect preserves legacy deep-links.
export default function CalibrationRedirect() {
  return <Redirect href="/(tabs)/settings/calibration" />;
}
