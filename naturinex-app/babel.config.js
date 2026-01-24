module.exports = function(api) {
  api.cache(true);

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Remove console.log statements in production builds
      // This improves performance and prevents sensitive data leakage
      isProduction && ['transform-remove-console', {
        exclude: ['error', 'warn'] // Keep console.error and console.warn for critical issues
      }]
    ].filter(Boolean)
  };
};
