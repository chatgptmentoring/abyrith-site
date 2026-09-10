import * as THREE from 'three';
import {lakes,rivers,bridges} from './waters.js?v=4';
export function expandWorld({centres,heightAt,mesh,building,tube,materials:m,box,cylinder,cone,roads,waterMaterial}){
 let seed=8181;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},TAU=Math.PI*2;
 const timber=new THREE.MeshStandardMaterial({color:'#75644b',roughness:1}),thatch=new THREE.MeshStandardMaterial({color:'#8e9670',roughness:1}),crop=new THREE.MeshStandardMaterial({color:'#537654',roughness:1});
 for(const id of ['riverpass','ashberry','luxharrow','blackwood','high-hollow']){
  const c=centres.get(id),count=id==='luxharrow'?58:id==='riverpass'?42:26;
  for(let i=0;i<count;i++){const a=random()*TAU,r=1.4+Math.sqrt(random())*3.3,x=c.x+Math.sin(a)*r,z=c.z+Math.cos(a)*r;if(Math.abs(x-c.x)<.8)continue;building(x,z,.4+random()*.4,.65,.7+random()*1.1,id==='blackwood'?timber:id==='luxharrow'?m.dark:m.stone,id==='luxharrow'?m.copper:thatch);}
  const path=[];for(let i=0;i<=14;i++){const t=i/14,r=91+(Math.hypot(c.x,c.z)-91)*t,a=Math.atan2(c.x,c.z),x=Math.sin(a)*r,z=Math.cos(a)*r;path.push(new THREE.Vector3(x,heightAt(x,z)+.07,z));}tube(path,.13,m.gold,roads);
  if(id==='riverpass'){building(c.x,c.z,.55,.55,5,m.stone,m.gold,'round');const bell=mesh(new THREE.SphereGeometry(.28,12,8,0,TAU,0,Math.PI/2),m.gold,c.x,heightAt(c.x,c.z)+4.5,c.z);bell.rotation.x=Math.PI;}
  if(id==='high-hollow')mesh(cylinder,m.stone,c.x,heightAt(c.x,c.z)+.4,c.z,.65,.8,.65);
  if(id==='luxharrow'){building(c.x+1,c.z,1.2,1,2.6,timber,m.copper);for(let i=0;i<12;i++){const x=c.x-4+(i%6)*1.3,z=c.z+Math.floor(i/6)*2.4;mesh(box,m.copper,x,heightAt(x,z)+.4,z,.75,.6,.5);mesh(cone,i%2?m.stone:m.gold,x,heightAt(x,z)+1.6,z,.85,.45,.7);}}
  if(id==='ashberry')for(let row=0;row<14;row++)for(let col=0;col<16;col++){const x=c.x+5+col*.28,z=c.z-3+row*.43;if(Math.hypot(x,z)<116)mesh(cone,crop,x,heightAt(x,z)+.18,z,.14,.32,.14);}
 }
 // Aurelion's expanded lower terraces, farmsteads, orchards and roadside courtyards.
 {const c=centres.get('aurelion');for(let i=0;i<130;i++){const a=random()*TAU,r=9+random()*7,x=c.x+Math.sin(a)*r,z=c.z+Math.cos(a)*r;if(Math.hypot(x,z)<73||Math.abs(x-c.x)<1.6)continue;building(x,z,.32+random()*.45,.52,.7+random()*1.9,m.stone,i%3?m.roof:m.gold);}}
 // Nine tributaries connect upland water to five additional lakes.
 for(const lake of lakes){const water=mesh(new THREE.CircleGeometry(lake.radius,64),waterMaterial,lake.x,lake.level,lake.z);water.rotation.x=-Math.PI/2;}
 for(const river of rivers){const positions=[],uvs=[],indices=[];for(let i=0;i<river.points.length;i++){const p=river.points[i],q=river.points[Math.min(i+1,river.points.length-1)],prev=river.points[Math.max(0,i-1)],dx=q.x-prev.x,dz=q.z-prev.z,len=Math.hypot(dx,dz);for(const sign of [-1,1]){positions.push(p.x-dz/len*river.width*sign,p.level,p.z+dx/len*river.width*sign);uvs.push(sign>0?1:0,i);}if(i<river.points.length-1){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();mesh(g,waterMaterial,0,0,0);}
 for(const b of bridges){const deck=mesh(box,m.stone,b.x,b.y,b.z,b.width,.18,b.length);deck.rotation.y=-b.angle;for(const side of [-1,1]){const x=b.x+Math.cos(b.angle)*side*b.width*.5,z=b.z+Math.sin(b.angle)*side*b.width*.5;const rail=mesh(box,m.stone,x,b.y+.45,z,.06,.08,b.length);rail.rotation.y=-b.angle;}for(const end of [-1,1]){const x=b.x-Math.sin(b.angle)*end*b.length*.43,z=b.z+Math.cos(b.angle)*end*b.length*.43;mesh(cylinder,m.stone,x,b.y-1,z,.2,2,.2);}}
 // Switchback paths climb the Basin's outer uplands between the lakes.
 for(const angle of [250,297,309]){const path=[];for(let i=0;i<=40;i++){const t=i/40,a=(angle+Math.sin(t*Math.PI*4)*1.15)*Math.PI/180,r=103+t*13,x=Math.sin(a)*r,z=Math.cos(a)*r;path.push(new THREE.Vector3(x,heightAt(x,z)+.14,z));if(i%10===0){mesh(cylinder,m.stone,x,heightAt(x,z)+.35,z,.22,.7,.22);}}tube(path,.17,m.stone,roads);}
 // Waterside hamlets are scenery, not invented named kingdoms.
 for(let i=0;i<32;i++){const lake=lakes[i%lakes.length],a=i*2.399,r=lake.radius+1.5,x=lake.x+Math.sin(a)*r,z=lake.z+Math.cos(a)*r;if(Math.hypot(x,z)>116)continue;building(x,z,.4,.6,1+random(),m.stone,m.roof);}
 // Solkar's newer skyline: slender crystal prisms, suspended transit spans and collectors.
 {const c=centres.get('solkar');for(let i=0;i<44;i++){const a=i*2.399,r=8+random()*7,x=c.x+Math.sin(a)*r,z=c.z+Math.cos(a)*r;if(Math.hypot(x,z)>114||Math.hypot(x-centres.get('museum').x,z-centres.get('museum').z)<5)continue;const h=5+random()*10;mesh(new THREE.CylinderGeometry(.12,.65,h,5),m.glass,x,heightAt(x,z)+h/2,z);mesh(cylinder,m.mirror,x,heightAt(x,z)+h*.55,z,.75,.10,.75);}
  for(let level=0;level<2;level++){const pts=[];for(let i=0;i<=80;i++){const a=i/80*TAU;pts.push(new THREE.Vector3(c.x+Math.sin(a)*(8+level*2),heightAt(c.x,c.z)+5+level*3,c.z+Math.cos(a)*(8+level*2)));}tube(pts,.10,m.mirror);}
 }
 // Museum exterior only: four separated halls and the high observation route.
 {const c=centres.get('museum'),h=heightAt(c.x,c.z);mesh(box,m.mirror,c.x,h+.2,c.z,9,.4,9);for(const x of [-2.2,2.2])for(const z of [-2.2,2.2]){mesh(box,m.glass,c.x+x,h+2,c.z+z,3.7,3.6,3.7);for(const side of [-1,1])mesh(box,m.mirror,c.x+x+side*1.85,h+4,c.z+z,.14,8,3.8);}mesh(box,m.mirror,c.x,h+8.2,c.z,.85,.16,12);for(const side of [-1,1])mesh(box,m.glass,c.x+side*.43,h+8.7,c.z,.04,.8,12);for(let i=0;i<5;i++)mesh(cylinder,m.mirror,c.x,h+4,c.z-5+i*2.5,.1,8,.1);}
}
