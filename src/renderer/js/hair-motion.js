// Three very small delayed hair motions; face and torso pixels remain in the stationary layer.
const cache=new WeakMap();
export function hairState(now){return [0,1,2].map(i=>({angle:[.016,.006,-.013][i]*Math.sin(now/[1450,1900,1650][i]+i*1.1),light:1+.035*Math.sin(now/850+i*1.7)}));}
export function prepareHair(frame,image=frame.image){
 if(cache.has(image))return cache.get(image);
 const make=()=>{const c=document.createElement('canvas');c.width=image.width;c.height=image.height;return c;};
 const body=make(),ctx=body.getContext('2d');ctx.drawImage(image,0,0);
 const data=ctx.getImageData(0,0,body.width,body.height),parts=[make(),make(),make()],buffers=parts.map(c=>c.getContext('2d').createImageData(c.width,c.height));
 const f=frame.face,cx=f.center.x,cy=f.center.y;
 for(let y=0;y<body.height;y++)for(let x=0;x<body.width;x++){
  const k=(y*body.width+x)*4,r=data.data[k],g=data.data[k+1],b=data.data[k+2],a=data.data[k+3];if(a<40)continue;
  const outside=x<f.x-f.w*.15||x>f.x+f.w*1.15;
  if(!(y<f.y-f.h*.1||outside&&y<f.y+f.w*2.1))continue;
  if(!((r>135&&r>g*1.55)||(r>210&&g>210&&b>180)||(b>135&&r>80&&g<150)))continue;
  const group=x<cx-f.w*.45?0:x>cx+f.w*.45?2:1;
  for(let j=0;j<4;j++)buffers[group].data[k+j]=data.data[k+j];data.data[k+3]=0;
 }
 ctx.putImageData(data,0,0);
 parts.forEach((c,i)=>c.getContext('2d').putImageData(buffers[i],0,0));
 const result={body,parts:parts.map((image,i)=>({image,pivot:{x:cx+[-.3,0,.4][i]*f.w,y:cy-[.8,1,.6][i]*f.w}}))};cache.set(image,result);return result;
}
