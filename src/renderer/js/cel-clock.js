// Exposure sheets use absolute frame numbers: RAF jitter must not turn 24 Hz into 20 Hz.
export const celRate=actor=>actor.mode==='sleep'?6:actor.busy||actor.stance==='fall'||actor.act?.player?.act?.fps===24?24:12;
export const celNumber=(time,rate=12)=>Math.floor(Math.max(0,time)*rate/1000);
export const celTime=(time,rate=12)=>celNumber(time,rate)*1000/rate;

// Four complete raster exposures, not separately moving image cut-outs. Cache is bounded
// by the caller. Face overlays are drawn afterwards, so the approved eyes stay crisp.
export function boilCels(image){
  return Array.from({length:4},(_,phase)=>{
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(image,0,0);
    const data=ctx.getImageData(0,0,canvas.width,canvas.height),p=data.data;
    for(let k=0;k<p.length;k+=4){
      if(p[k+3]<160||p[k]<120||p[k]<p[k+1]*1.8||p[k+2]>p[k]*.75)continue;
      const hash=Math.imul(k/4+1,1103515245)>>>0;
      if((hash+phase*47)%151<3){p[k]=255;p[k+1]=170+phase*18;p[k+2]=215+phase*10;}
    }
    ctx.putImageData(data,0,0);return canvas;
  });
}
