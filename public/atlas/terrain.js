import * as THREE from 'three';
import {places,SUNLIGHT_DEGREES} from './world-data.js';
import {addDetails} from './details.js';

export const INNER=70,OUTER=118;
const TAU=Math.PI*2, rad=THREE.MathUtils.degToRad;
const clamp=THREE.MathUtils.clamp;
export const polar=(angle,radius)=>new THREE.Vector3(Math.sin(rad(angle))*radius,0,Math.cos(rad(angle))*radius);
export const angleAt=(x,z)=>(Math.atan2(x,z)*180/Math.PI+360)%360;
let seed=19473;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const hash=(x,z)=>{const v=Math.sin(x*127.1+z*311.7)*43758.5453;return v-Math.floor(v);};
const smooth=t=>t*t*(3-2*t);
function noise(x,z){const i=Math.floor(x),j=Math.floor(z),a=smooth(x-i),b=smooth(z-j);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(i,j),hash(i+1,j),a),THREE.MathUtils.lerp(hash(i,j+1),hash(i+1,j+1),a),b);}
function fbm(x,z){return noise(x*.07,z*.07)*.6+noise(x*.18,z*.18)*.27+noise(x*.49,z*.49)*.13;}
const centres=new Map(places.filter(p=>p.angle!=null).map(p=>[p.id,polar(p.angle,p.radius)]));
const developed=['aurelion','oakhaven','twilight-city','caelmarch','east-tower','solkar','basin'];
export function biomeAt(x,z){const a=angleAt(x,z);return a>44&&a<89?'desert':a>=89&&a<119?'storm':a>=119&&a<160?'wild':a>=160&&a<190?'impact':a>=190&&a<246?'mountain':a>=246&&a<315?'water':'forest';}
export function heightAt(x,z){
 const r=Math.hypot(x,z),biome=biomeAt(x,z),n=fbm(x,z);
 const rim=Math.pow(clamp((r-103)/15,0,1),1.6);
 let h=1.3+n*3.6+rim*(4+noise(x*.18,z*.18)*8);
 if(biome==='mountain')h+=Math.pow(Math.abs(noise(x*.105,z*.105)-.5)*2,1.5)*14;
 if(biome==='desert')h=1.4+n*2.3+rim*6;
 if(biome==='wild')h+=noise(x*.15,z*.15)*3;
 if(biome==='water'){const c=centres.get('basin'),d=Math.hypot(x-c.x,z-c.z);h-=Math.max(0,1-d/15)*5;}
 const crater=centres.get('titanfall'),d=Math.hypot(x-crater.x,z-crater.z);
 if(d<13)h=1.8+Math.exp(-Math.pow((d-9)/2.2,2))*8.5+(d<7?-.8:noise(x,z));
 for(const id of developed){const c=centres.get(id),dist=Math.hypot(x-c.x,z-c.z),range=id==='east-tower'?3:id==='twilight-city'?6:id==='basin'?12:9;if(dist<range){const base=id==='basin'?4.5:3.4;h=THREE.MathUtils.lerp(base,h,smooth(clamp((dist-range*.6)/(range*.4),0,1)));}}
 return h;
}
export function pointOf(place){const p=centres.get(place.id)?.clone();if(p)p.y=heightAt(p.x,p.z);return p;}

// The light test uses final world coordinates, so it stays fixed as the land rotates.
function litMaterial(options={}){
 const mat=new THREE.MeshStandardMaterial({roughness:.85,...options});
 mat.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 atlasWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
  vec4 atlasPosition=vec4(transformed,1.0);
  #ifdef USE_INSTANCING
  atlasPosition=instanceMatrix*atlasPosition;
  #endif
  atlasWorld=(modelMatrix*atlasPosition).xyz;`);
  shader.fragmentShader='varying vec3 atlasWorld;\n'+shader.fragmentShader;
  if(options.vertexColors)shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float grain=fract(sin(dot(floor(atlasWorld.xz*24.),vec2(12.9898,78.233)))*43758.5453);
   float broad=sin(atlasWorld.x*.6+sin(atlasWorld.z*.7))*sin(atlasWorld.z*.9);
   diffuseColor.rgb*=.91+grain*.13+broad*.055;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',`float incidence=dot(normalize(atlasWorld.xz),vec2(0.0,1.0));
  float daylight=smoothstep(${Math.cos(rad(35)).toFixed(7)},${Math.cos(rad(31)).toFixed(7)},incidence);
  gl_FragColor.rgb*=mix(vec3(.57,.70,.80),vec3(1.10,1.05,.96),daylight);
  #include <dithering_fragment>`);
 };
 return mat;
}
function stoneTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#b7bcaf';ctx.fillRect(0,0,512,512);
 for(let y=0;y<512;y+=32)for(let x=-32;x<512;x+=64){const off=y%64?32:0,shade=220+random()*27;ctx.fillStyle=`rgb(${shade},${shade-2},${shade-8})`;ctx.fillRect(x+off+1,y+1,62,30);ctx.fillStyle='#ffffff45';ctx.fillRect(x+off+2,y+2,60,1);ctx.fillStyle='#6e786221';ctx.fillRect(x+off+2,y+29,60,1);}
 for(let i=0;i<22000;i++){ctx.fillStyle=random()>.5?'#ffffff12':'#273d2410';ctx.fillRect(random()*512,random()*512,random()*1.6,random()*1.6);}
 const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'#ffffe9');g.addColorStop(.13,'#ffe69be8');g.addColorStop(.35,'#ffd36565');g.addColorStop(1,'#f3af1800');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}

export function createWorld(scene,{mobile=false}={}){
 const root=new THREE.Group();root.name='Aethergard clockwise land';scene.add(root);
 const roads=new THREE.Group();roads.name='Serpent Roads network';root.add(roads);
 const weather=new THREE.Group();root.add(weather);
 const objects=new THREE.Group();root.add(objects);
 const colliders=[],spinners=[],smoke=[],waterfalls=[],localPoints=new Map();
 const texture=stoneTexture();
 const materials={
  stone:litMaterial({color:'#f1f0e7',map:texture,bumpMap:texture,bumpScale:.014}),gold:litMaterial({color:'#c8a55b',metalness:.5,roughness:.4}),
  dark:litMaterial({color:'#424b50',metalness:.6,roughness:.58}),copper:litMaterial({color:'#94785e',metalness:.7,roughness:.35}),
  roof:litMaterial({color:'#69888b',metalness:.5}),glass:litMaterial({color:'#a5dfe9',metalness:.45,roughness:.12,transparent:true,opacity:.77}),
  mirror:litMaterial({color:'#b6c7de',metalness:.85,roughness:.08}),amber:litMaterial({color:'#d6a63d',emissive:'#8c5014',emissiveIntensity:.38,metalness:.35,roughness:.32}),
  lamp:new THREE.MeshBasicMaterial({color:'#ffe3a0'}),window:litMaterial({color:'#264752',metalness:.4,roughness:.25,emissive:'#777157',emissiveIntensity:.25}),purple:new THREE.MeshBasicMaterial({color:'#b383df'}),black:litMaterial({color:'#2a3937',roughness:.8})
 };
 const box=new THREE.BoxGeometry(1,1,1),cone=new THREE.ConeGeometry(1,1,8),cylinder=new THREE.CylinderGeometry(1,1,1,10),ico=new THREE.IcosahedronGeometry(1,0);
 function mesh(geo,mat,x,y,z,sx=1,sy=1,sz=1,parent=objects){const item=new THREE.Mesh(geo,mat);item.position.set(x,y,z);item.scale.set(sx,sy,sz);parent.add(item);return item;}
 function building(x,z,w,d,h,mat=materials.stone,roofMat=materials.gold,shape='box'){
  const ground=heightAt(x,z),body=mesh(shape==='round'?cylinder:box,mat,x,ground+h/2,z,w,h,d);
  const roofHeight=shape==='round'?Math.min(2.3,h*.3):.65;
  const roof=mesh(cone,roofMat,x,ground+h+roofHeight/2,z,w*(shape==='round'?1.2:.85),roofHeight,d*(shape==='round'?1.2:.85));roof.rotation.y=shape==='round'?0:Math.PI/4;
  if(h>1.5){for(let level=.9;level<h-.3;level+=1.2){for(let side=0;side<4;side++){const a=side*Math.PI/2,edge=shape==='round'?1.006:.506;const window=mesh(box,materials.window,x+Math.sin(a)*w*edge,ground+level,z+Math.cos(a)*d*edge,Math.min(w*.33,.23),.46,.018);window.rotation.y=a;}if(shape==='round')mesh(cylinder,mat,x,ground+level+.4,z,w*1.05,.10,d*1.05);}}
  colliders.push({x,z,r:Math.max(w,d)*(shape==='round'?1:.65),height:ground+h+roofHeight});return body;
 }
 function tube(points,radius,material,parent=objects){const curve=new THREE.CatmullRomCurve3(points);return mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*5),radius,5,false),material,0,0,0,1,1,1,parent);}
 function wall(cx,cz,radius,mat){const points=[];for(let i=0;i<=80;i++){const a=i/80*TAU,x=cx+Math.sin(a)*radius,z=cz+Math.cos(a)*radius;points.push(new THREE.Vector3(x,heightAt(x,z)+.7,z));}tube(points,.3,mat);for(let i=0;i<16;i++){if(i===8)continue;const a=i/16*TAU;building(cx+Math.sin(a)*radius,cz+Math.cos(a)*radius,.48,.48,1.7,mat,materials.gold,'round');}}

 // Continuous coloured relief, including the impact depression and lake basin.
 const angular=mobile?360:576,radial=mobile?32:48,vertices=[],colors=[],indices=[],color=new THREE.Color();
 const palettes={forest:['#46694b','#67876a'],desert:['#bba379','#dcc39a'],storm:['#42565b','#65767b'],wild:['#214e3f','#4a7b55'],impact:['#49433e','#8b7561'],mountain:['#617578','#cbd3c9'],water:['#467c75','#86a48b']};
 for(let a=0;a<=angular;a++)for(let j=0;j<=radial;j++){
  const theta=a/angular*TAU,r=INNER+(OUTER-INNER)*j/radial,x=Math.sin(theta)*r,z=Math.cos(theta)*r,h=heightAt(x,z);vertices.push(x,h,z);
  const pal=palettes[biomeAt(x,z)];color.set(pal[0]).lerp(new THREE.Color(pal[1]),clamp(fbm(x*2,z*2)*.8+h/40,0,1));colors.push(color.r,color.g,color.b);
  if(a<angular&&j<radial){const k=a*(radial+1)+j;indices.push(k,k+1,k+radial+2,k,k+radial+2,k+radial+1);}
 }
 const terrainGeometry=new THREE.BufferGeometry();terrainGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));terrainGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrainGeometry.setIndex(indices);terrainGeometry.computeVertexNormals();
 const terrain=mesh(terrainGeometry,litMaterial({vertexColors:true,side:THREE.DoubleSide}),0,0,0,1,1,1,root);terrain.name='Walkable terrain';
 // Exposed basalt strata below the two rims.
 for(const radius of [INNER,OUTER]){const pos=[],ind=[];for(let i=0;i<=angular;i++){const a=i/angular*TAU,x=Math.sin(a)*radius,z=Math.cos(a)*radius;pos.push(x,heightAt(x,z),z,x,-9-noise(x*.2,z*.2)*4,z);if(i<angular){const k=i*2;ind.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(ind);g.computeVertexNormals();mesh(g,litMaterial({color:'#394948',side:THREE.DoubleSide,flatShading:true}),0,0,0,1,1,1,root);
 }
 const lowerRim=new THREE.RingGeometry(INNER,OUTER,angular);const underside=mesh(lowerRim,litMaterial({color:'#243539',side:THREE.DoubleSide}),0,-10,0,1,1,1,root);underside.rotation.x=Math.PI/2;

 // Instanced forests: trunks, layered pine crowns and broadleaf trees.
 const trees=[],rocks=[],pinePositions=[];
 const treeCount=mobile?2300:4700;
 for(let i=0;i<treeCount*2 && trees.length<treeCount;i++){
  const a=random()*TAU,r=73+random()*42,x=Math.sin(a)*r,z=Math.cos(a)*r,biome=biomeAt(x,z),h=heightAt(x,z);
  if(!['forest','wild','mountain','water'].includes(biome)||h<(biome==='water'?3.1:2)||r>112||developed.some(id=>centres.get(id).distanceTo(new THREE.Vector3(x,0,z))<10))continue;
  const scale=.38+random()*.95;trees.push({x,y:h,z,s:scale,biome});
 }
 const dummy=new THREE.Object3D();
 function instances(geo,mat,list,place){const inst=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((entry,i)=>{place(entry,dummy,i);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);if(entry.tint)inst.setColorAt(i,new THREE.Color(entry.tint));});inst.instanceMatrix.needsUpdate=true;inst.computeBoundingSphere();objects.add(inst);return inst;}
 instances(cylinder,litMaterial({color:'#5d5540'}),trees,(t,d)=>{d.position.set(t.x,t.y+t.s*.7,t.z);d.scale.set(.12*t.s,t.s*1.4,.12*t.s);d.rotation.set(0,0,0);});
 const pines=trees.filter(t=>t.biome==='mountain'||hash(t.x,t.z)>.55),broadleaf=trees.filter(t=>t.biome!=='mountain'&&hash(t.x,t.z)<=.55);
 for(let layer=0;layer<3;layer++)instances(new THREE.ConeGeometry(1,1,10),litMaterial({color:layer?'#5c8263':'#2e5c47'}),pines,(t,d)=>{d.position.set(t.x,t.y+t.s*(1.5+layer*.6),t.z);d.scale.set(t.s*(1-layer*.22),t.s*1.65,t.s*(1-layer*.22));d.rotation.set(0,(t.x+t.z)%TAU,0);});
 const crowns=[];for(const t of broadleaf)for(let i=0;i<3;i++)crowns.push({...t,dx:Math.sin(i*2.1)*t.s*.45,dz:Math.cos(i*2.1)*t.s*.45,dy:i*.33,tint:['#487359','#668262','#3a684d'][i]});
 instances(new THREE.IcosahedronGeometry(1,1),litMaterial({color:'#ffffff',roughness:1}),crowns,(t,d)=>{d.position.set(t.x+t.dx,t.y+t.s*(2+t.dy),t.z+t.dz);d.scale.set(t.s*.87,t.s*1.2,t.s*.92);d.rotation.set(t.x,0,t.z);});
 for(let i=0;i<(mobile?280:550);i++){
  const a=random()*TAU,r=106+random()*11,x=Math.sin(a)*r,z=Math.cos(a)*r,b=biomeAt(x,z);
  if(developed.some(id=>centres.get(id).distanceTo(new THREE.Vector3(x,0,z))<9))continue;
  const s=1+random()*3.2,high=b==='mountain'?2.4:1.1;rocks.push({x,z,y:heightAt(x,z),s,high,tint:b==='mountain'?'#a2b3b0':b==='impact'?'#655449':'#627c70'});
 }
 instances(new THREE.ConeGeometry(1,1,5),litMaterial({color:'#ffffff',flatShading:true}),rocks,(r,d)=>{d.position.set(r.x,r.y+r.s*r.high*.45,r.z);d.scale.set(r.s,r.s*r.high*2,r.s);d.rotation.set(.1,random()*TAU,.12);});
 const snow=rocks.filter(r=>r.high>2&&r.s>2);instances(new THREE.ConeGeometry(1,1,5),litMaterial({color:'#e5e9dc',flatShading:true}),snow,(r,d)=>{d.position.set(r.x,r.y+r.s*r.high*1.04,r.z);d.scale.set(r.s*.39,r.s*r.high*.78,r.s*.39);d.rotation.set(.1,0,.12);});

 // Roads are infrastructure. They have no place marker and stop before the Wilds.
 function road(points){tube(points.map(p=>new THREE.Vector3(p.x,heightAt(p.x,p.z)+.13,p.z)),.18,new THREE.MeshBasicMaterial({color:'#d8b769'}),roads);}
 const highway=[];for(let angle=-53;angle<=88;angle+=2){const r=91+Math.sin(angle*.12)*2.8;highway.push(polar(angle,r));}road(highway);
 for(const id of developed){const p=centres.get(id),a=angleAt(p.x,p.z),q=polar(a,91+Math.sin(a*.12)*2.8);road([p,p.clone().lerp(q,.5).add(new THREE.Vector3(1,0,0)),q]);}
 const lamps=[];for(let i=0;i<highway.length;i+=2){const p=highway[i];lamps.push({x:p.x+.7,z:p.z,y:heightAt(p.x+.7,p.z)+.7});}
 instances(cylinder,materials.dark,lamps,(p,d)=>{d.position.set(p.x,p.y-.3,p.z);d.scale.set(.07,.65,.07);d.rotation.set(0,0,0);});
 instances(new THREE.SphereGeometry(1,6,4),materials.lamp,lamps,(p,d)=>{d.position.set(p.x,p.y+.1,p.z);d.scale.setScalar(.18);d.rotation.set(0,0,0);});

 // Each settlement uses a distinct architectural vocabulary inspired by the Archive.
 for(const id of ['aurelion','oakhaven','caelmarch','twilight-city','solkar','basin']){
  const c=centres.get(id),count=id==='aurelion'?110:id==='solkar'?75:55;
  const bodyMat=id==='caelmarch'?materials.dark:id==='solkar'?materials.glass:id==='twilight-city'?materials.mirror:materials.stone;
  for(let i=0;i<count;i++){
   const a=random()*TAU,r=2.3+Math.sqrt(random())*4.8,x=c.x+Math.sin(a)*r,z=c.z+Math.cos(a)*r;
   // Leave an avenue along the radial approach and preserve each central landmark.
   const radialX=c.x/Math.hypot(c.x,c.z),radialZ=c.z/Math.hypot(c.x,c.z);
   if(Math.abs((x-c.x)*radialZ-(z-c.z)*radialX)<1.4)continue;
   const size=.35+random()*.58,h=.75+random()*(id==='solkar'?5:id==='aurelion'?3:2.6);
   building(x,z,size,size*(.8+random()*.6),h,bodyMat,id==='caelmarch'?materials.copper:id==='solkar'?materials.glass:materials.gold,id==='aurelion'&&i%4===0?'round':'box');
   if(i%3===0)mesh(box,id==='caelmarch'?materials.purple:materials.lamp,x,heightAt(x,z)+h*.65,z+size*.51,.12,.24,.025);
  }
  if(id!=='solkar')wall(c.x,c.z,7.6,bodyMat);
 }
 // Aurelion's stepped palace, slender gold-tipped spires and ceremonial avenue.
 {const c=centres.get('aurelion'),h=heightAt(c.x,c.z);mesh(cylinder,materials.stone,c.x,h+.35,c.z,3.5,.7,3.5);building(c.x,c.z,1.45,1.45,9,materials.stone,materials.gold,'round');
  for(let i=0;i<8;i++){const a=i/8*TAU;building(c.x+Math.sin(a)*2.5,c.z+Math.cos(a)*2.5,.55,.55,5.6,materials.stone,materials.gold,'round');}
  for(let i=0;i<7;i++)mesh(box,materials.stone,c.x,h+.08+i*.065,c.z-4+i*.32,3.5-i*.16,.12,.4);
 }
 // Oakhaven's great amber trunk and individually modelled glass leaves.
 {const c=centres.get('oakhaven'),h=heightAt(c.x,c.z);mesh(cylinder,materials.amber,c.x,h+3.5,c.z,.58,7,.58);
  const leaves=[];for(let i=0;i<18;i++){const a=i/18*TAU,length=3.2+random()*1.4;const end=new THREE.Vector3(c.x+Math.sin(a)*length,h+6+random()*3,c.z+Math.cos(a)*length);tube([new THREE.Vector3(c.x,h+2.5,c.z),new THREE.Vector3(c.x+Math.sin(a)*1.5,h+5,c.z+Math.cos(a)*1.5),end],.11,materials.amber);for(let j=0;j<55;j++)leaves.push({x:end.x+(random()-.5)*2.4,y:end.y+(random()-.5)*1.7,z:end.z+(random()-.5)*2.4,s:.12+random()*.19});}
  instances(new THREE.OctahedronGeometry(1),litMaterial({color:'#f5dc8c',emissive:'#976d26',emissiveIntensity:.35,transparent:true,opacity:.83,metalness:.4,roughness:.2}),leaves,(l,d)=>{d.position.set(l.x,l.y,l.z);d.scale.set(l.s,l.s*1.7,l.s*.5);d.rotation.set(random()*TAU,random()*TAU,0);});
 }
 // Caelmarch's furnaces, pipework and rotating fans.
 {const c=centres.get('caelmarch'),h=heightAt(c.x,c.z);
  for(let i=0;i<8;i++){const x=c.x+(i%4-1.5)*1.5,z=c.z+Math.floor(i/4)*2,hgt=5+random()*4;mesh(cylinder,materials.dark,x,h+hgt/2,z,.28,hgt,.28);mesh(cylinder,materials.copper,x,h+hgt-.5,z,.4,.3,.4);smoke.push({x,y:h+hgt,z,offset:random()*8});}
  for(let i=0;i<3;i++){const x=c.x-3+i*2;const pipe=tube([new THREE.Vector3(x,h+1,c.z-3),new THREE.Vector3(x,h+3,c.z-3),new THREE.Vector3(x+1.6,h+3,c.z-2)],.19,materials.copper);const fan=new THREE.Group();fan.position.set(x,h+2,c.z-4);objects.add(fan);for(let j=0;j<5;j++){const blade=mesh(box,materials.copper,0,0,0,.13,1.4,.1,fan);blade.rotation.z=j/5*TAU;}spinners.push(fan);}
  for(let i=0;i<18;i++){const a=random()*TAU,r=8.5+random()*2;building(c.x+Math.sin(a)*r,c.z+Math.cos(a)*r,.35,.4,.45,materials.dark,materials.roof);}
 }
 // East Tower is explicitly inward of Caelmarch.
 {const c=centres.get('east-tower'),h=heightAt(c.x,c.z);building(c.x,c.z,.9,.9,7,materials.stone,materials.gold,'round');mesh(new THREE.SphereGeometry(.55,12,8),materials.lamp,c.x,h+7.8,c.z);}
 // Twilight City's mirror-field and crossing, without story outcomes.
 {const c=centres.get('twilight-city'),h=heightAt(c.x,c.z);for(let i=0;i<12;i++){const a=i/12*TAU;const panel=mesh(box,materials.mirror,c.x+Math.sin(a)*8,h+2,c.z+Math.cos(a)*8,1.7,3,.12);panel.rotation.y=-a;panel.rotation.x=-.25;}
  mesh(box,materials.stone,c.x,h+1,c.z-5,1.25,.25,8);for(let i=0;i<4;i++)mesh(cylinder,materials.stone,c.x,h+.5,c.z-8+i*2,.15,1.6,.15);
 }
 // Solkar's glass needle, layered platforms and suspended bridges.
 {const c=centres.get('solkar'),h=heightAt(c.x,c.z);mesh(new THREE.CylinderGeometry(2.9,3.6,.5,12),materials.glass,c.x,h+.3,c.z);mesh(new THREE.ConeGeometry(1.3,14,6),materials.glass,c.x,h+7,c.z);
  for(let i=0;i<6;i++){const a=i/6*TAU,x=c.x+Math.sin(a)*4.5,z=c.z+Math.cos(a)*4.5;building(x,z,.6,.6,6+random()*3,materials.glass,materials.mirror);const b=mesh(box,materials.glass,(c.x+x)/2,h+4,(c.z+z)/2,.55,.15,4.5);b.rotation.y=a;}
  const shards=[];for(let i=0;i<180;i++){const a=rad(45+random()*41),r=75+random()*39,x=Math.sin(a)*r,z=Math.cos(a)*r;if(c.distanceTo(new THREE.Vector3(x,0,z))<10)continue;shards.push({x,z,y:heightAt(x,z),s:.3+random()*1.6});}
  instances(new THREE.ConeGeometry(1,1,4),materials.glass,shards,(p,d)=>{d.position.set(p.x,p.y+p.s,p.z);d.scale.set(p.s*.45,p.s*2,p.s*.45);d.rotation.set(.15,random()*TAU,.2);});
 }
 // The Basin: a broad lake, glass dam and falling water.
 const waterMaterial=new THREE.ShaderMaterial({transparent:true,uniforms:{time:{value:0}},vertexShader:'varying vec3 p; void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time; varying vec3 p; void main(){float wave=sin(p.x*1.7+p.y*.7+time*.65)*.4+sin(p.x*4.1-p.y*2.4-time*.9)*.2+sin(p.y*8.+p.x*2.+time)*.08;float glint=pow(max(0.,wave+.32),9.);gl_FragColor=vec4(mix(vec3(.025,.20,.29),vec3(.19,.47,.52),.5+wave*.3)+vec3(.4,.7,.6)*glint,.92);}',side:THREE.DoubleSide});
 {const c=centres.get('basin'),lake=mesh(new THREE.CircleGeometry(14,80),waterMaterial,c.x,3,c.z);lake.rotation.x=-Math.PI/2;
  const dam=mesh(box,materials.glass,c.x-10,5,c.z,1.1,6,14);for(let i=0;i<8;i++){const fall=mesh(new THREE.PlaneGeometry(.85,8),new THREE.MeshBasicMaterial({color:'#a1e4dd',transparent:true,opacity:.43,side:THREE.DoubleSide}),c.x-10.65,2.5,c.z-6+i*1.6);fall.rotation.y=Math.PI/2;waterfalls.push(fall);}
 }
 // Cloud masses and rain define the actual separating storm belt.
 const clouds=[];for(let i=0;i<(mobile?26:48);i++){const a=90+random()*28,r=77+random()*38,p=polar(a,r);clouds.push({x:p.x,y:15+random()*6,z:p.z,s:2+random()*3});}
 const cloudMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:'#52626b',transparent:true,opacity:.74,roughness:1}),clouds.length);
 clouds.forEach((c,i)=>{dummy.position.set(c.x,c.y,c.z);dummy.scale.set(c.s*1.6,c.s*.6,c.s);dummy.rotation.set(0,i,0);dummy.updateMatrix();cloudMesh.setMatrixAt(i,dummy.matrix);});weather.add(cloudMesh);
 const rainPos=[];for(let i=0;i<650;i++){const p=polar(91+random()*25,76+random()*38),h=6+random()*11;rainPos.push(p.x,h,p.z,p.x-.15,h-1.4,p.z);}
 const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.Float32BufferAttribute(rainPos,3));const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:'#b6dce3',transparent:true,opacity:.2}));weather.add(rain);
 const bolts=[];for(let i=0;i<4;i++){const p=polar(96+i*4,86+i*5),points=[];for(let j=0;j<8;j++)points.push(new THREE.Vector3(p.x+(j%2?.65:0),17-j*1.7,p.z+j*.15));const g=new THREE.BufferGeometry().setFromPoints(points),bolt=new THREE.Line(g,new THREE.LineBasicMaterial({color:'#c1eef6',transparent:true,opacity:.35}));weather.add(bolt);bolts.push(bolt);}
 // Titanfall's exposed dark fragments stand in the crater, beside the Wild Kingdom.
 {const c=centres.get('titanfall'),fragment=new THREE.ConeGeometry(1,1,4);for(let i=0;i<45;i++){const a=random()*TAU,r=random()*7,x=c.x+Math.sin(a)*r,z=c.z+Math.cos(a)*r,s=.4+random(),h=2+random()*4;const shard=mesh(fragment,materials.black,x,heightAt(x,z)+h*.45,z,s,h,s);shard.rotation.z=(random()-.5)*.65;}}
 const smokeMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshBasicMaterial({color:'#65716e',transparent:true,opacity:.2,depthWrite:false}),smoke.length*3);weather.add(smokeMesh);
 const details=addDetails({objects,materials,centres,heightAt,mesh,building,tube,box,cylinder,cone,litMaterial,mobile});
 // The fixed central sun and its precisely 70-degree horizontal focus.
 const sunUniforms={time:{value:0}};
 const sun=new THREE.Mesh(new THREE.SphereGeometry(8.5,48,32),new THREE.ShaderMaterial({uniforms:sunUniforms,vertexShader:'varying vec3 p;varying vec3 n;void main(){p=position;n=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time;varying vec3 p;varying vec3 n;float field(vec3 q){return sin(q.x+sin(q.z*1.3))*sin(q.y+sin(q.x*.8));}void main(){vec3 q=p*.24+vec3(time*.018,0.,time*.009);float f=field(q)*.55+field(q*2.1)*.28+field(q*4.3)*.12+field(q*8.7)*.05;vec3 c=mix(vec3(1.,.34,.035),vec3(1.,.95,.68),.7+f*.3);gl_FragColor=vec4(c*1.4,1.);}'}));sun.position.set(0,12,0);sun.name='Fixed Core';scene.add(sun);
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),color:'#ffdb88',transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));glow.position.copy(sun.position);glow.scale.set(54,54,1);scene.add(glow);
 const beamPos=[],beamColors=[],beamIndices=[],steps=80;
 for(let i=0;i<=steps;i++){const a=rad(-SUNLIGHT_DEGREES/2+i/steps*SUNLIGHT_DEGREES);for(const r of [11,130]){beamPos.push(Math.sin(a)*r,3+9*(1-r/130),Math.cos(a)*r);beamColors.push(1,.78,.32);}if(i<steps){const k=i*2;beamIndices.push(k,k+1,k+2,k+1,k+3,k+2);}}
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(beamPos,3));bg.setAttribute('color',new THREE.Float32BufferAttribute(beamColors,3));bg.setIndex(beamIndices);bg.computeVertexNormals();
 const beam=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({color:'#ffda8a',transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));beam.name='Fixed 70 degree beam';beam.userData.angle=SUNLIGHT_DEGREES;scene.add(beam);
 for(const a of [-35,35]){const points=[polar(a,11).setY(12),polar(a,130).setY(3)];scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#eacb8e',transparent:true,opacity:.2})));}
 // Quiet survey circles, not stars: Aethergard's night has the far Ring, not a starfield.
 const survey=new THREE.Group();scene.add(survey);for(const r of [132,135]){const points=[];for(let i=0;i<=180;i++)points.push(polar(i*2,r).setY(-14));survey.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#587c79',transparent:true,opacity:.15})));}
 for(const p of places.filter(p=>p.angle!=null)){const point=pointOf(p);localPoints.set(p.id,point);}
 // Batch repeated architectural parts to keep cities inexpensive to draw.
 const batches=new Map();for(const item of [...objects.children]){if(!item.isMesh||item.isInstancedMesh)continue;const key=item.geometry.uuid+item.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(item);}
 for(const batch of batches.values()){if(batch.length<3)continue;const inst=new THREE.InstancedMesh(batch[0].geometry,batch[0].material,batch.length);batch.forEach((item,i)=>{item.updateMatrix();inst.setMatrixAt(i,item.matrix);objects.remove(item);});inst.instanceMatrix.needsUpdate=true;inst.computeBoundingSphere();objects.add(inst);}
 objects.traverse(object=>{if(object.isMesh){object.castShadow=!object.material.transparent;object.receiveShadow=true;}});terrain.receiveShadow=true;
 const colliderGrid=new Map();for(const c of colliders){const key=`${Math.floor(c.x/4)},${Math.floor(c.z/4)}`;if(!colliderGrid.has(key))colliderGrid.set(key,[]);colliderGrid.get(key).push(c);}
 function collides(x,z,y){const gx=Math.floor(x/4),gz=Math.floor(z/4);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const c of colliderGrid.get(`${gx+dx},${gz+dz}`)||[])if(y<c.height+1&&Math.hypot(x-c.x,z-c.z)<c.r+.22)return true;return false;}
 function update(time,motion=true){details.update(time,motion);waterMaterial.uniforms.time.value=motion?time:0;sunUniforms.time.value=motion?time:0;for(const fan of spinners)fan.rotation.z=motion?time*.7:0;for(let i=0;i<smoke.length;i++)for(let j=0;j<3;j++){const p=smoke[i],rise=motion?(time*.5+p.offset+j*2)%7:j*2;dummy.position.set(p.x+rise*.16,p.y+rise,p.z);dummy.scale.setScalar(.45+rise*.2);dummy.rotation.set(0,0,0);dummy.updateMatrix();smokeMesh.setMatrixAt(i*3+j,dummy.matrix);}smokeMesh.instanceMatrix.needsUpdate=true;rain.position.y=motion?-(time*5%2):0;for(let i=0;i<bolts.length;i++)bolts[i].material.opacity=motion?.12+Math.pow(Math.max(0,Math.sin(time*.45+i*1.7)),16)*.45:.2;for(let i=0;i<waterfalls.length;i++)waterfalls[i].material.opacity=.35+(motion?Math.sin(time*2+i)*.08:0);}
 return {root,terrain,roads,weather,beam,sun,localPoints,collides,update,stats:{trees:trees.length,buildings:colliders.length,terrainVertices:vertices.length/3},heightAt};
}
