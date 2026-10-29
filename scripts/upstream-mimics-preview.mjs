import {loadUpstreamMimics,upstreamState,drawUpstreamA1,UPSTREAM_CONTEXTS as MIMIC_CONTEXTS} from '../src/renderer/js/upstream-mimics.js';
const loadFaithfulMimics=loadUpstreamMimics;
const sampleMimic=(context,time,options={})=>({context,state:upstreamState(context,time,options.speaking??context==='talk'),eyes:'UPSTREAM',mouth:context});
const drawMimicA1=(ctx,body,library,sample,options)=>drawUpstreamA1(ctx,body,library,sample.state,options);
const body=new Image(),canvas=document.querySelector('#preview'),ctx=canvas.getContext('2d',{willReadFrequently:true});let library,guide=false,paused=false,clock=0;
const lines={idle:'Still here. Obviously.',talk:"Oh! You're here! Come on, let's do something fun.",curious:"Oh? Now you've got my attention.",smug:"You were looking for me, weren't you?",laugh:'Ha! Again. Do that again!',sleep:'Just a little quiet...'};
function actor(ctx,x,y,scale,sample){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);drawMimicA1(ctx,body,library,sample,{guides:guide});ctx.restore();}
function wrap(text,x,y,width){const words=text.split(' ');let row='';for(const word of words){if(ctx.measureText(row+word).width>width){ctx.fillText(row,x,y);row='';y+=19;}row+=word+' ';}ctx.fillText(row,x,y);}
const tiles=Array.from({length:6},()=>{const c=document.createElement('canvas');c.width=382;c.height=360;return c;});
function paint(time){
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0b101b';ctx.fillRect(0,0,1200,850);ctx.fillStyle='#31e2f1';ctx.font='18px monospace';ctx.fillText('CAPRI // V3 · ORIGINAL REPOSITORY FACE',20,28);ctx.fillStyle='#a6bacd';ctx.font='12px monospace';ctx.fillText('Original repo / footage pixels · shared face proportions · no generated eye stickers',20,51);
 for(const [i,context]of MIMIC_CONTEXTS.entries()){
   const c=tiles[i],p=c.getContext('2d',{willReadFrequently:true}),sample=sampleMimic(context,time,{speaking:context==='talk'});
   p.reset();p.setTransform(1,0,0,1,0,0);p.fillStyle='#15202e';p.fillRect(0,0,382,360);p.strokeStyle='#294254';p.strokeRect(0,0,382,360);
   p.fillStyle='#39e8f0';p.font='14px monospace';p.fillText(context.toUpperCase(),12,25);actor(p,8,43,.42,sample);
   p.save();p.beginPath();p.rect(135,52,235,188);p.clip();actor(p,135-90*3,52-94*3,3,sample);p.restore();
   p.strokeStyle='#7637d4';p.strokeRect(134,51,237,190);p.fillStyle='#ffe289';p.font='11px monospace';p.fillText('UPSTREAM / '+context,135,261);
   p.fillStyle='#0b111e';p.fillRect(10,280,362,67);p.fillStyle='#ffe289';p.fillText('CAPRI >',19,299);p.fillStyle='#dceffa';p.font='12px monospace';
   const text=lines[context];p.fillText(text.slice(0,45),19,320);if(text.length>45)p.fillText(text.slice(45),19,337);
   ctx.drawImage(c,12+i%3*396,72+Math.floor(i/3)*374);
 }
 ctx.fillStyle='#92aabd';ctx.font='11px monospace';ctx.fillText('Original artwork study · A1 body retained · not the live desktop process',20,841);
 return canvas.toDataURL('image/png').split(',')[1];
}

window.ready=(async()=>{
 library=await loadFaithfulMimics();await new Promise((resolve,reject)=>{body.onload=resolve;body.onerror=reject;body.src=new URL('../assets/capri/base-a-v1/frames/key-0.png',import.meta.url).href;});
 window.upstreamLayers=()=>Object.fromEntries(Object.entries(library.parts).flatMap(([state,parts])=>Object.entries(parts).map(([name,p])=>[state+'-'+name,{x:p.x,y:p.y,png:p.image.toDataURL('image/png').split(',')[1]}])));
 window.mimicFrame=(time,debug=false)=>{window.exporting=true;guide=debug;return paint(time);};
 window.previewChecks=()=>{paint(0);let panels=0;for(const tile of tiles){const p=tile.getContext('2d').getImageData(20,330,1,1).data;if(p[0]!==11||p[1]!==17||p[2]!==30||p[3]!==255)throw Error('Incomplete preview panel');panels++;}return panels;};
 window.mimicChecks=()=>{
   const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=body.width;a.height=b.height=body.height;
   const ac=a.getContext('2d',{willReadFrequently:true}),bc=b.getContext('2d',{willReadFrequently:true});ac.drawImage(body,0,0);const before=ac.getImageData(0,0,a.width,a.height).data;let outside=0,draws=0;const signatures=new Set();
   for(const context of MIMIC_CONTEXTS)for(const time of [0,220,440,1000,3670,4000]){
     bc.clearRect(0,0,b.width,b.height);drawMimicA1(bc,body,library,sampleMimic(context,time));const after=bc.getImageData(0,0,b.width,b.height).data;let signature=0;
     for(let i=0;i<before.length;i+=4){const x=i/4%a.width,y=Math.floor(i/4/a.width);const changed=before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2]||before[i+3]!==after[i+3];if(changed&&(x<97||x>156||y<98||y>154))outside++;if(x>=97&&x<=156&&y>=98&&y<=154)signature=(signature*31+after[i]+after[i+1]+after[i+2])>>>0;}
     signatures.add(signature);draws++;
   }
   if(outside||signatures.size<5)throw Error('Mimic QA failed '+JSON.stringify({outside,states:signatures.size}));
   return {components:Object.keys(library.images).length,draws,outsideFacePixelChanges:outside,distinctStates:signatures.size,contexts:MIMIC_CONTEXTS};
 };
 document.querySelector('#pause').onclick=()=>paused=!paused;document.querySelector('#guides').onclick=()=>guide=!guide;
 const start=performance.now();function loop(t){if(!window.exporting){if(!paused)clock=t-start;paint(clock);}requestAnimationFrame(loop);}requestAnimationFrame(loop);
})();
