const sharp=require('sharp'),path=require('path'),fs=require('fs');
const SRC='C:/Users/user/Desktop/Business/Books/My Books/Athlegard Erik Swordstrong/Abyrith Locations';
const OUT=path.join(__dirname,'..','public','assets','places');
fs.mkdirSync(OUT,{recursive:true});
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
(async()=>{
  for(const f of fs.readdirSync(SRC).filter(f=>/\.png$/i.test(f))){
    const n=path.basename(f,path.extname(f));
    const m=await sharp(path.join(SRC,f)).metadata();
    await sharp(path.join(SRC,f)).resize({width:900,withoutEnlargement:true}).webp({quality:66}).toFile(path.join(OUT,slug(n)+'.webp'));
    console.log(slug(n), m.width+'x'+m.height);
  }
})();
