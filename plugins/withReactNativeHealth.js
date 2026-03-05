const { withEntitlementsPlist, withInfoPlist } = require("@expo/config-plugins");

/**
 * Minimal HealthKit enablement for iOS builds.
 * Note: "react-native-health" itself is not an Expo config plugin, so we use a local plugin.
 */
module.exports = function withReactNativeHealth(config) {
  // Enable HealthKit entitlement
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.developer.healthkit"] = true;
    // If you need clinical records or background delivery later, add those here.
    return config;
  });

  // Add privacy usage strings (Apple will check these)
  config = withInfoPlist(config, (config) => {
    config.modResults.NSHealthShareUsageDescription =
      config.modResults.NSHealthShareUsageDescription ||
      "MySky uses Health data to help you reflect on patterns like energy and recovery.";
    config.modResults.NSHealthUpdateUsageDescription =
      config.modResults.NSHealthUpdateUsageDescription ||
      "MySky may write limited Health data if you choose to log it from the app.";
    return config;
  });

  return config;
};