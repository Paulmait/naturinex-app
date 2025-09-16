# NaturineX Comprehensive Testing Suite

This document describes the complete testing infrastructure for the NaturineX application, providing high coverage (>80%) across all testing domains.

## Overview

The testing suite includes:
- **Unit Tests**: Service layer, utilities, and React components
- **Integration Tests**: API endpoints, database operations, authentication flows
- **E2E Tests**: Complete user workflows and critical path testing
- **Security Tests**: OWASP compliance, penetration testing, vulnerability scanning
- **Performance Tests**: Load testing with k6, API response times, memory leak detection
- **Compliance Tests**: HIPAA compliance verification, audit logging, data encryption validation

## Test Structure

```
├── src/
│   ├── __tests__/
│   │   ├── integration/           # Integration tests
│   │   └── components/            # Component tests
│   ├── services/__tests__/        # Service unit tests
│   ├── utils/__tests__/           # Utility function tests
│   └── __mocks__/                # Mock implementations
├── e2e/                           # End-to-end tests
├── security-tests/                # Security and penetration tests
├── load-testing/                  # Performance tests with k6
├── compliance-tests/              # HIPAA compliance tests
├── scripts/                       # Test automation scripts
└── .github/workflows/             # CI/CD pipeline
```

## Running Tests

### Quick Start
```bash
# Install dependencies
npm install

# Run all tests (comprehensive suite)
npm run test:all

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:security     # Security tests
npm run test:compliance   # HIPAA compliance tests
```

### Coverage Reporting
```bash
# Generate coverage report
npm run coverage

# Check coverage thresholds (>80%)
npm run coverage:check

# View coverage report in browser
npm run coverage:report
```

### Performance Testing
```bash
# Install k6 (load testing tool)
# On Windows with Chocolatey:
choco install k6

# On macOS with Homebrew:
brew install k6

# On Ubuntu/Debian:
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Run load tests
k6 run load-testing/medication-analysis-load.js
```

## Test Configuration

### Environment Variables
Create a `.env.test` file with:
```bash
# API Configuration
API_BASE_URL=https://staging.naturinex.com
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Test User Credentials
TEST_USER_EMAIL=test@naturinex.com
TEST_USER_PASSWORD=test_password_123

# Coverage Configuration
COVERAGE_THRESHOLD=80
VERBOSE_COVERAGE=false

# Security Testing
SECURITY_TEST_TIMEOUT=30000

# Performance Testing
K6_WEB_DASHBOARD=true
```

### Jest Configuration
The testing suite uses multiple Jest configurations:
- `jest.config.js` - Main configuration
- `jest.coverage.config.js` - Coverage-specific settings
- `jest.integration.config.js` - Integration test settings

## Unit Tests

### Service Tests
Located in `src/services/__tests__/`, these test core business logic:
- **Encryption Service**: AES-256 encryption, key management, HIPAA compliance
- **AI Service**: Medication analysis, OCR processing, rate limiting
- **Drug Interaction Service**: Interaction detection, severity classification
- **Disclaimer Service**: Legal compliance, version management, acceptance tracking

### Component Tests
Located in `src/components/__tests__/`, these test React components:
- **Dashboard**: Main interface, navigation, user interactions
- **ScanInterface**: Medication scanning workflows
- **Settings**: User preferences, account management

### Utility Tests
Located in `src/utils/__tests__/`, these test helper functions:
- **Analytics**: Event tracking, performance monitoring
- **Validation**: Input sanitization, format checking
- **Encryption Utilities**: Data protection helpers

## Integration Tests

### API Integration
Tests in `src/__tests__/integration/api.integration.test.js`:
- Supabase database operations
- Edge Functions execution
- Real-time database features
- External API integrations (FDA, RxNorm)
- Payment processing (Stripe)
- File storage operations

### Database Tests
- Row Level Security (RLS) enforcement
- Data encryption at rest
- Audit logging functionality
- Backup and recovery procedures

## E2E Tests

### User Workflows
Tests in `e2e/userWorkflows.e2e.test.js`:
- **Onboarding**: First-time user experience, disclaimer acceptance
- **Medication Scanning**: Manual entry, camera scan, image upload
- **History Management**: Viewing, filtering, sharing scan results
- **Account Management**: Registration, settings, subscription
- **Offline Functionality**: Offline mode, data synchronization
- **Error Handling**: Network failures, permission denials, recovery

### Accessibility Testing
- Screen reader compatibility
- Keyboard navigation
- Voice control support
- Large text support
- Color contrast compliance

### Cross-Platform Testing
- Web browsers (Chrome, Firefox, Safari, Edge)
- Mobile devices (iOS, Android)
- Different screen sizes and orientations

## Security Tests

### OWASP Compliance
Tests in `security-tests/owasp-security.test.js`:
- **A01**: Broken Access Control
- **A02**: Cryptographic Failures
- **A03**: Injection Attacks (SQL, NoSQL, Command, LDAP)
- **A04**: Insecure Design
- **A05**: Security Misconfiguration
- **A06**: Vulnerable Components
- **A07**: Authentication Failures
- **A08**: Data Integrity Failures
- **A09**: Logging and Monitoring Failures
- **A10**: Server-Side Request Forgery (SSRF)

### Additional Security Tests
- Cross-Site Scripting (XSS) prevention
- Cross-Site Request Forgery (CSRF) protection
- SSL/TLS configuration validation
- Input sanitization verification
- Rate limiting enforcement

## Performance Tests

### Load Testing with k6
Tests in `load-testing/medication-analysis-load.js`:
- **Ramp-up Testing**: Gradual load increase (10 → 100 → 200 users)
- **Steady State**: Sustained load for extended periods
- **Stress Testing**: Beyond normal capacity limits
- **Spike Testing**: Sudden load increases

### Performance Metrics
- Response time thresholds (95% < 2s, 99% < 5s)
- Error rate limits (< 5%)
- Throughput measurements
- Resource utilization monitoring

### Specific Test Scenarios
- Medication analysis workflow
- OCR processing performance
- Database query optimization
- Concurrent user handling
- Memory leak detection

## Compliance Tests

### HIPAA Compliance
Tests in `compliance-tests/hipaa-compliance.test.js`:

#### Administrative Safeguards (§164.308)
- Security Officer controls
- Workforce training tracking
- Access management (RBAC)
- Minimum necessary access principle

#### Physical Safeguards (§164.310)
- Facility access controls
- Workstation security policies
- Device and media controls
- Secure disposal procedures

#### Technical Safeguards (§164.312)
- Unique user identification
- Automatic logoff
- Data encryption (at rest and in transit)
- Audit controls and logging
- Data integrity verification
- Transmission security

#### Additional Compliance Areas
- Business Associate Agreements (BAA)
- Breach notification procedures
- Data retention and disposal policies
- Risk assessment and management

## CI/CD Integration

### GitHub Actions Workflow
File: `.github/workflows/comprehensive-testing.yml`

#### Pipeline Stages
1. **Setup**: Dependency installation, environment validation
2. **Code Quality**: ESLint, Prettier, TypeScript checking
3. **Unit Tests**: Cross-platform testing (Ubuntu, Windows, macOS)
4. **Integration Tests**: Database and API testing
5. **E2E Tests**: Multi-browser testing (Chromium, Firefox, WebKit)
6. **Security Tests**: SAST, dependency scanning, OWASP testing
7. **Performance Tests**: Load testing with k6
8. **Compliance Tests**: HIPAA verification
9. **Mobile Tests**: iOS and Android testing with Detox
10. **Accessibility Tests**: WCAG compliance verification
11. **Coverage Report**: Merged coverage analysis
12. **Quality Gate**: Pass/fail determination
13. **Deployment**: Automated staging deployment
14. **Notification**: Slack notifications and GitHub releases

#### Quality Gates
Tests must meet these criteria to pass:
- ✅ Unit test coverage ≥ 80%
- ✅ All critical tests passing (unit, integration, compliance)
- ✅ Zero high-severity security vulnerabilities
- ✅ Zero HIPAA compliance violations
- ✅ API response times within thresholds
- ✅ No memory leaks detected

### Test Environments
- **Development**: Local testing with mocked services
- **Staging**: Full integration testing with production-like data
- **Production**: Smoke tests and monitoring

## Coverage Requirements

### Global Thresholds
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Service-Specific Thresholds
- **Encryption Service**: 95% (critical security component)
- **Drug Interaction Service**: 90% (patient safety critical)
- **Disclaimer Service**: 90% (legal compliance critical)
- **AI Service**: 85% (core functionality)

### Component-Specific Thresholds
- **Dashboard**: 85% (main user interface)
- **ScanInterface**: 85% (core workflow)

## Test Data Management

### Mock Data
- Realistic medication names and interactions
- Synthetic patient data (HIPAA-safe)
- Test images for OCR processing
- Simulated API responses

### Test Database
- Isolated test environment
- Automated seeding and cleanup
- Transaction rollback for isolation

### Security Considerations
- No production data in tests
- Encrypted test credentials
- Secure test environment isolation

## Debugging Tests

### Common Issues
1. **Timeout Errors**: Increase timeout values in Jest configuration
2. **Mock Failures**: Verify mock implementations match actual APIs
3. **Coverage Gaps**: Use `--verbose` flag to identify uncovered code
4. **E2E Flakiness**: Add wait conditions and retry logic

### Debug Commands
```bash
# Run tests in debug mode
npm run test:unit -- --verbose

# Run specific test file
npm run test:unit -- src/services/__tests__/encryptionService.test.js

# Run tests with coverage details
npm run test:unit -- --coverage --verbose

# Debug E2E tests
npm run test:e2e -- --record-videos --record-screenshots
```

## Maintenance

### Regular Tasks
- Update test dependencies monthly
- Review and update test data quarterly
- Audit security test coverage annually
- Update compliance tests when regulations change

### Monitoring
- Track test execution times
- Monitor flaky test rates
- Review coverage trends
- Analyze performance test results

## Contributing

### Adding New Tests
1. Follow existing naming conventions
2. Include both positive and negative test cases
3. Mock external dependencies appropriately
4. Ensure tests are deterministic and repeatable
5. Add appropriate documentation

### Test Review Checklist
- [ ] Tests cover happy path and edge cases
- [ ] Mocks are properly configured
- [ ] Tests are fast and reliable
- [ ] Coverage thresholds are maintained
- [ ] Security considerations are addressed
- [ ] HIPAA compliance is verified

## Support

For questions about the testing suite:
1. Check this documentation
2. Review existing test implementations
3. Check CI/CD pipeline logs
4. Contact the development team

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Detox E2E Testing](https://github.com/wix/Detox)
- [k6 Load Testing](https://k6.io/docs/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
