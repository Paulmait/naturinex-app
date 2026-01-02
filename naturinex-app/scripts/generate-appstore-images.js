/**
 * App Store Image Generator
 *
 * Generates properly sized screenshots for Apple App Store submission.
 * Uses Node.js with sharp for image processing.
 *
 * Required sizes:
 * - iPhone 6.7": 1290 x 2796 pixels
 * - iPad 13": 2064 x 2752 pixels
 */

const fs = require('fs');
const path = require('path');

// Try to use sharp for image processing, fall back to simple copy
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Note: sharp not installed. Run "npm install sharp" for image resizing.');
  sharp = null;
}

// App Store screenshot dimensions
const DIMENSIONS = {
  'iphone-67': { width: 1290, height: 2796, name: 'iPhone 6.7"' },
  'ipad-13': { width: 2064, height: 2752, name: 'iPad 13"' },
};

// Screenshot filenames and their order
const SCREENSHOTS = [
  { file: '01_home_dashboard.png', title: 'Your Wellness Dashboard' },
  { file: '02_scan_camera.png', title: 'Scan Any Product' },
  { file: '03_analysis_results.png', title: 'AI-Powered Analysis' },
  { file: '04_scan_history.png', title: 'Track Your Scans' },
  { file: '05_subscription_paywall.png', title: 'Premium Features' },
  { file: '06_settings_delete_account.png', title: 'Privacy Controls' },
];

const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts', 'app-store');

async function processScreenshots() {
  console.log('Processing App Store screenshots...\n');

  for (const [deviceType, dimensions] of Object.entries(DIMENSIONS)) {
    const inputDir = path.join(ARTIFACTS_DIR, deviceType);
    const outputDir = path.join(ARTIFACTS_DIR, `${deviceType}-final`);

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Processing ${dimensions.name} screenshots...`);

    for (let i = 0; i < SCREENSHOTS.length; i++) {
      const screenshot = SCREENSHOTS[i];
      const inputPath = path.join(inputDir, screenshot.file);
      const outputPath = path.join(outputDir, `${String(i + 1).padStart(2, '0')}_${screenshot.file}`);

      if (!fs.existsSync(inputPath)) {
        console.log(`  - Skipping ${screenshot.file} (not found)`);
        continue;
      }

      if (sharp) {
        // Resize to exact App Store dimensions
        await sharp(inputPath)
          .resize(dimensions.width, dimensions.height, {
            fit: 'cover',
            position: 'center',
          })
          .toFile(outputPath);
        console.log(`  - Processed ${screenshot.file} -> ${dimensions.width}x${dimensions.height}`);
      } else {
        // Just copy if sharp not available
        fs.copyFileSync(inputPath, outputPath);
        console.log(`  - Copied ${screenshot.file} (no resizing)`);
      }
    }

    console.log(`  Output: ${outputDir}\n`);
  }

  // Process IAP review screenshots
  console.log('Processing IAP review screenshots...');
  const iapDir = path.join(ARTIFACTS_DIR, 'iap-review');
  if (fs.existsSync(iapDir)) {
    const files = fs.readdirSync(iapDir);
    console.log(`  Found ${files.length} IAP screenshots`);
  }
}

// Generate placeholder screenshots if running without Maestro
async function generatePlaceholders() {
  console.log('\nGenerating placeholder screenshots for testing...\n');

  if (!sharp) {
    console.log('Error: sharp is required for placeholder generation.');
    console.log('Run: npm install sharp');
    return;
  }

  for (const [deviceType, dimensions] of Object.entries(DIMENSIONS)) {
    const outputDir = path.join(ARTIFACTS_DIR, deviceType);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const screenshot of SCREENSHOTS) {
      const outputPath = path.join(outputDir, screenshot.file);

      // Create a simple placeholder image
      const svg = `
        <svg width="${dimensions.width}" height="${dimensions.height}">
          <rect width="100%" height="100%" fill="#10B981"/>
          <text x="50%" y="45%" font-family="Arial" font-size="60" fill="white" text-anchor="middle">
            ${screenshot.title}
          </text>
          <text x="50%" y="55%" font-family="Arial" font-size="40" fill="white" text-anchor="middle">
            ${dimensions.name} - ${dimensions.width}x${dimensions.height}
          </text>
        </svg>
      `;

      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);

      console.log(`  Created placeholder: ${screenshot.file}`);
    }
  }

  // Create IAP review placeholders
  const iapDir = path.join(ARTIFACTS_DIR, 'iap-review');
  if (!fs.existsSync(iapDir)) {
    fs.mkdirSync(iapDir, { recursive: true });
  }

  const iapScreenshots = ['paywall_screen.png', 'purchase_initiation.png'];
  for (const file of iapScreenshots) {
    const svg = `
      <svg width="1290" height="2796">
        <rect width="100%" height="100%" fill="#6366F1"/>
        <text x="50%" y="50%" font-family="Arial" font-size="60" fill="white" text-anchor="middle">
          IAP Review: ${file.replace('.png', '')}
        </text>
      </svg>
    `;
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(iapDir, file));
    console.log(`  Created IAP placeholder: ${file}`);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--placeholders')) {
    await generatePlaceholders();
  }

  await processScreenshots();

  console.log('\n=== App Store Image Generation Complete ===\n');
  console.log('Upload these folders to App Store Connect:');
  console.log(`  - ${path.join(ARTIFACTS_DIR, 'iphone-67-final')} (iPhone 6.7" - 6 images)`);
  console.log(`  - ${path.join(ARTIFACTS_DIR, 'ipad-13-final')} (iPad 13" - 6 images)`);
  console.log(`  - ${path.join(ARTIFACTS_DIR, 'iap-review')} (IAP Screenshots - 2 images)`);
}

main().catch(console.error);
