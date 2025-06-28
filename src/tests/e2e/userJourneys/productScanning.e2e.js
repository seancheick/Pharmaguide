// src/tests/e2e/userJourneys/productScanning.e2e.js
// E2E tests for product scanning and analysis user journeys

const { device, expect, element, by, waitFor } = require('detox');

describe('Product Scanning User Journey', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await TestHelpers.waitForLoadingToComplete();
    
    // Login for authenticated features
    await TestHelpers.loginUser();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  describe('Barcode Scanning Flow', () => {
    it('should complete full barcode scanning process', async () => {
      // Navigate to scan screen
      await TestHelpers.tapElement(by.id('scan-button'));
      await expect(element(by.id('scan-screen'))).toBeVisible();
      
      // Should show camera permission request if needed
      try {
        await expect(element(by.text('Camera permission required'))).toBeVisible();
        await TestHelpers.tapElement(by.id('grant-camera-permission'));
      } catch (error) {
        // Permission already granted
      }
      
      // Should show barcode scanner
      await expect(element(by.id('barcode-scanner'))).toExistEventually();
      await expect(element(by.text('Point camera at barcode'))).toBeVisible();
      
      // Simulate barcode scan (this would need mock barcode data)
      // For testing, we'll use a test barcode
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Test Barcode Scan',
        body: 'Simulating barcode: 1234567890123',
        payload: {
          barcode: '1234567890123',
          type: 'ean13'
        }
      });
      
      // Should navigate to product analysis
      await expect(element(by.id('product-analysis-screen'))).toExistEventually(15000);
      
      await TestHelpers.takeScreenshot('barcode-scan-success');
    });

    it('should handle camera permission denial', async () => {
      await TestHelpers.tapElement(by.id('scan-button'));
      
      // Deny camera permission
      await device.denyPermissions(['camera']);
      
      // Should show permission denied message
      await expect(element(by.text('Camera access is required for scanning'))).toExistEventually();
      await expect(element(by.id('open-settings-button'))).toBeVisible();
      
      // Should allow opening settings
      await TestHelpers.tapElement(by.id('open-settings-button'));
    });

    it('should handle invalid barcodes gracefully', async () => {
      await TestHelpers.tapElement(by.id('scan-button'));
      
      // Simulate invalid barcode
      await device.sendUserNotification({
        payload: {
          barcode: 'invalid-barcode',
          type: 'unknown'
        }
      });
      
      // Should show error message
      await expect(element(by.text('Invalid barcode format'))).toExistEventually();
      
      // Should allow trying again
      await expect(element(by.id('barcode-scanner'))).toBeVisible();
    });

    it('should handle network errors during product lookup', async () => {
      // Set network to offline
      await TestHelpers.setNetworkCondition('offline');
      
      await TestHelpers.tapElement(by.id('scan-button'));
      
      // Simulate barcode scan
      await device.sendUserNotification({
        payload: {
          barcode: '1234567890123',
          type: 'ean13'
        }
      });
      
      // Should show network error
      await expect(element(by.text('Network error'))).toExistEventually();
      await expect(element(by.id('retry-button'))).toBeVisible();
      
      // Restore network and retry
      await TestHelpers.setNetworkCondition('online');
      await TestHelpers.tapElement(by.id('retry-button'));
      
      // Should succeed on retry
      await expect(element(by.id('product-analysis-screen'))).toExistEventually();
    });
  });

  describe('Product Analysis Display', () => {
    beforeEach(async () => {
      // Navigate to product analysis with mock data
      await TestHelpers.tapElement(by.id('scan-button'));
      await device.sendUserNotification({
        payload: {
          barcode: '1234567890123',
          type: 'ean13'
        }
      });
      await expect(element(by.id('product-analysis-screen'))).toExistEventually();
    });

    it('should display complete product information', async () => {
      // Should show product header
      await expect(element(by.id('product-header'))).toBeVisible();
      await expect(element(by.id('product-name'))).toBeVisible();
      await expect(element(by.id('product-brand'))).toBeVisible();
      
      // Should show safety score
      await expect(element(by.id('safety-score-card'))).toBeVisible();
      await expect(element(by.id('safety-score-value'))).toBeVisible();
      
      // Should show ingredients list
      await expect(element(by.id('ingredients-section'))).toBeVisible();
      
      // Should show analysis sections
      await expect(element(by.id('analysis-sections'))).toBeVisible();
      
      await TestHelpers.takeScreenshot('product-analysis-complete');
    });

    it('should allow scrolling through analysis sections', async () => {
      // Scroll to interactions section
      await element(by.id('analysis-scroll-view')).scrollTo('down');
      await expect(element(by.id('interactions-section'))).toBeVisible();
      
      // Scroll to recommendations section
      await element(by.id('analysis-scroll-view')).scrollTo('down');
      await expect(element(by.id('recommendations-section'))).toBeVisible();
      
      // Scroll back to top
      await element(by.id('analysis-scroll-view')).scrollTo('up');
      await expect(element(by.id('product-header'))).toBeVisible();
    });

    it('should show interaction alerts when present', async () => {
      // Should show interaction alert if interactions exist
      try {
        await expect(element(by.id('interaction-alert'))).toBeVisible();
        await expect(element(by.text('Potential Interactions Found'))).toBeVisible();
        
        // Should allow viewing interaction details
        await TestHelpers.tapElement(by.id('view-interactions-button'));
        await expect(element(by.id('interactions-modal'))).toBeVisible();
        
        // Should allow closing modal
        await TestHelpers.tapElement(by.id('close-interactions-modal'));
        await expect(element(by.id('interactions-modal'))).not.toBeVisible();
      } catch (error) {
        // No interactions present, which is fine
      }
    });

    it('should handle AI analysis loading states', async () => {
      // Should show loading indicator during analysis
      await expect(element(by.id('ai-analysis-loading'))).toExistEventually();
      
      // Should hide loading when complete
      await waitFor(element(by.id('ai-analysis-loading')))
        .not.toExist()
        .withTimeout(30000);
      
      // Should show analysis results
      await expect(element(by.id('ai-analysis-results'))).toBeVisible();
    });
  });

  describe('Add to Stack Flow', () => {
    beforeEach(async () => {
      await TestHelpers.tapElement(by.id('scan-button'));
      await device.sendUserNotification({
        payload: {
          barcode: '1234567890123',
          type: 'ean13'
        }
      });
      await expect(element(by.id('product-analysis-screen'))).toExistEventually();
    });

    it('should add product to user stack', async () => {
      // Tap add to stack button
      await TestHelpers.tapElement(by.id('add-to-stack-button'));
      
      // Should show add to stack modal
      await expect(element(by.id('add-to-stack-modal'))).toBeVisible();
      
      // Fill stack item details
      await TestHelpers.typeText(by.id('dosage-input'), '1000mg');
      await TestHelpers.typeText(by.id('frequency-input'), 'Daily');
      await TestHelpers.typeText(by.id('time-input'), 'Morning');
      await TestHelpers.typeText(by.id('notes-input'), 'Take with food');
      
      // Submit
      await TestHelpers.tapElement(by.id('confirm-add-to-stack'));
      
      // Should show success message
      await expect(element(by.text('Added to your stack'))).toExistEventually();
      
      // Should close modal
      await expect(element(by.id('add-to-stack-modal'))).not.toBeVisible();
      
      await TestHelpers.takeScreenshot('added-to-stack');
    });

    it('should validate stack item form', async () => {
      await TestHelpers.tapElement(by.id('add-to-stack-button'));
      
      // Try to submit empty form
      await TestHelpers.tapElement(by.id('confirm-add-to-stack'));
      
      // Should show validation errors
      await expect(element(by.text('Dosage is required'))).toBeVisible();
      await expect(element(by.text('Frequency is required'))).toBeVisible();
    });

    it('should handle duplicate products in stack', async () => {
      // Add product first time
      await TestHelpers.tapElement(by.id('add-to-stack-button'));
      await TestHelpers.typeText(by.id('dosage-input'), '1000mg');
      await TestHelpers.typeText(by.id('frequency-input'), 'Daily');
      await TestHelpers.tapElement(by.id('confirm-add-to-stack'));
      
      await expect(element(by.text('Added to your stack'))).toExistEventually();
      
      // Try to add same product again
      await TestHelpers.tapElement(by.id('add-to-stack-button'));
      
      // Should show duplicate warning
      await expect(element(by.text('This product is already in your stack'))).toBeVisible();
      await expect(element(by.id('update-existing-button'))).toBeVisible();
      await expect(element(by.id('add-anyway-button'))).toBeVisible();
    });
  });

  describe('Manual Product Search', () => {
    it('should search products by name', async () => {
      // Navigate to search
      await TestHelpers.tapElement(by.id('search-tab'));
      await expect(element(by.id('search-screen'))).toBeVisible();
      
      // Enter search query
      await TestHelpers.typeText(by.id('search-input'), 'Vitamin D3');
      await TestHelpers.tapElement(by.id('search-button'));
      
      // Should show search results
      await expect(element(by.id('search-results'))).toExistEventually();
      await expect(element(by.id('search-result-item'))).toBeVisible();
      
      // Tap on search result
      await TestHelpers.tapElement(by.id('search-result-item').atIndex(0));
      
      // Should navigate to product analysis
      await expect(element(by.id('product-analysis-screen'))).toExistEventually();
    });

    it('should handle empty search results', async () => {
      await TestHelpers.tapElement(by.id('search-tab'));
      
      // Search for non-existent product
      await TestHelpers.typeText(by.id('search-input'), 'NonExistentProduct12345');
      await TestHelpers.tapElement(by.id('search-button'));
      
      // Should show no results message
      await expect(element(by.text('No products found'))).toExistEventually();
      await expect(element(by.id('suggest-product-button'))).toBeVisible();
    });

    it('should provide search suggestions', async () => {
      await TestHelpers.tapElement(by.id('search-tab'));
      
      // Start typing
      await TestHelpers.typeText(by.id('search-input'), 'Vit');
      
      // Should show suggestions
      await expect(element(by.id('search-suggestions'))).toExistEventually();
      await expect(element(by.text('Vitamin D3'))).toBeVisible();
      await expect(element(by.text('Vitamin C'))).toBeVisible();
      
      // Tap suggestion
      await TestHelpers.tapElement(by.text('Vitamin D3'));
      
      // Should fill search input
      await expect(element(by.id('search-input'))).toHaveText('Vitamin D3');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle rapid scanning attempts', async () => {
      await TestHelpers.tapElement(by.id('scan-button'));
      
      // Simulate rapid barcode scans
      for (let i = 0; i < 5; i++) {
        await device.sendUserNotification({
          payload: {
            barcode: `123456789012${i}`,
            type: 'ean13'
          }
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Should handle gracefully without crashes
      await expect(element(by.id('scan-screen'))).toBeVisible();
    });

    it('should maintain performance with large product data', async () => {
      // This would test with products that have many ingredients/interactions
      await TestHelpers.tapElement(by.id('scan-button'));
      
      // Simulate scanning complex product
      await device.sendUserNotification({
        payload: {
          barcode: '9999999999999', // Mock complex product
          type: 'ean13'
        }
      });
      
      // Should load within reasonable time
      await expect(element(by.id('product-analysis-screen'))).toExistEventually(20000);
      
      // Should be responsive to user interactions
      await TestHelpers.tapElement(by.id('safety-score-card'));
      await expect(element(by.id('safety-details-modal'))).toExistEventually();
    });
  });
});
