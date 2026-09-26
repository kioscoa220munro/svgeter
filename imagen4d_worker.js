self.onmessage=e=>{
  if(e.data.type!=='analyze')return;
  try{
    const{frames,width,height,duration,times=[]}=e.data;
    if(!frames?.length||!width||!height)throw new Error('No hay fotogramas para analizar.');
    const N=width*height;
    let prev=null,totalMotion=0,totalEdge=0;
    const timeline=[];
    const positions=[],colors=[],pointTimes=[];
    const stride=Math.max(3,Math.floor(Math.sqrt(N/2400)));
    const maxPerFrame=2600;
    const centerX=(width-1)/2,centerY=(height-1)/2;
    let camX=0,camY=0,camScale=1;
    function grayOf(buf){
      const a=new Uint8ClampedArray(buf),g=new Float32Array(N);
      for(let q=0;q<N;q++){const p=q*4;g[q]=.2126*a[p]+.7152*a[p+1]+.0722*a[p+2]}
      return g;
    }
    function estimateShift(g,p){
      const step=8,range=10;
      let best=Infinity,bx=0,by=0;
      for(let dy=-range;dy<=range;dy+=2)for(let dx=-range;dx<=range;dx+=2){
        let err=0,c=0;
        for(let y=range+step;y<height-range-step;y+=step)
          for(let x=range+step;x<width-range-step;x+=step){
            const q=y*width+x,q2=(y+dy)*width+(x+dx),d=g[q]-p[q2];err+=d*d;c++;
          }
        if(c&&err/c<best){best=err/c;bx=dx;by=dy}
      }
      return{dx:bx,dy:by};
    }
    for(let i=0;i<frames.length;i++){
      const a=new Uint8ClampedArray(frames[i]),gray=grayOf(frames[i]);
      let edge=0,motion=0;
      for(let y=1;y<height;y++)for(let x=1;x<width;x++){const q=y*width+x;edge+=Math.abs(gray[q]-gray[q-1])+Math.abs(gray[q]-gray[q-width]);}
      edge/=N*2;
      if(prev){
        for(let q=0;q<N;q+=2)motion+=Math.abs(gray[q]-prev[q]);
        motion/=Math.ceil(N/2)/255;
        const s=estimateShift(gray,prev);camX+=s.dx/width*0.22;camY-=s.dy/height*0.22;
        camScale*=1+Math.max(-.012,Math.min(.012,(Math.abs(s.dx)+Math.abs(s.dy))/width*.004));
      }
      totalMotion+=motion;totalEdge+=edge;
      const t=Number.isFinite(times[i])?times[i]:duration*i/Math.max(1,frames.length-1);
      if(motion>9)timeline.push({t,type:motion>22?'CAMBIO FUERTE':'CAMBIO',score:motion});
      let count=0;
      for(let y=1;y<height-1;y+=stride)for(let x=1;x<width-1;x+=stride){
        if(count++>=maxPerFrame)break;
        const q=y*width+x,p=q*4,lum=gray[q]/255;
        const gx=(gray[q]-gray[q-1])/255,gy=(gray[q]-gray[q-width])/255;
        const grad=Math.min(1,Math.hypot(gx,gy)*3.2),radial=Math.hypot((x-centerX)/width,(y-centerY)/height);
        const z=0.55+(1-radial)*0.9+grad*0.65;
        const nx=(x-centerX)/width*3.0,ny=(centerY-y)/height*2.2;
        if(grad<0.025&&((x+y+i)%5))continue;
        positions.push((nx+camX)*camScale,(ny+camY)*camScale,z);
        colors.push(a[p]/255,a[p+1]/255,a[p+2]/255);pointTimes.push(t);
      }
      prev=gray;
      if(i%2===0||i===frames.length-1)self.postMessage({type:'progress',i:i+1,total:frames.length});
    }
    self.postMessage({type:'done',report:{samples:frames.length,events:timeline.length,motion:totalMotion/frames.length,edge:totalEdge/frames.length,points:positions.length,positions,colors,times:pointTimes,timeline}});
  }catch(err){self.postMessage({type:'error',message:err?.message||String(err)})}
};