describe('Naturinex App E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should show onboarding or main screen', async () => {
    await expect(element(by.text('Naturinex'))).toBeVisible();
  });

  it('should show scan interface tabs', async () => {
    await expect(element(by.text('Manual Entry'))).toBeVisible();
    await expect(element(by.text('Camera Scan'))).toBeVisible();
    await expect(element(by.text('Upload Image'))).toBeVisible();
  });

  it('should allow entering medication name', async () => {
    await element(by.text('Manual Entry')).tap();
    await element(by.label('Medication Name')).typeText('Aspirin');
    await expect(element(by.text('Analyze Medication'))).toBeVisible();
  });

  it('should show quota info for free users', async () => {
    await expect(element(by.text(/Remaining scans today/i))).toBeVisible();
  });

  it('should show error for empty medication name', async () => {
    await element(by.text('Manual Entry')).tap();
    await element(by.text('Analyze Medication')).tap();
    await expect(element(by.text(/Please enter a medication name/i))).toBeVisible();
  });

  it('should navigate to camera tab and show camera controls', async () => {
    await element(by.text('Camera Scan')).tap();
    await expect(element(by.text('Start Camera'))).toBeVisible();
  });

  // Premium flow (mocked)
  it('should show upgrade prompt when quota exceeded (mock)', async () => {
    // Simulate quota exceeded by tapping Analyze multiple times
    await element(by.text('Manual Entry')).tap();
    for (let i = 0; i < 5; i++) {
      await element(by.label('Medication Name')).clearText();
      await element(by.label('Medication Name')).typeText('TestMed' + i);
      await element(by.text('Analyze Medication')).tap();
    }
    await expect(element(by.text(/Upgrade to premium/i))).toBeVisible();
  });

  // iOS-specific test (runs on both platforms)
  it('should render correctly on iOS and Android', async () => {
    await expect(element(by.text('Naturinex'))).toBeVisible();
  });
}); 