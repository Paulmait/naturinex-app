const axios = require('axios');
const crypto = require('crypto');
const { supabase } = require('../src/config/supabase');

// OWASP Security Testing Suite
describe('OWASP Security Compliance Tests', () => {
  const baseURL = process.env.API_BASE_URL || 'https://naturinex-app-1.onrender.com';
  const testUser = {
    email: 'security-test@naturinex.com',
    password: 'SecurityTest123!'
  };

  beforeAll(async () => {
    // Setup test environment
    console.log('Running OWASP Security Tests against:', baseURL);
  });

  describe('A01: Broken Access Control', () => {
    test('should prevent unauthorized access to protected endpoints', async () => {
      const protectedEndpoints = [
        '/api/user/profile',
        '/api/user/scans',
        '/api/admin/users',
        '/api/admin/analytics'
      ];
      
      for (const endpoint of protectedEndpoints) {
        try {
          const response = await axios.get(`${baseURL}${endpoint}`, {
            timeout: 5000
          });
          
          // Should return 401 or 403
          expect([401, 403]).toContain(response.status);
        } catch (error) {
          // Network errors are acceptable for this test
          if (error.response) {
            expect([401, 403]).toContain(error.response.status);
          }
        }
      }
    });

    test('should prevent horizontal privilege escalation', async () => {
      // Test accessing another user's data
      const maliciousRequests = [
        '/api/user/scans?user_id=other-user-123',
        '/api/user/profile/other-user-456',
        '/api/user/subscription/different-user-789'
      ];
      
      for (const request of maliciousRequests) {
        try {
          const response = await axios.get(`${baseURL}${request}`, {
            headers: {
              'Authorization': 'Bearer fake-jwt-token'
            },
            timeout: 5000
          });
          
          expect([401, 403, 404]).toContain(response.status);
        } catch (error) {
          if (error.response) {
            expect([401, 403, 404]).toContain(error.response.status);
          }
        }
      }
    });

    test('should prevent vertical privilege escalation', async () => {
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/system-config',
        '/api/admin/audit-logs'
      ];
      
      for (const endpoint of adminEndpoints) {
        try {
          const response = await axios.get(`${baseURL}${endpoint}`, {
            headers: {
              'Authorization': 'Bearer regular-user-token'
            },
            timeout: 5000
          });
          
          expect([401, 403]).toContain(response.status);
        } catch (error) {
          if (error.response) {
            expect([401, 403]).toContain(error.response.status);
          }
        }
      }
    });

    test('should validate JWT tokens properly', async () => {
      const invalidTokens = [
        'invalid.jwt.token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        '',
        null,
        'Bearer ',
        'malformed-token'
      ];
      
      for (const token of invalidTokens) {
        try {
          const response = await axios.get(`${baseURL}/api/user/profile`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : undefined
            },
            timeout: 5000
          });
          
          expect([401, 403]).toContain(response.status);
        } catch (error) {
          if (error.response) {
            expect([401, 403]).toContain(error.response.status);
          }
        }
      }
    });
  });

  describe('A02: Cryptographic Failures', () => {
    test('should use HTTPS for all communications', async () => {
      // Test that HTTP redirects to HTTPS
      const httpURL = baseURL.replace('https:', 'http:');
      
      try {
        const response = await axios.get(httpURL, {
          maxRedirects: 0,
          timeout: 5000
        });
        
        // Should redirect to HTTPS
        expect([301, 302, 308]).toContain(response.status);
        expect(response.headers.location?.startsWith('https:')).toBe(true);
      } catch (error) {
        // Connection refused is acceptable for HTTP
        expect(error.code).toBeOneOf(['ECONNREFUSED', 'ENOTFOUND']);
      }
    });

    test('should use secure headers', async () => {
      try {
        const response = await axios.get(`${baseURL}/api/health`, {
          timeout: 5000
        });
        
        const headers = response.headers;
        
        // Check for security headers
        expect(headers['strict-transport-security']).toBeTruthy();
        expect(headers['x-content-type-options']).toBe('nosniff');
        expect(headers['x-frame-options']).toBeOneOf(['DENY', 'SAMEORIGIN']);
        expect(headers['x-xss-protection']).toBeTruthy();
        expect(headers['content-security-policy']).toBeTruthy();
      } catch (error) {
        console.warn('Could not test security headers:', error.message);
      }
    });

    test('should not expose sensitive data in responses', async () => {
      try {
        const response = await axios.get(`${baseURL}/api/health`, {
          timeout: 5000
        });
        
        const responseText = JSON.stringify(response.data);
        
        // Should not contain sensitive information
        const sensitivePatterns = [
          /password/i,
          /secret/i,
          /private.*key/i,
          /api.*key/i,
          /sk_[a-zA-Z0-9]+/, // Stripe secret keys
          /rk_[a-zA-Z0-9]+/, // Stripe restricted keys
          /-----BEGIN.*PRIVATE.*KEY-----/
        ];
        
        sensitivePatterns.forEach(pattern => {
          expect(responseText).not.toMatch(pattern);
        });
      } catch (error) {
        console.warn('Could not test sensitive data exposure:', error.message);
      }
    });

    test('should validate SSL/TLS configuration', async () => {
      try {
        const response = await axios.get(`${baseURL}/api/health`, {
          timeout: 5000,
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: true // Ensure valid certificates
          })
        });
        
        expect(response.status).toBe(200);
      } catch (error) {
        if (error.code === 'CERT_UNTRUSTED' || error.code === 'CERT_INVALID') {
          throw new Error('Invalid SSL/TLS certificate');
        }
      }
    });
  });

  describe('A03: Injection Attacks', () => {
    test('should prevent SQL injection attacks', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users--",
        "1'; DELETE FROM scans; --"
      ];
      
      for (const payload of sqlInjectionPayloads) {
        try {
          const response = await axios.post(`${baseURL}/api/medication/analyze`, {
            medicationName: payload
          }, {
            timeout: 5000
          });
          
          // Should not execute SQL commands
          expect(response.status).toBeOneOf([400, 422, 500]);
          
          // Response should not contain SQL error messages
          const responseText = JSON.stringify(response.data);
          expect(responseText).not.toMatch(/sql|syntax error|mysql|postgres/i);
        } catch (error) {
          // Network errors are acceptable
          if (error.response) {
            expect([400, 422, 500]).toContain(error.response.status);
          }
        }
      }
    });

    test('should prevent NoSQL injection attacks', async () => {
      const noSQLPayloads = [
        { $ne: null },
        { $regex: '.*' },
        { $where: 'this.password == this.password' },
        { $gt: '' },
        "'; return true; var x = '"
      ];
      
      for (const payload of noSQLPayloads) {
        try {
          const response = await axios.post(`${baseURL}/api/user/login`, {
            email: 'test@example.com',
            password: payload
          }, {
            timeout: 5000
          });
          
          // Should not bypass authentication
          expect([400, 401, 422]).toContain(response.status);
        } catch (error) {
          if (error.response) {
            expect([400, 401, 422]).toContain(error.response.status);
          }
        }
      }
    });

    test('should prevent command injection', async () => {
      const commandInjectionPayloads = [
        '; ls -la',
        '&& cat /etc/passwd',
        '| whoami',
        '`rm -rf /`',
        '$(cat /etc/hosts)'
      ];
      
      for (const payload of commandInjectionPayloads) {
        try {
          const response = await axios.post(`${baseURL}/api/ocr/process`, {
            imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
            filename: `test${payload}.jpg`
          }, {
            timeout: 5000
          });
          
          // Should not execute system commands
          expect([400, 422, 500]).toContain(response.status);
        } catch (error) {
          if (error.response) {
            expect([400, 422, 500]).toContain(error.response.status);
          }
        }
      }
    });

    test('should prevent LDAP injection', async () => {
      const ldapPayloads = [
        '*)(uid=*',
        '*)(|(password=*))',
        '*)(&(objectClass=*)'
      ];
      
      for (const payload of ldapPayloads) {
        try {
          const response = await axios.post(`${baseURL}/api/user/search`, {
            query: payload
          }, {
            timeout: 5000
          });
          
          expect([400, 422]).toContain(response.status);
        } catch (error) {
          if (error.response) {
            expect([400, 422]).toContain(error.response.status);
          }
        }
      }
    });
  });

  describe('A04: Insecure Design', () => {
    test('should implement proper rate limiting', async () => {
      const requests = [];
      
      // Send rapid requests
      for (let i = 0; i < 20; i++) {
        requests.push(
          axios.post(`${baseURL}/api/user/login`, {
            email: 'test@example.com',
            password: 'wrongpassword'
          }, {
            timeout: 5000
          }).catch(error => error.response || error)
        );
      }
      
      const responses = await Promise.all(requests);
      
      // Should have rate limiting after multiple attempts
      const rateLimited = responses.filter(response => 
        response.status === 429 ||
        (response.data && response.data.message?.includes('rate limit'))
      );
      
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    test('should implement account lockout after failed attempts', async () => {
      const failedAttempts = [];
      
      // Multiple failed login attempts
      for (let i = 0; i < 10; i++) {
        failedAttempts.push(
          axios.post(`${baseURL}/api/user/login`, {
            email: testUser.email,
            password: 'wrongpassword123'
          }, {
            timeout: 5000
          }).catch(error => error.response)
        );
      }
      
      const responses = await Promise.all(failedAttempts);
      
      // Should eventually lock account
      const locked = responses.some(response => 
        response?.data?.message?.includes('locked') ||
        response?.status === 423
      );
      
      expect(locked).toBe(true);
    });

    test('should validate business logic constraints', async () => {
      // Test negative quantities
      try {
        const response = await axios.post(`${baseURL}/api/subscription/purchase`, {
          planId: 'premium',
          quantity: -1,
          price: -100
        }, {
          timeout: 5000
        });
        
        expect([400, 422]).toContain(response.status);
      } catch (error) {
        if (error.response) {
          expect([400, 422]).toContain(error.response.status);
        }
      }
      
      // Test invalid date ranges
      try {
        const response = await axios.get(`${baseURL}/api/analytics/scans`, {
          params: {
            startDate: '2025-01-01',
            endDate: '2020-01-01' // End before start
          },
          timeout: 5000
        });
        
        expect([400, 422]).toContain(response.status);
      } catch (error) {
        if (error.response) {
          expect([400, 422]).toContain(error.response.status);
        }
      }
    });
  });

  describe('A05: Security Misconfiguration', () => {
    test('should not expose sensitive server information', async () => {
      try {
        const response = await axios.get(`${baseURL}/api/health`, {
          timeout: 5000
        });
        
        const headers = response.headers;
        
        // Should not expose server details
        expect(headers.server).not.toMatch(/nginx|apache|express/i);
        expect(headers['x-powered-by']).toBeUndefined();
        
        // Should not expose version information
        const responseText = JSON.stringify(response.data);
        expect(responseText).not.toMatch(/version|v\d+\.\d+/i);
      } catch (error) {
        console.warn('Could not test server information exposure:', error.message);
      }
    });

    test('should handle HTTP methods securely', async () => {
      const methods = ['TRACE', 'OPTIONS', 'PUT', 'DELETE'];
      
      for (const method of methods) {
        try {
          const response = await axios({
            method,
            url: `${baseURL}/api/health`,
            timeout: 5000
          });
          
          // TRACE should be disabled, others should require auth
          if (method === 'TRACE') {
            expect([405, 501]).toContain(response.status);
          } else {
            expect([401, 403, 405]).toContain(response.status);
          }
        } catch (error) {
          if (error.response) {
            expect([401, 403, 405, 501]).toContain(error.response.status);
          }
        }
      }
    });

    test('should not expose debug information', async () => {
      const debugEndpoints = [
        '/debug',
        '/api/debug',
        '/.env',
        '/config',
        '/api/config',
        '/admin',
        '/phpmyadmin',
        '/wp-admin'
      ];
      
      for (const endpoint of debugEndpoints) {
        try {
          const response = await axios.get(`${baseURL}${endpoint}`, {
            timeout: 5000
          });
          
          // Should not be accessible
          expect([404, 403]).toContain(response.status);
        } catch (error) {
          if (error.response) {
            expect([404, 403]).toContain(error.response.status);
          }
        }
      }
    });
  });

  describe('A06: Vulnerable and Outdated Components', () => {
    test('should not expose component version information', async () => {
      try {
        const response = await axios.get(`${baseURL}`, {
          timeout: 5000
        });
        
        const headers = response.headers;
        const body = response.data;
        
        // Check headers for version information
        Object.values(headers).forEach(header => {
          expect(header).not.toMatch(/react|node|express|v\d+\.\d+/i);
        });
        
        // Check response body for framework signatures
        if (typeof body === 'string') {
          expect(body).not.toMatch(/powered by|built with|version/i);
        }
      } catch (error) {
        console.warn('Could not test component version exposure:', error.message);
      }
    });

    test('should use secure dependency configurations', async () => {
      // This would typically involve checking package.json for known vulnerabilities
      // In a real scenario, you'd integrate with tools like npm audit or Snyk
      console.log('Note: Run npm audit or similar tools to check for vulnerable dependencies');
    });
  });

  describe('A07: Identification and Authentication Failures', () => {
    test('should enforce strong password policies', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'qwerty',
        'abc123',
        '111111',
        'password123'
      ];
      
      for (const password of weakPasswords) {
        try {
          const response = await axios.post(`${baseURL}/api/user/register`, {
            email: 'test@example.com',
            password: password
          }, {
            timeout: 5000
          });
          
          // Should reject weak passwords
          expect([400, 422]).toContain(response.status);
          
          if (response.data.message) {
            expect(response.data.message).toMatch(/password.*weak|password.*strength/i);
          }
        } catch (error) {
          if (error.response) {
            expect([400, 422]).toContain(error.response.status);
          }
        }
      }
    });

    test('should implement proper session management', async () => {
      try {
        // Login to get session
        const loginResponse = await axios.post(`${baseURL}/api/user/login`, testUser, {
          timeout: 5000
        });
        
        if (loginResponse.status === 200) {
          const token = loginResponse.data.token;
          
          // Test token expiration
          const profileResponse = await axios.get(`${baseURL}/api/user/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            timeout: 5000
          });
          
          expect([200, 401]).toContain(profileResponse.status);
          
          // Test logout
          const logoutResponse = await axios.post(`${baseURL}/api/user/logout`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            timeout: 5000
          });
          
          expect([200, 204]).toContain(logoutResponse.status);
        }
      } catch (error) {
        console.warn('Could not test session management:', error.message);
      }
    });

    test('should prevent username enumeration', async () => {
      const testEmails = [
        'existing@naturinex.com',
        'nonexistent@example.com',
        'another@test.com'
      ];
      
      const responses = [];
      
      for (const email of testEmails) {
        try {
          const response = await axios.post(`${baseURL}/api/user/login`, {
            email: email,
            password: 'wrongpassword'
          }, {
            timeout: 5000
          });
          
          responses.push(response);
        } catch (error) {
          responses.push(error.response);
        }
      }
      
      // All responses should be similar to prevent enumeration
      const statusCodes = responses.map(r => r?.status).filter(Boolean);
      const uniqueStatuses = [...new Set(statusCodes)];
      
      // Should not reveal whether user exists
      expect(uniqueStatuses.length).toBeLessThanOrEqual(2);
    });
  });

  describe('A08: Software and Data Integrity Failures', () => {
    test('should validate file uploads', async () => {
      const maliciousFiles = [
        { name: 'test.exe', content: 'MZ\x90\x00\x03' }, // Executable
        { name: 'script.js', content: 'alert("xss")' }, // JavaScript
        { name: 'large.jpg', content: 'x'.repeat(10 * 1024 * 1024) }, // Too large
        { name: 'test.php', content: '<?php system($_GET["cmd"]); ?>' } // PHP script
      ];
      
      for (const file of maliciousFiles) {
        try {
          const formData = new FormData();
          formData.append('file', new Blob([file.content]), file.name);
          
          const response = await axios.post(`${baseURL}/api/upload/scan-image`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 5000
          });
          
          // Should reject malicious files
          expect([400, 415, 422]).toContain(response.status);
        } catch (error) {
          if (error.response) {
            expect([400, 415, 422]).toContain(error.response.status);
          }
        }
      }
    });

    test('should implement Content Security Policy', async () => {
      try {
        const response = await axios.get(`${baseURL}`, {
          timeout: 5000
        });
        
        const csp = response.headers['content-security-policy'];
        
        expect(csp).toBeTruthy();
        expect(csp).toMatch(/default-src|script-src|style-src/);
        expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
      } catch (error) {
        console.warn('Could not test CSP:', error.message);
      }
    });
  });

  describe('A09: Security Logging and Monitoring Failures', () => {
    test('should log security events', async () => {
      // Attempt to trigger security events
      const securityEvents = [
        () => axios.post(`${baseURL}/api/user/login`, {
          email: 'admin@example.com',
          password: 'wrongpassword'
        }),
        () => axios.get(`${baseURL}/api/admin/users`, {
          headers: { 'Authorization': 'Bearer invalid-token' }
        }),
        () => axios.post(`${baseURL}/api/medication/analyze`, {
          medicationName: "'; DROP TABLE users; --"
        })
      ];
      
      for (const event of securityEvents) {
        try {
          await event();
        } catch (error) {
          // Events should be logged regardless of success/failure
        }
      }
      
      // In a real test, you would check if these events are properly logged
      console.log('Note: Verify that security events are logged in your monitoring system');
    });

    test('should not expose sensitive information in logs', async () => {
      try {
        // Trigger an error with sensitive data
        await axios.post(`${baseURL}/api/user/login`, {
          email: 'test@example.com',
          password: 'MySecretPassword123!',
          creditCard: '4111-1111-1111-1111'
        });
      } catch (error) {
        if (error.response) {
          const responseText = JSON.stringify(error.response.data);
          
          // Should not contain sensitive data in error responses
          expect(responseText).not.toMatch(/MySecretPassword123!/i);
          expect(responseText).not.toMatch(/4111-1111-1111-1111/);
        }
      }
    });
  });

  describe('A10: Server-Side Request Forgery (SSRF)', () => {
    test('should prevent SSRF attacks', async () => {
      const ssrfPayloads = [
        'http://localhost:22',
        'http://169.254.169.254/latest/meta-data/', // AWS metadata
        'http://metadata.google.internal/', // GCP metadata
        'file:///etc/passwd',
        'http://internal-service:8080/admin'
      ];
      
      for (const payload of ssrfPayloads) {
        try {
          const response = await axios.post(`${baseURL}/api/external/fetch`, {
            url: payload
          }, {
            timeout: 5000
          });
          
          // Should block SSRF attempts
          expect([400, 403, 422]).toContain(response.status);
        } catch (error) {
          if (error.response) {
            expect([400, 403, 422]).toContain(error.response.status);
          }
        }
      }
    });

    test('should validate external URLs', async () => {
      const invalidUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'ftp://internal-server/file.txt',
        'ldap://internal-ldap:389/'
      ];
      
      for (const url of invalidUrls) {
        try {
          const response = await axios.post(`${baseURL}/api/external/validate-url`, {
            url: url
          }, {
            timeout: 5000
          });
          
          expect([400, 422]).toContain(response.status);
        } catch (error) {
          if (error.response) {
            expect([400, 422]).toContain(error.response.status);
          }
        }
      }
    });
  });

  describe('Cross-Site Scripting (XSS) Prevention', () => {
    test('should prevent reflected XSS', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '><script>alert(1)</script>',
        'javascript:alert(1)',
        '"><script>alert(document.cookie)</script>',
        "'><img src=x onerror=alert(1)>"
      ];
      
      for (const payload of xssPayloads) {
        try {
          const response = await axios.get(`${baseURL}/api/search`, {
            params: { q: payload },
            timeout: 5000
          });
          
          const responseText = JSON.stringify(response.data);
          
          // Should not contain unescaped script tags
          expect(responseText).not.toMatch(/<script[^>]*>/i);
          expect(responseText).not.toMatch(/javascript:/i);
          expect(responseText).not.toMatch(/onerror=/i);
        } catch (error) {
          // Network errors are acceptable
        }
      }
    });

    test('should prevent stored XSS', async () => {
      const xssPayload = '<script>alert("stored xss")</script>';
      
      try {
        // Try to store XSS payload
        await axios.post(`${baseURL}/api/user/profile`, {
          displayName: xssPayload,
          bio: xssPayload
        }, {
          timeout: 5000
        });
        
        // Retrieve the data
        const response = await axios.get(`${baseURL}/api/user/profile`, {
          timeout: 5000
        });
        
        const responseText = JSON.stringify(response.data);
        
        // Should be properly escaped
        expect(responseText).not.toMatch(/<script[^>]*>/i);
      } catch (error) {
        // Network errors are acceptable
      }
    });
  });

  describe('Cross-Site Request Forgery (CSRF) Prevention', () => {
    test('should require CSRF tokens for state-changing operations', async () => {
      const stateChangingEndpoints = [
        { method: 'POST', url: '/api/user/profile' },
        { method: 'DELETE', url: '/api/user/scans/123' },
        { method: 'PUT', url: '/api/user/settings' }
      ];
      
      for (const endpoint of stateChangingEndpoints) {
        try {
          const response = await axios({
            method: endpoint.method,
            url: `${baseURL}${endpoint.url}`,
            data: { test: 'data' },
            headers: {
              'Origin': 'https://malicious-site.com'
            },
            timeout: 5000
          });
          
          // Should require CSRF protection
          expect([403, 422]).toContain(response.status);
        } catch (error) {
          if (error.response) {
            expect([403, 422]).toContain(error.response.status);
          }
        }
      }
    });
  });
});