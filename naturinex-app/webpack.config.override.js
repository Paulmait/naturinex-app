// Webpack override to handle React Native modules for web build
module.exports = function override(config) {
  // Find the oneOf array and add our loader at the beginning
  const oneOfRule = config.module.rules.find((rule) => rule.oneOf);
  
  if (oneOfRule) {
    // Add a loader to ignore problematic React Native files
    oneOfRule.oneOf.unshift({
      test: /EventEmitter\.js$/,
      use: 'null-loader'
    });
    
    oneOfRule.oneOf.unshift({
      test: /NativeEventEmitter\.js$/,
      use: 'null-loader'
    });
  }
  
  // Add null-loader for all React Native navigation modules
  config.module.rules.unshift({
    test: /\.js$/,
    include: /node_modules[\\\/](react-native-screens|react-native-safe-area-context|@react-navigation)/,
    use: 'null-loader'
  });
  
  return config;
};