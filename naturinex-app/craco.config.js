const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // CRITICAL: Completely ignore EventEmitter and other problematic RN modules
      webpackConfig.module.rules.unshift({
        test: /EventEmitter\.js$/,
        use: 'null-loader'
      });

      // Ignore all React Navigation and related modules for web
      webpackConfig.module.rules.unshift({
        test: /\.(js|jsx|ts|tsx)$/,
        include: [
          /node_modules[\\\/]react-native-screens/,
          /node_modules[\\\/]react-native-safe-area-context/,
          /node_modules[\\\/]@react-navigation/,
          /node_modules[\\\/]react-native-reanimated/,
          /node_modules[\\\/]react-native-gesture-handler/,
          /node_modules[\\\/]@react-native-community/,
          /node_modules[\\\/]react-native[\\\/]Libraries[\\\/]EventEmitter/,
          /node_modules[\\\/]react-native[\\\/]Libraries[\\\/]vendor[\\\/]emitter/
        ],
        use: 'null-loader'
      });

      // Handle other React Native modules by converting to react-native-web
      const babelLoaderRule = webpackConfig.module.rules.find(
        rule => rule.oneOf
      );
      
      if (babelLoaderRule && babelLoaderRule.oneOf) {
        // Insert before the file-loader (which is usually last)
        babelLoaderRule.oneOf.splice(babelLoaderRule.oneOf.length - 1, 0, {
          test: /\.(js|jsx)$/,
          include: /node_modules[\\\/](react-native|expo)/,
          exclude: [
            /node_modules[\\\/]react-native[\\\/]Libraries[\\\/]EventEmitter/,
            /node_modules[\\\/]react-native-screens/,
            /node_modules[\\\/]react-native-safe-area-context/,
            /node_modules[\\\/]@react-navigation/
          ],
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['babel-preset-expo'],
              plugins: [
                '@babel/plugin-transform-flow-strip-types'
              ],
              cacheDirectory: true
            }
          }
        });
      }

      // Add fallbacks for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "crypto": false,
        "stream": false,
        "buffer": false,
        "util": false,
        "assert": false,
        "http": false,
        "https": false,
        "os": false,
        "url": false,
        "path": false,
        "fs": false,
        "events": require.resolve('events/'),
        "process": false
      };

      // Comprehensive aliases
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'react-native$': 'react-native-web',
        'react-native/Libraries/EventEmitter/EventEmitter': 'events',
        'react-native/Libraries/EventEmitter/NativeEventEmitter': 'events',
        'react-native/Libraries/vendor/emitter/EventEmitter': 'events',
        '@react-native-async-storage/async-storage': '@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.web.js',
        'expo-camera$': false,
        'expo-media-library$': false,
        'expo-image-picker$': false,
        'expo-file-system$': false,
        'expo-sharing$': false,
        '@stripe/stripe-react-native$': false,
        'react-native-screens$': false,
        'react-native-safe-area-context$': false,
        '@react-navigation/native$': false,
        '@react-navigation/native-stack$': false,
        'react-native-gesture-handler$': false,
        'react-native-reanimated$': false
      };

      // Add web-specific extensions first
      webpackConfig.resolve.extensions = [
        '.web.js',
        '.web.jsx',
        '.web.ts',
        '.web.tsx',
        ...webpackConfig.resolve.extensions
      ];

      // Ignore warnings
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /Module not found.*react-native/,
        /export .* was not found in/,
        /Can't resolve/
      ];

      // Ensure we have events package for EventEmitter fallback
      webpackConfig.resolve.modules = [
        ...webpackConfig.resolve.modules,
        path.resolve(__dirname, 'node_modules')
      ];

      return webpackConfig;
    }
  },
  babel: {
    plugins: [
      '@babel/plugin-transform-flow-strip-types',
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      ['@babel/plugin-proposal-private-methods', { loose: true }],
      ['@babel/plugin-proposal-private-property-in-object', { loose: true }]
    ]
  }
};