#!/usr/bin/env node

/**
 * Entry point for Render deployment
 * Render is detecting this as the main entry due to package.json location
 */

const path = require('path');
const { spawn } = require('child_process');

console.log('=================================');
console.log('Naturinex Server Starting...');
console.log('=================================');
console.log('Node version:', process.version);
console.log('Current directory:', __dirname);
console.log('Changing to server directory...');

// Change to server directory
const serverPath = path.join(__dirname, '..', 'server');
process.chdir(serverPath);
console.log('Now in:', process.cwd());

// Start the actual server
try {
  require('./index.js');
} catch (error) {
  console.error('Failed to start server:', error.message);
  console.error('Attempting direct require...');
  
  try {
    require(path.join(serverPath, 'index.js'));
  } catch (err2) {
    console.error('Direct require also failed:', err2.message);
    process.exit(1);
  }
}