const fs = require('fs');
const src = fs.readFileSync('../public/app.js', 'utf8');
// pull the exact production implementations out of app.js
const hashSrc = src.match(/const hash = \(s\) => \{[\s\S]*?\n\};/)[0];
const readSrc = src.match(/function readName\(raw\) \{[\s\S]*?\n\}/)[0];
const D = src.match(/const DESIGNATIONS = \[[\s\S]*?\];/)[0];
const O = src.match(/const ORDINALS = \[[\s\S]*?\];/)[0];
const G = src.match(/const GREEK = \[[\s\S]*?\];/)[0];
eval(D + O + G + hashSrc + readSrc);

const names = ['Dejan','Erik','Vira','Jem','Sarah','Michael','Anna','Chris','Maria','John',
               'Lucas','Emma','Noah','Olivia','Liam','Sofia','Marko','Ana','Petar','Elena',
               'David','Nikola','Ivan','Nina','Stefan','Milena','Tom','Kate','Alex','Sam'];
let u = 0;
for (const n of names) {
  const r = readName(n);
  if (r.undefinedSoul) u++;
  console.log((r.undefinedSoul ? 'UNDEFINED ' : 'DEFINED   ') + n.padEnd(9) + (r.undefinedSoul ? '' : r.desig));
}
console.log('\nUNDEFINED: ' + u + '/' + names.length);
