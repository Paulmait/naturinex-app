const path = require('path');
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // First, handle all React Native modules with null-loader
      // This needs to be at the BEGINNING of the rules array
      webpackConfig.module.rules.unshift({
        test: /\.js$/,
        include: /node_modules[\\/](react-native|@react-native|expo|@expo|@react-navigation|@stripe[\\/]stripe-react-native)/,
        use: 'null-loader'
      });

      // Add another rule specifically for the problematic EventEmitter file
      webpackConfig.module.rules.unshift({
        test: /NativeEventEmitter\.js$/,
        use: 'null-loader'
      });

      // Add .web.js extension priority
      webpackConfig.resolve.extensions = [
        '.web.js',
        '.web.jsx', 
        '.web.ts',
        '.web.tsx',
        ...webpackConfig.resolve.extensions
      ];

      // Module replacements
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        // Replace react-native with react-native-web
        'react-native$': 'react-native-web',
        // Replace specific problematic modules
        'react-native/Libraries/EventEmitter/NativeEventEmitter': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        // Replace AsyncStorage
        '@react-native-async-storage/async-storage': 
          '@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.web.js',
        // Replace navigation modules with empty modules
        '@react-navigation/native': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        '@react-navigation/native-stack': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        'react-native-screens': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        'react-native-safe-area-context': path.resolve(__dirname, 'src/web/mocks/empty.js')
      };

      // Use IgnorePlugin as backup
      webpackConfig.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^react-native-screens$/
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /^react-native-safe-area-context$/
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /^@react-navigation\/native$/
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /^@react-navigation\/native-stack$/
        })
      );

      // Add fallbacks
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
        "fs": false
      };

      return webpackConfig;
    }
  }
};