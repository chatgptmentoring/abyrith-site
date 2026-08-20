const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = 'C:/Users/user/Desktop/Business/Books/My Books/Athlegard Erik Swordstrong';
const OUT = path.join(__dirname, '..', 'public', 'assets');

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function run() {
  // --- Cover ---
  await sharp(path.join(SRC, 'Abyrith Cover 1.jpg'))
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(OUT, 'img', 'cover.webp'));
  await sharp(path.join(SRC, 'Abyrith Cover 1.jpg'))
    .resize({ width: 640, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(OUT, 'img', 'cover.jpg'));
  // OG image: 1200x630 crop from the cover's upper area
  await sharp(path.join(SRC, 'Abyrith Cover 1.jpg'))
    .resize({ width: 1200, height: 630, fit: 'cover', position: 'top' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(OUT, 'img', 'og.jpg'));

  // --- Characters ---
  const cdir = path.join(SRC, 'Abyrith Characters');
  for (const f of fs.readdirSync(cdir).filter(f => /\.png$/i.test(f))) {
    const name = path.basename(f, path.extname(f));
    await sharp(path.join(cdir, f))
      .resize({ width: 760, withoutEnlargement: true })
      .webp({ quality: 76 })
      .toFile(path.join(OUT, 'characters', slug(name) + '.webp'));
    // tiny preview for me to inspect
    await sharp(path.join(cdir, f))
      .resize({ width: 320 })
      .jpeg({ quality: 70 })
      .toFile(path.join(__dirname, 'preview-' + slug(name) + '.jpg'));
  }

  // --- Locations (kept for possible texture use) ---
  const ldir = path.join(SRC, 'Abyrith Locations');
  for (const f of fs.readdirSync(ldir).filter(f => /\.png$/i.test(f))) {
    const name = path.basename(f, path.extname(f));
    await sharp(path.join(ldir, f))
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 74 })
      .toFile(path.join(OUT, 'img', 'loc-' + slug(name) + '.webp'));
  }
  console.log('done');
}
run().catch(e => { console.error(e); process.exit(1); });
