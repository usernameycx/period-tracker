const sharp = require('sharp');
const path = require('path');

const MARK_SVG = path.join(__dirname, 'icon-mark.svg');
const OUT = path.join(__dirname, '..', 'splash-preview.png');
const PINK = '#FF69B4';

async function iconMark(size) {
  return sharp(MARK_SVG, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function main() {
  // Simulate a phone screen: 1080×1920 with the mark centered
  const W = 1080, H = 1920;
  const bg = await sharp({
    create: { width: W, height: H, channels: 4, background: PINK }
  }).png().toBuffer();

  const mark = await iconMark(480);

  await sharp(bg)
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(OUT);

  console.log('✅ Splash preview:', OUT, `(${W}×${H})`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
