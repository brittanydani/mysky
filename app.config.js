const APP_VARIANT = process.env.APP_VARIANT ?? 'production';
const isDevVariant = APP_VARIANT === 'development';
const isPreviewVariant = APP_VARIANT === 'preview';
const isLightweightDevMode = process.env.EXPO_PUBLIC_LIGHTWEIGHT_DEV === '1';

// Use the same bundle/package identity across all variants
// so RevenueCat and App Store products match.
const SHARED_IOS_BUNDLE_ID = 'com.brittany.mysky';
const SHARED_ANDROID_PACKAGE = 'com.brittany.mysky';

module.exports = ({ config }) => {
  let name = config.name;
  let scheme = config.scheme;

  if (isDevVariant) {
    name = 'MySky Dev';
    scheme = 'mysky-dev';
  } else if (isPreviewVariant) {
    name = 'MySky Preview';
    scheme = 'mysky-preview';
  }

  return {
    ...config,
    name,
    scheme,
    ios: {
      ...config.ios,
      bundleIdentifier: SHARED_IOS_BUNDLE_ID,
    },
    android: {
      ...config.android,
      package: SHARED_ANDROID_PACKAGE,
    },
    extra: {
      ...config.extra,
      appVariant: APP_VARIANT,
      lightweightDevMode: isLightweightDevMode,
    },
  };
};
