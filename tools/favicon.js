const sharp = require('sharp');
const path = require('path');
const SRC = 'C:/Users/user/Desktop/Business/Books/My Books/Athlegard Erik Swordstrong/Abyrith Logo.png';
const OUT = path.join(__dirname, '..', 'public', 'assets', 'img');

// Tight to the ring — the wordmark below is illegible at icon sizes — but with
// a little margin so the circle is not clipped by the tab's rounded corners.
const CROP = { left: 297, top: 205, width: 656, height: 656 };

const base = () => sharp(SRC).extract(CROP);
// The stone is dark grey on black; small sizes need a lift to stay readable.
const lift = (p, amt) => p.modulate({ brightness: amt }).linear(1.16, -8);

(async () => {
  for (const [name, size, amt] of [
    ['favicon-32.png', 32, 1.34], ['favicon-64.png', 64, 1.24],
    ['apple-touch-icon.png', 180, 1.10], ['icon-192.png', 192, 1.10],
    ['icon-512.png', 512, 1.0],
  ]) {
    await lift(base().resize(size, size, { kernel: 'lanczos3' }), amt)
      .png({ compressionLevel: 9 }).toFile(path.join(OUT, name));
  }
  for (const [n, s] of [['16', 16], ['32', 32]]) {
    await lift(base().resize(s, s, { kernel: 'lanczos3' }), 1.34)
      .resize(s * 8, s * 8, { kernel: 'nearest' }).jpeg({ quality: 92 })
      .toFile(`favicon-${n}-zoom.jpg`);
  }
  console.log('ok');
})();
