const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const ANDROID_RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const MARK_SVG = path.join(__dirname, 'icon-mark.svg');
// Warm amber-gold from the Golden Botanical theme
const ICON_BG = '#F8F2EA';

async function iconMark(size) {
  return sharp(MARK_SVG, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function generate() {
  // Transparent base — the mark IS the icon, no background box
  const transparent = (w, h) =>
    sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .png().toBuffer();

  // 1. icon.png — 1024×1024, just the circular mark (no background)
  console.log('icon.png (1024×1024)...');
  await sharp(await transparent(1024, 1024))
    .composite([{ input: await iconMark(980), gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS, 'icon.png'));

  // 2. adaptive-icon.png — 1024×1024, just the mark
  console.log('adaptive-icon.png (1024×1024)...');
  await sharp(await transparent(1024, 1024))
    .composite([{ input: await iconMark(980), gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS, 'adaptive-icon.png'));

  // 3. android-icon-foreground.png — 432×432, mark in safe zone (inner 66.7%), transparent bg
  console.log('android-icon-foreground.png (432×432)...');
  await sharp(await transparent(432, 432))
    .composite([{ input: await iconMark(280), gravity: 'center' }])
    .toFile(path.join(ASSETS, 'android-icon-foreground.png'));

  // 4. android-icon-background.png — 432×432, dark indigo matching the mark
  console.log('android-icon-background.png (432×432)...');
  await sharp({
    create: { width: 432, height: 432, channels: 3, background: ICON_BG }
  })
    .png()
    .toFile(path.join(ASSETS, 'android-icon-background.png'));

  // 5. android-icon-monochrome.png — 432×432, mark on transparent
  console.log('android-icon-monochrome.png (432×432)...');
  await sharp(await transparent(432, 432))
    .composite([{ input: await iconMark(280), gravity: 'center' }])
    .toFile(path.join(ASSETS, 'android-icon-monochrome.png'));

  // 6. splash-icon.png — 1024×1024, smaller mark centered, transparent bg (splash bg is set in app.json)
  console.log('splash-icon.png (1024×1024)...');
  await sharp(await transparent(1024, 1024))
    .composite([{ input: await iconMark(700), gravity: 'center' }])
    .toFile(path.join(ASSETS, 'splash-icon.png'));

  // 7. notification-icon.png — 96×96, mark on transparent (status bar)
  console.log('notification-icon.png (96×96)...');
  await sharp(await transparent(96, 96))
    .composite([{ input: await iconMark(88), gravity: 'center' }])
    .toFile(path.join(ASSETS, 'images', 'notification-icon.png'));

  // 8. favicon.png — 48×48, just the mark
  console.log('favicon.png (48×48)...');
  await sharp(await transparent(48, 48))
    .composite([{ input: await iconMark(44), gravity: 'center' }])
    .toFile(path.join(ASSETS, 'favicon.png'));

  // 9. Android mipmap legacy icons — render slightly larger then extract center
  //    so the circular mark fills the canvas edge-to-edge. The system's rounded-square
  //    mask then makes the icon look like the circle IS the icon shape.
  const densities = [
    { name: 'mdpi', size: 48 },
    { name: 'hdpi', size: 72 },
    { name: 'xhdpi', size: 96 },
    { name: 'xxhdpi', size: 144 },
    { name: 'xxxhdpi', size: 192 },
  ];
  for (const d of densities) {
    const dir = path.join(ANDROID_RES, `mipmap-${d.name}`);
    fs.mkdirSync(dir, { recursive: true });
    // SVG circle fills 440/512 ≈ 86%. We want circle to fill ~93% of canvas.
    // Render at: canvas * 0.93 / (440/512) ≈ canvas * 1.083, then extract center.
    const renderSize = Math.round(d.size * 1.083);
    const markBuf = await iconMark(renderSize);
    const offset = Math.floor((renderSize - d.size) / 2);

    console.log(`ic_launcher.png (${d.name} render ${renderSize}→${d.size})...`);
    await sharp(markBuf)
      .extract({ left: offset, top: offset, width: d.size, height: d.size })
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    console.log(`ic_launcher_round.png (${d.name} render ${renderSize}→${d.size})...`);
    await sharp(markBuf)
      .extract({ left: offset, top: offset, width: d.size, height: d.size })
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));
  }

  // 10. Android splash screen logos — same fill strategy
  for (const d of densities) {
    const drawDir = path.join(ANDROID_RES, `drawable-${d.name}`);
    fs.mkdirSync(drawDir, { recursive: true });
    const renderSize = Math.round(d.size * 1.5);
    const markBuf = await iconMark(renderSize);
    const offset = Math.floor((renderSize - d.size) / 2);
    console.log(`splashscreen_logo.png (${d.name} render ${renderSize}→${d.size})...`);
    await sharp(markBuf)
      .extract({ left: offset, top: offset, width: d.size, height: d.size })
      .png()
      .toFile(path.join(drawDir, 'splashscreen_logo.png'));
  }

  // 11. Save icon-mark.svg as reference
  fs.copyFileSync(MARK_SVG, path.join(ASSETS, 'icon-mark-source.svg'));

  console.log('\n✅ All icons generated (dark bg matching mark, legacy icons transparent).');
}

generate().catch(err => { console.error('❌', err.message); process.exit(1); });
