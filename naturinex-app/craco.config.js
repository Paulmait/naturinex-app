const path = require('path');
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // FIRST PRIORITY: Completely replace the problematic NativeEventEmitter
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        // Replace react-native entirely with react-native-web
        'react-native$': 'react-native-web',
        // Replace the specific problematic file
        'react-native/Libraries/EventEmitter/NativeEventEmitter$': 
          path.resolve(__dirname, 'src/web/mocks/NativeEventEmitter.js'),
        'react-native/Libraries/EventEmitter/NativeEventEmitter.js$': 
          path.resolve(__dirname, 'src/web/mocks/NativeEventEmitter.js'),
        // Replace EventEmitter imports
        './EventEmitter': path.resolve(__dirname, 'src/web/mocks/NativeEventEmitter.js'),
        // AsyncStorage
        '@react-native-async-storage/async-storage': 
          '@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.web.js'
      };

      // Add a custom loader for the specific problematic pattern
      webpackConfig.module.rules.push({
        test: /NativeEventEmitter\.js$/,
        loader: 'string-replace-loader',
        options: {
          search: 'import EventEmitter, { type EventSubscription }',
          replace: 'import EventEmitter',
          flags: 'g'
        }
      });

      // Use webpack's NormalModuleReplacementPlugin for more control
      webpackConfig.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /react-native\/Libraries\/EventEmitter\/NativeEventEmitter/,
          path.resolve(__dirname, 'src/web/mocks/NativeEventEmitter.js')
        )
      );

      // Ignore navigation modules
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

      // Extensions
      webpackConfig.resolve.extensions = [
        '.web.js',
        '.web.jsx',
        '.web.ts',
        '.web.tsx',
        ...webpackConfig.resolve.extensions
      ];

      // Handle .js files from react-native with babel
      const oneOfRule = webpackConfig.module.rules.find(rule => rule.oneOf);
      if (oneOfRule) {
        oneOfRule.oneOf.unshift({
          test: /\.js$/,
          include: /node_modules[\\\/]react-native/,
          exclude: /node_modules[\\\/]react-native[\\\/]Libraries[\\\/]EventEmitter/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react'],
              plugins: [
                '@babel/plugin-transform-flow-strip-types',
                ['@babel/plugin-proposal-class-properties', { loose: true }]
              ],
              cacheDirectory: true
            }
          }
        });
      }

      return webpackConfig;
    }
  }
};