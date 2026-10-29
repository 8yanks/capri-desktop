import {loadPoseSprites,PoseSprites,POSE_CLIPS} from '../src/renderer/js/pose-sprites.js';
import {SCENE_POSES} from '../src/renderer/js/scene-poses.js';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
let library,paused=false,facing=1,frozen=0;const states=['neutral','curious','smug','happy','talk','sleep','wink','surprised'];
function cel(frame,x,y,height,state,flip=1,maxWidth=Infinity){const s=Math.min(height/frame.image.height,maxWidth/frame.image.width);ctx.save();ctx.translate(x,y);ctx.scale(flip*s,s);ctx.drawImage(frame.image,-frame.image.width/2,0);const p=frame.facePatch;ctx.drawImage(frame.faceImages[state],p.x-frame.image.width/2,p.y,p.w,p.h);ctx.restore();}
function head(frame,x,y,state){const p=frame.facePatch;ctx.save();ctx.beginPath();ctx.rect(x,y,164,150);ctx.clip();const s=Math.min(164/p.w,150/p.h);ctx.translate(x+(164-p.w*s)/2-p.x*s,y-p.y*s);ctx.scale(s,s);ctx.drawImage(frame.image,0,0);ctx.drawImage(frame.faceImages[state],p.x,p.y,p.w,p.h);ctx.restore();}
function paint(now=0){
 const state=document.querySelector('#expression').value;ctx.reset();ctx.fillStyle='#0b101a';ctx.fillRect(0,0,1440,1110);ctx.font='14px monospace';ctx.fillStyle='#00e8f6';ctx.fillText('V5 EXPRESSIONS / SHARED LANDMARKS · A1 HAIR',16,25);
 states.forEach((state,i)=>{const x=12+i*178;ctx.fillStyle='#141f2d';ctx.fillRect(x,40,170,182);head(library.frames['gestures-0'],x+3,46,state);ctx.fillStyle='#00e8f6';ctx.fillText(state.toUpperCase(),x+7,211);});
 const actual=[...new Map(Object.values(library.frames).map(f=>[f.file,f])).values()];
 actual.forEach((frame,i)=>{const x=(i%10)*144+72,y=250+Math.floor(i/10)*285;ctx.fillStyle='#15202e';ctx.fillRect(x-69,y,138,274);cel(frame,x,y+22,235,state,facing,132);ctx.fillStyle='#a6bfce';ctx.fillText(frame.file.split('/').at(-1).replace('.png',''),x-60,y+15);});
 ctx.fillStyle='#00e8f6';ctx.fillText('WALK / DISTANCE PHASES · BOTH FACINGS',16,851);
 const walk=library.frames['walk-'+Math.floor(now/180)%8];
 cel(walk,160+(now/18)%400,865,230,state,1);cel(walk,1280-(now/18)%400,865,230,state,-1);
 return canvas.toDataURL('image/png').split(',')[1];
}
window.ready=(async()=>{library=await loadPoseSprites();
 document.querySelector('#pause').onclick=()=>{paused=!paused;document.querySelector('#pause').textContent=paused?'Play':'Pause';};document.querySelector('#mirror').onclick=()=>{facing*=-1;};
 window.productionFrame=paint;
 window.productionAudit=()=>{
  const root=document.createElement('div'),poses=new PoseSprites(root,library);let draws=0;
  for(const [id,frame]of Object.entries(library.frames)){
   if(!frame.modelFamily.startsWith('design-a-v5-'))throw Error('Legacy cel '+id);
   for(const facing of [-1,1])for(const state of states){
    const actor={scale:.6,facing,stance:frame.support==='hip'?'sit':'stand',pos:{x:800,y:900},p:{alpha:1},faceExpression:state,hairMotion:false,endAct(){}};
    poses.clip={sequence:[[id,1000]],born:0};poses.draw(actor,100,true);draws++;
    const p=frame.facePatch;if(!frame.faceImages[state]||p.x+p.w>frame.image.width||p.y+p.h>frame.image.height)throw Error('Face bounds '+id);
   }
  }
  for(const sequence of [...Object.values(POSE_CLIPS),...Object.values(SCENE_POSES).map(ids=>ids.map(id=>[id,1]))])for(const [id]of sequence)if(!poses.frame(id))throw Error('Uncovered scene '+id);
  return {logicalFrames:Object.keys(library.frames).length,uniqueCels:new Set(Object.values(library.frames).map(f=>f.file)).size,states:states.length,draws,scenes:Object.keys(SCENE_POSES).length};
 };
 function tick(t){if(!paused)frozen=t;if(!window.exporting)paint(frozen);requestAnimationFrame(tick);}requestAnimationFrame(tick);paint();return true;
})();
