module.exports = {
  // Extends the main Jest configuration
  ...require('./jest.config.js'),
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/index.js',
    '!src/index.tsx',
    '!src/serviceWorker.js',
    '!src/reportWebVitals.js',
    '!src/setupTests.js',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/build/**',
    '!**/dist/**'
  ],
  
  // Coverage thresholds - enforce >80% coverage
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Service-specific thresholds (higher requirements for critical services)
    './src/services/encryptionService.js': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/services/drugInteractionService.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/services/disclaimerService.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/services/aiService.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    // Component-specific thresholds
    './src/components/Dashboard.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/components/ScanInterface.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'clover',
    'cobertura'
  ],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/coverage/',
    '/public/',
    '\\.stories\\.',
    '\\.story\\.',
    '/storybook-static/',
    '/e2e/',
    '/cypress/',
    '/__fixtures__/',
    '/fixtures/',
    '/demo/',
    '/examples/'
  ],
  
  // Additional test environment setup for coverage
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.js',
    '<rootDir>/src/setupCoverage.js'
  ],
  
  // Transform ignore patterns for coverage
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@testing-library)/)',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  
  // Module name mapping for coverage
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output for coverage
  verbose: true,
  
  // Coverage provider
  coverageProvider: 'v8',
  
  // Additional Jest options for better coverage reporting
  errorOnDeprecated: true,
  passWithNoTests: false,
  bail: false,
  
  // Performance optimization for coverage
  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache'
};