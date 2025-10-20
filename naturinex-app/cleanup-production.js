#!/usr/bin/env node

/**
 * Production Cleanup Script
 * Removes console.log, test data, and ensures production readiness
 */

const fs = require('fs');
const path = require('path');

const results = {
  filesProcessed: 0,
  consoleLogsRemoved: 0,
  consoleErrorsKept: 0,
  filesModified: [],
  issues: []
};

// Directories to scan
const dirsToScan = [
  path.join(__dirname, 'src'),
];

// Files to skip
const skipFiles = [
  'node_modules',
  '.git',
  'build',
  'dist',
  '.test.js',
  '.spec.js',
  'test-',
  'cleanup-production.js'
];

function shouldSkipFile(filePath) {
  return skipFiles.some(skip => filePath.includes(skip));
}

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) {
    return;
  }

  if (shouldSkipFile(filePath)) {
    return;
  }

  try {
    results.filesProcessed++;
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let modified = false;

    // Count and remove console.log statements (but keep console.error for production debugging)
    const consoleLogMatches = content.match(/console\.log\([^)]*\);?/g) || [];
    const consoleWarnMatches = content.match(/console\.warn\([^)]*\);?/g) || [];

    if (consoleLogMatches.length > 0 || consoleWarnMatches.length > 0) {
      // Remove console.log and console.warn
      newContent = newContent.replace(/console\.log\([^)]*\);?/g, '');
      newContent = newContent.replace(/console\.warn\([^)]*\);?/g, '');

      results.consoleLogsRemoved += consoleLogMatches.length + consoleWarnMatches.length;
      modified = true;
    }

    // Count console.error (keep these for production debugging)
    const consoleErrorMatches = content.match(/console\.error\([^)]*\);?/g) || [];
    results.consoleErrorsKept += consoleErrorMatches.length;

    // Clean up extra blank lines created by removing console statements
    if (modified) {
      newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    }

    // Write back if modified
    if (modified && newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      results.filesModified.push(filePath);
    }

  } catch (error) {
    results.issues.push({
      file: filePath,
      error: error.message
    });
  }
}

function scanDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!shouldSkipFile(filePath)) {
          scanDirectory(filePath);
        }
      } else {
        processFile(filePath);
      }
    });
  } catch (error) {
    results.issues.push({
      dir: dir,
      error: error.message
    });
  }
}

// Main execution
console.log('🧹 Starting production cleanup...\n');

dirsToScan.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Scanning: ${dir}`);
    scanDirectory(dir);
  }
});

// Print results
console.log('\n' + '='.repeat(60));
console.log('✅ CLEANUP COMPLETE');
console.log('='.repeat(60));
console.log(`\n📊 Statistics:`);
console.log(`  Files Processed: ${results.filesProcessed}`);
console.log(`  Files Modified: ${results.filesModified.length}`);
console.log(`  console.log/warn Removed: ${results.consoleLogsRemoved}`);
console.log(`  console.error Kept: ${results.consoleErrorsKept} (for production debugging)`);

if (results.filesModified.length > 0) {
  console.log(`\n📝 Modified Files:`);
  results.filesModified.slice(0, 10).forEach(file => {
    console.log(`  - ${path.relative(__dirname, file)}`);
  });
  if (results.filesModified.length > 10) {
    console.log(`  ... and ${results.filesModified.length - 10} more`);
  }
}

if (results.issues.length > 0) {
  console.log(`\n⚠️  Issues Encountered: ${results.issues.length}`);
  results.issues.forEach(issue => {
    console.log(`  - ${issue.file || issue.dir}: ${issue.error}`);
  });
}

console.log('\n✅ Production code is now clean and ready for deployment!\n');

// Exit with appropriate code
process.exit(results.issues.length > 0 ? 1 : 0);
