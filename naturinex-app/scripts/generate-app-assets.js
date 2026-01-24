/**
 * App Store Asset Generator for Naturinex
 *
 * Generates all required iOS and Android app icons, splash screens,
 * and promotional images from source images.
 *
 * Usage: node scripts/generate-app-assets.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Source images
const SPLASH_SOURCE = path.join(__dirname, '../assets/splash.png');
const ICON_SOURCE = path.join(__dirname, '../assets/naturinex-splash.png');

// Output directories
const ASSETS_DIR = path.join(__dirname, '../assets');
const IOS_ICONS_DIR = path.join(ASSETS_DIR, 'ios-icons');
const ANDROID_ICONS_DIR = path.join(ASSETS_DIR, 'android-icons');
const APPSTORE_DIR = path.join(ASSETS_DIR, 'appstore');
const SPLASH_DIR = path.join(ASSETS_DIR, 'splash-screens');

// Brand color for backgrounds
const BRAND_COLOR = '#10B981';
const GRADIENT_START = '#4FD1A5';
const GRADIENT_END = '#10B981';

// iOS App Icon sizes (all required sizes)
const IOS_ICON_SIZES = [
  { size: 1024, name: 'icon-1024.png', desc: 'App Store' },
  { size: 180, name: 'icon-180.png', desc: 'iPhone @3x' },
  { size: 167, name: 'icon-167.png', desc: 'iPad Pro @2x' },
  { size: 152, name: 'icon-152.png', desc: 'iPad @2x' },
  { size: 120, name: 'icon-120.png', desc: 'iPhone @2x' },
  { size: 87, name: 'icon-87.png', desc: 'Settings @3x' },
  { size: 80, name: 'icon-80.png', desc: 'Spotlight @2x' },
  { size: 76, name: 'icon-76.png', desc: 'iPad @1x' },
  { size: 60, name: 'icon-60.png', desc: 'iPhone @1x' },
  { size: 58, name: 'icon-58.png', desc: 'Settings @2x' },
  { size: 40, name: 'icon-40.png', desc: 'Spotlight @1x' },
  { size: 29, name: 'icon-29.png', desc: 'Settings @1x' },
  { size: 20, name: 'icon-20.png', desc: 'Notification @1x' },
];

// Android Icon sizes
const ANDROID_ICON_SIZES = [
  { size: 512, name: 'playstore-icon.png', desc: 'Play Store' },
  { size: 432, name: 'xxxhdpi-icon.png', desc: 'xxxhdpi (432px)' },
  { size: 324, name: 'xxhdpi-icon.png', desc: 'xxhdpi (324px)' },
  { size: 216, name: 'xhdpi-icon.png', desc: 'xhdpi (216px)' },
  { size: 162, name: 'hdpi-icon.png', desc: 'hdpi (162px)' },
  { size: 108, name: 'mdpi-icon.png', desc: 'mdpi (108px)' },
];

// Splash screen sizes for iOS
const IOS_SPLASH_SIZES = [
  { width: 2732, height: 2732, name: 'splash-2732x2732.png', desc: 'iPad Pro 12.9"' },
  { width: 2048, height: 2732, name: 'splash-2048x2732.png', desc: 'iPad Pro Portrait' },
  { width: 1668, height: 2388, name: 'splash-1668x2388.png', desc: 'iPad Pro 11"' },
  { width: 1536, height: 2048, name: 'splash-1536x2048.png', desc: 'iPad' },
  { width: 1284, height: 2778, name: 'splash-1284x2778.png', desc: 'iPhone 12/13/14 Pro Max' },
  { width: 1170, height: 2532, name: 'splash-1170x2532.png', desc: 'iPhone 12/13/14' },
  { width: 1125, height: 2436, name: 'splash-1125x2436.png', desc: 'iPhone X/XS' },
  { width: 1242, height: 2688, name: 'splash-1242x2688.png', desc: 'iPhone XS Max' },
  { width: 828, height: 1792, name: 'splash-828x1792.png', desc: 'iPhone XR' },
  { width: 750, height: 1334, name: 'splash-750x1334.png', desc: 'iPhone 8/SE' },
  { width: 640, height: 1136, name: 'splash-640x1136.png', desc: 'iPhone SE 1st gen' },
];

// App Store promotional images
const PROMOTIONAL_SIZES = [
  { width: 1024, height: 1024, name: 'promo-1024x1024.png', desc: 'IAP Promotional' },
  { width: 1024, height: 500, name: 'promo-1024x500.png', desc: 'Feature Graphic' },
];

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Generate iOS icons from source (with gradient background, no transparency)
async function generateiOSIcons() {
  console.log('\n📱 Generating iOS App Icons...');
  ensureDir(IOS_ICONS_DIR);

  for (const icon of IOS_ICON_SIZES) {
    const outputPath = path.join(IOS_ICONS_DIR, icon.name);

    try {
      // Read source and resize
      await sharp(ICON_SOURCE)
        .resize(icon.size, icon.size, {
          fit: 'cover',
          position: 'center'
        })
        .flatten({ background: BRAND_COLOR }) // Remove transparency for iOS
        .png()
        .toFile(outputPath);

      console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size}) - ${icon.desc}`);
    } catch (error) {
      console.error(`  ✗ Failed to generate ${icon.name}:`, error.message);
    }
  }

  // Also copy the 1024 icon to the main assets folder for app.json
  const mainIconPath = path.join(ASSETS_DIR, 'icon-1024.png');
  await sharp(ICON_SOURCE)
    .resize(1024, 1024, { fit: 'cover', position: 'center' })
    .flatten({ background: BRAND_COLOR })
    .png()
    .toFile(mainIconPath);
  console.log(`  ✓ Main icon-1024.png copied to assets/`);
}

// Generate Android icons
async function generateAndroidIcons() {
  console.log('\n🤖 Generating Android App Icons...');
  ensureDir(ANDROID_ICONS_DIR);

  for (const icon of ANDROID_ICON_SIZES) {
    const outputPath = path.join(ANDROID_ICONS_DIR, icon.name);

    try {
      await sharp(ICON_SOURCE)
        .resize(icon.size, icon.size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(outputPath);

      console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size}) - ${icon.desc}`);
    } catch (error) {
      console.error(`  ✗ Failed to generate ${icon.name}:`, error.message);
    }
  }

  // Generate adaptive icon foreground (centered logo only, with padding)
  const foregroundPath = path.join(ANDROID_ICONS_DIR, 'adaptive-foreground.png');
  await sharp(ICON_SOURCE)
    .resize(432, 432, { fit: 'inside' })
    .extend({
      top: 54,
      bottom: 54,
      left: 54,
      right: 54,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(foregroundPath);
  console.log(`  ✓ adaptive-foreground.png (540x540)`);

  // Also copy to main assets
  const mainAdaptivePath = path.join(ASSETS_DIR, 'adaptive-icon-512.png');
  await sharp(ICON_SOURCE)
    .resize(512, 512, { fit: 'cover', position: 'center' })
    .png()
    .toFile(mainAdaptivePath);
  console.log(`  ✓ adaptive-icon-512.png copied to assets/`);
}

// Generate splash screens with gradient background
async function generateSplashScreens() {
  console.log('\n🎨 Generating Splash Screens...');
  ensureDir(SPLASH_DIR);

  for (const splash of IOS_SPLASH_SIZES) {
    const outputPath = path.join(SPLASH_DIR, splash.name);

    try {
      // Get source image metadata
      const metadata = await sharp(SPLASH_SOURCE).metadata();

      // Calculate scaling to fit within the splash area (with padding)
      const padding = Math.min(splash.width, splash.height) * 0.1;
      const maxWidth = splash.width - (padding * 2);
      const maxHeight = splash.height - (padding * 2);

      // Scale source to fit
      const scale = Math.min(maxWidth / metadata.width, maxHeight / metadata.height);
      const resizedWidth = Math.round(metadata.width * scale);
      const resizedHeight = Math.round(metadata.height * scale);

      // Create splash with brand color background
      await sharp({
        create: {
          width: splash.width,
          height: splash.height,
          channels: 4,
          background: BRAND_COLOR
        }
      })
        .composite([
          {
            input: await sharp(SPLASH_SOURCE)
              .resize(resizedWidth, resizedHeight)
              .toBuffer(),
            gravity: 'center'
          }
        ])
        .png()
        .toFile(outputPath);

      console.log(`  ✓ ${splash.name} (${splash.width}x${splash.height}) - ${splash.desc}`);
    } catch (error) {
      console.error(`  ✗ Failed to generate ${splash.name}:`, error.message);
    }
  }

  // Also create the main splash for app.json
  const mainSplashPath = path.join(ASSETS_DIR, 'naturinex-splash.png');
  await sharp({
    create: {
      width: 1284,
      height: 2778,
      channels: 4,
      background: BRAND_COLOR
    }
  })
    .composite([
      {
        input: await sharp(SPLASH_SOURCE)
          .resize(900, null, { fit: 'inside' })
          .toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(mainSplashPath);
  console.log(`  ✓ Main naturinex-splash.png updated`);
}

// Generate App Store promotional images
async function generatePromotionalImages() {
  console.log('\n🏪 Generating App Store Promotional Images...');
  ensureDir(APPSTORE_DIR);

  // 1024x1024 promotional image for IAP (required by Apple)
  const promoSquarePath = path.join(APPSTORE_DIR, 'iap-promo-1024x1024.png');
  await sharp(ICON_SOURCE)
    .resize(1024, 1024, { fit: 'cover', position: 'center' })
    .flatten({ background: BRAND_COLOR })
    .png()
    .toFile(promoSquarePath);
  console.log(`  ✓ iap-promo-1024x1024.png - IAP Promotional Image`);

  // Feature graphic for Play Store (1024x500)
  const featurePath = path.join(APPSTORE_DIR, 'feature-graphic-1024x500.png');
  await sharp({
    create: {
      width: 1024,
      height: 500,
      channels: 4,
      background: BRAND_COLOR
    }
  })
    .composite([
      {
        input: await sharp(SPLASH_SOURCE)
          .resize(null, 400, { fit: 'inside' })
          .toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(featurePath);
  console.log(`  ✓ feature-graphic-1024x500.png - Play Store Feature Graphic`);

  // Subscription promotional images
  const subPromoPath = path.join(APPSTORE_DIR, 'subscription-promo-1024x1024.png');
  await sharp(ICON_SOURCE)
    .resize(1024, 1024, { fit: 'cover', position: 'center' })
    .flatten({ background: BRAND_COLOR })
    .png()
    .toFile(subPromoPath);
  console.log(`  ✓ subscription-promo-1024x1024.png - Subscription Promotional`);
}

// Generate favicon
async function generateFavicon() {
  console.log('\n🌐 Generating Favicon...');

  const faviconPath = path.join(ASSETS_DIR, 'favicon.png');
  await sharp(ICON_SOURCE)
    .resize(196, 196, { fit: 'cover', position: 'center' })
    .flatten({ background: BRAND_COLOR })
    .png()
    .toFile(faviconPath);
  console.log(`  ✓ favicon.png (196x196)`);
}

// Generate transparent logo (just the icon portion without background)
async function generateTransparentLogo() {
  console.log('\n✨ Generating Transparent Logo...');

  // We'll extract just the logo area from the splash image
  // The logo is roughly in the top portion of the image
  const logoPath = path.join(ASSETS_DIR, 'logo-transparent.png');

  // Get metadata to understand dimensions
  const metadata = await sharp(SPLASH_SOURCE).metadata();

  // Extract just the top portion with the logo
  // The splash is roughly 824x1181 based on typical dimensions
  const logoHeight = Math.round(metadata.height * 0.4); // Top 40% contains logo

  await sharp(SPLASH_SOURCE)
    .extract({
      left: 0,
      top: 0,
      width: metadata.width,
      height: logoHeight
    })
    .resize(512, null, { fit: 'inside' })
    .png()
    .toFile(logoPath);
  console.log(`  ✓ logo-transparent.png (512px wide)`);

  // Also create a square version
  const logoSquarePath = path.join(ASSETS_DIR, 'logo-square-512.png');
  await sharp(SPLASH_SOURCE)
    .extract({
      left: Math.round(metadata.width * 0.15),
      top: Math.round(metadata.height * 0.05),
      width: Math.round(metadata.width * 0.7),
      height: Math.round(metadata.width * 0.7)
    })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(logoSquarePath);
  console.log(`  ✓ logo-square-512.png (512x512)`);
}

// Main execution
async function main() {
  console.log('🚀 Naturinex App Asset Generator');
  console.log('================================');
  console.log(`Source splash: ${SPLASH_SOURCE}`);
  console.log(`Source icon: ${ICON_SOURCE}`);

  // Check if source files exist
  if (!fs.existsSync(SPLASH_SOURCE)) {
    console.error(`\n❌ Source splash not found: ${SPLASH_SOURCE}`);
    process.exit(1);
  }
  if (!fs.existsSync(ICON_SOURCE)) {
    console.error(`\n❌ Source icon not found: ${ICON_SOURCE}`);
    process.exit(1);
  }

  try {
    await generateiOSIcons();
    await generateAndroidIcons();
    await generateSplashScreens();
    await generatePromotionalImages();
    await generateFavicon();
    await generateTransparentLogo();

    console.log('\n✅ All assets generated successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - iOS Icons: ${IOS_ICON_SIZES.length} sizes in ${IOS_ICONS_DIR}`);
    console.log(`   - Android Icons: ${ANDROID_ICON_SIZES.length} sizes in ${ANDROID_ICONS_DIR}`);
    console.log(`   - Splash Screens: ${IOS_SPLASH_SIZES.length} sizes in ${SPLASH_DIR}`);
    console.log(`   - Promotional: in ${APPSTORE_DIR}`);
    console.log(`   - Main assets updated in ${ASSETS_DIR}`);

    console.log('\n📝 Next Steps:');
    console.log('   1. Upload iap-promo-1024x1024.png to App Store Connect for each IAP');
    console.log('   2. Upload icon-1024.png as the App Store icon');
    console.log('   3. Use splash screens for launch screen configuration');
    console.log('   4. Run: eas build --platform ios --profile production');

  } catch (error) {
    console.error('\n❌ Error generating assets:', error);
    process.exit(1);
  }
}

main();
