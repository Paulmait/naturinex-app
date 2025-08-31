// Root entry point for Render deployment
// This file redirects to the actual server in /server directory

const path = require('path');
const fs = require('fs');

console.log('=== Naturinex Server Startup ===');
console.log('Current directory:', __dirname);
console.log('Process cwd:', process.cwd());

// List files in current directory for debugging
console.log('Files in current directory:');
const files = fs.readdirSync(__dirname);
files.forEach(file => {
  const stat = fs.statSync(path.join(__dirname, file));
  console.log(`  - ${file} (${stat.isDirectory() ? 'directory' : 'file'})`);
});

// Check if server directory exists
const serverPath = path.join(__dirname, 'server');
if (fs.existsSync(serverPath)) {
  console.log('✓ Server directory found at:', serverPath);
  const serverIndex = path.join(serverPath, 'index.js');
  
  if (fs.existsSync(serverIndex)) {
    console.log('✓ Server index.js found at:', serverIndex);
    console.log('Starting server...');
    
    // Change to server directory and start
    process.chdir(serverPath);
    console.log('Changed working directory to:', process.cwd());
    
    require('./index.js');
  } else {
    console.error('✗ Server index.js not found at:', serverIndex);
    process.exit(1);
  }
} else {
  console.error('✗ Server directory not found at:', serverPath);
  console.error('Please ensure the server directory exists with index.js file');
  process.exit(1);
}