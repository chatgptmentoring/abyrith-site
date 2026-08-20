const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const SRC = 'C:/Users/user/Desktop/Business/Books/My Books/Athlegard Erik Swordstrong';
const OUT = path.join(__dirname, '..', 'public', 'assets');

const CHARS = ['Erik Swordstrong','Vira','Jem','Valerious','King Auron',
               'Torian in His Workshop','Lucious','The Seer','Axiom'];
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

(async () => {
  fs.rmSync(path.join(OUT,'characters'), {recursive:true, force:true});
  fs.mkdirSync(path.join(OUT,'characters'), {recursive:true});
  fs.rmSync(path.join(OUT,'img'), {recursive:true, force:true});
  fs.mkdirSync(path.join(OUT,'img'), {recursive:true});

  await sharp(path.join(SRC,'Abyrith Cover 1.jpg')).resize({width:720}).webp({quality:80}).toFile(path.join(OUT,'img','cover.webp'));
  await sharp(path.join(SRC,'Abyrith Cover 1.jpg')).resize({width:560}).jpeg({quality:76,mozjpeg:true}).toFile(path.join(OUT,'img','cover.jpg'));
  await sharp(path.join(SRC,'Abyrith Cover 1.jpg')).resize({width:1200,height:630,fit:'cover',position:'top'}).jpeg({quality:80,mozjpeg:true}).toFile(path.join(OUT,'img','og.jpg'));
  await sharp(path.join(SRC,'Abyrith Locations','Solkar City.png')).resize({width:1200}).webp({quality:58}).toFile(path.join(OUT,'img','solkar.webp'));

  for (const c of CHARS) {
    await sharp(path.join(SRC,'Abyrith Characters', c + '.png'))
      .resize({width:700}).webp({quality:72})
      .toFile(path.join(OUT,'characters', slug(c) + '.webp'));
  }
  // favicon from the cover's rift
  await sharp(path.join(SRC,'Abyrith Cover 1.jpg'))
    .extract({left:430,top:120,width:220,height:220}).resize(64,64).png().toFile(path.join(OUT,'img','favicon.png'));
  console.log('ok');
})().catch(e=>{console.error(e);process.exit(1)});
