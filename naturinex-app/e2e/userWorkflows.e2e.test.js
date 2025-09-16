const { device, expect, element, by, waitFor } = require('detox');

describe('NaturineX E2E User Workflows', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('First Time User Onboarding', () => {
    test('should complete full onboarding flow', async () => {
      // Check if disclaimer appears
      await waitFor(element(by.text('Medical Disclaimer')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Read and accept disclaimer
      await element(by.id('disclaimer-scroll')).scroll(300, 'down');
      await waitFor(element(by.id('accept-disclaimer-button')))
        .toBeVisible()
        .withTimeout(3000);
      
      await element(by.id('accept-disclaimer-button')).tap();
      
      // Should show privacy notice
      await waitFor(element(by.text('Privacy Notice')))
        .toBeVisible()
        .withTimeout(3000);
      
      await element(by.id('accept-privacy-button')).tap();
      
      // Should show app intro/tutorial
      await waitFor(element(by.text('Welcome to NaturineX')))
        .toBeVisible()
        .withTimeout(3000);
      
      await element(by.id('skip-tutorial-button')).tap();
      
      // Should reach main dashboard
      await waitFor(element(by.text('Scan Medication')))
        .toBeVisible()
        .withTimeout(3000);
    });

    test('should enforce minimum reading time for disclaimer', async () => {
      await waitFor(element(by.text('Medical Disclaimer')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Try to accept immediately (should be disabled)
      await expect(element(by.id('accept-disclaimer-button'))).toBeNotVisible();
      
      // Wait for minimum reading time
      await device.waitForEvent('disclaimerReadingTimeCompleted', 10000);
      
      // Now button should be visible
      await expect(element(by.id('accept-disclaimer-button'))).toBeVisible();
    });
  });

  describe('Medication Scanning Workflow', () => {
    beforeEach(async () => {
      // Skip onboarding for these tests
      await device.launchApp({ newInstance: true });
      await element(by.id('skip-onboarding')).tap();
    });

    test('should complete manual medication entry workflow', async () => {
      // Navigate to scan tab
      await element(by.text('Scan Medication')).tap();
      
      // Select manual entry tab
      await element(by.text('Manual Entry')).tap();
      
      // Enter medication name
      await element(by.id('medication-input')).typeText('Aspirin 81mg');
      
      // Tap analyze button
      await element(by.id('analyze-button')).tap();
      
      // Wait for analysis to complete
      await waitFor(element(by.text('Analysis Complete')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Verify results are displayed
      await expect(element(by.text('Aspirin'))).toBeVisible();
      await expect(element(by.text('Acetylsalicylic Acid'))).toBeVisible();
      
      // Check drug interactions section
      await element(by.id('results-scroll')).scroll(200, 'down');
      await expect(element(by.text('Drug Interactions'))).toBeVisible();
      
      // Save scan to history
      await element(by.id('save-scan-button')).tap();
      
      // Verify success message
      await waitFor(element(by.text('Scan saved to history')))
        .toBeVisible()
        .withTimeout(3000);
    });

    test('should complete camera scanning workflow', async () => {
      // Grant camera permissions if needed
      await device.grantPermissions({ name: 'camera' });
      
      await element(by.text('Scan Medication')).tap();
      await element(by.text('Camera Scan')).tap();
      
      // Start camera
      await element(by.id('start-camera-button')).tap();
      
      // Wait for camera to initialize
      await waitFor(element(by.id('camera-view')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Simulate taking a photo
      await element(by.id('capture-button')).tap();
      
      // Wait for OCR processing
      await waitFor(element(by.text('Processing Image...')))
        .toBeVisible()
        .withTimeout(3000);
      
      await waitFor(element(by.text('OCR Complete')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Verify extracted text is shown
      await expect(element(by.id('extracted-text'))).toBeVisible();
      
      // Confirm the medication
      await element(by.id('confirm-medication-button')).tap();
      
      // Should proceed to analysis
      await waitFor(element(by.text('Analysis Complete')))
        .toBeVisible()
        .withTimeout(15000);
    });

    test('should handle image upload workflow', async () => {
      // Grant photo library permissions
      await device.grantPermissions({ name: 'photos' });
      
      await element(by.text('Scan Medication')).tap();
      await element(by.text('Upload Image')).tap();
      
      // Select image from library
      await element(by.id('select-image-button')).tap();
      
      // This would open the photo picker in a real scenario
      // For testing, we'll simulate the selection
      await device.waitForEvent('imageSelected', 5000);
      
      // Verify image preview
      await expect(element(by.id('image-preview'))).toBeVisible();
      
      // Process the image
      await element(by.id('process-image-button')).tap();
      
      await waitFor(element(by.text('Processing Image...')))
        .toBeVisible()
        .withTimeout(3000);
      
      await waitFor(element(by.text('OCR Complete')))
        .toBeVisible()
        .withTimeout(15000);
    });

    test('should handle scan quota for free users', async () => {
      // Perform multiple scans to exhaust quota
      for (let i = 0; i < 4; i++) {
        await element(by.text('Scan Medication')).tap();
        await element(by.text('Manual Entry')).tap();
        await element(by.id('medication-input')).clearText();
        await element(by.id('medication-input')).typeText(`TestMed${i}`);
        await element(by.id('analyze-button')).tap();
        
        if (i < 3) {
          await waitFor(element(by.text('Analysis Complete')))
            .toBeVisible()
            .withTimeout(15000);
          await element(by.id('back-button')).tap();
        }
      }
      
      // Should show quota exceeded message
      await waitFor(element(by.text('Daily scan limit reached')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should show upgrade prompt
      await expect(element(by.text('Upgrade to Premium'))).toBeVisible();
    });
  });

  describe('Scan History and Management', () => {
    test('should view and manage scan history', async () => {
      // Navigate to history tab
      await element(by.text('My Scans')).tap();
      
      // Should show recent scans
      await waitFor(element(by.id('scan-history-list')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Tap on a scan to view details
      await element(by.id('scan-item-0')).tap();
      
      // Should show scan details
      await expect(element(by.text('Scan Details'))).toBeVisible();
      await expect(element(by.id('medication-name'))).toBeVisible();
      await expect(element(by.id('scan-timestamp'))).toBeVisible();
      
      // Test sharing functionality
      await element(by.id('share-scan-button')).tap();
      
      // Should open share dialog
      await waitFor(element(by.text('Share Scan Results')))
        .toBeVisible()
        .withTimeout(3000);
      
      await element(by.text('Cancel')).tap();
      
      // Test delete functionality
      await element(by.id('delete-scan-button')).tap();
      
      // Should show confirmation
      await waitFor(element(by.text('Delete this scan?')))
        .toBeVisible()
        .withTimeout(3000);
      
      await element(by.text('Cancel')).tap();
    });

    test('should filter and search scan history', async () => {
      await element(by.text('My Scans')).tap();
      
      // Test search functionality
      await element(by.id('search-scans-input')).typeText('Aspirin');
      
      // Should filter results
      await waitFor(element(by.id('filtered-results')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Clear search
      await element(by.id('clear-search-button')).tap();
      
      // Test date filter
      await element(by.id('filter-button')).tap();
      await element(by.text('Last 7 days')).tap();
      await element(by.text('Apply')).tap();
      
      // Should show filtered results
      await waitFor(element(by.id('date-filtered-results')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('User Account and Settings', () => {
    test('should complete user registration flow', async () => {
      await element(by.text('Settings')).tap();
      await element(by.text('Sign Up')).tap();
      
      // Fill registration form
      await element(by.id('email-input')).typeText('test@naturinex.com');
      await element(by.id('password-input')).typeText('TestPassword123!');
      await element(by.id('confirm-password-input')).typeText('TestPassword123!');
      
      // Accept terms
      await element(by.id('terms-checkbox')).tap();
      
      // Submit registration
      await element(by.id('register-button')).tap();
      
      // Should show email verification message
      await waitFor(element(by.text('Check your email')))
        .toBeVisible()
        .withTimeout(5000);
    });

    test('should update user preferences', async () => {
      await element(by.text('Settings')).tap();
      
      // Navigate to preferences
      await element(by.text('Preferences')).tap();
      
      // Toggle notifications
      await element(by.id('email-notifications-toggle')).tap();
      await element(by.id('push-notifications-toggle')).tap();
      
      // Change theme
      await element(by.id('theme-selector')).tap();
      await element(by.text('Dark')).tap();
      
      // Save preferences
      await element(by.id('save-preferences-button')).tap();
      
      // Should show success message
      await waitFor(element(by.text('Preferences saved')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Verify dark theme is applied
      await expect(element(by.id('dark-theme-indicator'))).toBeVisible();
    });

    test('should manage subscription', async () => {
      await element(by.text('Settings')).tap();
      await element(by.text('Subscription')).tap();
      
      // Should show current plan
      await expect(element(by.text('Free Plan'))).toBeVisible();
      
      // Tap upgrade
      await element(by.id('upgrade-button')).tap();
      
      // Should show pricing plans
      await waitFor(element(by.text('Choose Your Plan')))
        .toBeVisible()
        .withTimeout(3000);
      
      await expect(element(by.text('Monthly'))).toBeVisible();
      await expect(element(by.text('Annual'))).toBeVisible();
      
      // Select annual plan
      await element(by.id('annual-plan-button')).tap();
      
      // Should show payment screen
      await waitFor(element(by.text('Payment Details')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Cancel for test
      await element(by.text('Cancel')).tap();
    });
  });

  describe('Offline Functionality', () => {
    test('should work in offline mode', async () => {
      // Disable network
      await device.setNetworkStatus('offline');
      
      // Navigate to scan
      await element(by.text('Scan Medication')).tap();
      await element(by.text('Manual Entry')).tap();
      
      // Enter medication
      await element(by.id('medication-input')).typeText('Offline Test Med');
      await element(by.id('analyze-button')).tap();
      
      // Should show offline message
      await waitFor(element(by.text('You are offline')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should queue scan for later
      await element(by.id('queue-scan-button')).tap();
      
      await waitFor(element(by.text('Scan queued')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Re-enable network
      await device.setNetworkStatus('online');
      
      // Should show sync notification
      await waitFor(element(by.text('Syncing queued scans')))
        .toBeVisible()
        .withTimeout(5000);
    });

    test('should sync data when back online', async () => {
      // Ensure we have queued data from previous test
      await element(by.text('Settings')).tap();
      await element(by.text('Sync Status')).tap();
      
      // Should show sync information
      await expect(element(by.id('pending-syncs'))).toBeVisible();
      
      // Trigger manual sync
      await element(by.id('manual-sync-button')).tap();
      
      await waitFor(element(by.text('Sync complete')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle API errors gracefully', async () => {
      // Mock API failure
      await device.setNetworkStatus('slow');
      
      await element(by.text('Scan Medication')).tap();
      await element(by.text('Manual Entry')).tap();
      await element(by.id('medication-input')).typeText('Error Test Med');
      await element(by.id('analyze-button')).tap();
      
      // Should show error message
      await waitFor(element(by.text('Analysis failed')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Should offer retry option
      await expect(element(by.id('retry-button'))).toBeVisible();
      
      // Restore network and retry
      await device.setNetworkStatus('online');
      await element(by.id('retry-button')).tap();
      
      // Should succeed on retry
      await waitFor(element(by.text('Analysis Complete')))
        .toBeVisible()
        .withTimeout(15000);
    });

    test('should handle camera permission denied', async () => {
      // Deny camera permission
      await device.denyPermissions({ name: 'camera' });
      
      await element(by.text('Scan Medication')).tap();
      await element(by.text('Camera Scan')).tap();
      await element(by.id('start-camera-button')).tap();
      
      // Should show permission denied message
      await waitFor(element(by.text('Camera permission required')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should offer to open settings
      await element(by.text('Open Settings')).tap();
      
      // This would open device settings in real scenario
    });

    test('should handle app crash recovery', async () => {
      // Simulate app crash
      await device.terminateApp();
      await device.launchApp();
      
      // Should recover gracefully
      await waitFor(element(by.text('Welcome back')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should restore previous state
      await expect(element(by.text('Scan Medication'))).toBeVisible();
      
      // Check if unsaved data is recovered
      await element(by.text('Settings')).tap();
      await element(by.text('Recovery')).tap();
      
      // Should show recovery options if data exists
      const hasRecoveryData = await element(by.id('recovery-data')).exists();
      if (hasRecoveryData) {
        await element(by.id('restore-data-button')).tap();
        await waitFor(element(by.text('Data restored')))
          .toBeVisible()
          .withTimeout(3000);
      }
    });
  });

  describe('Accessibility', () => {
    test('should support screen reader navigation', async () => {
      // Enable accessibility
      await device.setAccessibilityService(true);
      
      // Navigate using accessibility labels
      await element(by.accessibilityLabel('Scan Medication tab')).tap();
      await element(by.accessibilityLabel('Manual Entry tab')).tap();
      
      // Verify accessibility labels are present
      await expect(element(by.accessibilityLabel('Medication name input field')))
        .toBeVisible();
      
      await expect(element(by.accessibilityLabel('Analyze medication button')))
        .toBeVisible();
    });

    test('should support voice control', async () => {
      // This would test voice commands in a real scenario
      // For now, we'll test that voice-enabled elements are accessible
      
      await expect(element(by.accessibilityHint('Double tap to analyze medication')))
        .toBeVisible();
      
      await expect(element(by.accessibilityTraits(['button'])))
        .toBeVisible();
    });

    test('should support large text sizes', async () => {
      // This would test dynamic text scaling
      await device.setAccessibilityTextSize('large');
      
      // Elements should still be visible and usable
      await expect(element(by.text('Scan Medication'))).toBeVisible();
      await expect(element(by.id('medication-input'))).toBeVisible();
      
      // Reset to normal size
      await device.setAccessibilityTextSize('normal');
    });
  });

  describe('Performance', () => {
    test('should load main screens within performance thresholds', async () => {
      const startTime = Date.now();
      
      await element(by.text('Scan Medication')).tap();
      await waitFor(element(by.id('medication-input')))
        .toBeVisible()
        .withTimeout(3000);
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // Should load within 2 seconds
    });

    test('should handle rapid user interactions', async () => {
      // Rapidly tap between tabs
      for (let i = 0; i < 5; i++) {
        await element(by.text('Scan Medication')).tap();
        await element(by.text('My Scans')).tap();
        await element(by.text('Settings')).tap();
      }
      
      // App should remain responsive
      await expect(element(by.text('Settings'))).toBeVisible();
    });
  });
});