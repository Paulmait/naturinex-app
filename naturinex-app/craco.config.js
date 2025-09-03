module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add rule to handle React Native modules with null-loader (ignore them completely for web)
      webpackConfig.module.rules.unshift({
        test: /\.(js|jsx|ts|tsx)$/,
        include: /node_modules[\\\/](react-native-screens|react-native-safe-area-context|@react-navigation|react-native-reanimated|react-native-gesture-handler)/,
        use: 'null-loader'
      });

      // Handle Expo and React Native modules
      webpackConfig.module.rules.push({
        test: /\.(js|jsx)$/,
        include: /node_modules[\\\/](expo|@expo|react-native|@react-native)/,
        exclude: /node_modules[\\\/](expo|@expo|react-native|@react-native).*\.(native|ios|android)\.(js|jsx|ts|tsx)$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['babel-preset-expo'],
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
        "fs": false,
        "events": false,
        "process": false
      };

      // Alias React Native to React Native Web
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'react-native$': 'react-native-web',
        'react-native/Libraries/EventEmitter/NativeEventEmitter': 'react-native-web/dist/vendor/react-native/NativeEventEmitter',
        'react-native/Libraries/EventEmitter/EventEmitter': 'events',
        '@react-native-async-storage/async-storage': '@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.web.js',
        'expo-camera': false,
        'expo-media-library': false,
        'expo-image-picker': false,
        'expo-file-system': false,
        'expo-sharing': false,
        '@stripe/stripe-react-native': false
      };

      // Add extensions
      webpackConfig.resolve.extensions = [
        '.web.js',
        '.web.jsx',
        '.web.ts',
        '.web.tsx',
        ...webpackConfig.resolve.extensions
      ];

      // Ignore specific files that cause issues
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /Module not found.*react-native/,
        /export .* was not found in/
      ];

      return webpackConfig;
    }
  }
};