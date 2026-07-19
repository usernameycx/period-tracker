const sharp = require('sharp');
const path = require('path');

const svgPath = path.join(__dirname, 'logo.svg');
const outPath = path.join(__dirname, '..', 'fayetide-logo.png');

sharp(svgPath, { density: 300 })
  .resize(1200, 1200)
  .png({ quality: 100, compressionLevel: 1 })
  .toFile(outPath)
  .then(info => {
    console.log(`✅ Logo rendered: ${outPath}`);
    console.log(`   Size: ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} KB`);
  })
  .catch(err => {
    console.error('❌ Render failed:', err.message);
    process.exit(1);
  });
