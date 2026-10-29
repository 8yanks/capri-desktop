// Temporary rig for the current base artwork. New DA will need its own reviewed joint metadata.
const cache=new WeakMap();
export function limbAngles(kind,elapsed,duration){
 const envelope=Math.max(0,Math.min(1,elapsed/200,(duration-elapsed)/200));
 if(kind==='wave')return [.3*Math.sin(elapsed*Math.PI*2/650)*envelope];
 const phase=Math.sin(elapsed*Math.PI*2/1600)*envelope;
 return [.22*phase,-.18*phase];
}
export function prepareLimbs(frame,kind){
 let stored=cache.get(frame.image);if(!stored){stored={};cache.set(frame.image,stored);}if(stored[kind])return stored[kind];
 const {w}=frame.face,cx=frame.head.x,cy=frame.head.y,seated=frame.support==='hip';
 const joints=kind==='wave'?[{x:cx-w*(seated?2.45:2.9),y:cy+frame.face.h*(seated?1.8:1.7)}]
  :[{x:cx-1.57*w,y:cy+3.1*w},{x:cx-.48*w,y:cy+3.2*w}];
 const make=()=>{const c=document.createElement('canvas');c.width=frame.image.width;c.height=frame.image.height;return c;};
 const body=make(),ctx=body.getContext('2d');ctx.drawImage(frame.image,0,0);
 const parts=joints.map((pivot,i)=>{
  const rect=kind==='wave'?{x:pivot.x-.95*w,y:pivot.y-1.4*w,w:1.2*w,h:1.65*w}
   :{x:pivot.x-(i ? .37 : .85)*w,y:pivot.y-.22*w,w:(i?1.42:1.3)*w,h:frame.image.height-pivot.y+.22*w+4};
  const part=make(),g=part.getContext('2d');g.save();g.beginPath();g.rect(rect.x,rect.y,rect.w,rect.h);g.clip();g.drawImage(frame.image,0,0);g.restore();
  if(kind==='wave'){const pixels=g.getImageData(0,0,part.width,part.height);for(let k=0;k<pixels.data.length;k+=4){const r=pixels.data[k],green=pixels.data[k+1];if(r>130&&r>green*1.7)pixels.data[k+3]=0;}g.putImageData(pixels,0,0);}
  ctx.save();ctx.globalCompositeOperation='destination-out';ctx.drawImage(part,0,0);ctx.restore();return {image:part,pivot};
 });
 return stored[kind]={body,parts};
}
