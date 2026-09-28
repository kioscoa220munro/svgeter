import * as cocoSsd from "https://esm.sh/@tensorflow-models/coco-ssd@2.2.3";
import * as faceDetection from "https://esm.sh/@tensorflow-models/face-detection@1.0.3";
import { createWorker } from "https://esm.sh/tesseract.js@6.0.1";

export async function createVision(){
  const [objects,faces,ocr]=await Promise.all([
    cocoSsd.load({base:"lite_mobilenet_v2"}),
    faceDetection.createDetector(faceDetection.SupportedModels.MediaPipeFaceDetector,{runtime:"tfjs",maxFaces:20,modelType:"short"}),
    createWorker("spa+eng",1)
  ]);
  await ocr.setParameters({tessedit_pageseg_mode:"11"});
  return {objects,faces,ocr};
}
export async function analyzeFrame(c,engine,state){
  const detections=await engine.objects.detect(c,20,.35);
  const tracked=track(detections,state);
  const faceResult=await engine.faces.estimateFaces(c,{flipHorizontal:false});
  const faces=(faceResult||[]).map((f,i)=>({id:i,bbox:[f.box.xMin,f.box.yMin,f.box.width,f.box.height],conf:f.score??1}));
  const ret=await engine.ocr.recognize(c,{rectangle:{left:0,top:0,width:c.width,height:c.height}},{blocks:true});
  const text=(ret.data.blocks||[]).map(b=>({text:String(b.text||"").trim(),bbox:b.bbox||null,conf:(b.confidence||0)/100})).filter(x=>x.text);
  const plates=text.filter(x=>plateCandidate(x.text)).map(x=>({...x,kind:"plate_candidate"}));
  return {objects:tracked,faces,text,plates};
}
export function track(detections,state){const out=[];for(const d of detections){let best=null,bestIoU=.25;for(const t of state.tracks.values()){if(t.label!==d.class)continue;const a=t.box,b=d.bbox,ax=Math.max(a[0],b[0]),ay=Math.max(a[1],b[1]),bx=Math.min(a[0]+a[2],b[0]+b[2]),by=Math.min(a[1]+a[3],b[1]+b[3]),i=Math.max(0,bx-ax)*Math.max(0,by-ay),u=a[2]*a[3]+b[2]*b[3]-i,q=i/(u||1);if(q>bestIoU){bestIoU=q;best=t}}if(!best){best={id:state.next++,label:d.class,box:d.bbox,age:0};state.tracks.set(best.id,best)}best.box=d.bbox;best.age=0;out.push({trackId:best.id,label:d.class,score:d.score,bbox:d.bbox})}for(const t of state.tracks.values())t.age++;for(const [id,t] of state.tracks)if(t.age>8)state.tracks.delete(id);return out}
export function plateCandidate(s){const x=String(s).toUpperCase().replace(/[^A-Z0-9]/g,"");return /^[A-Z]{2,3}[0-9]{3}$/.test(x)||/^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(x)}
