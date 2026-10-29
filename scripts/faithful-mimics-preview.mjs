import {loadFaithfulMimics,sampleMimic,drawMimicA1,MIMIC_CONTEXTS} from '../src/renderer/js/faithful-mimics.js?v=alignment2';
const body=new Image(),canvas=document.querySelector('#preview'),ctx=canvas.getContext('2d');let library,guide=false,paused=false,clock=0;
const lines={idle:'Still here. Obviously.',talk:"Oh! You're here! Come on, let's do something fun.",curious:"Oh? Now you've got my attention.",smug:"You were looking for me, weren't you?",laugh:'Ha! Again. Do that again!',sleep:'Just a little quiet...'};
function actor(ctx,x,y,scale,sample){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);drawMimicA1(ctx,body,library,sample,{guides:guide});ctx.restore();}
function wrap(text,x,y,width){const words=text.split(' ');let row='';for(const word of words){if(ctx.measureText(row+word).width>width){ctx.fillText(row,x,y);row='';y+=19;}row+=word+' ';}ctx.fillText(row,x,y);}
function paint(time){
 ctx.fillStyle='#0b101b';ctx.fillRect(0,0,1200,850);ctx.fillStyle='#31e2f1';ctx.font='18px monospace';ctx.fillText('CAPRI // A1 · source-faithful facial acting',20,28);ctx.fillStyle='#a6bacd';ctx.font='12px monospace';ctx.fillText('New separate eye / mouth artwork · same A1 body · original RP lines for context',20,51);
 for(const [i,context]of MIMIC_CONTEXTS.entries()){
   const x=12+i%3*396,y=72+Math.floor(i/3)*374,sample=sampleMimic(context,time,{speaking:context==='talk'});
   ctx.fillStyle='#15202e';ctx.fillRect(x,y,382,360);ctx.strokeStyle='#294254';ctx.strokeRect(x,y,382,360);
   ctx.fillStyle='#39e8f0';ctx.font='14px monospace';ctx.fillText(context.toUpperCase(),x+12,y+25);
   actor(ctx,x+8,y+43,.42,sample);
   ctx.save();ctx.beginPath();ctx.rect(x+135,y+52,235,188);ctx.clip();actor(ctx,x+135-90*3,y+52-94*3,3,sample);ctx.restore();
   ctx.strokeStyle='#7637d4';ctx.strokeRect(x+134,y+51,237,190);
   ctx.fillStyle='#ffe289';ctx.font='11px monospace';ctx.fillText(sample.eyes+' / '+sample.mouth,x+135,y+261);
   ctx.fillStyle='#0b111e';ctx.fillRect(x+10,y+280,362,67);ctx.fillStyle='#ffe289';ctx.fillText('CAPRI >',x+19,y+299);ctx.fillStyle='#dceffa';ctx.font='12px monospace';wrap(lines[context],x+19,y+320,338);
 }
 ctx.fillStyle='#92aabd';ctx.font='11px monospace';ctx.fillText('Silent context study · graphic held cels, no squashed-eye blink · not the live desktop process',20,841);
 return canvas.toDataURL('image/png').split(',')[1];
}
window.ready=(async()=>{
 library=await loadFaithfulMimics();await new Promise((resolve,reject)=>{body.onload=resolve;body.onerror=reject;body.src=new URL('../assets/capri/base-a-v1/frames/key-0.png',import.meta.url).href;});
 window.mimicFrame=(time,debug=false)=>{guide=debug;return paint(time);};
 window.mimicChecks=()=>{
   const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=body.width;a.height=b.height=body.height;
   const ac=a.getContext('2d',{willReadFrequently:true}),bc=b.getContext('2d',{willReadFrequently:true});ac.drawImage(body,0,0);const before=ac.getImageData(0,0,a.width,a.height).data;let outside=0,draws=0;const signatures=new Set();
   for(const context of MIMIC_CONTEXTS)for(const time of [0,220,650,1500,3670,4000]){
     bc.clearRect(0,0,b.width,b.height);drawMimicA1(bc,body,library,sampleMimic(context,time));const after=bc.getImageData(0,0,b.width,b.height).data;let signature=0;
     for(let i=0;i<before.length;i+=4){const x=i/4%a.width,y=Math.floor(i/4/a.width);const changed=before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2]||before[i+3]!==after[i+3];if(changed&&(x<97||x>156||y<98||y>154))outside++;if(x>=97&&x<=156&&y>=98&&y<=154)signature=(signature*31+after[i]+after[i+1]+after[i+2])>>>0;}
     signatures.add(signature);draws++;
   }
   if(outside||signatures.size<8)throw Error('Mimic QA failed '+JSON.stringify({outside,states:signatures.size}));
   return {components:Object.keys(library.frames).length,draws,outsideFacePixelChanges:outside,distinctStates:signatures.size,contexts:MIMIC_CONTEXTS};
 };
 document.querySelector('#pause').onclick=()=>paused=!paused;document.querySelector('#guides').onclick=()=>guide=!guide;
 const start=performance.now();function loop(t){if(!paused)clock=t-start;paint(clock);requestAnimationFrame(loop);}requestAnimationFrame(loop);
})();
