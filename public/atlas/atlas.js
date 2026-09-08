import {places, journeys} from './data.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const byId = new Map(places.map(place => [place.id, place]));
const viewport = $('#mapViewport'), world = $('#mapWorld'), area = $('.map-area');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const state = {x:0,y:0,scale:1,base:1,selected:null,filter:'all',tab:'places',chart:false,spoilers:false,labels:true,regions:false,roads:false,light:true,lightPanel:false,journey:null,step:0,phase:0,playing:!reducedMotion.matches};
const markerElements = new Map();
let animation = 0, lightFrame = 0, lastLightTime = 0, dragDistance = 0, resizeTimer, zoomTimer, zoomTarget = null;
const visiblePlaces = () => places.filter(place => !place.spoilerOnly || state.spoilers);
const anchorOf = (place) => place?.x != null ? place : byId.get(place?.anchor);
const isMobile = () => innerWidth <= 760;
const placementOf = (place) => place.placement || (place.x != null ? 'On the chart' : place.anchor ? 'Regional record' : 'Unplaced record');
const status = (message) => { $('#mapStatus').textContent = message; };
const SUN = {x:563,y:637};
const DAWN_ORDER = ['aurelion','solkar','thunder','wild','wydin','basin'];
function rotatedPoint(point) {
  const angle=(state.chart?0:state.phase)*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
  const x=point.x-SUN.x,y=point.y-SUN.y;
  return {x:SUN.x+x*cos-y*sin,y:SUN.y+x*sin+y*cos};
}
const beamBearing=101.63; // Fixed on Aurelion at phase zero; the cone spans exactly 40 degrees.
function currentDawn() {
  let nearest=DAWN_ORDER[0],distance=Infinity,upcoming=nearest,until=Infinity;
  for(const id of DAWN_ORDER){const p=rotatedPoint(byId.get(id));const bearing=Math.atan2(p.y-SUN.y,p.x-SUN.x)*180/Math.PI;const delta=Math.abs(((bearing-beamBearing+540)%360)-180);const next=(beamBearing-bearing+720)%360;if(delta<distance){nearest=id;distance=delta;}if(next<until){upcoming=id;until=next;}}
  return {place:byId.get(distance<=20?nearest:upcoming),distance};
}

function renderCatalogue() {
  $('#placeCount').textContent = String(visiblePlaces().length).padStart(2,'0');
  $('#filters').hidden = state.tab === 'journeys';
  $('#catalog').setAttribute('aria-labelledby', state.tab === 'places' ? 'placesTab' : 'journeysTab');
  if (state.tab === 'journeys') {
    $('#catalog').innerHTML = journeys.map((journey,index) => `<button class="journey-card ${journey.spoilers && !state.spoilers ? 'locked' : ''}" data-journey="${journey.id}"><span class="journey-number">JOURNEY 0${index+1} / ${journey.stops.length} STOPS</span><h3>${escapeHTML(journey.name)}</h3><p>${escapeHTML(journey.summary)}</p><small>${journey.spoilers && !state.spoilers ? 'ENABLE BOOK ONE SPOILERS TO BEGIN' : 'BEGIN THE JOURNEY →'}</small></button>`).join('') + '<p class="placement-note">These are guided reading itineraries. Lines connect broad chart anchors; they do not establish exact roads or distances.</p>';
    return;
  }
  const query = $('#search').value.trim().toLocaleLowerCase();
  const matches = visiblePlaces().filter(place => {
    const searchText = `${place.name} ${place.aliases||''} ${place.kind} ${place.region} ${place.lede} ${place.text}`.toLocaleLowerCase();
    return (!query || searchText.includes(query)) && (state.filter === 'all' || state.filter === 'charted' && place.x != null || state.filter === 'landmark' && place.kind === 'Landmark');
  });
  let group = '';
  $('#catalog').innerHTML = matches.map(place => {
    const heading = group !== place.group ? `<div class="list-heading">${escapeHTML(place.group.toUpperCase())}</div>` : '';
    group = place.group;
    return `${heading}<button class="place-row ${state.selected === place.id ? 'selected' : ''} ${!place.x ? 'unplaced' : ''}" data-place="${place.id}" aria-pressed="${state.selected === place.id}"><span class="place-symbol" aria-hidden="true">${place.icon || (place.kind === 'Landmark' ? '⌑' : '·')}</span><span class="row-text"><span class="row-name">${escapeHTML(place.name)}</span><span class="row-sub">${escapeHTML(place.kind.toUpperCase())}${!place.x ? ' · '+(place.anchor?'REGIONAL':'UNPLACED') : ''}</span></span><span class="row-arrow" aria-hidden="true">↗</span></button>`;
  }).join('') || '<p class="empty-results">No matching records.<br>Try a city, kingdom, or landmark.</p>';
}

function makeMarkers() {
  $('#markerLayer').innerHTML = '';
  for (const place of places.filter(place => place.x != null)) {
    const button = document.createElement('button');
    button.className = `map-marker${place.id === 'core' ? ' core' : ''}`;
    button.type = 'button';
    button.setAttribute('aria-label',`Explore ${place.name}`);
    button.setAttribute('aria-pressed','false');
    button.dataset.place = place.id;
    button.innerHTML = `<span class="marker-dot" aria-hidden="true"><span>${place.icon}</span></span><span class="marker-label">${escapeHTML(place.name)}</span>`;
    button.addEventListener('click', () => { if (dragDistance < 7) selectPlace(place.id); });
    $('#markerLayer').append(button);
    markerElements.set(place.id,button);
  }
}

function paint() {
  const angle=state.chart?0:state.phase;
  world.style.transform = `translate(${state.x}px,${state.y}px) scale(${state.scale}) translate(${SUN.x}px,${SUN.y}px) rotate(${angle}deg) translate(${-SUN.x}px,${-SUN.y}px)`;
  $('#lightLayer').setAttribute('transform',`rotate(${-angle} ${SUN.x} ${SUN.y})`);
  const w = viewport.clientWidth, h = viewport.clientHeight;
  for (const [id,button] of markerElements) {
    const place = byId.get(id), point=rotatedPoint(place),x = state.x + point.x*state.scale, y = state.y + point.y*state.scale;
    button.style.left = `${x}px`; button.style.top = `${y}px`;
    button.hidden = x < -40 || x > w+40 || y < -40 || y > h+40 || (isMobile() && state.scale < .6 && id === 'serpent');
    button.classList.toggle('label-left', x > w-170);
    button.classList.toggle('low-priority', (id === 'serpent' && state.scale < .7) || (isMobile() && state.scale < .6 && ['core','thunder','caelmarch'].includes(id)));
  }
  $('#zoomValue').textContent = `${Math.round(state.scale/state.base*100)}%`;
  $('#zoomIn').disabled = state.scale >= state.base*6-.001;
  $('#zoomOut').disabled = state.scale <= state.base*.65+.001;
}

function moveTo(x,y,scale,animate=true,duration=620) {
  cancelAnimationFrame(animation);
  zoomTarget=null;
  if (!animate || reducedMotion.matches) {Object.assign(state,{x,y,scale});paint();return;}
  const start = performance.now(), from = {x:state.x,y:state.y,scale:state.scale};
  const tick = now => {
    const t = Math.min(1,(now-start)/duration), eased = 1-Math.pow(1-t,4);
    state.x = from.x + (x-from.x)*eased; state.y = from.y + (y-from.y)*eased; state.scale = from.scale + (scale-from.scale)*eased;
    paint(); if(t<1) animation=requestAnimationFrame(tick);else zoomTarget=null;
  };
  animation=requestAnimationFrame(tick);
}

function fitMap(animate=true) {
  const w=viewport.clientWidth,h=viewport.clientHeight;
  const scale=state.chart ? Math.min((w-50)/1122,(h-165)/1402) : Math.min((w-(isMobile()?24:65))/1000,(h-(isMobile()?260:145))/870);
  state.base=Math.max(.14,scale);
  const centreY = isMobile() && !state.chart ? h*.37 : (h-45)*.5;
  moveTo(w/2-561*state.base, centreY-(state.chart?701:650)*state.base,state.base,animate);
  $('#viewTitle').textContent=state.chart?'The original Aethergard chart':'The world that encircles the sun';
}

function zoomAt(factor,x=viewport.clientWidth/2,y=viewport.clientHeight/2,animate=false) {
  cancelAnimationFrame(animation);
  const next=Math.min(state.base*6,Math.max(state.base*.65,(animate?(zoomTarget||state.scale):state.scale)*factor));
  const ratio=next/state.scale;
  const nextX=x-(x-state.x)*ratio,nextY=y-(y-state.y)*ratio;
  if(animate){moveTo(nextX,nextY,next,true,360);if(!reducedMotion.matches)zoomTarget=next;zoomEffect(x,y);}else{state.x=nextX;state.y=nextY;state.scale=next;paint();}
}

function zoomEffect(x,y){
  if(reducedMotion.matches)return;
  viewport.style.setProperty('--zoom-x',`${x}px`);viewport.style.setProperty('--zoom-y',`${y}px`);
  viewport.classList.add('zooming');clearTimeout(zoomTimer);zoomTimer=setTimeout(()=>viewport.classList.remove('zooming'),520);
}

function focusPlace(place,animate=true) {
  const anchor=anchorOf(place);
  if(!anchor){fitMap(animate);status(`${place.name}. No position has been established on the chart.`);return;}
  const w=viewport.clientWidth,h=viewport.clientHeight;
  const next = state.base*(isMobile()?2.15:1.85);
  const targetX=isMobile()?w*.43:(w-330)*.49;
  const targetY=isMobile()?h*.245:h*.43;
  const point=rotatedPoint(anchor);
  moveTo(targetX-point.x*next,targetY-point.y*next,next,animate);
  $('#viewTitle').textContent=place.x!=null ? place.name : `Regional view · ${anchor.name}`;
}

function renderDetail(place) {
  const source = escapeHTML(place.source);
  const related=(place.related||[]).map(id=>byId.get(id)).filter(p=>p && (!p.spoilerOnly || state.spoilers));
  const placement=place.note || (place.x!=null?'Marker follows the original artwork. The chart is illustrative and has no measured scale.':place.anchor?`This place has no individual pin. The map highlights ${anchorOf(place).name} as a regional reference, not its exact location.`:'The available sources do not establish a reliable position. This record has no map pin.');
  $('#detail').innerHTML=`<button class="detail-close" aria-label="Close location record">×</button>${place.image?`<img class="detail-image" src="/assets/places/${place.image}.webp" alt="Published artwork of ${escapeHTML(place.name)}" width="600" height="340">`:''}<div class="detail-inner"><p class="detail-tag">${escapeHTML(place.kind.toUpperCase())}</p><h2>${escapeHTML(place.name)}</h2><p class="detail-lede">${escapeHTML(place.lede)}</p><p class="detail-copy">${escapeHTML(place.text)}</p><div class="record-meta"><span>${escapeHTML(place.region)}</span><span>${placementOf(place)}</span></div>${place.facts?.length?`<h3 class="detail-section-title">IN THE RECORD</h3><ul class="detail-facts">${place.facts.map(f=>`<li>${escapeHTML(f)}</li>`).join('')}</ul>`:''}${state.spoilers && place.plot?`<div class="plot-note"><b>BOOK ONE · SPOILERS</b>${escapeHTML(place.plot)}</div>`:''}${related.length?`<h3 class="detail-section-title">FOLLOW THE THREAD</h3><div class="related">${related.map(p=>`<button data-place="${p.id}">${escapeHTML(p.name)} ↗</button>`).join('')}</div>`:''}<p class="placement-note">${escapeHTML(placement)}</p><p class="source-note">SOURCE / ${source}</p><div class="detail-actions">${anchorOf(place)?'<button data-action="locate">⌖ Re-centre</button>':'<span></span>'}<button data-action="share">Copy link ↗</button></div></div>`;
  $('#detail').hidden=false;
  $('#detail').scrollTop=0;
}

function selectPlace(id,{focus=true,hash=true}={}) {
  const place=byId.get(id);
  if(!place || place.spoilerOnly && !state.spoilers)return;
  state.selected=id;
  const anchor=anchorOf(place);
  for(const [key,button] of markerElements){const selected=anchor?.id===key;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));}
  $('#selectionLayer').innerHTML=anchor?`<ellipse class="selection-ring" cx="${anchor.x}" cy="${anchor.y}" rx="${place.x!=null?37:80}" ry="${place.x!=null?24:52}"/>`:'';
  area.classList.add('detail-open');
  renderDetail(place);renderCatalogue();closeExplorer();
  if(focus)focusPlace(place);
  if(hash)updateHash();
  status(`${place.name}. ${placementOf(place)}. ${place.lede}`);
}

function closeDetail() {
  const previous=state.selected;
  state.selected=null;$('#detail').hidden=true;area.classList.remove('detail-open');
  $('#selectionLayer').innerHTML='';
  markerElements.forEach(button=>{button.classList.remove('selected');button.setAttribute('aria-pressed','false');});
  renderCatalogue();updateHash();
  const anchor=anchorOf(byId.get(previous));
  if(anchor && !markerElements.get(anchor.id).hidden)markerElements.get(anchor.id).focus({preventScroll:true});
  else viewport.focus({preventScroll:true});
}

function updateHash() {
  const params=new URLSearchParams();
  if(state.selected)params.set('place',state.selected);
  // Spoiler consent is intentionally never inherited from a shared URL.
  if(state.chart)params.set('view','chart');
  history.replaceState(null,'',`${location.pathname}${params.size?'#'+params:''}`);
}

function renderConnections() {
  const paths=[];
  if(state.roads) {
    const routes=[['basin','aurelion','caelmarch','solkar'],['aurelion','oakhaven','serpent','caelmarch']];
    for(const route of routes){const d=route.map((id,i)=>`${i?'L':'M'}${byId.get(id).x},${byId.get(id).y}`).join(' ');paths.push(`<path class="connection-halo" d="${d}"/><path class="connection" d="${d}"/>`);}
  }
  if(state.journey) {
    const journey=journeys.find(j=>j.id===state.journey);
    const anchors=journey.stops.slice(0,state.step+1).map(stop=>anchorOf(byId.get(stop.id))).filter(Boolean);
    const distinct=anchors.filter((point,index)=>!index || point.id!==anchors[index-1].id);
    if(distinct.length>1)paths.push(`<path class="journey-line" d="${distinct.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ')}"/>`);
  }
  $('#routeLayer').innerHTML=paths.join('');
}

function setTab(tab) {
  state.tab=tab;
  for(const [id,name] of [['placesTab','places'],['journeysTab','journeys']]){const selected=tab===name;$('#'+id).setAttribute('aria-selected',String(selected));$('#'+id).tabIndex=selected?0:-1;}
  renderCatalogue();
}

function startJourney(id) {
  const journey=journeys.find(item=>item.id===id);
  if(!journey)return;
  if(journey.spoilers && !state.spoilers){$('#spoilers').focus();status('Enable Book One spoilers using the switch before beginning this journey.');return;}
  state.journey=id;state.step=0;area.classList.add('tour-active');$('#tourBar').hidden=false;
  state.lightPanel=false;syncLight();
  showStop();
}

function showStop() {
  const journey=journeys.find(item=>item.id===state.journey), stop=journey.stops[state.step];
  selectPlace(stop.id);
  $('#tourProgress').textContent=`${String(state.step+1).padStart(2,'0')} / ${journey.stops.length} · ${journey.spoilers?'BOOK ONE':'THE KNOWN RING'}`;
  $('#tourStop').textContent=stop.caption;
  $('#tourPrev').disabled=state.step===0;
  $('#tourNext').textContent=state.step===journey.stops.length-1?'✓':'→';
  $('#tourNext').setAttribute('aria-label',state.step===journey.stops.length-1?'Finish journey':'Next journey stop');
  renderConnections();
}

function endJourney() {state.journey=null;$('#tourBar').hidden=true;area.classList.remove('tour-active');renderConnections();}
function closeExplorer(){$('#explorer').classList.remove('is-open');$('#mobileExplore').setAttribute('aria-expanded','false');if(isMobile())$('#explorer').inert=true;}

function syncLight(){
  $('#lightLayer').toggleAttribute('hidden',state.chart);$('#lightControl').hidden=!state.lightPanel;
  $('#lightToggle').classList.toggle('active',state.lightPanel);$('#lightToggle').setAttribute('aria-pressed',String(state.lightPanel));$('#lightToggle').setAttribute('aria-expanded',String(state.lightPanel));
  $('#lightPlay').textContent=state.playing?'Pause':'Play';$('#lightPlay').setAttribute('aria-label',state.playing?'Pause sunlight':'Animate sunlight');$('#lightPlay').setAttribute('aria-pressed',String(state.playing));
  $('#rotationToggle').textContent=state.playing&&!state.chart?'Ⅱ':'▶';$('#rotationToggle').setAttribute('aria-label',state.playing?'Pause world rotation':'Play world rotation');$('#rotationToggle').setAttribute('aria-pressed',String(state.playing&&!state.chart));$('#rotationToggle').disabled=state.chart;
  $('#lightPlay').disabled=state.chart;
  $('#orbitMode').textContent=state.chart?'ORIGINAL CHART · STILL':state.playing?'40° FOCUS · CLOCKWISE':'40° FOCUS · PAUSED';
  cancelAnimationFrame(lightFrame);
  if(state.playing && !state.chart){lastLightTime=0;lightFrame=requestAnimationFrame(animateLight);}
  paintLight();
}
function paintLight(){
  $('#lightPhase').value=String(Math.round(state.phase));$('#phaseValue').textContent=`${Math.round(state.phase)}°`;
  const dawn=currentDawn();$('#dawnLocation').textContent=state.chart?'The source illustration':`${dawn.distance<=20?'Dawn over':'Light approaching'} ${dawn.place.name.replace(/^The /,'').replace('?','?')}`;
  for(const [id,button] of markerElements)button.classList.toggle('in-light',!state.chart&&id===dawn.place.id&&dawn.distance<=20);
  paint();
}
function animateLight(now){if(!state.playing || state.chart)return;if(lastLightTime)state.phase=(state.phase+Math.min(now-lastLightTime,100)*.001)%360;lastLightTime=now;paintLight();lightFrame=requestAnimationFrame(animateLight);}

$('#catalog').addEventListener('click',event=>{const place=event.target.closest('[data-place]'),journey=event.target.closest('[data-journey]');if(place)selectPlace(place.dataset.place);if(journey)startJourney(journey.dataset.journey);});
$('#detail').addEventListener('click',async event=>{
  if(event.target.closest('.detail-close')){closeDetail();return;}
  const place=event.target.closest('[data-place]');if(place){selectPlace(place.dataset.place);return;}
  const action=event.target.closest('[data-action]');if(!action)return;
  if(action.dataset.action==='locate')focusPlace(byId.get(state.selected));
  if(action.dataset.action==='share'){
    try{await navigator.clipboard.writeText(location.href);action.textContent='Link copied ✓';status('Location link copied.');}catch{action.textContent='Copy the address above';status('Copy the current address to share this location.');}
  }
});
$('#search').addEventListener('input',()=>{if(state.tab!=='places')setTab('places');else renderCatalogue();});
$('#placesTab').addEventListener('click',()=>setTab('places'));$('#journeysTab').addEventListener('click',()=>setTab('journeys'));
$('.tabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();setTab(event.key==='Home'?'places':event.key==='End'?'journeys':state.tab==='places'?'journeys':'places');$(state.tab==='places'?'#placesTab':'#journeysTab').focus();});
$('#filters').addEventListener('click',event=>{const button=event.target.closest('[data-filter]');if(!button)return;state.filter=button.dataset.filter;$$('[data-filter]').forEach(b=>{const selected=b===button;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});renderCatalogue();});
$('#spoilers').addEventListener('change',()=>{
  state.spoilers=$('#spoilers').checked;
  if(!state.spoilers && state.journey==='book-one')endJourney();
  if(state.selected){const place=byId.get(state.selected);if(place.spoilerOnly && !state.spoilers)closeDetail();else renderDetail(place);}
  renderCatalogue();status(state.spoilers?'Book One spoilers revealed.':'Book One spoilers hidden.');
});
$('#startTour').addEventListener('click',()=>startJourney('ring'));
$('#tourPrev').addEventListener('click',()=>{if(state.step>0){state.step--;showStop();}});
$('#tourNext').addEventListener('click',()=>{const journey=journeys.find(j=>j.id===state.journey);if(state.step<journey.stops.length-1){state.step++;showStop();}else{endJourney();closeDetail();fitMap();status('Journey complete. Explore any place on the Ring.');}});
$('#tourClose').addEventListener('click',endJourney);

function setPresentation(chart){state.chart=chart;area.classList.toggle('original',chart);$('#chartButton').classList.toggle('active',chart);$('#reliefButton').classList.toggle('active',!chart);$('#chartButton').setAttribute('aria-pressed',String(chart));$('#reliefButton').setAttribute('aria-pressed',String(!chart));fitMap();syncLight();updateHash();}
$('#reliefButton').addEventListener('click',()=>setPresentation(false));$('#chartButton').addEventListener('click',()=>setPresentation(true));
$('#labelsToggle').addEventListener('click',()=>{state.labels=!state.labels;area.classList.toggle('labels-hidden',!state.labels);$('#labelsToggle').classList.toggle('active',state.labels);$('#labelsToggle').setAttribute('aria-pressed',String(state.labels));});
$('#regionsToggle').addEventListener('click',()=>{state.regions=!state.regions;$('#regionLayer').toggleAttribute('hidden',!state.regions);$('#regionsToggle').classList.toggle('active',state.regions);$('#regionsToggle').setAttribute('aria-pressed',String(state.regions));status('Region washes follow the illustrated landscape. They are not surveyed borders.');});
$('#roadsToggle').addEventListener('click',()=>{state.roads=!state.roads;$('#roadsToggle').classList.toggle('active',state.roads);$('#roadsToggle').setAttribute('aria-pressed',String(state.roads));renderConnections();if(state.roads)status('Schematic connections shown. These are reading guides, not measured roads.');});
$('#lightToggle').addEventListener('click',()=>{state.lightPanel=!state.lightPanel;syncLight();});
$('#lightPhase').addEventListener('input',()=>{state.phase=Number($('#lightPhase').value);state.playing=false;syncLight();paintLight();});
$('#lightPlay').addEventListener('click',()=>{state.playing=!state.playing;syncLight();});
$('#rotationToggle').addEventListener('click',()=>{state.playing=!state.playing;syncLight();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(lightFrame);else syncLight();});
$('#zoomIn').addEventListener('click',()=>zoomAt(1.25,viewport.clientWidth/2,viewport.clientHeight/2,true));$('#zoomOut').addEventListener('click',()=>zoomAt(.8,viewport.clientWidth/2,viewport.clientHeight/2,true));
$('#fitMap').addEventListener('click',()=>{fitMap();status('The Ring is centred.');});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{status('Fullscreen is unavailable in this browser.');}});
document.addEventListener('fullscreenchange',()=>{$('#fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');});
if(!document.fullscreenEnabled)$('#fullscreen').hidden=true;
$('#mobileExplore').addEventListener('click',()=>{const open=!$('#explorer').classList.contains('is-open');$('#explorer').classList.toggle('is-open',open);$('#mobileExplore').setAttribute('aria-expanded',String(open));$('#explorer').inert=!open&&isMobile();if(open)$('#search').focus();});
$('#notesButton').addEventListener('click',()=>$('#notesDialog').showModal());$('#closeNotes').addEventListener('click',()=>$('#notesDialog').close());
$('#notesDialog').addEventListener('click',event=>{if(event.target===$('#notesDialog')){const box=event.target.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)event.target.close();}});

// Pointer events implement drag and two-finger pinch without a third-party map SDK.
const pointers=new Map();let gesture=null;
function gestureState(){const points=[...pointers.values()];if(points.length>1){const [a,b]=points;return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)};}return points[0]?{...points[0],d:0}:null;}
viewport.addEventListener('pointerdown',event=>{cancelAnimationFrame(animation);zoomTarget=null;const captureTarget=event.target.closest('button')||viewport;captureTarget.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});gesture=gestureState();if(pointers.size===1)dragDistance=0;viewport.classList.add('dragging');});
viewport.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId))return;
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const next=gestureState();
  if(gesture){const dx=next.x-gesture.x,dy=next.y-gesture.y;dragDistance+=Math.abs(dx)+Math.abs(dy);state.x+=dx;state.y+=dy;
    if(next.d && gesture.d){const rect=viewport.getBoundingClientRect();zoomAt(next.d/gesture.d,next.x-rect.left,next.y-rect.top);}else paint();
  }gesture=next;
});
function pointerEnd(event){pointers.delete(event.pointerId);gesture=gestureState();if(!pointers.size){viewport.classList.remove('dragging');setTimeout(()=>{dragDistance=0;},0);}}
viewport.addEventListener('pointerup',pointerEnd);viewport.addEventListener('pointercancel',pointerEnd);viewport.addEventListener('lostpointercapture',pointerEnd);
viewport.addEventListener('wheel',event=>{event.preventDefault();const rect=viewport.getBoundingClientRect();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?viewport.clientHeight:1);zoomAt(Math.exp(-Math.max(-180,Math.min(180,delta))*.003),event.clientX-rect.left,event.clientY-rect.top,true);},{passive:false});
viewport.addEventListener('dblclick',event=>{if(event.target.closest('button'))return;event.preventDefault();const rect=viewport.getBoundingClientRect();zoomAt(1.5,event.clientX-rect.left,event.clientY-rect.top,true);});
viewport.addEventListener('keydown',event=>{
  if(event.target.closest('button'))return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();cancelAnimationFrame(animation);state.x+=event.key==='ArrowLeft'?65:event.key==='ArrowRight'?-65:0;state.y+=event.key==='ArrowUp'?65:event.key==='ArrowDown'?-65:0;paint();}
  if(['+','=','-','0'].includes(event.key)){event.preventDefault();if(event.key==='0')fitMap();else zoomAt(event.key==='-'?.8:1.25);}
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape' && !$('#notesDialog').open){if($('#explorer').classList.contains('is-open'))closeExplorer();else if(state.selected)closeDetail();else if(state.journey)endJourney();}
  if(event.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName) && !$('#notesDialog').open){event.preventDefault();if(isMobile()){$('#explorer').classList.add('is-open');$('#explorer').inert=false;$('#mobileExplore').setAttribute('aria-expanded','true');}$('#search').focus();}
});
new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{fitMap(false);if(state.selected)focusPlace(byId.get(state.selected),false);$('#explorer').inert=isMobile()&&!$('#explorer').classList.contains('is-open');},100);}).observe(viewport);

function loadHash(){const params=new URLSearchParams(location.hash.slice(1));state.chart=params.get('view')==='chart';area.classList.toggle('original',state.chart);$('#chartButton').classList.toggle('active',state.chart);$('#reliefButton').classList.toggle('active',!state.chart);$('#chartButton').setAttribute('aria-pressed',String(state.chart));$('#reliefButton').setAttribute('aria-pressed',String(!state.chart));fitMap(false);const id=params.get('place');if(byId.has(id) && !byId.get(id).spoilerOnly)selectPlace(id,{hash:false});syncLight();}
window.addEventListener('hashchange',loadHash);
makeMarkers();renderCatalogue();loadHash();
$('#explorer').inert=isMobile();
