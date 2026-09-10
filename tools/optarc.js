const sharp=require('sharp'),fs=require('fs'),path=require('path');
const SRC='C:/Users/user/Desktop/Business/Books/My Books/Athlegard Erik Swordstrong/Abyrith Archives';
const OUT=path.join(__dirname,'..','public','assets','archive');
fs.mkdirSync(path.join(OUT,'full'),{recursive:true});
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const MAP={ 'solcryst-tent':'lumen-tent', 'luxharow-town':'luxharrow',
            'mark-variations':'the-mark', 'erik-s-memory':'eriks-memory',
            'butcher-s-rage':'butchers-rage', 'vira-in-the-north-eye':'vira-north-eye' };
(async()=>{
  let tot=0;
  for(const f of fs.readdirSync(SRC).filter(f=>/\.png$/i.test(f))){
    let n=slug(path.basename(f,'.png')); n=MAP[n]||n;
    // grid thumbnail
    await sharp(path.join(SRC,f)).resize({width:760,withoutEnlargement:true})
      .webp({quality:70}).toFile(path.join(OUT,n+'.webp'));
    // the version the zoom viewer loads
    await sharp(path.join(SRC,f)).resize({width:1600,withoutEnlargement:true})
      .webp({quality:72}).toFile(path.join(OUT,'full',n+'.webp'));
    const a=fs.statSync(path.join(OUT,n+'.webp')).size;
    const b=fs.statSync(path.join(OUT,'full',n+'.webp')).size;
    tot+=a+b;
    console.log(n.padEnd(22), Math.round(a/1024)+'KB /', Math.round(b/1024)+'KB');
  }
  console.log('TOTAL', (tot/1048576).toFixed(2)+'MB');
})();
