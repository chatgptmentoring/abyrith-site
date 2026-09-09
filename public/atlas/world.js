import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {createWorld,pointOf,heightAt,polar,angleAt,INNER,OUTER} from './terrain.js';
import {places,DAWN_ORDER,SUNLIGHT_DEGREES} from './world-data.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId=new Map(places.map(p=>[p.id,p]));
const mobile=()=>innerWidth<=760, reduced=matchMedia('(prefers-reduced-motion: reduce)');
const state={mode:'atlas',selected:null,spin:!reduced.matches,resumeSpin:!reduced.matches,phase:0,filter:'all',labels:true,roads:true,weather:true,ready:false,locked:false};
const viewport=$('#viewport'),canvas=$('#sceneCanvas'),labels=new Map(),keys=new Set();
let renderer,scene,camera,controls,world,keyLight,frame=0,lastTime=0,elapsed=0,goal=null,surfaceTransition=null,desiredDistance=320,zoomTimeout,landingPoint=null,lookYaw=0,lookPitch=0;
const player={position:new THREE.Vector3(),altitude:5},stick={x:0,y:0},touchLook={id:null,x:0,y:0},pinch=new Map();
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),vector=new THREE.Vector3(),projected=new THREE.Vector3();
const notify=text=>{$('#status').textContent=text;};
const anchor=p=>p?.angle!=null?p:byId.get(p?.anchor);
function renderCatalogue(){
 const query=$('#search').value.trim().toLowerCase();
 const filtered=places.filter(p=>(state.filter==='all'||p.kind==='landmark')&&`${p.name} ${p.aliases||''} ${p.tag} ${p.text}`.toLowerCase().includes(query));
 $('#recordCount').textContent=places.length;let previous='';
 $('#catalog').innerHTML=filtered.map(p=>{const group=p.angle!=null?'THE KNOWN RING':p.kind==='unplaced'?'BEYOND THE SURVEY':'WITHIN THE KINGDOMS';const heading=group===previous?'':`<p class="group-title">${group}</p>`;previous=group;return `${heading}<button class="place-row ${state.selected===p.id?'selected':''}" data-place="${p.id}" style="--place-color:${p.color||'#abc3a9'}" aria-pressed="${state.selected===p.id}"><span class="symbol" aria-hidden="true">${p.symbol||'·'}</span><span><strong>${esc(p.name)}</strong><small>${esc(p.tag)}</small></span><span class="arrow" aria-hidden="true">↗</span></button>`;}).join('')||'<p class="empty">No place matches that search.<br>Try a kingdom or a landmark.</p>';
}
function detail(p){
 const location=anchor(p),related=(p.related||[]).map(id=>byId.get(id)).filter(Boolean);
 $('#detail').innerHTML=`<button class="detail-back" data-back>← ALL PLACES</button><button class="detail-mobile-close" data-close aria-label="Close place panel">×</button>${p.art?`<img class="detail-art" src="/assets/places/${p.art}.webp" alt="Archive artwork of ${esc(p.name)}">`:''}<div class="detail-inner"><p class="eyebrow">${esc(p.tag)}</p><h2>${esc(p.name)}</h2><blockquote>${esc(p.quote)}</blockquote><p class="detail-copy">${esc(p.text)}</p>${location?'<div class="visit-buttons"><button data-visit="hover">↗ Fly over</button><button data-visit="walk">♙ Walk here</button></div>':''}${p.details?`<ul>${p.details.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}<p class="model-note"><b>${location?'IN THIS RECONSTRUCTION':'UNPLACED RECORD'}</b>${esc(p.model||p.placement)}${p.model&&p.placement?'<br><br>'+esc(p.placement):''}${p.anchor?'<br><br>The view uses the broader region. An exact individual building position is not established.':''}</p>${related.length?`<div class="related">${related.map(x=>`<button data-place="${x.id}">${esc(x.name)} ↗</button>`).join('')}</div>`:''}<button class="detail-share" data-share>Copy this place’s link ↗</button></div>`;
 $('#detail').hidden=false;$('#detail').scrollTop=0;$('#explorer').classList.add('detail-active');
}
function selectPlace(id,{move=true,hash=true}={}){
 const p=byId.get(id);if(!p)return;
 state.selected=id;detail(p);renderCatalogue();$('#welcome').hidden=true;
 for(const [key,button] of labels){const selected=anchor(p)?.id===key;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));}
 if(move&&state.ready){if(state.mode!=='atlas')exitSurface(false);const a=anchor(p);if(a)focusPlace(a);else resetView(false);}
 if(hash)history.replaceState(null,'',`${location.pathname}#place=${encodeURIComponent(id)}`);
 notify(`${p.name}. ${p.text}`);if(mobile())openExplorer();
}
function backToCatalogue(){state.selected=null;$('#detail').hidden=true;$('#explorer').classList.remove('detail-active');for(const button of labels.values()){button.classList.remove('selected');button.setAttribute('aria-pressed','false');}history.replaceState(null,'',location.pathname);renderCatalogue();}
function openExplorer(){$('#explorer').classList.add('open');$('#explorer').inert=false;$('#mobileExplore').setAttribute('aria-expanded','true');}
function closeExplorer(){$('#explorer').classList.remove('open');$('#explorer').inert=mobile();$('#mobileExplore').setAttribute('aria-expanded','false');}

function makeLabels(){for(const p of places.filter(p=>p.angle!=null)){const b=document.createElement('button');b.className='map-label';b.dataset.place=p.id;b.style.setProperty('--place-color',p.color);b.setAttribute('aria-label',`Explore ${p.name}`);b.setAttribute('aria-pressed','false');b.innerHTML=`<i aria-hidden="true"></i><span>${esc(p.name)}</span>`;b.addEventListener('click',()=>selectPlace(p.id));$('#labels').append(b);labels.set(p.id,b);}}
function worldPoint(p){return pointOf(p).applyMatrix4(world.root.matrixWorld);}
function updateLabels(){
 if(!state.ready)return;
 camera.updateMatrixWorld();world.root.updateMatrixWorld();const w=viewport.clientWidth,h=viewport.clientHeight,used=[];
 const priorities=[...labels].sort(([a],[b])=>(anchor(byId.get(state.selected))?.id===b?1:0)-(anchor(byId.get(state.selected))?.id===a?1:0));
 for(const [id,button] of priorities){const p=byId.get(id),pos=worldPoint(p);pos.y+=p.id==='aurelion'?12:p.id==='oakhaven'?11:p.id==='solkar'?15:p.id==='east-tower'?10:8;projected.copy(pos).project(camera);const x=(projected.x*.5+.5)*w,y=(-projected.y*.5+.5)*h;
  const far=state.mode==='atlas'&&controls.getDistance()>160,secondary=far&&['east-tower','twilight-city','titanfall','oakhaven','caelmarch'].includes(id),isSelected=anchor(byId.get(state.selected))?.id===id;
  let hide=!state.labels||projected.z>1||projected.z< -1||x<12||x>w-12||y<42||y>h-82;
  if(state.mode!=='atlas'&&pos.distanceTo(camera.position)>90&&!isSelected)hide=true;
  if(!hide&&!isSelected&&mobile()&&used.some(q=>Math.abs(q.x-x)<155&&Math.abs(q.y-y)<27))hide=true;
  if(!hide)used.push({x,y});button.hidden=hide;button.style.left=`${x}px`;button.style.top=`${y}px`;button.classList.toggle('left-label',x>w-160);button.classList.toggle('secondary',secondary&&!isSelected);
  const angle=(p.angle-state.phase+360)%360;button.classList.toggle('in-light',Math.min(angle,360-angle)<SUNLIGHT_DEGREES/2);
 }
}
function updateRotation(){
 const running=state.spin&&state.mode==='atlas';$('#rotationToggle').textContent=running?'Ⅱ':'▶';$('#rotationToggle').setAttribute('aria-label',running?'Pause world rotation':'Play world rotation');$('#rotationToggle').setAttribute('aria-pressed',String(running));
 $('#rotationLabel').textContent=`70° LIGHT · ${running?'CLOCKWISE':'PAUSED'}`;$('#rotationRange').value=String(Math.floor(state.phase));$('#rotationValue').textContent=`${Math.floor(state.phase)}°`;
 let closest=DAWN_ORDER[0],difference=Infinity,next=closest,nextDistance=Infinity;for(const id of DAWN_ORDER){const a=(byId.get(id).angle-state.phase+360)%360,d=Math.min(a,360-a);if(d<difference){difference=d;closest=id;}if(a<nextDistance){nextDistance=a;next=id;}}
 $('#dawnLabel').textContent=`${difference<35?'Dawn over':'Light approaches'} ${byId.get(difference<35?closest:next).name.replace(/^The /,'')}`;
}
function pauseForExploration(){state.spin=false;updateRotation();}
function moveCamera(position,target){goal={position:position.clone(),target:target.clone()};desiredDistance=position.distanceTo(target);if(reduced.matches){camera.position.copy(position);controls.target.copy(target);controls.update();goal=null;}}
function focusPlace(p){
 pauseForExploration();world.root.updateMatrixWorld();const target=worldPoint(p);landingPoint=pointOf(p);const outward=polar(p.angle-state.phase,1);const offset=new THREE.Vector3(-outward.x*40+outward.z*12,32,-outward.z*40-outward.x*12).normalize().multiplyScalar(55);
 moveCamera(target.clone().add(offset),target);$('#viewTitle').textContent=p.name;$('#zoomReadout').textContent='REGION';
}
function overviewDistance(){const aspect=viewport.clientWidth/viewport.clientHeight;return Math.max(350,150/Math.sin(Math.atan(Math.tan(THREE.MathUtils.degToRad(21))*aspect)));}
function resetView(clear=false){
 if(!state.ready)return;if(state.mode!=='atlas')exitSurface(false);
 state.phase=0;world.root.rotation.y=0;world.root.updateMatrixWorld();const distance=overviewDistance(),direction=new THREE.Vector3(0,.8,1).normalize();moveCamera(direction.multiplyScalar(distance),new THREE.Vector3(0,0,0));
 state.spin=state.resumeSpin;landingPoint=null;$('#viewTitle').textContent='A world worth getting lost in.';$('#zoomReadout').textContent='WORLD';$('#welcome').hidden=false;if(clear)backToCatalogue();updateRotation();
}
function pickGround(clientX,clientY){const rect=canvas.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-((clientY-rect.top)/rect.height)*2+1);ray.setFromCamera(pointer,camera);world.root.updateMatrixWorld();return ray.intersectObject(world.terrain,false)[0]?.point||null;}
function zoom(factor,point=null){
 if(!state.ready)return;
 if(state.mode!=='atlas'){if(factor>1)exitSurface();else if(state.mode==='hover'){player.position.y=Math.max(groundAtWorld(player.position.x,player.position.z)+1.8,player.position.y-1.5);notify('Descending. Use the movement controls to explore.');}return;}
 pauseForExploration();$('#welcome').hidden=true;
 const distance=goal?desiredDistance:controls.getDistance(),next=THREE.MathUtils.clamp(distance*factor,7,Math.max(1100,overviewDistance()));
 let target=goal?.target.clone()||controls.target.clone();
 if(factor<1){
  if(point){landingPoint=world.root.worldToLocal(point.clone());target.lerp(point,distance>150?.3:.16);}
  else if(Math.hypot(target.x,target.z)<INNER*.8){const p=anchor(byId.get(state.selected))||byId.get('aurelion'),pWorld=worldPoint(p);landingPoint=pointOf(p);target.lerp(pWorld,.28);}
 }
 if(next<15&&factor<1){enterSurface('hover',landingPoint);return;}
 const direction=camera.position.clone().sub(controls.target).normalize();moveCamera(target.clone().addScaledVector(direction,next),target);desiredDistance=next;
 viewport.classList.add('zooming');clearTimeout(zoomTimeout);zoomTimeout=setTimeout(()=>viewport.classList.remove('zooming'),500);
}
function localAtWorld(point){return world.root.worldToLocal(point.clone());}
function groundAtWorld(x,z){const p=localAtWorld(new THREE.Vector3(x,0,z));return heightAt(p.x,p.z);}
function safeSpawn(point){
 let p=point?.clone()||pointOf(anchor(byId.get(state.selected))||byId.get('aurelion'));
 const a=angleAt(p.x,p.z),r=Math.hypot(p.x,p.z);
 // Enter on the sunward approach outside a building's footprint.
 if(!point)p=polar(a,THREE.MathUtils.clamp(r-(anchor(byId.get(state.selected))?.id==='basin'?16:9),INNER+3,OUTER-3));
 for(let i=0;i<30&&world.collides(p.x,p.z,heightAt(p.x,p.z)+1.1);i++){p.x+=.4;p.z-=.3;}
 const radius=Math.hypot(p.x,p.z);if(radius<INNER+2||radius>OUTER-2)p.multiplyScalar(THREE.MathUtils.clamp(radius,INNER+2,OUTER-2)/radius);
 p.y=heightAt(p.x,p.z);return p;
}
function isLake(x,z){const c=pointOf(byId.get('basin'));return Math.hypot(x-c.x,z-c.z)<14&&heightAt(x,z)<3;}
function syncMode(){
 viewport.classList.toggle('surface',state.mode!=='atlas');$$('[data-mode]').forEach(b=>{const selected=b.dataset.mode===state.mode;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
 $('#surfaceHUD').hidden=state.mode==='atlas';$('#crosshair').hidden=state.mode==='atlas';$('#touchControls').hidden=state.mode==='atlas';$('.altitude-buttons').hidden=state.mode==='walk';
 $('#surfaceMode').textContent=state.mode==='walk'?'ON FOOT':'HOVERING';$('#zoomReadout').textContent=state.mode==='walk'?'ON FOOT':state.mode==='hover'?'HOVER':'REGION';
 $('#controlsHint').textContent=state.mode==='atlas'?'Drag to orbit · Scroll to descend · Right-drag to pan':state.mode==='walk'?'WASD to walk · Drag to look · Shift to move faster':'WASD to fly · E / Q to rise or descend · Drag to look';
 updateRotation();
}
function enterSurface(mode,point=null){
 if(!state.ready)return;const from=camera.position.clone(),fromRotation=camera.quaternion.clone();pauseForExploration();goal=null;keys.clear();stick.x=stick.y=0;controls.enabled=false;
 if(state.mode==='atlas'){
  const local=safeSpawn(point);world.root.updateMatrixWorld();player.position.copy(local.applyMatrix4(world.root.matrixWorld));
  const focus=anchor(byId.get(state.selected))||byId.get('aurelion');const centre=worldPoint(focus);const direction=centre.clone().sub(player.position);if(direction.length()<1)direction.copy(player.position).normalize();
  lookYaw=Math.atan2(-direction.x,-direction.z);lookPitch=mode==='hover'?-.18:0;
 }
 if(mode==='walk'){const p=localAtWorld(player.position);if(isLake(p.x,p.z)){const c=pointOf(byId.get('basin')),direction=p.clone().sub(c).setY(0);if(direction.length()<.1)direction.set(1,0,0);p.copy(c).add(direction.normalize().multiplyScalar(15));p.y=heightAt(p.x,p.z);player.position.copy(world.root.localToWorld(p));}}
 state.mode=mode;player.altitude=mode==='walk'?1.05:7;player.position.y=groundAtWorld(player.position.x,player.position.z)+player.altitude;camera.position.copy(player.position);camera.rotation.order='YXZ';camera.rotation.set(lookPitch,lookYaw,0);surfaceTransition=reduced.matches?null:{from,fromRotation,time:0};
 $('#welcome').hidden=true;$('#viewTitle').textContent=anchor(byId.get(state.selected))?.name||'Across the living Ring';closeExplorer();syncMode();notify(mode==='walk'?'On foot. Use WASD or the movement pad; drag the scenery to look.':'Hover mode. Use WASD to travel, E and Q for altitude, or the touch controls.');
}
function exitSurface(fit=false){
 if(state.mode==='atlas')return;surfaceTransition=null;if(document.pointerLockElement===canvas)document.exitPointerLock();state.mode='atlas';keys.clear();stick.x=stick.y=0;touchLook.id=null;controls.enabled=true;
 const ground=groundAtWorld(camera.position.x,camera.position.z),target=new THREE.Vector3(camera.position.x,ground,camera.position.z),position=target.clone().add(new THREE.Vector3(15,26,38));
 camera.rotation.order='XYZ';controls.target.copy(target);moveCamera(position,target);syncMode();if(fit)resetView();
}
function rotateLook(dx,dy){lookYaw-=dx*.003;lookPitch=THREE.MathUtils.clamp(lookPitch-dy*.003,-1.35,1.35);camera.rotation.set(lookPitch,lookYaw,0,'YXZ');}
function updatePlayer(dt){
 if(state.mode==='atlas')return;
 const inputX=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stick.x;
 const inputZ=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-stick.y;
 const up=(keys.has('KeyE')||keys.has('Space')?1:0)-(keys.has('KeyQ')?1:0);
 const speed=(state.mode==='walk'?2.5:11)*(keys.has('ShiftLeft')||keys.has('ShiftRight')?2:1);
 const length=Math.max(1,Math.hypot(inputX,inputZ)),forward=new THREE.Vector3(-Math.sin(lookYaw),0,-Math.cos(lookYaw)),right=new THREE.Vector3(Math.cos(lookYaw),0,-Math.sin(lookYaw));
 const proposed=player.position.clone().addScaledVector(forward,inputZ/length*speed*dt).addScaledVector(right,inputX/length*speed*dt);
 const local=localAtWorld(proposed),radius=Math.hypot(local.x,local.z);local.multiplyScalar(THREE.MathUtils.clamp(radius,INNER+1.2,OUTER-1.2)/radius);local.y=0;
 const ground=heightAt(local.x,local.z),oldGround=groundAtWorld(player.position.x,player.position.z);
 const collision=world.collides(local.x,local.z,state.mode==='walk'?ground+1.05:proposed.y)||(state.mode==='walk'&&isLake(local.x,local.z));
 if(!collision&&(state.mode==='hover'||ground-oldGround<.9)){const p=world.root.localToWorld(local);player.position.x=p.x;player.position.z=p.z;}
 const floor=groundAtWorld(player.position.x,player.position.z);
 if(state.mode==='walk')player.position.y=floor+1.05;
 else player.position.y=THREE.MathUtils.clamp(player.position.y+up*speed*.65*dt,floor+1.8,60);
 player.altitude=player.position.y-floor;camera.position.copy(player.position);camera.rotation.set(lookPitch,lookYaw,0,'YXZ');$('#heightReadout').textContent=state.mode==='walk'?'ON THE GROUND':`${player.altitude.toFixed(1)} ABOVE GROUND`;
}

function setup(){
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.5:1.75));renderer.setSize(viewport.clientWidth,viewport.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#18393e',.0014);camera=new THREE.PerspectiveCamera(42,viewport.clientWidth/viewport.clientHeight,.12,1800);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene.add(new THREE.HemisphereLight('#dce7e7','#263d37',1.65));keyLight=new THREE.DirectionalLight('#fff1d7',2.7);keyLight.position.set(-70,130,65);keyLight.castShadow=true;keyLight.shadow.mapSize.setScalar(mobile()?1024:2048);keyLight.shadow.bias=-.00015;keyLight.shadow.normalBias=.045;keyLight.shadow.camera.near=1;keyLight.shadow.camera.far=360;scene.add(keyLight,keyLight.target);const sunLight=new THREE.PointLight('#ffefc5',1000,500,2);sunLight.position.set(0,25,0);scene.add(sunLight);
  controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.1;controls.enableZoom=false;controls.minDistance=7;controls.maxDistance=Math.max(1100,overviewDistance());controls.minPolarAngle=.2;controls.maxPolarAngle=1.37;controls.screenSpacePanning=false;controls.rotateSpeed=.55;controls.panSpeed=.65;
  controls.addEventListener('start',()=>{if(state.mode==='atlas'){goal=null;desiredDistance=controls.getDistance();pauseForExploration();}});
  world=createWorld(scene,{mobile:mobile()});state.ready=true;makeLabels();resetView();setupInput();$('#loading').hidden=true;renderer.render(scene,camera);notify('Aethergard is ready. Select a place or descend toward the terrain.');
  const params=new URLSearchParams(location.hash.slice(1));if(byId.has(params.get('place')))selectPlace(params.get('place'),{hash:false});
  frame=requestAnimationFrame(animate);
  // Read-only diagnostics used for geography, camera and performance verification.
  window.__aethergard={getState:()=>({mode:state.mode,phase:state.phase,spin:state.spin,beam:world.beam.userData.angle,selected:state.selected,distance:controls.getDistance(),camera:camera.position.toArray(),player:player.position.toArray(),floor:state.mode==='atlas'?null:groundAtWorld(player.position.x,player.position.z),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,...world.stats}),getPlace:id=>{const p=anchor(byId.get(id));return p?{local:pointOf(p).toArray(),world:worldPoint(p).toArray()}:null;}};
 }catch(error){console.error('Aethergard could not initialise:',error);$('#loading').hidden=true;$('#fallback').hidden=false;$('#fallbackReason').textContent='This browser could not start the 3D view. Try enabling graphics acceleration or opening a browser with WebGL 2 support. The place catalogue is still available.';}
}
function animate(now){
 const dt=Math.min((now-(lastTime||now))/1000,.045);lastTime=now;elapsed+=dt;
 if(state.mode==='atlas'){
  if(state.spin&&!goal)state.phase=(state.phase+dt)%360;world.root.rotation.y=-THREE.MathUtils.degToRad(state.phase);world.root.updateMatrixWorld();
  if(goal){const t=1-Math.exp(-dt*9);camera.position.lerp(goal.position,t);controls.target.lerp(goal.target,t);if(camera.position.distanceTo(goal.position)<.015&&controls.target.distanceTo(goal.target)<.015){camera.position.copy(goal.position);controls.target.copy(goal.target);goal=null;}}
  controls.update(dt);
  // Keep an orbital camera above the terrain when tilted close to the ground.
  const local=localAtWorld(camera.position),r=Math.hypot(local.x,local.z);if(r>INNER&&r<OUTER)camera.position.y=Math.max(camera.position.y,heightAt(local.x,local.z)+1.4);
  const d=controls.getDistance();$('#zoomReadout').textContent=d>170?'WORLD':d>60?'REGION':'DESCEND';$('#zoomOut').disabled=d>=controls.maxDistance-1;$('#zoomIn').disabled=false;
 }else{updatePlayer(dt);$('#zoomOut').disabled=false;if(surfaceTransition){surfaceTransition.time+=dt;const t=THREE.MathUtils.smoothstep(surfaceTransition.time/1.15,0,1),toRotation=camera.quaternion.clone();camera.position.lerpVectors(surfaceTransition.from,player.position,t);camera.quaternion.slerpQuaternions(surfaceTransition.fromRotation,toRotation,t);if(t===1)surfaceTransition=null;}}
 const shadowFocus=state.mode==='atlas'?controls.target:player.position;keyLight.target.position.copy(shadowFocus);keyLight.position.copy(shadowFocus).add(new THREE.Vector3(-65,120,60));const extent=state.mode==='atlas'?THREE.MathUtils.clamp(controls.getDistance()*.65,24,140):24,sc=keyLight.shadow.camera;sc.left=sc.bottom=-extent;sc.right=sc.top=extent;sc.updateProjectionMatrix();
 scene.fog.density=state.mode==='atlas'?.0014:.004;
 world.update(elapsed,!reduced.matches);updateLabels();if(Math.floor(now/180)!==Math.floor((now-dt*1000)/180))updateRotation();renderer.render(scene,camera);frame=requestAnimationFrame(animate);
}
function setupInput(){
 canvas.addEventListener('wheel',e=>{e.preventDefault();const delta=THREE.MathUtils.clamp(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?500:1),-170,170);zoom(Math.exp(delta*.0024),state.mode==='atlas'?pickGround(e.clientX,e.clientY):null);},{passive:false});
 viewport.addEventListener('pointerdown',e=>{
  if(e.target!==canvas&&!e.target.closest('.map-label'))return;
  if(state.mode!=='atlas'){if(e.pointerType==='touch'||!document.pointerLockElement){touchLook.id=e.pointerId;touchLook.x=e.clientX;touchLook.y=e.clientY;canvas.setPointerCapture(e.pointerId);}return;}
  if(e.pointerType==='touch'){pinch.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch.size===2){controls.enabled=false;goal=null;for(const id of pinch.keys())viewport.setPointerCapture(id);const values=[...pinch.values()];pinch.distance=Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y);e.preventDefault();}}
 },true);
 viewport.addEventListener('pointermove',e=>{
  if(state.mode!=='atlas'&&touchLook.id===e.pointerId){rotateLook(e.clientX-touchLook.x,e.clientY-touchLook.y);touchLook.x=e.clientX;touchLook.y=e.clientY;return;}
  if(pinch.has(e.pointerId)){pinch.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch.size===2){const [a,b]=[...pinch.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch.distance)zoom(pinch.distance/d,pickGround((a.x+b.x)/2,(a.y+b.y)/2));pinch.distance=d;}}
 },true);
 const end=e=>{pinch.delete(e.pointerId);if(pinch.size<2){pinch.distance=null;if(state.mode==='atlas')controls.enabled=true;}if(touchLook.id===e.pointerId)touchLook.id=null;};viewport.addEventListener('pointerup',end,true);viewport.addEventListener('pointercancel',end,true);
 canvas.addEventListener('dblclick',e=>{if(state.mode!=='atlas')return;const hit=pickGround(e.clientX,e.clientY);if(hit){landingPoint=world.root.worldToLocal(hit.clone());pauseForExploration();moveCamera(hit.clone().add(new THREE.Vector3(10,18,25)),hit);}});
 document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas&&state.mode!=='atlas')rotateLook(e.movementX,e.movementY);});
 document.addEventListener('pointerlockchange',()=>{state.locked=document.pointerLockElement===canvas;$('#lookButton').textContent=state.locked?'Mouse look · Esc to release':'Click to look around';});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);$('#fallback').hidden=false;$('#fallbackReason').textContent='The graphics connection was interrupted. Reload the world to continue.';});
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
}

$('#catalog').addEventListener('click',e=>{const button=e.target.closest('[data-place]');if(button)selectPlace(button.dataset.place);});
$('#detail').addEventListener('click',async e=>{const p=e.target.closest('[data-place]'),visit=e.target.closest('[data-visit]');if(p)selectPlace(p.dataset.place);if(visit)enterSurface(visit.dataset.visit);if(e.target.closest('[data-back]'))backToCatalogue();if(e.target.closest('[data-close]'))closeExplorer();if(e.target.closest('[data-share]')){try{await navigator.clipboard.writeText(location.href);e.target.textContent='Link copied ✓';}catch{e.target.textContent='Copy the address to share';}}});
$('#search').addEventListener('input',renderCatalogue);
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.filter;$$('[data-filter]').forEach(x=>{const selected=x===b;x.classList.toggle('active',selected);x.setAttribute('aria-pressed',String(selected));});renderCatalogue();}));
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.mode==='atlas'){exitSurface();resetView();}else enterSurface(b.dataset.mode);}));
$('#zoomIn').addEventListener('click',()=>zoom(.76));$('#zoomOut').addEventListener('click',()=>zoom(1/.76));$('#resetView').addEventListener('click',()=>resetView(true));
$('#rotationToggle').addEventListener('click',()=>{state.spin=!state.spin;state.resumeSpin=state.spin;updateRotation();});
$('#timeButton').addEventListener('click',()=>{$('#timePanel').hidden=!$('#timePanel').hidden;$('#timeButton').setAttribute('aria-expanded',String(!$('#timePanel').hidden));});
$('#rotationRange').addEventListener('input',()=>{state.phase=Number($('#rotationRange').value);state.spin=false;goal=null;updateRotation();});
for(const [id,key] of [['labelsToggle','labels'],['roadsToggle','roads'],['weatherToggle','weather']])$('#'+id).addEventListener('click',()=>{state[key]=!state[key];$('#'+id).classList.toggle('active',state[key]);$('#'+id).setAttribute('aria-pressed',String(state[key]));if(world&&key!=='labels')world[key].visible=state[key];});
$('#beginExplore').addEventListener('click',()=>{selectPlace('aurelion');});
$('#mobileExplore').addEventListener('click',()=>$('#explorer').classList.contains('open')?closeExplorer():openExplorer());
$('#aboutButton').addEventListener('click',()=>$('#aboutDialog').showModal());$('#helpButton').addEventListener('click',()=>$('#helpDialog').showModal());$$('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('#lookButton').addEventListener('click',async()=>{if(state.mode==='atlas')return;if(canvas.requestPointerLock&&!mobile()){try{await canvas.requestPointerLock();}catch{notify('Drag the view to look around.');}}else notify('Drag the scenery with your finger to look around.');});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Fullscreen is unavailable in this browser.');}});if(!document.fullscreenEnabled)$('#fullscreen').hidden=true;
$('#retry').addEventListener('click',()=>location.reload());
const moveKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE','KeyQ','Space','ShiftLeft','ShiftRight']);
document.addEventListener('keydown',e=>{
 if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)||$('dialog[open]'))return;
 if(e.key==='/'){e.preventDefault();if(mobile())openExplorer();if($('#explorer').classList.contains('detail-active'))backToCatalogue();$('#search').focus();return;}
 if(e.key==='Escape'){if(document.pointerLockElement===canvas)return;if($('#explorer').classList.contains('open'))closeExplorer();else if(state.mode!=='atlas')exitSurface();return;}
 if(state.mode!=='atlas'&&moveKeys.has(e.code)){e.preventDefault();keys.add(e.code);}
 if(state.mode==='atlas'&&document.activeElement===canvas){if(['+','=','-','0'].includes(e.key)){e.preventDefault();if(e.key==='0')resetView();else zoom(e.key==='-'?1.25:.8);}if(e.code.startsWith('Arrow')){e.preventDefault();controls.pan(e.code==='ArrowLeft'?30:e.code==='ArrowRight'?-30:0,e.code==='ArrowUp'?30:e.code==='ArrowDown'?-30:0);}}
});
document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();stick.x=stick.y=0;});
document.addEventListener('visibilitychange',()=>{lastTime=0;if(document.hidden){cancelAnimationFrame(frame);keys.clear();}else if(state.ready)frame=requestAnimationFrame(animate);});
let joyId=null;const joy=$('#joystick');function joystick(e){const r=joy.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/34,y=(e.clientY-r.top-r.height/2)/34,length=Math.max(1,Math.hypot(x,y));stick.x=x/length;stick.y=y/length;$('#joystickKnob').style.transform=`translate(${stick.x*26}px,${stick.y*26}px)`;}
joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(e.pointerId);joystick(e);});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joystick(e);});for(const event of ['pointerup','pointercancel'])joy.addEventListener(event,()=>{joyId=null;stick.x=stick.y=0;$('#joystickKnob').style.transform='';});
for(const [id,key] of [['ascend','KeyE'],['descend','KeyQ']]){const b=$('#'+id);b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);keys.add(key);});for(const event of ['pointerup','pointercancel'])b.addEventListener(event,()=>keys.delete(key));}
new ResizeObserver(()=>{if(!renderer)return;const w=viewport.clientWidth,h=viewport.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);$('#explorer').inert=mobile()&&!$('#explorer').classList.contains('open');}).observe(viewport);
window.addEventListener('hashchange',()=>{const id=new URLSearchParams(location.hash.slice(1)).get('place');if(byId.has(id))selectPlace(id,{hash:false});});
reduced.addEventListener('change',()=>{if(reduced.matches){state.spin=false;state.resumeSpin=false;surfaceTransition=null;updateRotation();}});
renderCatalogue();$('#explorer').inert=mobile();
// Let the loading screen paint before constructing the geometry.
requestAnimationFrame(()=>setTimeout(setup,40));
