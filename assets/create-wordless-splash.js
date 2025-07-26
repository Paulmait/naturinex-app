// Script to create a wordless splash screen
// This creates an SVG file that can be converted to PNG

const fs = require('fs');

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1242" height="2688" viewBox="0 0 1242 2688" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1242" height="2688" fill="#10B981"/>
  
  <!-- Centered Logo Group -->
  <g transform="translate(421, 1144)">
    <!-- Magnifying Glass Circle -->
    <circle cx="200" cy="200" r="150" stroke="white" stroke-width="40" fill="none"/>
    
    <!-- Magnifying Glass Handle -->
    <line x1="305" y1="305" x2="400" y2="400" stroke="white" stroke-width="40" stroke-linecap="round"/>
    
    <!-- Leaf Shape -->
    <path d="M50 150 Q50 50 150 50 Q200 50 200 100 Q200 150 150 200 Q100 200 50 150 Z" 
          fill="white" opacity="0.9"/>
    
    <!-- Leaf Vein -->
    <path d="M80 120 Q125 125 170 170" 
          stroke="#10B981" stroke-width="8" fill="none"/>
  </g>
</svg>`;

// Instructions for next steps
console.log(`
SVG content has been created. To convert to PNG:

1. Save the SVG content to a file: splash-wordless.svg
2. Use an online converter or image editor to convert to PNG
3. Resize to 1242x2688 pixels (standard iOS splash size)
4. Save as splash-wordless.png
5. Replace the current splash.png

Or use ImageMagick if installed:
convert -background "#10B981" -size 1242x2688 splash-wordless.svg splash-wordless.png
`);

// For now, let's update app.json to use a solid color splash while we prepare the new image
const appJsonPath = './app.json';
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// You can update this after creating the wordless splash
console.log('\nCurrent splash configuration:', appJson.expo.splash);