import sharp from 'sharp';
import { readFileSync } from 'fs';

const SIZES = {
  icon: 1024,
  adaptiveIcon: 1024,
  favicon: 48,
  foreground: 1024,
  background: 1024,
};

// Read the SVG templates
const iconSvg = readFileSync('assets/icon-template.svg', 'utf8');
const foregroundSvg = readFileSync('assets/icon-foreground.svg', 'utf8');

async function generate() {
  // 1. Main app icon (1024x1024 with gradient bg + flower)
  await sharp(Buffer.from(iconSvg))
    .resize(SIZES.icon, SIZES.icon)
    .png()
    .toFile('assets/icon.png');
  console.log('✅ icon.png');

  // 2. Adaptive icon (same as main)
  await sharp(Buffer.from(iconSvg))
    .resize(SIZES.adaptiveIcon, SIZES.adaptiveIcon)
    .png()
    .toFile('assets/adaptive-icon.png');
  console.log('✅ adaptive-icon.png');

  // 3. Favicon (48x48)
  await sharp(Buffer.from(iconSvg))
    .resize(SIZES.favicon, SIZES.favicon)
    .png()
    .toFile('assets/favicon.png');
  console.log('✅ favicon.png');

  // 4. Android adaptive foreground (just the flower, transparent bg)
  await sharp(Buffer.from(foregroundSvg))
    .resize(SIZES.foreground, SIZES.foreground)
    .png()
    .toFile('assets/android-icon-foreground.png');
  console.log('✅ android-icon-foreground.png');

  // 5. Android adaptive background (solid color square)
  await sharp({
    create: {
      width: SIZES.background,
      height: SIZES.background,
      channels: 4,
      background: { r: 255, g: 105, b: 180, alpha: 1 },
    },
  })
    .png()
    .toFile('assets/android-icon-background.png');
  console.log('✅ android-icon-background.png');

  // 6. Splash icon (same as main)
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile('assets/splash-icon.png');
  console.log('✅ splash-icon.png');

  console.log('\nAll icons generated!');
}

generate().catch((e) => {
  console.error('Icon generation failed:', e);
  process.exit(1);
});
