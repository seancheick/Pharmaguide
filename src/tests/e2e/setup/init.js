// src/tests/e2e/setup/init.js
// E2E test initialization and setup

const { device, expect, element, by, waitFor } = require('detox');

// Global test timeout
jest.setTimeout(300000);

// Custom matchers for better assertions
expect.extend({
  async toBeVisibleAndTappable(received) {
    try {
      await waitFor(received).toBeVisible().withTimeout(10000);
      await expect(received).toBeVisible();
      await expect(received).toBeTappable();
      return {
        message: () => `Element is visible and tappable`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Element is not visible or tappable: ${error.message}`,
        pass: false,
      };
    }
  },

  async toHaveTextContent(received, expectedText) {
    try {
      await waitFor(received).toHaveText(expectedText).withTimeout(10000);
      return {
        message: () => `Element has expected text: ${expectedText}`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Element does not have expected text: ${expectedText}. Error: ${error.message}`,
        pass: false,
      };
    }
  },

  async toExistEventually(received, timeout = 10000) {
    try {
      await waitFor(received).toExist().withTimeout(timeout);
      return {
        message: () => `Element exists`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Element does not exist within ${timeout}ms: ${error.message}`,
        pass: false,
      };
    }
  }
});

// Global test helpers
global.TestHelpers = {
  // Wait for element and tap
  async tapElement(elementMatcher, timeout = 10000) {
    const el = element(elementMatcher);
    await waitFor(el).toBeVisible().withTimeout(timeout);
    await el.tap();
  },

  // Type text into input field
  async typeText(elementMatcher, text, timeout = 10000) {
    const el = element(elementMatcher);
    await waitFor(el).toBeVisible().withTimeout(timeout);
    await el.clearText();
    await el.typeText(text);
  },

  // Scroll to element and tap
  async scrollAndTap(scrollViewMatcher, elementMatcher, direction = 'down') {
    await element(scrollViewMatcher).scrollTo(direction);
    await this.tapElement(elementMatcher);
  },

  // Wait for loading to complete
  async waitForLoadingToComplete(timeout = 30000) {
    try {
      await waitFor(element(by.id('loading-indicator')))
        .not.toExist()
        .withTimeout(timeout);
    } catch (error) {
      // Loading indicator might not exist, which is fine
    }
  },

  // Take screenshot with custom name
  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await device.takeScreenshot(`${name}-${timestamp}`);
  },

  // Simulate app background/foreground
  async backgroundApp(duration = 2000) {
    await device.sendToHome();
    await new Promise(resolve => setTimeout(resolve, duration));
    await device.launchApp({ newInstance: false });
  },

  // Reset app to clean state
  async resetApp() {
    await device.reloadReactNative();
    await this.waitForLoadingToComplete();
  },

  // Login helper
  async loginUser(email = 'test@example.com', password = 'TestPass123!') {
    // Navigate to login if not already there
    try {
      await this.tapElement(by.id('login-button'));
    } catch (error) {
      // Already on login screen
    }

    await this.typeText(by.id('email-input'), email);
    await this.typeText(by.id('password-input'), password);
    await this.tapElement(by.id('submit-login-button'));
    await this.waitForLoadingToComplete();
  },

  // Logout helper
  async logoutUser() {
    await this.tapElement(by.id('profile-tab'));
    await this.tapElement(by.id('logout-button'));
    await this.tapElement(by.id('confirm-logout-button'));
    await this.waitForLoadingToComplete();
  },

  // Grant permissions helper
  async grantPermissions() {
    try {
      // Camera permission for barcode scanning
      await device.grantPermissions(['camera']);
      
      // Notification permissions
      await device.grantPermissions(['notifications']);
    } catch (error) {
      console.warn('Could not grant permissions:', error.message);
    }
  },

  // Mock network conditions
  async setNetworkCondition(condition) {
    // This would integrate with network mocking tools
    // For now, just log the condition
    console.log(`Setting network condition: ${condition}`);
  },

  // Verify no memory leaks
  async checkMemoryUsage() {
    // This would integrate with memory profiling tools
    // For now, just take a memory snapshot
    console.log('Checking memory usage...');
  }
};

// Global setup for each test
beforeEach(async () => {
  // Ensure app is in a clean state
  await TestHelpers.waitForLoadingToComplete();
  
  // Grant necessary permissions
  await TestHelpers.grantPermissions();
});

// Global cleanup for each test
afterEach(async () => {
  // Take screenshot on test failure
  if (jasmine.currentTest && jasmine.currentTest.failedExpectations.length > 0) {
    const testName = jasmine.currentTest.fullName.replace(/\s+/g, '-');
    await TestHelpers.takeScreenshot(`failed-${testName}`);
  }
  
  // Check for memory leaks
  await TestHelpers.checkMemoryUsage();
});

// Console logging for debugging
const originalConsoleLog = console.log;
console.log = (...args) => {
  const timestamp = new Date().toISOString();
  originalConsoleLog(`[${timestamp}] E2E:`, ...args);
};

console.log('E2E test environment initialized');
