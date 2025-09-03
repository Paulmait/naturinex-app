const path = require('path');
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Find the existing babel-loader rule
      const oneOfRule = webpackConfig.module.rules.find(rule => rule.oneOf);
      
      if (oneOfRule) {
        // Add babel-loader for React Native modules with Flow syntax FIRST
        oneOfRule.oneOf.unshift({
          test: /\.(js|jsx)$/,
          include: [
            /node_modules[/\\]react-native/,
            /node_modules[/\\]@react-native/
          ],
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-react', { runtime: 'automatic' }]
              ],
              plugins: [
                '@babel/plugin-transform-flow-strip-types',
                ['@babel/plugin-proposal-class-properties', { loose: true }],
                '@babel/plugin-proposal-export-namespace-from',
                '@babel/plugin-transform-modules-commonjs'
              ],
              cacheDirectory: true
            }
          }
        });
      }

      // Add null-loader for navigation and other problematic modules
      webpackConfig.module.rules.push({
        test: /\.(js|jsx|ts|tsx)$/,
        include: [
          /node_modules[/\\]@react-navigation/,
          /node_modules[/\\]@stripe[/\\]stripe-react-native/,
          /node_modules[/\\]react-native-screens/,
          /node_modules[/\\]react-native-safe-area-context/,
          /node_modules[/\\]react-native-webview/,
          /node_modules[/\\]expo/,
          /node_modules[/\\]@expo/
        ],
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
        // Replace AsyncStorage
        '@react-native-async-storage/async-storage': 
          '@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.web.js',
        // Navigation and other modules
        '@react-navigation/native': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        '@react-navigation/native-stack': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        'react-native-screens': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        'react-native-safe-area-context': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        'react-native-webview': path.resolve(__dirname, 'src/web/mocks/empty.js'),
        '@stripe/stripe-react-native': path.resolve(__dirname, 'src/web/mocks/empty.js')
      };

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
        "fs": false
      };

      return webpackConfig;
    }
  }
};