const fs = require('fs');
const path = require('path');

async function embedSVG() {
  const pngPath = path.join(__dirname, 'public', 'pwa-512x512.png');
  const buffer = fs.readFileSync(pngPath);
  const base64 = buffer.toString('base64');
  const uri = `data:image/png;base64,${base64}`;

  // Maintain aspect ratio dynamically, though 512x512 is 1:1 square.
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <image href="${uri}" x="0" y="0" width="512" height="512" />
</svg>`;

  fs.writeFileSync(path.join(__dirname, 'public', 'pwa-icons.svg'), svgContent, 'utf-8');
  fs.writeFileSync(path.join(__dirname, 'public', 'vite.svg'), svgContent, 'utf-8');
}

embedSVG().catch(console.error);
