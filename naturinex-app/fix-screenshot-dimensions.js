const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Correct Apple App Store Screenshot Dimensions for 2024
const SCREENSHOT_SIZES = [
  // iPhone 6.9" Display (iPhone 15 Pro Max, 14 Pro Max)
  { width: 1290, height: 2796, name: 'iphone-6.9-portrait', device: 'iPhone 6.9" Portrait' },
  { width: 2796, height: 1290, name: 'iphone-6.9-landscape', device: 'iPhone 6.9" Landscape' },
  
  // Alternative 6.9" dimensions
  { width: 1320, height: 2868, name: 'iphone-6.9-alt-portrait', device: 'iPhone 6.9" Alt Portrait' },
  { width: 2868, height: 1320, name: 'iphone-6.9-alt-landscape', device: 'iPhone 6.9" Alt Landscape' },
  
  // iPhone 6.5" Display (older Pro Max models)
  { width: 1242, height: 2688, name: 'iphone-6.5-portrait', device: 'iPhone 6.5" Portrait' },
  
  // iPhone 5.5" Display (iPhone 8 Plus - still required)
  { width: 1242, height: 2208, name: 'iphone-5.5-portrait', device: 'iPhone 5.5" Portrait' },
  
  // iPad Pro 12.9"
  { width: 2048, height: 2732, name: 'ipad-12.9-portrait', device: 'iPad Pro 12.9" Portrait' },
];

async function ensureDirectory(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function generateCorrectScreenshots() {
  console.log('🎨 Generating App Store Screenshots with CORRECT dimensions...\n');
  
  const outputDir = './assets/app-store-screenshots';
  await ensureDirectory(outputDir);
  
  // Use the splash screen as base
  const splashPath = './assets/naturinex-splash.png';
  
  for (const screen of SCREENSHOT_SIZES) {
    try {
      // Create a screenshot with the app's branding
      const svg = `
        <svg width="${screen.width}" height="${screen.height}" xmlns="http://www.w3.org/2000/svg">
          <!-- Background gradient -->
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="${screen.width}" height="${screen.height}" fill="url(#grad)"/>
          
          <!-- App name -->
          <text x="${screen.width/2}" y="${screen.height/3}" 
                font-family="Arial, sans-serif" 
                font-size="${screen.width > 2000 ? 120 : 80}" 
                font-weight="bold"
                fill="white" 
                text-anchor="middle">
            Naturinex
          </text>
          
          <!-- Tagline -->
          <text x="${screen.width/2}" y="${screen.height/3 + (screen.width > 2000 ? 150 : 100)}" 
                font-family="Arial, sans-serif" 
                font-size="${screen.width > 2000 ? 60 : 40}" 
                fill="white" 
                text-anchor="middle"
                opacity="0.9">
            Wellness Guide
          </text>
          
          <!-- Feature -->
          <text x="${screen.width/2}" y="${screen.height/2}" 
                font-family="Arial, sans-serif" 
                font-size="${screen.width > 2000 ? 50 : 35}" 
                fill="white" 
                text-anchor="middle"
                opacity="0.8">
            Scan • Analyze • Learn
          </text>
          
          <!-- Device info -->
          <text x="${screen.width/2}" y="${screen.height - 100}" 
                font-family="Arial, sans-serif" 
                font-size="24" 
                fill="white" 
                text-anchor="middle"
                opacity="0.5">
            ${screen.device} - ${screen.width}×${screen.height}
          </text>
        </svg>
      `;
      
      await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(outputDir, `${screen.name}.png`));
      
      console.log(`✅ Generated ${screen.name}.png (${screen.width}×${screen.height})`);
      
      // Also create a version with the actual splash screen
      if (screen.name.includes('portrait')) {
        await sharp(splashPath)
          .resize(screen.width, screen.height, {
            fit: 'cover',
            position: 'center'
          })
          .png()
          .toFile(path.join(outputDir, `${screen.name}-splash.png`));
        
        console.log(`✅ Generated ${screen.name}-splash.png with actual logo`);
      }
    } catch (error) {
      console.error(`❌ Error generating ${screen.name}:`, error.message);
    }
  }
  
  console.log('\n✨ Screenshots generated successfully!');
  console.log('\n📋 Upload Instructions:');
  console.log('1. Go to App Store Connect');
  console.log('2. For iPhone 6.9" display, use:');
  console.log('   - iphone-6.9-portrait.png (1290×2796)');
  console.log('   - OR iphone-6.9-alt-portrait.png (1320×2868)');
  console.log('3. You can use the -splash versions for more realistic screenshots');
  console.log('4. Upload at least 2-3 screenshots per device size');
  console.log('\n💡 Tip: Take real screenshots from TestFlight for best results!');
}

generateCorrectScreenshots();