self.onmessage=e=>{
  if(e.data.type!=='analyze')return;
  try{
    const{frames,width,height,duration,times=[]}=e.data;
    if(!frames?.length||!width||!height)throw new Error('No hay fotogramas para analizar.');
    let prev=null,totalMotion=0,totalEdge=0;const timeline=[];
    const positions=[],colors=[],pointTimes=[];
    const stride=Math.max(3,Math.floor(Math.sqrt((width*height)/1800)));
    const maxPerFrame=2200;
    for(let i=0;i<frames.length;i++){
      const a=new Uint8ClampedArray(frames[i]),gray=new Float32Array(width*height);
      let edge=0,motion=0;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const q=y*width+x,p=q*4,v=.2126*a[p]+.7152*a[p+1]+.0722*a[p+2];gray[q]=v;
        if(x>0)edge+=Math.abs(v-gray[q-1]);
      }
      edge/=gray.length;
      if(prev){for(let q=0;q<gray.length;q+=2)motion+=Math.abs(gray[q]-prev[q]);motion/=Math.ceil(gray.length/2)/255}
      totalMotion+=motion;totalEdge+=edge;
      const t=Number.isFinite(times[i])?times[i]:duration*i/Math.max(1,frames.length-1);
      if(motion>9)timeline.push({t,type:motion>22?'CAMBIO FUERTE':'CAMBIO',score:motion});
      const scale=Math.max(.18,1.0-(i/(frames.length||1))*.12);
      let count=0;
      for(let y=0;y<height;y+=stride)for(let x=0;x<width;x+=stride){
        if(count++>=maxPerFrame)break;
        const q=y*width+x,p=q*4;
        const lum=gray[q]/255;
        const left=gray[q-(x>0?1:0)],up=gray[q-(y>0?width:0)];
        const gx=(gray[q]-left)/255,gy=(gray[q]-up)/255;
        const depth=.12+lum*.9+(Math.abs(gx)+Math.abs(gy))*.35;
        const nx=(x/(width-1))-.5,ny=.5-(y/(height-1));
        const temporal=(t/(Math.max(duration,.001))-.5)*.7;
        positions.push(nx*2.2*scale,ny*2.2*scale,depth*1.7+temporal);
        colors.push(a[p]/255,a[p+1]/255,a[p+2]/255);
        pointTimes.push(t);
      }
      prev=gray;
      if(i%2===0||i===frames.length-1)self.postMessage({type:'progress',i:i+1,total:frames.length});
    }
    const avgMotion=totalMotion/frames.length,avgEdge=totalEdge/frames.length;
    self.postMessage({type:'done',report:{
      samples:frames.length,events:timeline.length,motion:avgMotion,edge:avgEdge,
      points:positions.length,positions,colors,times:pointTimes,timeline
    }});
  }catch(err){self.postMessage({type:'error',message:err?.message||String(err)})}
};