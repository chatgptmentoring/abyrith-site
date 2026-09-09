import * as THREE from 'three';
export const RING_RADIUS=250, WIDTH_SCALE=2.25, BAND_MIDDLE=94;
// The map coordinates are a construction chart. The inhabited surface is the
// inside of a cylindrical ring, with raised, cooler shoulders across its width.
export function curvePoint(p,out=new THREE.Vector3()){
 const r=Math.hypot(p.x,p.z),a=Math.atan2(p.x,p.z),v=(r-BAND_MIDDLE)*WIDTH_SCALE;
 const shoulder=.0045*v*v,radius=RING_RADIUS+shoulder-p.y;
 return out.set(Math.sin(a)*radius,v,Math.cos(a)*radius);
}
export function uncurvePoint(p,out=new THREE.Vector3()){
 const r=BAND_MIDDLE+p.y/WIDTH_SCALE,a=Math.atan2(p.x,p.z);
 return out.set(Math.sin(a)*r,RING_RADIUS+.0045*p.y*p.y-Math.hypot(p.x,p.z),Math.cos(a)*r);
}
export function surfaceFrame(p){
 const a=Math.atan2(p.x,p.z),v=(Math.hypot(p.x,p.z)-BAND_MIDDLE)*WIDTH_SCALE;
 const east=new THREE.Vector3(Math.cos(a),0,-Math.sin(a));
 const across=new THREE.Vector3(Math.sin(a)*.009*v,1,Math.cos(a)*.009*v).normalize();
 const up=across.clone().cross(east).normalize();return {east,across,up};
}
export function curveMatrix(matrix){
 const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();matrix.decompose(p,q,s);
 const a=Math.atan2(p.x,p.z),{east,across,up}=surfaceFrame(p);
 const r=Math.hypot(p.x,p.z),v=(r-BAND_MIDDLE)*WIDTH_SCALE,circumference=(RING_RADIUS+.0045*v*v-p.y)/r;
 const x=east.clone().multiplyScalar(Math.cos(a)*circumference).addScaledVector(across,Math.sin(a)*WIDTH_SCALE);
 const z=east.clone().multiplyScalar(-Math.sin(a)*circumference).addScaledVector(across,Math.cos(a)*WIDTH_SCALE);
 const basis=new THREE.Matrix4().makeBasis(x,up,z),rotation=new THREE.Matrix4().makeRotationFromQuaternion(q);
 basis.multiply(rotation).scale(s);basis.setPosition(curvePoint(p));return basis;
}
export function curveGeometry(geometry,matrix=new THREE.Matrix4()){
 const g=geometry.clone(),p=g.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);curvePoint(v,v);p.setXYZ(i,v.x,v.y,v.z);}p.needsUpdate=true;if(g.attributes.normal)g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}
export function bendWorld(root){
 root.updateMatrixWorld(true);const items=[];root.traverse(o=>{if(o.geometry)items.push(o);});
 for(const o of items){
  if(o.parent.userData.ringAnimated)continue;
  if(o.userData.ringDynamic)continue;
  if(o.isInstancedMesh){const m=new THREE.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);m.premultiply(o.matrixWorld);o.setMatrixAt(i,curveMatrix(m));}o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);o.instanceMatrix.needsUpdate=true;o.computeBoundingSphere();}
  else if(o.userData.ringAnimated){const m=curveMatrix(o.matrixWorld);m.decompose(o.position,o.quaternion,o.scale);o.userData.frame=o.quaternion.clone();}
  else {o.geometry=curveGeometry(o.geometry,o.matrixWorld);o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);}
 }
 // Moving machinery keeps its local pivot and rotates in the surface frame.
 const groups=[];root.traverse(o=>{if(o.isGroup&&o.userData.ringAnimated)groups.push(o);});
 for(const group of groups){const m=curveMatrix(group.matrixWorld);root.attach(group);m.decompose(group.position,group.quaternion,group.scale);group.userData.frame=group.quaternion.clone();}
 root.updateMatrixWorld(true);
}
export function daylightAt(p){
 const angle=Math.atan2(p.x,p.z)*180/Math.PI,edge=Math.min(1,Math.abs(p.y)/54);
 const wave=Math.sin(p.y*.12)*.65+Math.sin(p.y*.3)*.22;
 const s=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
 const daylight=(1-s(24,35,angle+wave))*s(-35,-18,angle+wave);
 return {light:daylight*(1-.48*edge*edge),direct:daylight,angle,edge,stage:daylight<.015?'Night':angle>24?'Dawn':angle< -18?'Dimming':'Daylight'};
}
const lightGLSL=`
float ringAngle=degrees(atan(vRingPosition.x,vRingPosition.z));
float ringWave=sin(vRingPosition.y*.12)*.65+sin(vRingPosition.y*.3)*.22;
float ringDay=(1.-smoothstep(24.,35.,ringAngle+ringWave))*smoothstep(-35.,-18.,ringAngle+ringWave);
float ringEdge=min(1.,abs(vRingPosition.y)/54.);
float ringPatch=mix(1.,.62+.38*smoothstep(-.3,.4,sin(vRingPosition.y*.48+ringAngle*.37)),smoothstep(.50,.94,ringEdge));
gl_FragColor.rgb*=pow(ringDay,1.35)*(1.-ringEdge*ringEdge*.48)*ringPatch*mix(vec3(1.08,1.0,.84),vec3(.73,.85,1.),ringEdge);
`;
export function nightMaterial(mat){
 if(mat.userData.ringLight)return;mat.userData.ringLight=true;const previous=mat.onBeforeCompile;
 mat.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);shader.vertexShader='varying vec3 vRingPosition;\n'+shader.vertexShader;shader.fragmentShader='varying vec3 vRingPosition;\n'+shader.fragmentShader;
  if(shader.vertexShader.includes('#include <project_vertex>'))shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 ringP=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nringP=instanceMatrix*ringP;\n#endif\nvRingPosition=(modelMatrix*ringP).xyz;\n#include <project_vertex>`);
  else shader.vertexShader=shader.vertexShader.replace('void main(){','void main(){vRingPosition=(modelMatrix*vec4(position,1.)).xyz;');
  if(shader.fragmentShader.includes('#include <dithering_fragment>'))shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',lightGLSL+'\n#include <dithering_fragment>');
  else {const end=shader.fragmentShader.lastIndexOf('}');shader.fragmentShader=shader.fragmentShader.slice(0,end)+lightGLSL+shader.fragmentShader.slice(end);}
 };mat.customProgramCacheKey=()=>`ring-night-${mat.type}-${!!mat.vertexColors}-${!!mat.map}`;mat.needsUpdate=true;
}
