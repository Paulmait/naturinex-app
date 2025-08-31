#!/usr/bin/env node

// Startup script for Render deployment
// This ensures we're running from the correct directory

const path = require('path');
const fs = require('fs');

console.log('=== Naturinex Server Startup ===');
console.log('Node version:', process.version);
console.log('Current directory:', __dirname);
console.log('Process cwd:', process.cwd());

// Check if phantom directories exist and warn
if (fs.existsSync(path.join(__dirname, '../src/server'))) {
  console.error('WARNING: Phantom src/server directory detected!');
  console.error('This should not exist. Ignoring it.');
}

// Ensure we're in the server directory
if (!fs.existsSync(path.join(__dirname, 'index.js'))) {
  console.error('ERROR: index.js not found in current directory');
  console.error('Files in current directory:');
  fs.readdirSync(__dirname).forEach(file => {
    console.error(`  - ${file}`);
  });
  process.exit(1);
}

// Start the actual server
console.log('Starting server from index.js...');
try {
  require('./index.js');
} catch (error) {
  console.error('Failed to start server:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}