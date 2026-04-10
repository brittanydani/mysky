const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");
const path = require('path');

const config = getSentryExpoConfig(__dirname);

const threeSingletonEntry = path.join(__dirname, 'node_modules/three/build/three.module.js');
const defaultResolveRequest = config.resolver.resolveRequest;

config.transformer.babelTransformerPath =
  require.resolve('react-native-svg-transformer');

config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'svg'
);
config.resolver.sourceExts.push('svg');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return {
      filePath: threeSingletonEntry,
      type: 'sourceFile',
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;