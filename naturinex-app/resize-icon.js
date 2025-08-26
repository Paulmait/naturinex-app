const sharp = require('sharp');
const path = require('path');

async function resizeIcon() {
  try {
    await sharp('./assets/icon.png')
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 16, g: 185, b: 129, alpha: 1 } // #10B981 - your brand color
      })
      .png()
      .toFile('./assets/icon-1024.png');
    
    console.log('✅ Icon resized successfully to 1024x1024');
    console.log('📍 Location: assets/icon-1024.png');
  } catch (error) {
    console.error('❌ Error resizing icon:', error);
  }
}

resizeIcon();