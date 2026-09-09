import * as THREE from 'three';

// Architectural ornament is an artistic reconstruction from the Archive's visual language.
// Repeated components share geometry and materials and are instanced by the world builder.
export function addDetails({objects,materials:m,centres,heightAt,mesh,building,tube,box,cylinder,cone,litMaterial,mobile}){
 const flags=[],TAU=Math.PI*2;
 const archShape=new THREE.Shape();archShape.moveTo(-1,0);archShape.lineTo(-1,1.5);archShape.absarc(0,1.5,1,Math.PI,0,true);archShape.lineTo(1,0);archShape.lineTo(.72,0);archShape.lineTo(.72,1.5);archShape.absarc(0,1.5,.72,0,Math.PI,false);archShape.lineTo(-.72,0);archShape.closePath();
 const archGeo=new THREE.ExtrudeGeometry(archShape,{depth:.28,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.035,bevelThickness:.035,curveSegments:16});
 const torus=new THREE.TorusGeometry(1,.055,6,40),orb=new THREE.SphereGeometry(1,12,8),finial=new THREE.OctahedronGeometry(1,0);
 const bannerMaterial=litMaterial({color:'#34566a',roughness:.9,side:THREE.DoubleSide});
 const verdigris=litMaterial({color:'#5a8880',metalness:.45,roughness:.7});
 const flagGeo=new THREE.PlaneGeometry(.52,1.3,6,8),fp=flagGeo.attributes.position;for(let i=0;i<fp.count;i++)fp.setZ(i,Math.sin(fp.getX(i)*9+fp.getY(i)*4)*.065);flagGeo.computeVertexNormals();
 function flag(x,y,z,rotation=0){mesh(cylinder,m.copper,x,y,z,.025,2.8,.025);const f=mesh(flagGeo,bannerMaterial,x+.25,y+.3,z,1,1,1);f.rotation.y=rotation;flags.push(f);mesh(finial,m.gold,x,y+1.48,z,.09,.2,.09);}
 function sunSeal(x,y,z,size=.4){mesh(torus,m.gold,x,y,z,size,size,size);mesh(orb,m.gold,x,y,z,size*.48,size*.48,.06);for(let i=0;i<12;i++){const a=i/12*TAU,s=mesh(box,m.gold,x+Math.sin(a)*size*1.25,y+Math.cos(a)*size*1.25,z,.035,size*.32,.055);s.rotation.z=-a;}}
 function balustrade(x,z,length,y,axis='x',mat=m.stone){for(let i=0;i<=Math.floor(length/.35);i++){const d=-length/2+i*.35;mesh(cylinder,mat,x+(axis==='x'?d:0),y+.35,z+(axis==='z'?d:0),.045,.7,.045);}mesh(box,mat,x,y+.72,z,axis==='x'?length:.13,.12,axis==='z'?length:.13);}
 function column(x,z,y,h,mat=m.stone){mesh(cylinder,mat,x,y+h/2,z,.14,h,.14);for(const t of [.05,h-.07])mesh(cylinder,mat,x,y+t,z,.22,.14,.22);}
 function pavement(c,width,length,angle=0){const p=mesh(box,m.stone,c.x,heightAt(c.x,c.z)+.04,c.z,width,.07,length);p.rotation.y=angle;}

 // Aurelion: a processional entrance, sun emblems, arcades, buttresses and gold finials.
 {const c=centres.get('aurelion'),h=heightAt(c.x,c.z),gate=c.z-7.5;
  mesh(archGeo,m.stone,c.x,h,gate,1.45,1.4,2);sunSeal(c.x,h+3.55,gate-.08,.45);
  for(const side of [-1,1]){building(c.x+side*2.1,gate,.53,.53,3.8,m.stone,m.gold,'round');flag(c.x+side*1.6,h+3.2,gate-.45);}
  pavement({x:c.x,z:c.z-4.6},2.4,5.4);
  for(let i=0;i<6;i++)for(const side of [-1,1]){const x=c.x+side*2.4,z=c.z-5.4+i*.8;column(x,z,h,2.1);if(i<5){const a=mesh(archGeo,m.stone,x,h+.9,z+.4,.4,.5,.5);a.rotation.y=Math.PI/2;}}
  for(let level=0;level<3;level++){const radius=1.52-level*.07,y=h+2.3+level*2.2;mesh(cylinder,m.stone,c.x,y,c.z,radius,.18,radius);for(let j=0;j<12;j++){const a=j/12*TAU,x=c.x+Math.sin(a)*1.48,z=c.z+Math.cos(a)*1.48;mesh(box,m.stone,x,y-.7,z,.12,1.4,.12);}}
  for(let i=0;i<8;i++){const a=i/8*TAU,x=c.x+Math.sin(a)*2.5,z=c.z+Math.cos(a)*2.5;mesh(finial,m.gold,x,h+7.6,z,.15,.7,.15);}
  mesh(finial,m.gold,c.x,h+12,c.z,.2,1,.2);
  for(const side of [-1,1]){const x=c.x+side*3.5,z=c.z-3.8;mesh(cylinder,m.stone,x,h+.35,z,.42,.7,.42);mesh(cone,m.stone,x,h+1.25,z,.31,1.15,.31);mesh(orb,m.stone,x,h+1.95,z,.18,.18,.18);mesh(box,m.gold,x+side*.25,h+1.6,z,.035,1.8,.035);}
 }
 // Oakhaven: thermal canals, stone crossings, market awnings and delicate amber lanterns.
 {const c=centres.get('oakhaven'),h=heightAt(c.x,c.z),canal=litMaterial({color:'#498e92',metalness:.55,roughness:.22,transparent:true,opacity:.8});
  for(const r of [5.3,8.1]){const points=[];for(let i=0;i<=80;i++){const a=i/80*TAU,x=c.x+Math.sin(a)*r,z=c.z+Math.cos(a)*r;points.push(new THREE.Vector3(x,heightAt(x,z)+.06,z));}tube(points,.19,canal);}
  for(let i=0;i<6;i++){const a=i/6*TAU,x=c.x+Math.sin(a)*5.3,z=c.z+Math.cos(a)*5.3;const bridge=mesh(box,m.stone,x,h+.24,z,1.3,.19,1.2);bridge.rotation.y=a;}
  for(let i=0;i<12;i++){const a=i/12*TAU,x=c.x+Math.sin(a)*3.4,z=c.z+Math.cos(a)*3.4;column(x,z,h,1.4,m.amber);mesh(orb,m.lamp,x,h+1.65,z,.12,.18,.12);}
  for(let i=0;i<5;i++){const x=c.x-4+i*1.6,z=c.z+5.7;mesh(box,m.copper,x,h+.45,z,.85,.6,.6);const awning=mesh(cone,i%2?bannerMaterial:m.stone,x,h+1.6,z,.8,.45,.7);awning.rotation.y=Math.PI/4;for(const side of [-1,1])mesh(cylinder,m.dark,x+side*.55,h+.8,z,.025,1.6,.025);}
 }
 // Caelmarch: riveted pipe collars, industrial gantries, warm furnace mouths and agri-vines.
 {const c=centres.get('caelmarch'),h=heightAt(c.x,c.z);
  for(let i=0;i<8;i++){const x=c.x+(i%4-1.5)*1.5,z=c.z+Math.floor(i/4)*2;for(let j=0;j<5;j++)mesh(cylinder,m.copper,x,h+1+j*.85,z,.32,.12,.32);}
  for(let i=0;i<3;i++){const x=c.x-3+i*2,z=c.z-4;mesh(torus,m.dark,x,h+2,z,.95,.95,.95);for(let j=0;j<12;j++){const a=j/12*TAU;mesh(orb,m.copper,x+Math.sin(a)*.92,h+2+Math.cos(a)*.92,z-.1,.055,.055,.045);}mesh(box,m.lamp,x,h+.55,z+.7,.6,.35,.05);}
  mesh(box,m.dark,c.x,h+3.5,c.z-3,8,.14,.7);balustrade(c.x,c.z-3.4,8,h+3.55,'x',m.copper);
  for(const side of [-1,1])for(let i=0;i<8;i++)mesh(box,m.copper,c.x+side*3.9,h+.5+i*.42,c.z-3,.9,.055,.2);
  for(let i=0;i<35;i++){const a=i/35*TAU,x=c.x+Math.sin(a)*7.4,z=c.z+Math.cos(a)*7.4;mesh(finial,m.purple,x,heightAt(x,z)+.35,z,.13,.3,.13);}
 }
 // Solkar: engraved glass planes, bright ribs, floating terraces and bridge rails.
 {const c=centres.get('solkar'),h=heightAt(c.x,c.z);
  for(let i=0;i<6;i++){const a=i/6*TAU;const pts=[new THREE.Vector3(c.x+Math.sin(a)*1.3,h,c.z+Math.cos(a)*1.3),new THREE.Vector3(c.x+Math.sin(a)*.6,h+8,c.z+Math.cos(a)*.6),new THREE.Vector3(c.x,h+14,c.z)];tube(pts,.025,m.lamp);
   for(const side of [-1,1]){const dx=Math.cos(a)*side*.29,dz=-Math.sin(a)*side*.29;const rail=mesh(box,m.mirror,c.x+Math.sin(a)*2.25+dx,h+4.45,c.z+Math.cos(a)*2.25+dz,.035,.08,4.5);rail.rotation.y=a;}
  }
  for(let i=0;i<4;i++){const radius=2.5-i*.4;const platform=mesh(cylinder,m.glass,c.x,h+2+i*2,c.z,radius,.08,radius);mesh(torus,m.mirror,c.x,h+2.05+i*2,c.z,radius,radius,radius).rotation.x=Math.PI/2;}
 }
 // Twilight mirror-field: supported panels, lens mechanisms and a mountain-valley observatory.
 {const c=centres.get('twilight-city'),h=heightAt(c.x,c.z);for(let i=0;i<12;i++){const a=i/12*TAU,x=c.x+Math.sin(a)*8,z=c.z+Math.cos(a)*8;column(x,z,h,1.6,verdigris);mesh(torus,m.copper,x,h+1.9,z,.45,.45,.45).rotation.y=-a;}
  mesh(new THREE.SphereGeometry(1.7,24,12,0,TAU,0,Math.PI/2),verdigris,c.x,h+3.2,c.z);building(c.x,c.z,1.7,1.7,3.2,m.stone,m.copper,'round');
 }
 // Basin: terraced retaining walls, polished coping stones and a dam gallery.
 {const c=centres.get('basin');for(let i=0;i<12;i++){const z=c.z-6.7+i*1.2;column(c.x-10,z,7.9,1.7,m.glass);mesh(box,m.stone,c.x-10,7.95,z,1.3,.15,1.25);}balustrade(c.x-10.6,c.z,14,8,'z',m.glass);for(let i=0;i<3;i++)mesh(cylinder,m.stone,c.x,4.5+i*.22,c.z,5.7-i*.45,.18,5.7-i*.45);}
 // East Tower has a readable watch platform, narrow arrow slits and a caged beacon.
 {const c=centres.get('east-tower'),h=heightAt(c.x,c.z);mesh(cylinder,m.stone,c.x,h+6.8,c.z,1.2,.25,1.2);for(let i=0;i<12;i++){const a=i/12*TAU;column(c.x+Math.sin(a)*.8,c.z+Math.cos(a)*.8,h+7.1,1.5,m.gold);}mesh(cone,m.gold,c.x,h+9.2,c.z,1.3,1,1.3);}
 // Contact shadows ground each settlement without requiring a post-processing pass.
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'#00000060');gradient.addColorStop(.5,'#00000024');gradient.addColorStop(1,'#00000000');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 const shadowMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,color:'#102423'}),shadowGeo=new THREE.PlaneGeometry(1,1);
 for(const c of centres.values()){const shadow=mesh(shadowGeo,shadowMat,c.x,heightAt(c.x,c.z)+.045,c.z,18,18,1);shadow.rotation.x=-Math.PI/2;}
 return {update(time,motion){for(let i=0;i<flags.length;i++)flags[i].rotation.y=motion?Math.sin(time*1.2+i)*.12:0;}};
}
