const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Apple App Store Required Image Sizes
const APP_ICON_SIZES = [
  { size: 20, scale: 2, name: 'icon-20@2x.png' },    // 40x40
  { size: 20, scale: 3, name: 'icon-20@3x.png' },    // 60x60
  { size: 29, scale: 2, name: 'icon-29@2x.png' },    // 58x58
  { size: 29, scale: 3, name: 'icon-29@3x.png' },    // 87x87
  { size: 40, scale: 2, name: 'icon-40@2x.png' },    // 80x80
  { size: 40, scale: 3, name: 'icon-40@3x.png' },    // 120x120
  { size: 60, scale: 2, name: 'icon-60@2x.png' },    // 120x120
  { size: 60, scale: 3, name: 'icon-60@3x.png' },    // 180x180
  { size: 1024, scale: 1, name: 'icon-1024.png' },   // App Store Icon
];

// Launch Screen Sizes (for different iPhone models)
const LAUNCH_SCREEN_SIZES = [
  { width: 1125, height: 2436, name: 'splash-1125x2436.png', device: 'iPhone X/XS/11 Pro' },
  { width: 1242, height: 2688, name: 'splash-1242x2688.png', device: 'iPhone XS Max/11 Pro Max' },
  { width: 828, height: 1792, name: 'splash-828x1792.png', device: 'iPhone XR/11' },
  { width: 1170, height: 2532, name: 'splash-1170x2532.png', device: 'iPhone 12/13/14' },
  { width: 1284, height: 2778, name: 'splash-1284x2778.png', device: 'iPhone 12/13/14 Pro Max' },
  { width: 1179, height: 2556, name: 'splash-1179x2556.png', device: 'iPhone 15/15 Pro' },
  { width: 1290, height: 2796, name: 'splash-1290x2796.png', device: 'iPhone 15 Pro Max' },
  { width: 2048, height: 2732, name: 'splash-2048x2732.png', device: 'iPad Pro 12.9"' },
];

// App Store Screenshots Required Sizes
const SCREENSHOT_SIZES = [
  { width: 1290, height: 2796, name: 'screenshot-6.7inch', device: 'iPhone 15 Pro Max (6.7")' },
  { width: 1179, height: 2556, name: 'screenshot-6.1inch', device: 'iPhone 15 Pro (6.1")' },
  { width: 1242, height: 2208, name: 'screenshot-5.5inch', device: 'iPhone 8 Plus (5.5")' },
  { width: 2048, height: 2732, name: 'screenshot-ipad-12.9inch', device: 'iPad Pro 12.9"' },
];

async function ensureDirectory(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function generateAppIcons() {
  console.log('🎨 Generating App Icons...\n');
  
  const outputDir = './assets/ios-icons';
  await ensureDirectory(outputDir);
  
  for (const icon of APP_ICON_SIZES) {
    const size = icon.size * icon.scale;
    try {
      await sharp('./assets/icon.png')
        .resize(size, size, {
          fit: 'contain',
          background: { r: 16, g: 185, b: 129, alpha: 1 } // #10B981
        })
        .png()
        .toFile(path.join(outputDir, icon.name));
      
      console.log(`✅ Generated ${icon.name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error generating ${icon.name}:`, error.message);
    }
  }
}

async function generateLaunchScreens() {
  console.log('\n🚀 Generating Launch Screens...\n');
  
  const outputDir = './assets/ios-launch';
  await ensureDirectory(outputDir);
  
  // Use the splash screen as base
  const splashPath = './assets/naturinex-splash.png';
  
  for (const screen of LAUNCH_SCREEN_SIZES) {
    try {
      await sharp(splashPath)
        .resize(screen.width, screen.height, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(path.join(outputDir, screen.name));
      
      console.log(`✅ Generated ${screen.name} for ${screen.device}`);
    } catch (error) {
      console.error(`❌ Error generating ${screen.name}:`, error.message);
    }
  }
}

async function generateScreenshotTemplates() {
  console.log('\n📱 Creating Screenshot Templates...\n');
  
  const outputDir = './assets/ios-screenshots';
  await ensureDirectory(outputDir);
  
  // Create template screenshots with instructions
  for (const screenshot of SCREENSHOT_SIZES) {
    try {
      const svg = `
        <svg width="${screenshot.width}" height="${screenshot.height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${screenshot.width}" height="${screenshot.height}" fill="#10B981"/>
          <text x="${screenshot.width/2}" y="${screenshot.height/2}" 
                font-family="Arial, sans-serif" 
                font-size="60" 
                fill="white" 
                text-anchor="middle" 
                dominant-baseline="middle">
            ${screenshot.device}
          </text>
          <text x="${screenshot.width/2}" y="${screenshot.height/2 + 80}" 
                font-family="Arial, sans-serif" 
                font-size="40" 
                fill="white" 
                text-anchor="middle" 
                dominant-baseline="middle">
            ${screenshot.width} x ${screenshot.height}
          </text>
          <text x="${screenshot.width/2}" y="${screenshot.height/2 + 140}" 
                font-family="Arial, sans-serif" 
                font-size="30" 
                fill="white" 
                text-anchor="middle" 
                dominant-baseline="middle">
            Take screenshot on this device
          </text>
        </svg>
      `;
      
      await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(outputDir, `${screenshot.name}-template.png`));
      
      console.log(`✅ Created template: ${screenshot.name}-template.png`);
    } catch (error) {
      console.error(`❌ Error creating template ${screenshot.name}:`, error.message);
    }
  }
}

async function generateAllAssets() {
  console.log('🎯 Generating all iOS assets for App Store...\n');
  
  try {
    await generateAppIcons();
    await generateLaunchScreens();
    await generateScreenshotTemplates();
    
    console.log('\n✨ All assets generated successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. App icons are in ./assets/ios-icons/');
    console.log('2. Launch screens are in ./assets/ios-launch/');
    console.log('3. Screenshot templates are in ./assets/ios-screenshots/');
    console.log('4. Take actual screenshots on the devices specified in templates');
    console.log('5. Replace templates with real screenshots before submission');
    
  } catch (error) {
    console.error('❌ Error generating assets:', error);
  }
}

// Run the script
generateAllAssets();