import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const $=id=>document.getElementById(id);
const video=$('video'),canvas=$('world');
let stream=null,url=null,worker=null,report=null,running=false;
let renderer,scene,camera,controls,points,pointGeometry,pointMaterial,clock3d;

function status(t){$('status').textContent=t}
function init3D(){
  if(renderer)return;
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.setClearColor(0x03070d,1);
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(58,1,.01,200);
  camera.position.set(0,0,3.2);
  controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;controls.dampingFactor=.07;
  controls.minDistance=.25;controls.maxDistance=30;
  controls.target.set(0,0,0);
  const axes=new THREE.AxesHelper(.7);axes.visible=false;scene.add(axes);
  clock3d=new THREE.Clock();
  resize3D();
  animate();
}
function resize3D(){
  if(!renderer)return;
  const r=canvas.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
function animate(){
  requestAnimationFrame(animate);
  controls?.update();
  if(points&&pointMaterial?.uniforms){
    const t=video.currentTime||0;
    pointMaterial.uniforms.uTime.value=t;
    pointMaterial.uniforms.uWindow.value=Math.max(.45,(report?.duration||video.duration||1)*.12);
  }
  renderer?.render(scene,camera);
}
function clearWorld(){
  if(points){scene.remove(points);pointGeometry.dispose();pointMaterial.dispose();points=null}
}
function buildWorld(r){
  init3D();clearWorld();
  const pos=new Float32Array(r.positions),col=new Float32Array(r.colors),times=new Float32Array(r.times);
  pointGeometry=new THREE.BufferGeometry();
  pointGeometry.setAttribute('position',new THREE.BufferAttribute(pos,3));
  pointGeometry.setAttribute('color',new THREE.BufferAttribute(col,3));
  pointGeometry.setAttribute('aTime',new THREE.BufferAttribute(times,1));
  pointGeometry.computeBoundingSphere();
  pointMaterial=new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uWindow:{value:1}},
  vertexColors:true,transparent:true,depthWrite:false,
  vertexShader:`attribute float aTime; varying vec3 vColor; varying float vTime; void main(){vColor=color;vTime=aTime;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=max(1.5,18.0/-mv.z);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform float uTime; uniform float uWindow; varying vec3 vColor; varying float vTime; void main(){float d=abs(vTime-uTime);float fade=1.0-smoothstep(uWindow,uWindow*1.8,d);if(fade<.02)discard;vec2 p=gl_PointCoord-.5;if(dot(p,p)>.25)discard;gl_FragColor=vec4(vColor,fade);}`
});
  points=new THREE.Points(pointGeometry,pointMaterial);
  scene.add(points);
  const box=new THREE.Box3().setFromBufferAttribute(pointGeometry.getAttribute('position'));
  const center=box.getCenter(new THREE.Vector3());const size=box.getSize(new THREE.Vector3());
  points.position.sub(center);
  const max=Math.max(size.x,size.y,size.z)||1;
  points.scale.setScalar(2.2/max);
  controls.target.set(0,0,0);camera.position.set(0,0,3.2);controls.update();
}
function reportDone(r){
  report=r;report.duration=Number(video.duration)||r.duration||1;
  $('stats').innerHTML=[['Fotogramas',r.samples],['Cambios',r.events],['Movimiento',r.motion.toFixed(2)],['Estructura',r.edge.toFixed(2)],['Puntos 3D',Math.round(r.points/3)]]
    .map(x=>'<div class="stat"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');
  $('events').textContent='Mundo espacial generado · '+r.samples+' instantes · usá un dedo/ratón para orbitar, pellizcá/rueda para zoom.';
  buildWorld(r);
}
async function startCamera(){
  try{
    init3D();
    if(stream)stream.getTracks().forEach(t=>t.stop());
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
    video.srcObject=stream;video.muted=true;await video.play();
    $('run').disabled=false;status('Cámara lista · generaremos un espacio 3D temporal de 8 s');
  }catch(e){status('No se pudo acceder a la cámara: '+e.message)}
}
$('live').onclick=startCamera;

$('videoFile').onchange=async e=>{
  const f=e.target.files?.[0];if(!f)return;
  init3D();if(url)URL.revokeObjectURL(url);
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
  url=URL.createObjectURL(f);video.srcObject=null;video.src=url;video.load();
  try{
    await new Promise((resolve,reject)=>{
      const ok=()=>{cleanup();resolve()};const fail=()=>{cleanup();reject(new Error('El navegador no pudo decodificar este video.'))};
      const cleanup=()=>{video.removeEventListener('loadedmetadata',ok);video.removeEventListener('error',fail)};
      video.addEventListener('loadedmetadata',ok,{once:true});video.addEventListener('error',fail,{once:true});
    });
    $('run').disabled=false;$('time').max=Number.isFinite(video.duration)?video.duration:1;
    $('clock').textContent='0.0 / '+(Number.isFinite(video.duration)?video.duration.toFixed(1):'0.0')+' s';
    status('Video cargado · listo para reconstruir el espacio');
  }catch(err){$('run').disabled=true;status(err.message)}
};

function seekTo(t){
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{cleanup();reject(new Error('Tiempo de espera buscando '+t.toFixed(2)+' s'))},5000);
    const done=()=>{cleanup();resolve()};const fail=()=>{cleanup();reject(new Error('No se pudo leer un fotograma'))};
    const cleanup=()=>{clearTimeout(timeout);video.removeEventListener('seeked',done);video.removeEventListener('error',fail)};
    video.addEventListener('seeked',done,{once:true});video.addEventListener('error',fail,{once:true});
    try{video.currentTime=Math.max(0,Math.min(t,Math.max(0,video.duration-.001)))}catch(err){cleanup();reject(err)}
  })
}
async function captureVideoSamples(){
  const W=160,H=Math.max(90,Math.round(160*video.videoHeight/video.videoWidth)),c=document.createElement('canvas');c.width=W;c.height=H;
  const x=c.getContext('2d',{willReadFrequently:true}),duration=Number.isFinite(video.duration)&&video.duration>0?video.duration:1;
  const frames=Math.min(72,Math.max(24,Math.ceil(duration*2.5))),samples=[],times=[];
  if(video.readyState<2)await new Promise(r=>video.addEventListener('loadeddata',r,{once:true}));
  for(let i=0;i<frames;i++){const t=duration*i/Math.max(1,frames-1);status('Leyendo '+(i+1)+'/'+frames+' vistas…');await seekTo(t);x.drawImage(video,0,0,W,H);samples.push(x.getImageData(0,0,W,H).data.buffer);times.push(t)}
  return{samples,times,width:W,height:H,duration}
}
async function captureLiveSamples(){
  const W=160,H=Math.max(90,Math.round(160*video.videoHeight/video.videoWidth)),c=document.createElement('canvas');c.width=W;c.height=H;
  const x=c.getContext('2d',{willReadFrequently:true}),samples=[],times=[],started=performance.now(),captureMs=8000,interval=220;
  while(performance.now()-started<captureMs){x.drawImage(video,0,0,W,H);samples.push(x.getImageData(0,0,W,H).data.buffer);times.push((performance.now()-started)/1000);status('Capturando · '+times.at(-1).toFixed(1)+' / 8.0 s');await new Promise(r=>setTimeout(r,interval))}
  return{samples,times,width:W,height:H,duration:Math.max(.1,times.at(-1)||.1)}
}
$('run').onclick=async()=>{
  if(running||!video.videoWidth){status('Primero cargá un video o activá la cámara.');return}
  running=true;$('run').disabled=true;report=null;
  try{
    status('Construyendo geometría 3D…');worker?.terminate();worker=new Worker('./imagen4d_worker.js');
    worker.onmessage=e=>{
      if(e.data.type==='progress')status('Reconstruyendo '+e.data.i+'/'+e.data.total+' vistas…');
      if(e.data.type==='done'){reportDone(e.data.report);status('Mundo 4D generado · podés moverte dentro del espacio')}
      if(e.data.type==='error')status('Error del motor 4D: '+e.data.message)
    };
    const cap=video.srcObject?await captureLiveSamples():await captureVideoSamples();
    const sensors=cap.samples.map((_,i)=>({t:cap.times[i],type:'camera-motion',available:true}));
    worker.postMessage({type:'analyze',frames:cap.samples,sensors,times:cap.times,width:cap.width,height:cap.height,duration:cap.duration},cap.samples);
  }catch(err){status('No se pudo generar el 4D: '+(err?.message||err))}
  finally{running=false;$('run').disabled=false}
};
$('play').onclick=()=>video.paused?video.play():video.pause();
video.ontimeupdate=()=>{if(Number.isFinite(video.duration)&&video.duration>0){$('time').value=video.currentTime;$('clock').textContent=video.currentTime.toFixed(1)+' / '+video.duration.toFixed(1)+' s'}};
$('time').oninput=e=>{const t=+e.target.value;if(!video.srcObject)video.currentTime=t;if(pointMaterial?.uniforms)pointMaterial.uniforms.uTime.value=t;};
window.onresize=resize3D;
init3D();
