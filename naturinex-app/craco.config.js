const path = require('path');
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // CRITICAL: Block ALL React Native modules from being parsed
      // This MUST be the first rule to prevent any processing
      webpackConfig.module.rules.unshift({
        test: /\.(js|jsx|ts|tsx)$/,
        include: [
          /node_modules\/react-native/,
          /node_modules\/@react-native/,
          /node_modules\/expo/,
          /node_modules\/@expo/,
          /node_modules\/@react-navigation/,
          /node_modules\/@stripe\/stripe-react-native/,
          /node_modules\/react-native-screens/,
          /node_modules\/react-native-safe-area-context/,
          /node_modules\/react-native-webview/
        ],
        loader: 'null-loader'
      });

      // Add .web.js extension priority
      webpackConfig.resolve.extensions = [
        '.web.js',
        '.web.jsx', 
        '.web.ts',
        '.web.tsx',
        ...webpackConfig.resolve.extensions
      ];

      // Module replacements - map problematic modules to empty ones
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        // Replace react-native with react-native-web
        'react-native$': 'react-native-web',
        'react-native/Libraries/EventEmitter/NativeEventEmitter': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        'react-native/Libraries/EventEmitter/EventEmitter': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        // Replace AsyncStorage
        '@react-native-async-storage/async-storage': 
          '@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.web.js',
        // Replace navigation modules
        '@react-navigation/native': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        '@react-navigation/native-stack': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        'react-native-screens': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        'react-native-safe-area-context': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        'react-native-webview': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        '@stripe/stripe-react-native': path.resolve(__dirname, 'src/web/mocks/empty.js')
      };

      // Use IgnorePlugin as additional protection
      webpackConfig.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /react-native|@react-native|expo|@expo|@react-navigation|@stripe\/stripe-react-native/
        })
      );

      // Add NormalModuleReplacementPlugin to catch any remaining imports
      webpackConfig.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /.*NativeEventEmitter.*/,
          path.resolve(__dirname, 'src/web/mocks/empty.js')
        )
      );

      // Add fallbacks for Node.js modules
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
        "fs": false,
        "path": false,
        "zlib": false,
        "querystring": false,
        "events": false,
        "tty": false,
        "net": false,
        "tls": false,
        "dns": false,
        "dgram": false,
        "child_process": false,
        "cluster": false,
        "module": false,
        "readline": false,
        "repl": false,
        "vm": false
      };

      // Exclude problematic files from parsing entirely
      webpackConfig.module.noParse = /react-native|NativeEventEmitter/;

      return webpackConfig;
    }
  }
};