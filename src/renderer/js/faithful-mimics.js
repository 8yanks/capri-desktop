// Eye and mouth art is independently generated; only this A1 pose is calibrated.
export const MIMIC_CONTEXTS=['idle','talk','curious','smug','laugh','sleep'];
export const A1_MIMIC_ANCHORS={leftEye:{x:114,y:118,width:14,angle:0},rightEye:{x:138,y:118,width:14,angle:0},mouth:{x:126,y:136,width:25,angle:0}};
// Cancel the slant already painted into each source mouth, rather than adding it twice.
export const MOUTH_LEVEL_ANGLES={neutral:.29,small:.06,open:.28,laugh:.09,smirk:.35,surprised:.08};
export function sampleMimic(context,time,{speaking=context==='talk',reducedMotion=false}={}){
 const alias={look:'talk',calm:'idle',aside:'curious',grin:'smug',wide:'curious',many:'curious'};context=alias[context]||context;
 if(!MIMIC_CONTEXTS.includes(context))context='idle';const t=Math.max(0,time),phase=t%5200;
 let eyes=({curious:'curious',smug:'wink',laugh:'happy',sleep:'closed'}[context]||'normal');
 if(context==='smug'&&t%4200>650)eyes='normal';
 if(!reducedMotion&&context!=='sleep'&&context!=='laugh'&&phase>=3600&&phase<3760)eyes='closed';
 let mouth=({smug:'smirk',laugh:'laugh',curious:'neutral',sleep:'neutral'}[context]||'neutral');
 if(speaking&&!reducedMotion){const sequence=[['small',190],['neutral',110],['open',230],['small',160],['neutral',220],['open',180],['neutral',280]];let p=t%sequence.reduce((n,s)=>n+s[1],0);for(const [state,hold]of sequence){if(p<hold){mouth=state;break;}p-=hold;}}
 return {context,eyes,mouth};
}
async function readJSON(url){
 if(url.protocol!=='file:')return (await fetch(url)).json();
 return new Promise((resolve,reject)=>{const r=new XMLHttpRequest();r.open('GET',url);r.onload=()=>{try{resolve(JSON.parse(r.responseText));}catch(e){reject(e);}};r.onerror=()=>reject(Error('Mimic manifest unavailable'));r.send();});
}
export async function loadFaithfulMimics(base=new URL('../../../assets/capri/faithful-mimics-v2/',import.meta.url)){
 const manifest=await readJSON(new URL('frames.json',base));if(manifest.version!==1||Object.keys(manifest.frames||{}).length!==18)throw Error('Invalid mimic library');
 const frames={};await Promise.all(Object.entries(manifest.frames).map(([id,frame])=>new Promise((resolve,reject)=>{
   if(!/^(leftEye|rightEye|mouth)-[a-z]+\.png$/.test(frame.file)){reject(Error('Invalid mimic path'));return;}
   const image=new Image();image.onerror=()=>reject(Error('Mimic unavailable: '+id));image.onload=()=>{const a=frame.anchor;if(!a||!Number.isFinite(a.x)||!Number.isFinite(a.y)||a.x<0||a.y<0||a.x>image.width||a.y>image.height){reject(Error('Invalid optical anchor: '+id));return;}frames[id]={...frame,image};resolve();};image.src=new URL(frame.file,base).href;
 })));return {frames};
}
const colors=new WeakMap();
function plateColors(image){
 if(!colors.has(image)){const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,0,0);const sample=(a,b)=>{const p=x.getImageData(a,b,1,1).data;return 'rgb('+p[0]+','+p[1]+','+p[2]+')';};colors.set(image,{green:sample(123,124),black:sample(125,144)});}return colors.get(image);
}
function polygon(ctx,points){ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();}
function part(ctx,library,id,target,maxHeight=Infinity){
 const f=library.frames[id];if(!f)throw Error('Missing mimic '+id);const s=Math.min(target.width/(target.optical?f.anchor.diameter||f.image.width:f.image.width),maxHeight/f.image.height);
 ctx.save();ctx.translate(target.x,target.y);ctx.rotate(target.angle);ctx.drawImage(f.image,-f.anchor.x*s,-f.anchor.y*s,f.image.width*s,f.image.height*s);ctx.restore();
}
export function drawMimicA1(ctx,body,library,sample,{guides=false}={}){
 ctx.drawImage(body,0,0);const colors=plateColors(body);
 ctx.save();polygon(ctx,[[113,104],[149,101],[152,128],[100,132],[104,120]]);ctx.clip();ctx.fillStyle=colors.green;ctx.fillRect(98,99,57,35);
 for(const eye of ['leftEye','rightEye']){const f=library.frames[eye+'-'+sample.eyes],open=!!f.anchor.diameter;part(ctx,library,eye+'-'+sample.eyes,{...A1_MIMIC_ANCHORS[eye],width:open?14:23,optical:open});}ctx.restore();
 ctx.save();polygon(ctx,[[103,133],[149,130],[139,147],[125,152],[106,143]]);ctx.clip();ctx.fillStyle=colors.black;ctx.fillRect(100,129,52,25);
 const mouth=A1_MIMIC_ANCHORS.mouth,thin=['neutral','smirk'].includes(sample.mouth);part(ctx,library,'mouth-'+sample.mouth,{...mouth,angle:MOUTH_LEVEL_ANGLES[sample.mouth]||0,width:thin?25:sample.mouth==='small'?17:22},thin?Infinity:13);ctx.restore();
 if(guides){ctx.save();ctx.strokeStyle='#ffe35c';ctx.lineWidth=.5;for(const p of Object.values(A1_MIMIC_ANCHORS)){ctx.beginPath();ctx.moveTo(p.x-3,p.y);ctx.lineTo(p.x+3,p.y);ctx.moveTo(p.x,p.y-3);ctx.lineTo(p.x,p.y+3);ctx.stroke();}ctx.restore();}
}
