// Script to generate PNG icons from SVG
// Run with: node scripts/generate-icons.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');
const screenshotsDir = join(__dirname, '..', 'public', 'screenshots');

// Ensure directories exist
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Try to use sharp if available
async function generateIcons() {
  try {
    const sharp = (await import('sharp')).default;
    const svgBuffer = readFileSync(join(iconsDir, 'icon.svg'));

    console.log('Generating PNG icons with sharp...');

    for (const size of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(join(iconsDir, `icon-${size}.png`));
      console.log(`  Created icon-${size}.png`);
    }

    // Create maskable icon (with padding for safe zone)
    await sharp(svgBuffer)
      .resize(410, 410)  // Leave padding for maskable
      .extend({
        top: 51,
        bottom: 51,
        left: 51,
        right: 51,
        background: { r: 135, g: 206, b: 235, alpha: 1 }  // Sky blue background
      })
      .png()
      .toFile(join(iconsDir, 'maskable-512.png'));
    console.log('  Created maskable-512.png');

    console.log('All icons generated successfully!');
  } catch (error) {
    console.log('Sharp not available.');
    console.log('To generate PNG icons, install sharp: npm install sharp --save-dev');
    console.log('Then run: node scripts/generate-icons.mjs');
    console.log('');
    console.log('Or manually convert the SVG at public/icons/icon.svg to PNG');
    console.log('Required sizes: 72, 96, 128, 144, 152, 192, 384, 512');
  }
}

generateIcons();
