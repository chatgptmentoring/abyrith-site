const polar=(a,r)=>({x:Math.sin(a*Math.PI/180)*r,z:Math.cos(a*Math.PI/180)*r});
export const lakes=[{...polar(257,96),radius:4.8,level:4.2},{...polar(267,108),radius:4,level:8},{...polar(294,99),radius:5.8,level:4},{...polar(306,90),radius:5,level:3.2},{...polar(286,79),radius:3.5,level:3.4}];
export const rivers=[];
for(let i=0;i<9;i++){
 const source=252+i*6.7,dest=lakes[[0,0,1,1,1,2,2,3,4][i]],points=[];
 const start=polar(source,114),end={x:dest.x,z:dest.z};
 for(let j=0;j<=16;j++){const t=j/16,bend=Math.sin(t*Math.PI*3+i)*2.2*Math.sin(t*Math.PI);points.push({x:start.x*(1-t)+end.x*t+bend,z:start.z*(1-t)+end.z*t-bend*.55,level:12*(1-t)+dest.level*t});}
 rivers.push({points,width:.48+(i%3)*.14});
}
export function waterAt(x,z){
 let found=null;
 for(const l of lakes){const d=Math.hypot(x-l.x,z-l.z);if(d<l.radius+1)found={level:l.level,bed:l.level-.6,weight:Math.max(0,Math.min(1,(l.radius+1-d)/1.3)),wet:d<l.radius-.12};}
 for(const river of rivers)for(let i=1;i<river.points.length;i++){const a=river.points[i-1],b=river.points[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-a.x-dx*t,z-a.z-dz*t);if(d<river.width+1.1){const level=a.level+(b.level-a.level)*t,w=Math.min(1,(river.width+1.1-d)/1.1);if(!found||w>found.weight)found={level,bed:level-.5,weight:w,wet:d<river.width*.9};}}
 return found;
}
export const bridges=rivers.filter((_,i)=>i%2===0).map(r=>{const a=r.points[9],b=r.points[10];return {x:a.x,z:a.z,y:a.level+.7,angle:Math.atan2(b.z-a.z,b.x-a.x),width:1.1,length:3.6};});
export function bridgeAt(x,z){for(const b of bridges){const dx=x-b.x,dz=z-b.z,u=dx*Math.cos(b.angle)+dz*Math.sin(b.angle),v=-dx*Math.sin(b.angle)+dz*Math.cos(b.angle);if(Math.abs(u)<b.width*.6&&Math.abs(v)<b.length*.55)return b.y;}return null;}
