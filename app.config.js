const { expo: baseConfig } = require('./app.json');

const APP_VARIANT = process.env.APP_VARIANT ?? 'production';
const isDevVariant = APP_VARIANT === 'development';
const isPreviewVariant = APP_VARIANT === 'preview';
const isLightweightDevMode = process.env.EXPO_PUBLIC_LIGHTWEIGHT_DEV === '1';

let name = baseConfig.name;
let scheme = baseConfig.scheme;
let iosBundleIdentifier = baseConfig.ios?.bundleIdentifier;
let androidPackage = baseConfig.android?.package;

if (isDevVariant) {
  name = 'MySky Dev';
  scheme = 'mysky-dev';
  iosBundleIdentifier = 'com.brittany.mysky.dev';
  androidPackage = 'com.brittany.mysky.dev';
} else if (isPreviewVariant) {
  name = 'MySky Preview';
  scheme = 'mysky-preview';
  iosBundleIdentifier = 'com.brittany.mysky.preview';
  androidPackage = 'com.brittany.mysky.preview';
}

module.exports = () => ({
  ...baseConfig,
  name,
  scheme,
  ios: {
    ...baseConfig.ios,
    bundleIdentifier: iosBundleIdentifier,
  },
  android: {
    ...baseConfig.android,
    package: androidPackage,
  },
  extra: {
    ...baseConfig.extra,
    appVariant: APP_VARIANT,
    lightweightDevMode: isLightweightDevMode,
  },
});
