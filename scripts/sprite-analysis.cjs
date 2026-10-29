'use strict';
// Read-only asset landmarks. This locates the green mask; it does not certify character likeness.
function faceLandmark(pixels,width,height,{lying=false}={}){
  const green=new Uint8Array(width*height),blue=new Uint8Array(width*height),seen=new Uint8Array(width*height);
  const queue=new Int32Array(width*height),groups=[];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=y*width+x,i=p*4,a=pixels[i+3];if(a<96)continue;
    const r=Math.min(255,pixels[i+2]*255/a),g=Math.min(255,pixels[i+1]*255/a),b=Math.min(255,pixels[i]*255/a);
    // Reclining poses can put the head on either side of the sheet.
    if(g>100&&g>r*1.45&&g>b*1.15&&(lying||y<height*.65))green[p]=1;
    if(b>120&&b>r*1.5&&g>50&&g<220)blue[p]=1;
  }
  for(let start=0;start<green.length;start++){
    if(!green[start]||seen[start])continue;
    let head=0,tail=1,x0=width,y0=height,x1=0,y1=0;queue[0]=start;seen[start]=1;
    while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);
      x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
      for(const n of [x?p-1:-1,x<width-1?p+1:-1,y?p-width:-1,y<height-1?p+width:-1])if(n>=0&&green[n]&&!seen[n]){seen[n]=1;queue[tail++]=n;}
    }
    // Tiny cyan/green clothing jewels must not beat a closed-eye mask.
    if(tail<25||x1-x0<7||y1-y0<5)continue;
    let optic=0;for(let y=Math.max(0,y0-2);y<=Math.min(height-1,y1+2);y++)for(let x=Math.max(0,x0-2);x<=Math.min(width-1,x1+2);x++)optic+=blue[y*width+x];
    const cx=(x0+x1)/2,cy=(y0+y1)/2;
    const dx=lying?Math.min(Math.abs(cx/width-.28),Math.abs(cx/width-.72)):Math.abs(cx/width-.52);
    const dist=Math.hypot(dx,cy/height-(lying?.5:.34));
    groups.push({x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,green:tail,blue:optic,score:(tail+(optic>=20?optic*4:0))/(1+30*dist)});
  }
  const best=groups.sort((a,b)=>b.score-a.score)[0];if(!best)return null;
  const nearby=groups.filter(g=>Math.abs(g.x+g.w/2-best.x-best.w/2)<Math.max(best.w*2.5,height*.08)
    &&Math.abs(g.y+g.h/2-best.y-best.h/2)<best.h*.65);
  const x=Math.min(...nearby.map(g=>g.x)),y=Math.min(...nearby.map(g=>g.y));
  const w=Math.max(...nearby.map(g=>g.x+g.w))-x,h=Math.max(...nearby.map(g=>g.y+g.h))-y;
  return {x,y,w,h,center:{x:x+w/2,y:y+h/2},green:nearby.reduce((n,g)=>n+g.green,0),blue:nearby.reduce((n,g)=>n+g.blue,0)};
}
function alphaBounds(pixels,width,height){
  let x0=width,y0=height,x1=-1,y1=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>=96){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  return x1<0?null:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};
}
function bodyComponents(pixels,w,h,count,columns){
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h),groups=[];
 for(let start=0;start<seen.length;start++){
  if(seen[start]||pixels[start*4+3]<96)continue;
  let head=0,tail=1,x0=w,y0=h,x1=0,y1=0;queue[0]=start;seen[start]=1;
  while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(const n of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(n>=0&&!seen[n]&&pixels[n*4+3]>=96){seen[n]=1;queue[tail++]=n;}
  }
  if(tail>1500)groups.push({x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,area:tail});
 }
 const sorted=groups.sort((a,b)=>b.area-a.area).slice(0,count).sort((a,b)=>a.y-b.y),ordered=[];
 for(let i=0;i<count;i+=columns)ordered.push(...sorted.slice(i,i+columns).sort((a,b)=>a.x-b.x));
 return ordered;
}
module.exports={faceLandmark,alphaBounds,bodyComponents};
