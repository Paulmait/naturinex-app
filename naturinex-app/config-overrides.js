const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add fallbacks for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer/"),
    "util": require.resolve("util/"),
    "process": require.resolve("process/browser.js")
  };

  // Add plugins for Node.js globals
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer']
    })
  ];

  // Ignore React Native modules
  config.module.rules.push({
    test: /node_modules[\\/](react-native|@react-native|expo|@expo|@react-navigation|@stripe[\\/]stripe-react-native)[\\/]/,
    use: 'null-loader'
  });

  // Ignore specific problematic imports
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web'
  };

  return config;
};