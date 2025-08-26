const sharp = require('sharp');
const fs = require('fs').promises;

async function generateAndroidAdaptiveIcon() {
  console.log('🤖 Generating Android Adaptive Icon...\n');
  
  // Android adaptive icon requires 108dp with safe zone of 66dp
  // For a 512x512 icon, foreground should be about 60% of the size
  const size = 512;
  const foregroundSize = Math.round(size * 0.6);
  
  try {
    // Generate foreground (icon centered with transparency)
    await sharp('./assets/icon.png')
      .resize(foregroundSize, foregroundSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: Math.round((size - foregroundSize) / 2),
        bottom: Math.round((size - foregroundSize) / 2),
        left: Math.round((size - foregroundSize) / 2),
        right: Math.round((size - foregroundSize) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile('./assets/adaptive-icon-foreground.png');
    
    console.log('✅ Generated adaptive-icon-foreground.png (512x512)');
    
    // Generate background (solid color)
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#10B981"/>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile('./assets/adaptive-icon-background.png');
    
    console.log('✅ Generated adaptive-icon-background.png (512x512)');
    
    // Update the existing adaptive-icon.png to proper size
    await sharp('./assets/icon.png')
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 16, g: 185, b: 129, alpha: 1 }
      })
      .png()
      .toFile('./assets/adaptive-icon-512.png');
    
    console.log('✅ Generated adaptive-icon-512.png (512x512)');
    
    console.log('\n✨ Android adaptive icons generated successfully!');
    console.log('\n📋 For best results:');
    console.log('1. Use adaptive-icon-foreground.png + adaptive-icon-background.png');
    console.log('2. These follow Android\'s adaptive icon guidelines');
    console.log('3. Icon will work well with different launcher shapes');
    
  } catch (error) {
    console.error('❌ Error generating Android adaptive icon:', error);
  }
}

generateAndroidAdaptiveIcon();