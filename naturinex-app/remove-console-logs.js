const fs = require('fs');
const path = require('path');

// Directories to process
const directories = ['src', 'server', 'functions'];
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

let totalRemoved = 0;
let filesProcessed = 0;

function removeConsoleLogs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Remove console.log, console.error, console.warn, console.info, console.debug
  // But keep console.error for critical error handling
  const patterns = [
    /console\.log\([^)]*\);?/g,
    /console\.warn\([^)]*\);?/g,
    /console\.info\([^)]*\);?/g,
    /console\.debug\([^)]*\);?/g,
    /console\.trace\([^)]*\);?/g,
    /console\.table\([^)]*\);?/g,
  ];

  let removedCount = 0;
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      removedCount += matches.length;
      content = content.replace(pattern, '');
    }
  });

  // Clean up empty lines left behind
  content = content.replace(/^\s*[\r\n]/gm, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Processed ${filePath}: Removed ${removedCount} console statements`);
    totalRemoved += removedCount;
    filesProcessed++;
  }

  return removedCount;
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Directory ${dir} does not exist, skipping...`);
    return;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and other build directories
      if (!['node_modules', '.git', 'build', 'dist', 'coverage', '.next'].includes(file)) {
        processDirectory(filePath);
      }
    } else if (extensions.includes(path.extname(file))) {
      removeConsoleLogs(filePath);
    }
  });
}

console.log('🧹 Starting to remove console.log statements...\n');

directories.forEach(dir => {
  console.log(`📁 Processing directory: ${dir}`);
  processDirectory(dir);
});

console.log('\n📊 Summary:');
console.log(`✅ Total console statements removed: ${totalRemoved}`);
console.log(`📄 Files processed: ${filesProcessed}`);
console.log('\n✨ Console.log cleanup complete!');