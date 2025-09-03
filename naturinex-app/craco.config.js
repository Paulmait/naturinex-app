const path = require('path');
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Find the babel-loader rule
      const oneOfRule = webpackConfig.module.rules.find(rule => rule.oneOf);
      
      if (oneOfRule) {
        // Add a specific loader for React Native modules BEFORE other loaders
        oneOfRule.oneOf.unshift({
          test: /\.(js|jsx|ts|tsx)$/,
          include: /node_modules[\\\/]react-native/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-react',
                '@babel/preset-flow'
              ],
              plugins: [
                '@babel/plugin-transform-flow-strip-types',
                ['@babel/plugin-proposal-class-properties', { loose: true }],
                '@babel/plugin-proposal-export-namespace-from',
                '@babel/plugin-proposal-export-default-from',
                '@babel/plugin-syntax-dynamic-import',
                '@babel/plugin-transform-modules-commonjs'
              ]
            }
          }
        });
      }

      // Use webpack's IgnorePlugin to skip problematic modules entirely
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
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /^react-native-gesture-handler$/
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /^react-native-reanimated$/
        })
      );

      // Add fallbacks
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "crypto": false,
        "stream": false,
        "assert": false,
        "http": false,
        "https": false,
        "os": false,
        "url": false,
        "fs": false
      };

      // Critical aliases
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'react-native$': 'react-native-web',
        'react-native/Libraries/EventEmitter/NativeEventEmitter': 
          path.resolve(__dirname, 'src/web/mocks/NativeEventEmitter.js'),
        '@react-native-async-storage/async-storage': 
          '@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.web.js'
      };

      // Extensions
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
        /Module not found/,
        /export .* was not found/
      ];

      return webpackConfig;
    }
  },
  babel: {
    presets: [
      '@babel/preset-react',
      '@babel/preset-flow'
    ],
    plugins: [
      '@babel/plugin-transform-flow-strip-types',
      ['@babel/plugin-proposal-class-properties', { loose: true }]
    ]
  }
};