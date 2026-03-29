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
  {
    // react-three-fiber (3D canvas) components use Three.js JSX props that differ from
    // standard DOM/React Native props — suppress false positives from the prop linter
    files: [
      'components/ui/CircadianRhythmTerrain.tsx',
      'components/ui/CorrelationGyroscope.tsx',
      'components/ui/DreamClusterMap.tsx',
    ],
    rules: {
      'react/no-unknown-property': 'off',
    },
  },
  {
    // Jest test files use jest.mock() before imports (hoisted by Jest at runtime)
    // import/first false-positive for this pattern
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'import/first': 'off',
    },
  },
]);
