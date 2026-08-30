const sharp=require('sharp'),fs=require('fs'),path=require('path');
const SRC='C:/Users/user/Desktop/Business/Books/My Books/Athlegard Erik Swordstrong/More Photos';
const OUT=path.join(__dirname,'..','public','assets');
fs.mkdirSync(path.join(OUT,'map'),{recursive:true});
fs.mkdirSync(path.join(OUT,'art'),{recursive:true});

const ART=[
  ['Astrafer.png','astrafer',900],
  ['The Skyweaver.png','skyweaver',900],
  ['The Twilight Strider.png','twilight-strider',900],
  ['Gold Coins Large Ones and Credits.png','currency',900],
  ['The kids with the stones.png','kids-stones',900],
  ["Vira's Parents.png",'viras-parents',900],
];
(async()=>{
  // Map kept at near-native resolution: the marginalia must stay readable.
  await sharp(path.join(SRC,'Aethergard Map.png')).resize({width:1122,withoutEnlargement:true})
    .webp({quality:74}).toFile(path.join(OUT,'map','aethergard.webp'));
  await sharp(path.join(SRC,'Aethergard Map.png')).resize({width:640})
    .webp({quality:66}).toFile(path.join(OUT,'map','aethergard-sm.webp'));
  for(const [f,slug,w] of ART){
    await sharp(path.join(SRC,f)).resize({width:w,withoutEnlargement:true})
      .webp({quality:72}).toFile(path.join(OUT,'art',slug+'.webp'));
  }
  console.log('ok');
})();
