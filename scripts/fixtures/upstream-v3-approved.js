// Original pixels, one shared face coordinate system: no independently fitted eye stickers.
export const UPSTREAM_CONTEXTS=['idle','talk','curious','smug','laugh','sleep'];
export const UPSTREAM_SOURCES={
 neutral:{file:'neutral.png',eyes:[[111,145],[289,105]]},
 wink:{file:'wink.png',eyes:[[126,107],[360,167]]},
 laugh:{file:'laugh.png',eyes:[[250,320],[640,200]]},
 mouth1:{file:'intro-mouth1.webp',eyes:[[719.5,382.5],[935,297.5]]},
 mouth2:{file:'intro-mouth2.webp',eyes:[[719.5,382.5],[935,297.5]]},
 mouth3:{file:'intro-mouth3.webp',eyes:[[719.5,382.5],[935,297.5]]},
};
const REGIONS={neutral:{left:[49,55,111,160],right:[230,30,124,145],mouth:[150,174,160,73]},wink:{left:[32,8,185,190],right:[258,92,210,150],mouth:[135,240,240,62]},laugh:{left:[60,170,320,350],right:[440,5,360,410],mouth:[330,390,350,300]}};
function sourcePart(image,rect,mouth,circle=null){
 const [x,y,w,h]=rect,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,-x,-y);
 const pixels=ctx.getImageData(0,0,w,h),p=pixels.data,mask=new Uint8Array(w*h),seen=new Uint8Array(w*h);let best=[];
 for(let i=0;i<mask.length;i++){const k=i*4,r=p[k],g=p[k+1],b=p[k+2],inside=circle&&Math.hypot(i%w+x-circle.x,Math.floor(i/w)+y-circle.y)<circle.r;mask[i]=p[k+3]>50&&(mouth?Math.min(r,g,b)>65&&Math.max(r,g,b)-Math.min(r,g,b)<65:(inside||r<100&&g<120||b>70&&b>r*1.5&&b>g*1.1||Math.min(r,g,b)>180))?1:0;}
 for(let start=0;start<mask.length;start++)if(mask[start]&&!seen[start]){const group=[start];seen[start]=1;for(let n=0;n<group.length;n++){const i=group[n],px=i%w,py=Math.floor(i/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=px+dx,b=py+dy,j=b*w+a;if(a>=0&&a<w&&b>=0&&b<h&&mask[j]&&!seen[j]){seen[j]=1;group.push(j);}}}if(group.length>best.length)best=group;}
 if(best.length<3)throw Error('Empty original feature');const keep=new Uint8Array(w*h);for(const i of best)keep[i]=1;for(let i=0;i<keep.length;i++)if(!keep[i])p[i*4+3]=0;ctx.putImageData(pixels,0,0);return {image:c,x,y};
}
export function faceTransform(source){
 const [[lx,ly],[rx,ry]]=source.eyes,dx=rx-lx,dy=ry-ly,length=Math.hypot(dx,dy);
 if(!Number.isFinite(length)||length<1)throw Error('Invalid upstream face basis');
 return {origin:{x:(lx+rx)/2,y:(ly+ry)/2},angle:-Math.atan2(dy,dx),scale:24/length,target:{x:126,y:117}};
}
export function upstreamState(context,time,speaking=context==='talk'){
 if(context==='smug')return time%4200<800?'wink':'neutral';
 if(context==='laugh')return 'laugh';
 if(context==='sleep')return 'closed';
 if(speaking)return ['neutral','mouth1','mouth2','neutral','mouth1','mouth3','neutral'][Math.floor(time/200)%7];
 return time%5200>3600&&time%5200<3760?'wink':'neutral';
}
export async function loadUpstreamMimics(){
 const root=new URL('../../../assets/capri/upstream-mimics-v3/',import.meta.url),images={};
 await Promise.all(Object.entries(UPSTREAM_SOURCES).map(([id,s])=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>{images[id]=i;resolve();};i.onerror=()=>reject(Error('Original art unavailable: '+id));i.src=new URL(s.file,root).href;})));
 const parts={};for(const [id,image]of Object.entries(images)){const regions=REGIONS[id]||{left:[620,260,200,230],right:[846,180,200,230],mouth:[735,390,250,210]},eyes=UPSTREAM_SOURCES[id].eyes,len=Math.hypot(eyes[1][0]-eyes[0][0],eyes[1][1]-eyes[0][1]),circle=j=>({x:eyes[j][0],y:eyes[j][1],r:len*(id==='laugh'?.29:id==='neutral'?.24:.28)});parts[id]={left:sourcePart(image,regions.left,false,circle(0)),right:sourcePart(image,regions.right,false,id==='wink'?null:circle(1)),mouth:sourcePart(image,regions.mouth,true)};}return {images,parts};
}
function faceClip(ctx){ctx.beginPath();ctx.moveTo(113,104);for(const p of [[149,101],[152,128],[139,147],[125,152],[106,143],[100,132],[104,120]])ctx.lineTo(...p);ctx.closePath();}
function mapped(ctx,library,state,eyes=true){
 const f=faceTransform(UPSTREAM_SOURCES[state]);ctx.save();ctx.translate(f.target.x,f.target.y);ctx.scale(f.scale,f.scale);ctx.rotate(f.angle);ctx.translate(-f.origin.x,-f.origin.y);for(const name of eyes?['left','right','mouth']:['mouth']){const part=library.parts[state][name];ctx.drawImage(part.image,part.x,part.y);}ctx.restore();
}
export function drawUpstreamA1(ctx,body,library,state,{guides=false}={}){
 ctx.drawImage(body,0,0);ctx.save();faceClip(ctx);ctx.clip();ctx.fillStyle='#050312';ctx.fillRect(98,99,57,55);
 ctx.beginPath();ctx.moveTo(113,104);for(const p of [[149,101],[152,123],[100,127],[104,120]])ctx.lineTo(...p);ctx.closePath();ctx.fillStyle='#00ed57';ctx.fill();
 mapped(ctx,library,state==='closed'?'neutral':state,state!=='closed');
 if(state==='closed'){
   // The original Netflix wink's closed eye, reused as mirrored paired lids.
   const p=library.parts.wink.right,f=faceTransform(UPSTREAM_SOURCES.wink);
   for(const [x,mirror]of [[114,-1],[138,1]]){ctx.save();ctx.translate(x,117);ctx.scale(mirror*f.scale,f.scale);ctx.rotate(f.angle);ctx.translate(-360,-167);ctx.drawImage(p.image,p.x,p.y);ctx.restore();}
 }
 ctx.restore();
 if(guides){ctx.save();ctx.strokeStyle='#ffe66e';ctx.lineWidth=.5;for(const x of [114,138]){ctx.beginPath();ctx.moveTo(x-3,117);ctx.lineTo(x+3,117);ctx.moveTo(x,114);ctx.lineTo(x,120);ctx.stroke();}ctx.restore();}
}
