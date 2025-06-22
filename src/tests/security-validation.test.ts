// src/tests/security-validation.test.ts
import { 
  validateEmail, 
  validatePassword, 
  validateText, 
  validateDosage, 
  validateFrequency 
} from '../utils/validation';
import { 
  sanitizeText, 
  sanitizeEmail, 
  sanitizeUrl, 
  sanitizeUserInput 
} from '../utils/sanitization';
import { authRateLimiter, scanRateLimiter, analysisRateLimiter } from '../utils/rateLimiting';

/**
 * Comprehensive security validation tests
 * Run these tests to ensure all security measures are working
 */

// Test data for validation
const testCases = {
  emails: {
    valid: [
      'user@example.com',
      'test.email+tag@domain.co.uk',
      'user123@test-domain.com'
    ],
    invalid: [
      'invalid-email',
      '@domain.com',
      'user@',
      'user..double@domain.com',
      'user@domain',
      'a'.repeat(255) + '@domain.com' // Too long
    ],
    malicious: [
      'user@domain.com<script>alert("xss")</script>',
      'user@domain.com"onload="alert(1)"',
      'javascript:alert(1)@domain.com'
    ]
  },
  passwords: {
    valid: [
      'SecurePass123!',
      'MyStr0ngP@ssw0rd',
      'Complex!Pass123'
    ],
    invalid: [
      '123456', // Too common
      'password', // Too common
      'short', // Too short
      'a'.repeat(129), // Too long
      'NoNumbers!', // Missing numbers
      'nonumbers123' // Missing special chars
    ]
  },
  text: {
    valid: [
      'Normal text input',
      'Product name with numbers 123',
      'Brand-Name_2024'
    ],
    malicious: [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '<iframe src="evil.com"></iframe>',
      'onload="alert(1)"',
      '<img src=x onerror=alert(1)>'
    ]
  },
  dosage: {
    valid: [
      '500mg daily',
      '1 tablet twice daily',
      '2.5ml once daily',
      '1000 IU per day'
    ],
    invalid: [
      'Take some pills',
      'A lot',
      '<script>alert(1)</script>',
      'javascript:void(0)'
    ]
  }
};

/**
 * Test email validation
 */
export function testEmailValidation(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🧪 Testing Email Validation...');

  // Test valid emails
  testCases.emails.valid.forEach(email => {
    const result = validateEmail(email);
    if (result.isValid) {
      passed++;
      console.log(`✅ Valid email accepted: ${email}`);
    } else {
      failed++;
      errors.push(`❌ Valid email rejected: ${email} - ${result.error}`);
    }
  });

  // Test invalid emails
  testCases.emails.invalid.forEach(email => {
    const result = validateEmail(email);
    if (!result.isValid) {
      passed++;
      console.log(`✅ Invalid email rejected: ${email}`);
    } else {
      failed++;
      errors.push(`❌ Invalid email accepted: ${email}`);
    }
  });

  // Test malicious emails
  testCases.emails.malicious.forEach(email => {
    const result = validateEmail(email);
    if (!result.isValid) {
      passed++;
      console.log(`✅ Malicious email blocked: ${email}`);
    } else {
      failed++;
      errors.push(`❌ Malicious email accepted: ${email}`);
    }
  });

  return { passed, failed, errors };
}

/**
 * Test password validation
 */
export function testPasswordValidation(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🧪 Testing Password Validation...');

  // Test valid passwords
  testCases.passwords.valid.forEach(password => {
    const result = validatePassword(password);
    if (result.isValid) {
      passed++;
      console.log(`✅ Strong password accepted: ${password.substring(0, 3)}***`);
    } else {
      failed++;
      errors.push(`❌ Strong password rejected: ${password.substring(0, 3)}*** - ${result.error}`);
    }
  });

  // Test invalid passwords
  testCases.passwords.invalid.forEach(password => {
    const result = validatePassword(password);
    if (!result.isValid) {
      passed++;
      console.log(`✅ Weak password rejected: ${password.substring(0, 3)}***`);
    } else {
      failed++;
      errors.push(`❌ Weak password accepted: ${password.substring(0, 3)}***`);
    }
  });

  return { passed, failed, errors };
}

/**
 * Test text sanitization
 */
export function testTextSanitization(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🧪 Testing Text Sanitization...');

  // Test malicious text sanitization
  testCases.text.malicious.forEach(maliciousText => {
    const sanitized = sanitizeText(maliciousText);
    
    // Check if dangerous patterns are removed
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /<iframe/i,
      /onload=/i,
      /onerror=/i
    ];

    const containsDangerous = dangerousPatterns.some(pattern => pattern.test(sanitized));
    
    if (!containsDangerous) {
      passed++;
      console.log(`✅ Malicious text sanitized: "${maliciousText}" → "${sanitized}"`);
    } else {
      failed++;
      errors.push(`❌ Malicious text not properly sanitized: "${maliciousText}" → "${sanitized}"`);
    }
  });

  return { passed, failed, errors };
}

/**
 * Test rate limiting
 */
export async function testRateLimiting(): Promise<{ passed: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🧪 Testing Rate Limiting...');

  const testUserId = 'test-user-123';

  try {
    // Test auth rate limiting (5 requests per 15 minutes)
    for (let i = 0; i < 6; i++) {
      const isAllowed = await authRateLimiter.isAllowed(testUserId, 'test');
      if (i < 5 && isAllowed) {
        passed++;
        console.log(`✅ Auth request ${i + 1} allowed`);
      } else if (i === 5 && !isAllowed) {
        passed++;
        console.log(`✅ Auth request ${i + 1} properly rate limited`);
      } else {
        failed++;
        errors.push(`❌ Auth rate limiting failed at request ${i + 1}`);
      }
    }

    // Clear the rate limit for next test
    await authRateLimiter.clearLimit(testUserId, 'test');

    // Test scan rate limiting (30 requests per minute)
    for (let i = 0; i < 32; i++) {
      const isAllowed = await scanRateLimiter.isAllowed(testUserId);
      if (i < 30 && isAllowed) {
        if (i % 10 === 0) console.log(`✅ Scan request ${i + 1} allowed`);
        passed++;
      } else if (i >= 30 && !isAllowed) {
        passed++;
        console.log(`✅ Scan request ${i + 1} properly rate limited`);
      } else {
        failed++;
        errors.push(`❌ Scan rate limiting failed at request ${i + 1}`);
      }
    }

  } catch (error) {
    failed++;
    errors.push(`❌ Rate limiting test error: ${error}`);
  }

  return { passed, failed, errors };
}

/**
 * Test dosage validation
 */
export function testDosageValidation(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🧪 Testing Dosage Validation...');

  // Test valid dosages
  testCases.dosage.valid.forEach(dosage => {
    const result = validateDosage(dosage);
    if (result.isValid) {
      passed++;
      console.log(`✅ Valid dosage accepted: ${dosage}`);
    } else {
      failed++;
      errors.push(`❌ Valid dosage rejected: ${dosage} - ${result.error}`);
    }
  });

  // Test invalid dosages
  testCases.dosage.invalid.forEach(dosage => {
    const result = validateDosage(dosage);
    if (!result.isValid) {
      passed++;
      console.log(`✅ Invalid dosage rejected: ${dosage}`);
    } else {
      failed++;
      errors.push(`❌ Invalid dosage accepted: ${dosage}`);
    }
  });

  return { passed, failed, errors };
}

/**
 * Run all security tests
 */
export async function runAllSecurityTests(): Promise<void> {
  console.log('🔒 Starting Comprehensive Security Validation Tests\n');

  const results = {
    email: testEmailValidation(),
    password: testPasswordValidation(),
    sanitization: testTextSanitization(),
    dosage: testDosageValidation(),
    rateLimiting: await testRateLimiting()
  };

  // Summary
  const totalPassed = Object.values(results).reduce((sum, result) => sum + result.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, result) => sum + result.failed, 0);
  const allErrors = Object.values(results).flatMap(result => result.errors);

  console.log('\n📊 Security Test Results Summary:');
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);

  if (allErrors.length > 0) {
    console.log('\n🚨 Errors Found:');
    allErrors.forEach(error => console.log(error));
  } else {
    console.log('\n🎉 All security tests passed!');
  }
}

// Export for manual testing
export { testCases };
