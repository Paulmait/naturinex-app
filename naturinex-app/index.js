// Root entry point for Render deployment
// This file redirects to the actual server in /server directory

console.log('Starting Naturinex server from root index.js...');
console.log('Current directory:', __dirname);
console.log('Looking for server at:', './server/index.js');

try {
  require('./server/index.js');
} catch (error) {
  console.error('Failed to start server:', error.message);
  console.error('Stack trace:', error.stack);
  
  // If the above fails, try alternative path
  try {
    console.log('Trying alternative path: server/index.js');
    require('server/index.js');
  } catch (err2) {
    console.error('Alternative path also failed:', err2.message);
    process.exit(1);
  }
}