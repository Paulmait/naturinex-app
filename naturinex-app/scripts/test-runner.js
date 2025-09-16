#!/usr/bin/env node

/**
 * Comprehensive Test Runner for NaturineX
 * Orchestrates all testing types with proper reporting and quality gates
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

class TestRunner {
  constructor() {
    this.results = {
      unit: { status: 'pending', coverage: 0, duration: 0 },
      integration: { status: 'pending', coverage: 0, duration: 0 },
      e2e: { status: 'pending', coverage: 0, duration: 0 },
      security: { status: 'pending', vulnerabilities: 0, duration: 0 },
      performance: { status: 'pending', avgResponseTime: 0, duration: 0 },
      compliance: { status: 'pending', violations: 0, duration: 0 }
    };
    this.startTime = Date.now();
    this.coverageThreshold = 80;
  }

  async run() {
    console.log('🚀 Starting NaturineX Comprehensive Test Suite\n');
    
    try {
      // Pre-test setup
      await this.setup();
      
      // Run tests in parallel where possible
      await this.runTestSuites();
      
      // Generate reports
      await this.generateReports();
      
      // Quality gate check
      const passed = this.checkQualityGate();
      
      // Cleanup
      await this.cleanup();
      
      process.exit(passed ? 0 : 1);
    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    }
  }

  async setup() {
    console.log('🔧 Setting up test environment...');
    
    // Create necessary directories
    const dirs = ['coverage', 'test-results', 'reports'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Verify environment variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'API_BASE_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }
    
    console.log('✅ Test environment setup complete\n');
  }

  async runTestSuites() {
    const testSuites = [
      { name: 'unit', fn: () => this.runUnitTests() },
      { name: 'integration', fn: () => this.runIntegrationTests() },
      { name: 'security', fn: () => this.runSecurityTests() },
      { name: 'compliance', fn: () => this.runComplianceTests() }
    ];
    
    // Run critical tests first (unit, integration, compliance)
    for (const suite of testSuites) {
      await this.runTestSuite(suite.name, suite.fn);
    }
    
    // Run E2E and performance tests in parallel (if critical tests pass)
    const criticalTestsPassed = ['unit', 'integration', 'compliance'].every(
      test => this.results[test].status === 'passed'
    );
    
    if (criticalTestsPassed) {
      await Promise.allSettled([
        this.runTestSuite('e2e', () => this.runE2ETests()),
        this.runTestSuite('performance', () => this.runPerformanceTests())
      ]);
    } else {
      console.log('⚠️  Skipping E2E and performance tests due to critical test failures\n');
    }
  }

  async runTestSuite(name, testFn) {
    const startTime = Date.now();
    console.log(`🧪 Running ${name} tests...`);
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results[name].status = 'passed';
      this.results[name].duration = duration;
      console.log(`✅ ${name} tests passed (${this.formatDuration(duration)})\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results[name].status = 'failed';
      this.results[name].duration = duration;
      this.results[name].error = error.message;
      console.log(`❌ ${name} tests failed (${this.formatDuration(duration)})`);
      console.log(`   Error: ${error.message}\n`);
      
      // Fail fast for critical tests
      if (['unit', 'integration', 'compliance'].includes(name)) {
        throw error;
      }
    }
  }

  async runUnitTests() {
    const { stdout, stderr } = await execAsync(
      'npm run test:unit -- --coverage --coverageReporters=json --passWithNoTests=false',
      { timeout: 300000 } // 5 minutes
    );
    
    // Parse coverage from output
    this.results.unit.coverage = this.parseCoverage(stdout);
    
    if (this.results.unit.coverage < this.coverageThreshold) {
      throw new Error(`Unit test coverage ${this.results.unit.coverage}% below threshold ${this.coverageThreshold}%`);
    }
  }

  async runIntegrationTests() {
    const { stdout, stderr } = await execAsync(
      'npm run test:integration -- --coverage --coverageReporters=json',
      { timeout: 600000 } // 10 minutes
    );
    
    this.results.integration.coverage = this.parseCoverage(stdout);
  }

  async runE2ETests() {
    const { stdout, stderr } = await execAsync(
      'npm run test:e2e',
      { timeout: 1200000 } // 20 minutes
    );
    
    // Parse E2E test results
    this.parseE2EResults(stdout);
  }

  async runSecurityTests() {
    const { stdout, stderr } = await execAsync(
      'npm run test:security',
      { timeout: 900000 } // 15 minutes
    );
    
    // Parse security vulnerabilities
    this.results.security.vulnerabilities = this.parseSecurityResults(stdout);
    
    if (this.results.security.vulnerabilities > 0) {
      throw new Error(`Found ${this.results.security.vulnerabilities} security vulnerabilities`);
    }
  }

  async runPerformanceTests() {
    const { stdout, stderr } = await execAsync(
      'k6 run --out json=performance-results.json load-testing/medication-analysis-load.js',
      { timeout: 1800000 } // 30 minutes
    );
    
    // Parse performance metrics
    this.parsePerformanceResults();
  }

  async runComplianceTests() {
    const { stdout, stderr } = await execAsync(
      'npm run test:compliance',
      { timeout: 600000 } // 10 minutes
    );
    
    // Parse compliance violations
    this.results.compliance.violations = this.parseComplianceResults(stdout);
    
    if (this.results.compliance.violations > 0) {
      throw new Error(`Found ${this.results.compliance.violations} HIPAA compliance violations`);
    }
  }

  parseCoverage(output) {
    // Extract coverage percentage from Jest output
    const coverageMatch = output.match(/All files[\s\S]*?([0-9.]+)%/);
    return coverageMatch ? parseFloat(coverageMatch[1]) : 0;
  }

  parseE2EResults(output) {
    // Parse E2E test results from output
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    
    this.results.e2e.passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    this.results.e2e.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
  }

  parseSecurityResults(output) {
    // Count security vulnerabilities from output
    const vulnMatch = output.match(/found (\d+) vulnerabilities?/i);
    return vulnMatch ? parseInt(vulnMatch[1]) : 0;
  }

  parsePerformanceResults() {
    try {
      const results = JSON.parse(fs.readFileSync('performance-results.json', 'utf8'));
      const avgResponseTime = results.metrics?.http_req_duration?.values?.avg || 0;
      this.results.performance.avgResponseTime = Math.round(avgResponseTime);
      
      // Check if performance thresholds are met
      if (avgResponseTime > 3000) { // 3 seconds threshold
        throw new Error(`Average response time ${avgResponseTime}ms exceeds 3000ms threshold`);
      }
    } catch (error) {
      console.warn('Could not parse performance results:', error.message);
    }
  }

  parseComplianceResults(output) {
    // Count HIPAA compliance violations
    const violationMatch = output.match(/(\d+) violations?/i);
    return violationMatch ? parseInt(violationMatch[1]) : 0;
  }

  async generateReports() {
    console.log('📊 Generating test reports...');
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync('reports/test-report.html', htmlReport);
    
    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      results: this.results,
      summary: this.generateSummary()
    };
    fs.writeFileSync('reports/test-report.json', JSON.stringify(jsonReport, null, 2));
    
    // Generate coverage report
    await this.generateCoverageReport();
    
    console.log('✅ Reports generated successfully\n');
  }

  generateHTMLReport() {
    const summary = this.generateSummary();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>NaturineX Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; flex: 1; }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        .warning { border-left: 5px solid #ff9800; }
        .details { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>NaturineX Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Duration: ${this.formatDuration(Date.now() - this.startTime)}</p>
        <p>Overall Status: <strong style="color: ${summary.overallStatus === 'PASSED' ? 'green' : 'red'}">${summary.overallStatus}</strong></p>
    </div>
    
    <div class="summary">
        <div class="metric ${summary.overallStatus === 'PASSED' ? 'passed' : 'failed'}">
            <h3>Overall Coverage</h3>
            <p style="font-size: 2em; margin: 0;">${summary.averageCoverage}%</p>
        </div>
        <div class="metric">
            <h3>Tests Passed</h3>
            <p style="font-size: 2em; margin: 0;">${summary.testsPassed}/${summary.totalTests}</p>
        </div>
        <div class="metric">
            <h3>Security Issues</h3>
            <p style="font-size: 2em; margin: 0;">${this.results.security.vulnerabilities || 0}</p>
        </div>
        <div class="metric">
            <h3>Compliance Violations</h3>
            <p style="font-size: 2em; margin: 0;">${this.results.compliance.violations || 0}</p>
        </div>
    </div>
    
    <div class="details">
        <h2>Test Details</h2>
        <table>
            <tr>
                <th>Test Suite</th>
                <th>Status</th>
                <th>Coverage</th>
                <th>Duration</th>
                <th>Details</th>
            </tr>
            ${Object.entries(this.results).map(([name, result]) => `
            <tr>
                <td>${name.charAt(0).toUpperCase() + name.slice(1)}</td>
                <td style="color: ${result.status === 'passed' ? 'green' : 'red'}">${result.status.toUpperCase()}</td>
                <td>${result.coverage || 'N/A'}%</td>
                <td>${this.formatDuration(result.duration || 0)}</td>
                <td>${result.error || 'No issues'}</td>
            </tr>
            `).join('')}
        </table>
    </div>
</body>
</html>
    `;
  }

  async generateCoverageReport() {
    try {
      await execAsync('npx nyc report --reporter=html --report-dir=reports/coverage');
      console.log('📊 Coverage report generated at reports/coverage/index.html');
    } catch (error) {
      console.warn('Could not generate coverage report:', error.message);
    }
  }

  generateSummary() {
    const testSuites = Object.keys(this.results);
    const passedTests = testSuites.filter(test => this.results[test].status === 'passed').length;
    const totalTests = testSuites.length;
    
    const coverageValues = Object.values(this.results)
      .map(r => r.coverage)
      .filter(c => c > 0);
    const averageCoverage = coverageValues.length > 0 
      ? Math.round(coverageValues.reduce((a, b) => a + b, 0) / coverageValues.length)
      : 0;
    
    const overallStatus = passedTests === totalTests && averageCoverage >= this.coverageThreshold
      ? 'PASSED'
      : 'FAILED';
    
    return {
      overallStatus,
      testsPassed: passedTests,
      totalTests,
      averageCoverage
    };
  }

  checkQualityGate() {
    const summary = this.generateSummary();
    
    console.log('🚪 Quality Gate Check');
    console.log('===================');
    console.log(`Overall Status: ${summary.overallStatus}`);
    console.log(`Tests Passed: ${summary.testsPassed}/${summary.totalTests}`);
    console.log(`Average Coverage: ${summary.averageCoverage}%`);
    console.log(`Security Vulnerabilities: ${this.results.security.vulnerabilities || 0}`);
    console.log(`Compliance Violations: ${this.results.compliance.violations || 0}`);
    
    // Critical requirements for quality gate
    const requirements = [
      { name: 'Unit Tests', passed: this.results.unit.status === 'passed' },
      { name: 'Integration Tests', passed: this.results.integration.status === 'passed' },
      { name: 'Compliance Tests', passed: this.results.compliance.status === 'passed' },
      { name: 'Coverage Threshold', passed: summary.averageCoverage >= this.coverageThreshold },
      { name: 'No Security Vulnerabilities', passed: (this.results.security.vulnerabilities || 0) === 0 },
      { name: 'No Compliance Violations', passed: (this.results.compliance.violations || 0) === 0 }
    ];
    
    console.log('\nRequirements:');
    requirements.forEach(req => {
      console.log(`  ${req.passed ? '✅' : '❌'} ${req.name}`);
    });
    
    const allRequirementsMet = requirements.every(req => req.passed);
    
    if (allRequirementsMet) {
      console.log('\n🎉 Quality gate PASSED! Ready for deployment.');
    } else {
      console.log('\n💥 Quality gate FAILED! Fix issues before deployment.');
    }
    
    return allRequirementsMet;
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    // Remove temporary files
    const tempFiles = [
      'performance-results.json',
      '.nyc_output',
      'junit.xml'
    ];
    
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.rmSync(file, { recursive: true, force: true });
      }
    });
    
    console.log('✅ Cleanup complete');
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// Run the test suite if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run();
}

module.exports = TestRunner;