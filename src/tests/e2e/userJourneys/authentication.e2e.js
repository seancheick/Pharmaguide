// src/tests/e2e/userJourneys/authentication.e2e.js
// E2E tests for authentication user journeys

const { device, expect, element, by, waitFor } = require('detox');

describe('Authentication User Journey', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await TestHelpers.waitForLoadingToComplete();
  });

  describe('User Registration Flow', () => {
    it('should complete full registration process', async () => {
      // Should start on welcome screen
      await expect(element(by.id('welcome-screen'))).toBeVisible();
      
      // Tap sign up button
      await TestHelpers.tapElement(by.id('signup-button'));
      
      // Fill registration form
      await TestHelpers.typeText(by.id('email-input'), 'newuser@example.com');
      await TestHelpers.typeText(by.id('password-input'), 'SecurePass123!');
      await TestHelpers.typeText(by.id('confirm-password-input'), 'SecurePass123!');
      
      // Accept terms and conditions
      await TestHelpers.tapElement(by.id('terms-checkbox'));
      
      // Submit registration
      await TestHelpers.tapElement(by.id('submit-signup-button'));
      
      // Should show email verification screen
      await expect(element(by.id('email-verification-screen'))).toExistEventually();
      await expect(element(by.text('Check your email'))).toBeVisible();
      
      // Take screenshot for verification
      await TestHelpers.takeScreenshot('registration-email-verification');
    });

    it('should validate registration form inputs', async () => {
      await TestHelpers.tapElement(by.id('signup-button'));
      
      // Try to submit empty form
      await TestHelpers.tapElement(by.id('submit-signup-button'));
      
      // Should show validation errors
      await expect(element(by.text('Email is required'))).toBeVisible();
      await expect(element(by.text('Password is required'))).toBeVisible();
      
      // Test invalid email
      await TestHelpers.typeText(by.id('email-input'), 'invalid-email');
      await TestHelpers.tapElement(by.id('submit-signup-button'));
      await expect(element(by.text('Please enter a valid email'))).toBeVisible();
      
      // Test weak password
      await TestHelpers.typeText(by.id('email-input'), 'test@example.com');
      await TestHelpers.typeText(by.id('password-input'), '123');
      await TestHelpers.tapElement(by.id('submit-signup-button'));
      await expect(element(by.text('Password must be at least 8 characters'))).toBeVisible();
      
      // Test password mismatch
      await TestHelpers.typeText(by.id('password-input'), 'SecurePass123!');
      await TestHelpers.typeText(by.id('confirm-password-input'), 'DifferentPass123!');
      await TestHelpers.tapElement(by.id('submit-signup-button'));
      await expect(element(by.text('Passwords do not match'))).toBeVisible();
    });

    it('should handle registration errors gracefully', async () => {
      await TestHelpers.tapElement(by.id('signup-button'));
      
      // Use an email that already exists (mock scenario)
      await TestHelpers.typeText(by.id('email-input'), 'existing@example.com');
      await TestHelpers.typeText(by.id('password-input'), 'SecurePass123!');
      await TestHelpers.typeText(by.id('confirm-password-input'), 'SecurePass123!');
      await TestHelpers.tapElement(by.id('terms-checkbox'));
      
      await TestHelpers.tapElement(by.id('submit-signup-button'));
      
      // Should show error message
      await expect(element(by.text('Email already registered'))).toExistEventually();
      
      // Should allow user to try again
      await expect(element(by.id('submit-signup-button'))).toBeTappable();
    });
  });

  describe('User Login Flow', () => {
    it('should complete successful login process', async () => {
      // Navigate to login
      await TestHelpers.tapElement(by.id('login-button'));
      
      // Fill login form
      await TestHelpers.typeText(by.id('email-input'), 'test@example.com');
      await TestHelpers.typeText(by.id('password-input'), 'TestPass123!');
      
      // Submit login
      await TestHelpers.tapElement(by.id('submit-login-button'));
      
      // Should navigate to home screen
      await expect(element(by.id('home-screen'))).toExistEventually(15000);
      await expect(element(by.text('Welcome to PharmaGuide'))).toBeVisible();
      
      // Should show user-specific content
      await expect(element(by.id('user-stack-section'))).toBeVisible();
      
      await TestHelpers.takeScreenshot('successful-login');
    });

    it('should handle invalid login credentials', async () => {
      await TestHelpers.tapElement(by.id('login-button'));
      
      // Try invalid credentials
      await TestHelpers.typeText(by.id('email-input'), 'wrong@example.com');
      await TestHelpers.typeText(by.id('password-input'), 'wrongpassword');
      await TestHelpers.tapElement(by.id('submit-login-button'));
      
      // Should show error message
      await expect(element(by.text('Invalid email or password'))).toExistEventually();
      
      // Should remain on login screen
      await expect(element(by.id('login-screen'))).toBeVisible();
    });

    it('should remember login state after app restart', async () => {
      // Login first
      await TestHelpers.loginUser();
      await expect(element(by.id('home-screen'))).toBeVisible();
      
      // Restart app
      await device.reloadReactNative();
      await TestHelpers.waitForLoadingToComplete();
      
      // Should still be logged in
      await expect(element(by.id('home-screen'))).toExistEventually();
      await expect(element(by.text('Welcome to PharmaGuide'))).toBeVisible();
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete password reset process', async () => {
      await TestHelpers.tapElement(by.id('login-button'));
      
      // Tap forgot password
      await TestHelpers.tapElement(by.id('forgot-password-button'));
      
      // Should show password reset screen
      await expect(element(by.id('password-reset-screen'))).toBeVisible();
      
      // Enter email
      await TestHelpers.typeText(by.id('email-input'), 'test@example.com');
      await TestHelpers.tapElement(by.id('send-reset-button'));
      
      // Should show confirmation
      await expect(element(by.text('Reset link sent'))).toExistEventually();
      await expect(element(by.text('Check your email for reset instructions'))).toBeVisible();
    });

    it('should validate email for password reset', async () => {
      await TestHelpers.tapElement(by.id('login-button'));
      await TestHelpers.tapElement(by.id('forgot-password-button'));
      
      // Try empty email
      await TestHelpers.tapElement(by.id('send-reset-button'));
      await expect(element(by.text('Email is required'))).toBeVisible();
      
      // Try invalid email
      await TestHelpers.typeText(by.id('email-input'), 'invalid-email');
      await TestHelpers.tapElement(by.id('send-reset-button'));
      await expect(element(by.text('Please enter a valid email'))).toBeVisible();
    });
  });

  describe('Logout Flow', () => {
    it('should complete logout process', async () => {
      // Login first
      await TestHelpers.loginUser();
      await expect(element(by.id('home-screen'))).toBeVisible();
      
      // Navigate to profile
      await TestHelpers.tapElement(by.id('profile-tab'));
      await expect(element(by.id('profile-screen'))).toBeVisible();
      
      // Tap logout
      await TestHelpers.tapElement(by.id('logout-button'));
      
      // Should show confirmation dialog
      await expect(element(by.text('Are you sure you want to logout?'))).toBeVisible();
      await TestHelpers.tapElement(by.id('confirm-logout-button'));
      
      // Should return to welcome screen
      await expect(element(by.id('welcome-screen'))).toExistEventually();
      await expect(element(by.id('login-button'))).toBeVisible();
      
      await TestHelpers.takeScreenshot('successful-logout');
    });

    it('should allow canceling logout', async () => {
      await TestHelpers.loginUser();
      await TestHelpers.tapElement(by.id('profile-tab'));
      await TestHelpers.tapElement(by.id('logout-button'));
      
      // Cancel logout
      await TestHelpers.tapElement(by.id('cancel-logout-button'));
      
      // Should remain on profile screen
      await expect(element(by.id('profile-screen'))).toBeVisible();
      await expect(element(by.id('logout-button'))).toBeVisible();
    });
  });

  describe('Session Management', () => {
    it('should handle session expiration', async () => {
      await TestHelpers.loginUser();
      
      // Simulate session expiration (this would need backend support)
      // For now, we'll test the UI behavior
      
      // Try to perform an authenticated action
      await TestHelpers.tapElement(by.id('stack-tab'));
      
      // If session expired, should redirect to login
      // This test would need actual session expiration simulation
    });

    it('should handle app backgrounding and foregrounding', async () => {
      await TestHelpers.loginUser();
      await expect(element(by.id('home-screen'))).toBeVisible();
      
      // Background app
      await TestHelpers.backgroundApp(5000);
      
      // Should still be logged in after foregrounding
      await expect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('Accessibility in Authentication', () => {
    it('should be accessible with screen reader', async () => {
      await TestHelpers.tapElement(by.id('login-button'));
      
      // Check accessibility labels
      await expect(element(by.id('email-input'))).toHaveAccessibilityLabel('Email address');
      await expect(element(by.id('password-input'))).toHaveAccessibilityLabel('Password');
      await expect(element(by.id('submit-login-button'))).toHaveAccessibilityLabel('Sign in');
      
      // Check accessibility hints
      const emailInput = element(by.id('email-input'));
      await expect(emailInput).toHaveAccessibilityHint('Enter your email address');
    });

    it('should support keyboard navigation', async () => {
      await TestHelpers.tapElement(by.id('login-button'));
      
      // Tab through form fields
      await TestHelpers.typeText(by.id('email-input'), 'test@example.com');
      
      // Should be able to navigate to password field
      await element(by.id('password-input')).tap();
      await TestHelpers.typeText(by.id('password-input'), 'password');
      
      // Should be able to submit with keyboard
      await element(by.id('submit-login-button')).tap();
    });
  });
});
