const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude server-side code from Metro bundler
config.resolver.blockList = [
  // Exclude server directory and all its contents
  /server\/.*/,
  /\/server\/.*/,
  // Exclude server files
  /.*\.server\.js$/,
  /.*-server\.js$/,
  // Exclude development/test files
  /.*\.dev\.js$/,
  /.*\.test\.js$/,
  /.*\.spec\.js$/,
];

module.exports = config;
