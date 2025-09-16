// Coverage setup and configuration

// Global coverage tracking
global.__coverage__ = global.__coverage__ || {};

// Custom coverage utilities
global.coverageUtils = {
  // Track function calls for coverage
  trackFunction: (functionName, filePath) => {
    if (global.__coverage__ && global.__coverage__[filePath]) {
      const coverage = global.__coverage__[filePath];
      if (coverage.f && coverage.f[functionName]) {
        coverage.f[functionName]++;
      }
    }
  },
  
  // Track statement execution
  trackStatement: (statementId, filePath) => {
    if (global.__coverage__ && global.__coverage__[filePath]) {
      const coverage = global.__coverage__[filePath];
      if (coverage.s && coverage.s[statementId]) {
        coverage.s[statementId]++;
      }
    }
  },
  
  // Track branch execution
  trackBranch: (branchId, branchIndex, filePath) => {
    if (global.__coverage__ && global.__coverage__[filePath]) {
      const coverage = global.__coverage__[filePath];
      if (coverage.b && coverage.b[branchId] && coverage.b[branchId][branchIndex] !== undefined) {
        coverage.b[branchId][branchIndex]++;
      }
    }
  },
  
  // Get coverage summary
  getCoverageSummary: () => {
    if (!global.__coverage__) return null;
    
    const files = Object.keys(global.__coverage__);
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalLines = 0;
    let coveredLines = 0;
    
    files.forEach(file => {
      const coverage = global.__coverage__[file];
      
      // Statements
      const statements = Object.values(coverage.s || {});
      totalStatements += statements.length;
      coveredStatements += statements.filter(count => count > 0).length;
      
      // Branches
      const branches = Object.values(coverage.b || {});
      branches.forEach(branch => {
        totalBranches += branch.length;
        coveredBranches += branch.filter(count => count > 0).length;
      });
      
      // Functions
      const functions = Object.values(coverage.f || {});
      totalFunctions += functions.length;
      coveredFunctions += functions.filter(count => count > 0).length;
      
      // Lines
      const lines = Object.values(coverage.l || {});
      totalLines += lines.length;
      coveredLines += lines.filter(count => count > 0).length;
    });
    
    return {
      statements: {
        total: totalStatements,
        covered: coveredStatements,
        percentage: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0
      },
      branches: {
        total: totalBranches,
        covered: coveredBranches,
        percentage: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0
      },
      functions: {
        total: totalFunctions,
        covered: coveredFunctions,
        percentage: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0
      },
      lines: {
        total: totalLines,
        covered: coveredLines,
        percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
      }
    };
  }
};

// Mock console methods to reduce noise during coverage tests
if (process.env.NODE_ENV === 'test' && process.env.COVERAGE_MODE) {
  const originalConsole = { ...console };
  
  // Suppress non-critical console outputs
  console.debug = jest.fn();
  console.info = jest.fn();
  
  // Keep important outputs but format them for coverage reports
  console.warn = jest.fn((message, ...args) => {
    if (process.env.VERBOSE_COVERAGE) {
      originalConsole.warn('[COVERAGE WARNING]', message, ...args);
    }
  });
  
  console.error = jest.fn((message, ...args) => {
    if (process.env.VERBOSE_COVERAGE) {
      originalConsole.error('[COVERAGE ERROR]', message, ...args);
    }
  });
}

// Setup coverage tracking for async operations
if (typeof global.Promise !== 'undefined') {
  const originalThen = global.Promise.prototype.then;
  const originalCatch = global.Promise.prototype.catch;
  const originalFinally = global.Promise.prototype.finally;
  
  // Track promise resolution for coverage
  global.Promise.prototype.then = function(onFulfilled, onRejected) {
    const wrappedOnFulfilled = onFulfilled ? function(...args) {
      try {
        return onFulfilled.apply(this, args);
      } catch (error) {
        // Track error in coverage if needed
        throw error;
      }
    } : undefined;
    
    const wrappedOnRejected = onRejected ? function(...args) {
      try {
        return onRejected.apply(this, args);
      } catch (error) {
        // Track error in coverage if needed
        throw error;
      }
    } : undefined;
    
    return originalThen.call(this, wrappedOnFulfilled, wrappedOnRejected);
  };
  
  global.Promise.prototype.catch = function(onRejected) {
    const wrappedOnRejected = onRejected ? function(...args) {
      try {
        return onRejected.apply(this, args);
      } catch (error) {
        // Track error in coverage if needed
        throw error;
      }
    } : undefined;
    
    return originalCatch.call(this, wrappedOnRejected);
  };
  
  if (originalFinally) {
    global.Promise.prototype.finally = function(onFinally) {
      const wrappedOnFinally = onFinally ? function(...args) {
        try {
          return onFinally.apply(this, args);
        } catch (error) {
          // Track error in coverage if needed
          throw error;
        }
      } : undefined;
      
      return originalFinally.call(this, wrappedOnFinally);
    };
  }
}

// Setup DOM coverage tracking for React components
if (typeof global.document !== 'undefined') {
  // Track DOM mutations for component coverage
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Track component renders in coverage
        const addedNodes = Array.from(mutation.addedNodes);
        addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const componentName = node.getAttribute('data-testid') || node.className;
            if (componentName) {
              global.coverageUtils.trackStatement(`component_render_${componentName}`, 'virtual://components');
            }
          }
        });
      }
    });
  });
  
  // Start observing DOM changes
  if (global.document.body) {
    observer.observe(global.document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true
    });
  }
  
  // Cleanup observer after tests
  afterAll(() => {
    observer.disconnect();
  });
}

// Coverage reporting utilities
global.generateCoverageReport = () => {
  const summary = global.coverageUtils.getCoverageSummary();
  
  if (!summary) {
    console.log('No coverage data available');
    return;
  }
  
  console.log('\n=== Coverage Summary ===');
  console.log(`Statements: ${summary.statements.covered}/${summary.statements.total} (${summary.statements.percentage.toFixed(2)}%)`);
  console.log(`Branches: ${summary.branches.covered}/${summary.branches.total} (${summary.branches.percentage.toFixed(2)}%)`);
  console.log(`Functions: ${summary.functions.covered}/${summary.functions.total} (${summary.functions.percentage.toFixed(2)}%)`);
  console.log(`Lines: ${summary.lines.covered}/${summary.lines.total} (${summary.lines.percentage.toFixed(2)}%)`);
  
  // Check if thresholds are met
  const threshold = 80;
  const passing = [
    summary.statements.percentage >= threshold,
    summary.branches.percentage >= threshold,
    summary.functions.percentage >= threshold,
    summary.lines.percentage >= threshold
  ].every(Boolean);
  
  console.log(`\nCoverage threshold (${threshold}%): ${passing ? 'PASSED' : 'FAILED'}`);
  
  return { summary, passing };
};

// Export coverage utilities for use in tests
module.exports = {
  coverageUtils: global.coverageUtils,
  generateCoverageReport: global.generateCoverageReport
};