const $=id=>document.getElementById(id);
const video=$('video'),canvas=$('world'),ctx=canvas.getContext('2d');
let stream=null,url=null,worker=null,report=null,running=false;

function status(t){$('status').textContent=t}
function resize(){const r=canvas.getBoundingClientRect(),d=devicePixelRatio||1;canvas.width=Math.max(1,r.width*d);canvas.height=Math.max(1,r.height*d);ctx.setTransform(d,0,0,d,0,0)}
function drawWorld(t=0){
  resize();const w=canvas.clientWidth,h=canvas.clientHeight;
  ctx.fillStyle='#05070b';ctx.fillRect(0,0,w,h);
  const n=report?Math.min(2400,Math.max(700,report.points)):1000,phase=t*((report?.motion||1)+.5);
  for(let i=0;i<n;i++){
    const a=i*2.399+phase*.12,r=25+(i%n)*(Math.min(w,h)*.45/n),z=.45+.55*Math.sin(a*2+phase);
    const x=w/2+Math.cos(a+phase)*r,y=h/2+Math.sin(a*1.31+phase*.7)*r*.55;
    ctx.globalAlpha=.18+.72*z;ctx.fillStyle=i%5===0?'#fbbf24':i%3===0?'#a78bfa':'#67e8f9';
    ctx.fillRect(x,y,1.5+2*z,1.5+2*z)
  }
  ctx.globalAlpha=1
}
function reportDone(r){
  report=r;
  $('stats').innerHTML=[['Muestras',r.samples],['Cambios',r.events],['Movimiento',r.motion.toFixed(2)],['Profundidad/estructura',r.edge.toFixed(2)],['Puntos 4D',r.points]]
    .map(x=>'<div class="stat"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');
  $('events').textContent='Campo 4D generado · '+r.samples+' instantes fusionados';
  drawWorld(video.currentTime||0)
}
async function startCamera(){
  try{
    if(stream)stream.getTracks().forEach(t=>t.stop());
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
    video.srcObject=stream;video.muted=true;await video.play();
    $('run').disabled=false;status('Cámara en vivo · lista para generar el mundo 4D');drawWorld()
  }catch(e){status('No se pudo acceder a la cámara: '+e.message)}
}
$('live').onclick=startCamera;

$('videoFile').onchange=async e=>{
  const f=e.target.files?.[0];if(!f)return;
  if(url)URL.revokeObjectURL(url);
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
  url=URL.createObjectURL(f);video.srcObject=null;video.src=url;video.load();
  try{
    await new Promise((resolve,reject)=>{
      const ok=()=>{cleanup();resolve()};
      const fail=()=>{cleanup();reject(new Error('El navegador no pudo decodificar este video.'))};
      const cleanup=()=>{video.removeEventListener('loadedmetadata',ok);video.removeEventListener('error',fail)};
      video.addEventListener('loadedmetadata',ok,{once:true});video.addEventListener('error',fail,{once:true});
    });
    $('run').disabled=false;$('time').max=Number.isFinite(video.duration)?video.duration:1;
    $('clock').textContent='0.0 / '+(Number.isFinite(video.duration)?video.duration.toFixed(1):'0.0')+' s';
    status('Video cargado · listo para analizar');drawWorld()
  }catch(err){$('run').disabled=true;status(err.message)}
};

function seekTo(t){
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{cleanup();reject(new Error('Tiempo de espera buscando el instante '+t.toFixed(2)+' s'))},5000);
    const done=()=>{cleanup();resolve()};
    const fail=()=>{cleanup();reject(new Error('No se pudo leer un fotograma del video'))};
    const cleanup=()=>{clearTimeout(timeout);video.removeEventListener('seeked',done);video.removeEventListener('error',fail)};
    video.addEventListener('seeked',done,{once:true});
    video.addEventListener('error',fail,{once:true});
    try{video.currentTime=Math.max(0,Math.min(t,Math.max(0,video.duration-0.001)))}catch(err){cleanup();reject(err)}
  })
}

async function captureVideoSamples(){
  const W=192,H=Math.max(108,Math.round(192*video.videoHeight/video.videoWidth));
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const x=c.getContext('2d',{willReadFrequently:true});
  const duration=Number.isFinite(video.duration)&&video.duration>0?video.duration:1;
  const frames=Math.min(90,Math.max(24,Math.ceil(duration*3)));
  const samples=[],times=[];
  if(video.readyState<2)await new Promise(r=>video.addEventListener('loadeddata',r,{once:true}));
  for(let i=0;i<frames;i++){
    const t=duration*i/Math.max(1,frames-1);
    status('Capturando '+(i+1)+'/'+frames+' instantes…');
    await seekTo(t);
    x.drawImage(video,0,0,W,H);
    samples.push(x.getImageData(0,0,W,H).data.buffer);times.push(t)
  }
  return {samples,times,width:W,height:H,duration}
}

async function captureLiveSamples(){
  const W=192,H=Math.max(108,Math.round(192*video.videoHeight/video.videoWidth));
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const x=c.getContext('2d',{willReadFrequently:true});
  const samples=[],times=[],started=performance.now(),captureMs=8000,interval=180;
  while(performance.now()-started<captureMs){
    x.drawImage(video,0,0,W,H);samples.push(x.getImageData(0,0,W,H).data.buffer);
    times.push((performance.now()-started)/1000);status('Capturando ao vivo · '+times.at(-1).toFixed(1)+' / 8.0 s');
    await new Promise(r=>setTimeout(r,interval))
  }
  return {samples,times,width:W,height:H,duration:Math.max(.1,times.at(-1)||.1)}
}

$('run').onclick=async()=>{
  if(running||!video.videoWidth){status('Primero cargá un video o activá la cámara.');return}
  running=true;$('run').disabled=true;report=null;
  try{
    status('Preparando captura 4D…');
    worker?.terminate();worker=new Worker('./imagen4d_worker.js');
    worker.onmessage=e=>{
      if(e.data.type==='progress')status('Fusionando '+e.data.i+'/'+e.data.total+' instantes…');
      if(e.data.type==='done'){reportDone(e.data.report);status('Mundo 4D generado · listo para explorar')}
      if(e.data.type==='error')status('Error del motor 4D: '+e.data.message)
    };
    const live=!!video.srcObject;
    const cap=live?await captureLiveSamples():await captureVideoSamples();
    const sensors=cap.samples.map((_,i)=>({t:cap.times[i],type:'camera-motion',available:true}));
    worker.postMessage({type:'analyze',frames:cap.samples,sensors,times:cap.times,width:cap.width,height:cap.height,duration:cap.duration},cap.samples);
  }catch(err){status('No se pudo generar el 4D: '+(err?.message||err))}
  finally{running=false;$('run').disabled=false}
};

$('play').onclick=()=>video.paused?video.play():video.pause();
video.ontimeupdate=()=>{
  if(Number.isFinite(video.duration)&&video.duration>0){
    $('time').value=video.currentTime;$('clock').textContent=video.currentTime.toFixed(1)+' / '+video.duration.toFixed(1)+' s'
  }
  drawWorld(video.currentTime||0)
};
$('time').oninput=e=>{if(!video.srcObject)video.currentTime=+e.target.value;drawWorld(+e.target.value)};
window.onresize=()=>drawWorld(video.currentTime||0);