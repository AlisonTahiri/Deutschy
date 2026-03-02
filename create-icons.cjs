const sharp = require('sharp');
const fs = require('fs');

async function processIcon() {
  const input = '/home/alison/.gemini/antigravity/brain/790e0a54-b31b-4ee4-99b2-0f41a241bfab/deutchi_3d_icon_1772455894308.png';

  const width = 640;
  const cx = 320;
  const cy = 320;
  const radius = 265; // Adjust as needed

  const circleSvg = `<svg width="${width}" height="${width}">
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="white"/>
  </svg>`;

  await sharp(input)
    .ensureAlpha()
    .composite([{
      input: Buffer.from(circleSvg),
      blend: 'dest-in'
    }])
    .trim()
    .toFile('/tmp/cropped-sphere.png');

  await sharp('/tmp/cropped-sphere.png').resize(192, 192).toFile('./public/pwa-192x192.png');
  await sharp('/tmp/cropped-sphere.png').resize(512, 512).toFile('./public/pwa-512x512.png');

  await sharp('/tmp/cropped-sphere.png').toFile('/home/alison/.gemini/antigravity/brain/790e0a54-b31b-4ee4-99b2-0f41a241bfab/deutchi_3d_icon_transparent.png');
}

processIcon().catch(console.error);
