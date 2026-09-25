self.onmessage=e=>{
  if(e.data.type!=='analyze')return;
  try{
    const{frames,width,height,duration,sensors=[],times=[]}=e.data;
    if(!frames?.length||!width||!height)throw new Error('No hay fotogramas para analizar.');
    let prev=null,totalMotion=0,totalEdge=0;const timeline=[];
    for(let i=0;i<frames.length;i++){
      const a=new Uint8ClampedArray(frames[i]),g=new Float32Array(width*height);
      let edge=0,motion=0;
      for(let p=0,q=0;p<a.length;p+=4,q++){
        const v=.2126*a[p]+.7152*a[p+1]+.0722*a[p+2];
        g[q]=v;if(q%width>0)edge+=Math.abs(v-g[q-1])
      }
      edge/=g.length;
      if(prev){
        for(let q=0;q<g.length;q+=2)motion+=Math.abs(g[q]-prev[q]);
        motion/=Math.ceil(g.length/2)/255
      }
      totalMotion+=motion;totalEdge+=edge;
      const t=Number.isFinite(times[i])?times[i]:duration*i/Math.max(1,frames.length-1);
      if(motion>9)timeline.push({t,type:motion>22?'CAMBIO FUERTE':'CAMBIO',score:motion});
      prev=g;
      if(i%3===0||i===frames.length-1)self.postMessage({type:'progress',i:i+1,total:frames.length})
    }
    const avgRssi=sensors.length?sensors.reduce((a,s)=>a+(Number.isFinite(+s.rssi)?+s.rssi:-70),0)/sensors.length:-70;
    const avgMotion=totalMotion/frames.length,avgEdge=totalEdge/frames.length;
    self.postMessage({type:'done',report:{
      samples:frames.length,events:timeline.length,motion:avgMotion,edge:avgEdge,
      baseScore:Math.max(0,100-avgMotion),points:Math.round(600+avgEdge*12+Math.abs(avgRssi)*8),
      sensorSources:sensors.length,timeline
    }})
  }catch(err){self.postMessage({type:'error',message:err?.message||String(err)})}
};