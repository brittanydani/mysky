module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      // Strip console.* in all non-dev builds. Metro sets NODE_ENV='production'
      // during EAS builds, but we also guard on __DEV__ absence as a safety net.
      ...(process.env.NODE_ENV === 'production' || process.env.EAS_BUILD === 'true'
        ? ['transform-remove-console']
        : []),
    ],
  }
}
