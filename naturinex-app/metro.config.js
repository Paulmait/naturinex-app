const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const config = getDefaultConfig(__dirname);

// Exclude server-side code from Metro bundler
config.resolver.blockList = exclusionList([
  // Exclude entire server directory
  new RegExp(`${path.resolve(__dirname, 'server').replace(/[/\\]/g, '/')}\/.*`),
  // Exclude server files
  /.*\.server\.[jt]sx?$/,
  /.*-server\.[jt]sx?$/,
  // Exclude development/test files
  /.*\.dev\.[jt]sx?$/,
  /.*\.test\.[jt]sx?$/,
  /.*\.spec\.[jt]sx?$/,
  /.*\/__tests__\/.*/,
]);

module.exports = config;
