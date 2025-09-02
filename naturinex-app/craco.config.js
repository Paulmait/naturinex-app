module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore React Native modules completely
      webpackConfig.module.rules.push({
        test: /\.js$/,
        include: /node_modules[\\\/](react-native|@react-native|expo|@expo)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react'],
            plugins: ['@babel/plugin-syntax-flow'],
            cacheDirectory: true
          }
        }
      });

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
        "fs": false
      };

      // Alias React Native to React Native Web
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'react-native$': 'react-native-web',
        'react-native/Libraries/EventEmitter/NativeEventEmitter': 'react-native-web/dist/vendor/react-native/NativeEventEmitter',
        '@react-native-async-storage/async-storage': '@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.web.js'
      };

      // Ignore specific files that cause issues
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /Module not found.*react-native/
      ];

      return webpackConfig;
    }
  }
};