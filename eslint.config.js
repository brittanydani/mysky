// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // React Native <Text> handles quotes/apostrophes natively — no HTML escaping needed
      'react/no-unescaped-entities': 'off',
    },
  },
]);
