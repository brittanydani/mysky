const { expo: baseConfig } = require('./app.json');

const APP_VARIANT = process.env.APP_VARIANT;
const isDevVariant = APP_VARIANT === 'development';
const isLightweightDevMode = process.env.EXPO_PUBLIC_LIGHTWEIGHT_DEV === '1';

module.exports = () => ({
  ...baseConfig,
  name: isDevVariant ? 'MySky Dev' : baseConfig.name,
  icon: isDevVariant ? './assets/images/birth_logo.png' : baseConfig.icon,
  scheme: isDevVariant ? 'mysky-dev' : baseConfig.scheme,
  ios: {
    ...baseConfig.ios,
    bundleIdentifier: isDevVariant
      ? 'com.brittany.mysky.dev'
      : baseConfig.ios.bundleIdentifier,
  },
  android: {
    ...baseConfig.android,
    package: isDevVariant ? 'com.brittany.mysky.dev' : baseConfig.android?.package,
  },
  extra: {
    ...baseConfig.extra,
    appVariant: isDevVariant ? 'development' : 'production',
    lightweightDevMode: isLightweightDevMode,
  },
});