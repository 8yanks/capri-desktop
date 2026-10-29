import {A1_FACE,drawA1Face} from '../src/renderer/js/a1-face-motion.js';
const image=new Image(),canvas=document.querySelector('#preview'),ctx=canvas.getContext('2d');let paused=false,guide=false,frozen=0;
function actor(c,x,y,scale,time,animate,guides){c.save();c.translate(x,y);c.scale(scale,scale);drawA1Face(c,image,time,{animate,guides});c.restore();}
function paint(time){
 ctx.fillStyle='#0b101b';ctx.fillRect(0,0,1100,660);ctx.font='18px monospace';ctx.fillStyle='#00e5f0';ctx.fillText('CAPRI // A1 · original artwork / independent facial motion',22,30);
 ctx.font='13px monospace';ctx.fillStyle='#9ab3c9';ctx.fillText('ORIGINAL',55,65);ctx.fillText('ANIMATED',350,65);ctx.fillText('FACE DETAIL',755,65);
 actor(ctx,35,88,.96,0,false,false);actor(ctx,328,88,.96,time,true,guide);
 ctx.save();ctx.beginPath();ctx.rect(650,90,420,390);ctx.clip();actor(ctx,650-90*4,95-75*4,4,time,true,guide);ctx.restore();
 ctx.fillStyle='#96adc5';ctx.fillText('Same hair, silhouette and colours. Blink + speech test.',650,515);ctx.fillText('Silent animation study · not installed in the desktop pet',22,640);
 return canvas.toDataURL('image/png').split(',')[1];
}
window.ready=new Promise((resolve,reject)=>{image.onload=()=>resolve({width:image.width,height:image.height});image.onerror=reject;image.src=new URL('../assets/capri/base-a-v1/frames/key-0.png',import.meta.url).href;}).then(()=>{
 window.a1Frame=(time,guides=false)=>{guide=guides;return paint(time);};
 window.a1Layers=()=>Object.fromEntries(Object.entries(A1_FACE).map(([name,p])=>{const c=document.createElement('canvas');c.width=p.w;c.height=p.h;c.getContext('2d').drawImage(image,p.x,p.y,p.w,p.h,0,0,p.w,p.h);return [name,{...p,png:c.toDataURL('image/png').split(',')[1]}];}));
 window.a1Check=()=>{
   const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=image.width;a.height=b.height=image.height;
   const ac=a.getContext('2d',{willReadFrequently:true}),bc=b.getContext('2d',{willReadFrequently:true});ac.drawImage(image,0,0);const source=ac.getImageData(0,0,a.width,a.height).data;
   let outsideChanges=0,neutralChanges=0,animatedChanges=0,outsideSample=[];
   for(const time of [0,2120,3300]){bc.clearRect(0,0,b.width,b.height);drawA1Face(bc,image,time);const pixels=bc.getImageData(0,0,b.width,b.height).data;
     for(let i=0;i<source.length;i+=4){if(source[i]===pixels[i]&&source[i+1]===pixels[i+1]&&source[i+2]===pixels[i+2]&&source[i+3]===pixels[i+3])continue;
       if(time===0)neutralChanges++;else animatedChanges++;
       const x=i/4%a.width,y=Math.floor(i/4/a.width);if(!Object.values(A1_FACE).some(p=>x>=p.cx-p.w*.56-2&&x<=p.cx+p.w*.56+2&&y>=p.cy-p.h*.55-2&&y<=p.cy+p.h*.55+2)){outsideChanges++;if(outsideSample.length<5)outsideSample.push({x,y,a:[...source.slice(i,i+4)],b:[...pixels.slice(i,i+4)]});}
     }
   }
   if(neutralChanges||outsideChanges||!animatedChanges)throw Error('A1 body invariance failed: '+JSON.stringify({neutralChanges,outsideChanges,animatedChanges,outsideSample}));return {neutralChanges,outsideChanges,animatedChanges,landmarks:A1_FACE};
 };
 document.querySelector('#pause').onclick=()=>paused=!paused;document.querySelector('#guides').onclick=()=>guide=!guide;
 const start=performance.now();function loop(now){if(!paused)frozen=now-start;paint(frozen);requestAnimationFrame(loop);}requestAnimationFrame(loop);
});
