const sharp = require('sharp');
const path = require('path');

const LOGO_SVG = path.join(__dirname, 'logo.svg');
const ASSETS = path.join(__dirname, '..', 'assets');
const OUT = path.join(__dirname, '..', 'splash-preview.png');
const PARCHMENT = '#F6F1E9';

async function main() {
  // splash-icon.png — full logo at 1024
  await sharp(LOGO_SVG, { density: 300 })
    .resize(1024, 1024, { fit: 'contain', background: PARCHMENT })
    .png()
    .toFile(path.join(ASSETS, 'splash-icon.png'));
  console.log('✅ splash-icon.png');

  // Phone preview: parchment background, logo centered
  const phone = await sharp({
    create: { width: 1080, height: 1920, channels: 4, background: PARCHMENT }
  }).png().toBuffer();

  const mark = await sharp(LOGO_SVG, { density: 300 })
    .resize(900, 900, { fit: 'contain', background: PARCHMENT })
    .png()
    .toBuffer();

  await sharp(phone)
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(OUT);
  console.log('✅ splash-preview.png');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
