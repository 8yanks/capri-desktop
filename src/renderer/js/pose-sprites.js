// Illustrated cels. New anatomy is in the artwork; playback does not rotate a standing pose into lying.
import { costumePose } from './outfit-frames.js';
import { scenePose } from './scene-poses.js';
import { prepareLimbs,limbAngles } from './limb-motion.js';
import { prepareHair,hairState } from './hair-motion.js';
import { drawFace,validateFaceRig } from './face-rig.js';
import { rosePixels,roseImage,normalizeActionSizes } from './sprite-style.js';
import { celRate,celTime,celNumber,boilCels } from './cel-clock.js';
import { mouthCels } from './mouth-cels.js';
const seq = (sheet, entries) => entries.map(([index, ms]) => [sheet + '-' + index, ms]);
export const POSE_CLIPS = {
  // Rest holds are separate from reactions and deliberate seated leg swings.
  idle: seq('idle', [[0,600],[1,600],[2,600],[3,600]]),
  falling: seq('airborne',[[1,420],[2,420]]),
  seated: seq('seated', [[0,8000],[2,150],[0,4000]]),
  'rest-sleep': seq('gestures',[[1,10000]]),
  'rest-sleep-seated': seq('seated',[[7,10000]]),
  talk: seq('idle', [[0,900]]),
  'dialogue-curious': seq('gestures', [[8,170],[9,430],[11,250]]),
  'dialogue-smug': seq('gestures', [[7,250],[10,450],[11,200]]),
  'dialogue-soft': seq('gestures', [[0,350],[1,400],[0,250]]),
  'idle-wave': seq('greet',[[0,220],[1,280],[2,260],[3,300],[4,300],[3,300],[2,260],[5,320],[0,220]]),
  'idle-shrug': seq('gestures', [[8,180],[9,500],[10,450],[11,300],[0,200]]),
  'idle-stretch': [...seq('gestures',[[0,180]]),...seq('activities',[[0,700],[1,250],[0,600]]),...seq('gestures',[[0,300]])],
  'idle-exercise': [...seq('gestures',[[0,180]]),...seq('activities',[[1,220],[2,180],[1,220],[2,180],[1,220],[2,180],[1,250]]),...seq('gestures',[[0,350]])],
  'idle-dance': seq('activities',[[3,260],[2,180],[3,260],[1,180],[3,260],[2,180],[3,360]]),
  'idle-lounge': seq('rest',[[0,700],[1,1500],[2,1800],[3,2200],[4,2500],[5,14000],[4,2200],[3,2200],[2,1800],[1,1500],[0,700]]),
  'idle-seated-kick': seq('seated',[[0,5000]]),
  walk: seq('walk',[[0,120],[1,120],[2,120],[3,120],[4,120],[5,120],[6,120],[7,120]]),
  'idle-finger-guns': seq('extra',[[0,220],[1,250],[0,200],[1,250]]),
  'idle-hacking': seq('extra',[[2,250],[3,220],[2,250],[3,220],[2,250],[3,220],[2,300]]),
  'idle-listening': seq('extra',[[4,360],[5,340],[4,360],[5,340],[4,360],[5,340]]),
  'idle-doze': seq('seated',[[6,500],[7,1500],[6,400]]),
};
const SEATED_CLIPS = {
  talk: seq('seated',[[0,200],[5,350],[0,250]]),
  'dialogue-curious': seq('seated',[[0,250],[2,400],[0,250]]),
  'dialogue-smug': seq('seated',[[5,250],[4,450],[0,250]]),
  'dialogue-soft': seq('seated',[[0,450],[1,350],[0,300]]),
  'idle-wave': seq('seated',[[5,2400]]),
  'idle-shrug': seq('seated',[[0,200],[5,450],[0,300]]),
  'idle-stretch': seq('seated',[[0,250],[5,650],[0,300]]),
};
export function poseAt(sequence, elapsed, loop = false) {
  const duration = sequence.reduce((sum, [,ms]) => sum + ms,0);
  if (!loop && elapsed >= duration) return null;
  let time = Math.max(0,loop ? elapsed % duration : elapsed);
  for (const [frame, ms] of sequence) { if(time < ms)return frame; time -= ms; }
  return sequence.at(-1)[0];
}
async function readManifest(url) {
  if (url.protocol !== 'file:') return (await fetch(url)).json();
  return new Promise((resolve,reject)=>{
    const request=new XMLHttpRequest();request.open('GET',url);
    request.onload=()=>{try{resolve(JSON.parse(request.responseText));}catch(error){reject(error);}};
    request.onerror=()=>reject(Error('Pose manifest unavailable'));request.send();
  });
}
async function loadLibrary(base,pattern) {
  const manifest=await readManifest(new URL('frames.json',base));
  if(manifest.version!==1||Object.keys(manifest.frames||{}).length>64)throw Error('Invalid pose manifest');
  const frames={};
  await Promise.all(Object.entries(manifest.frames).map(async([id,frame])=>{
    if(!pattern.test(frame.file))throw Error('Invalid pose asset');
    const image=new Image();
    // Match the app's loader: decode() can stall on its custom protocol while hidden.
    await new Promise((resolve,reject)=>{
      image.onload=resolve;image.onerror=()=>reject(Error('Pose image unavailable: '+id));
      image.src=new URL(frame.file,base).href;
    });
    const bitmap=await createImageBitmap(image), canvas=document.createElement('canvas');
    if(frame.faceRig)validateFaceRig(frame.faceRig,bitmap.width,bitmap.height);
    canvas.width=bitmap.width;canvas.height=bitmap.height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);
    const imageData=ctx.getImageData(0,0,bitmap.width,bitmap.height),pixels=imageData.data,alpha=new Uint8Array(pixels.length/4);
    const bounds={top:bitmap.height,bottom:0};let opaquePixels=0;
    for(let i=0;i<alpha.length;i++){alpha[i]=pixels[i*4+3];if(alpha[i]>40){opaquePixels++;const y=Math.floor(i/bitmap.width);bounds.top=Math.min(bounds.top,y);bounds.bottom=Math.max(bounds.bottom,y);}}
    rosePixels(pixels);ctx.putImageData(imageData,0,0);bitmap.close();
    const faceImages={};
    if(frame.facePatch)await Promise.all(Object.entries(frame.facePatch.variants).map(async([state,file])=>{
      if(!/^faces\/(key|seat|walk|greet|rest|airborne|guide|extended|idle|phase|possession|react)-\d+-(neutral|curious|smug|happy|talk|sleep|wink|surprised|starry)\.png$/.test(file))throw Error('Invalid face asset');
      const face=new Image();await new Promise((resolve,reject)=>{face.onload=resolve;face.onerror=reject;face.src=new URL(file,base).href;});
      faceImages[state]=await createImageBitmap(roseImage(face));
    }));
    const faceParts={};
    if(frame.facePatch)for(const [state,image]of Object.entries(faceImages)){
      const parts={};const [a,b,c,d,tx,ty]=frame.v5Transform,det=a*d-b*c,p=frame.facePatch;
      for(const kind of ['eyes','mouth']){const layer=document.createElement('canvas');layer.width=p.w;layer.height=p.h;const g=layer.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);const pixels=g.getImageData(0,0,p.w,p.h);
        for(let k=0;k<pixels.data.length;k+=4){const x=k/4%p.w+p.x-tx,y=Math.floor(k/4/p.w)+p.y-ty,sx=(d*x-c*y)/det,sy=(-b*x+a*y)/det;const mouth=sy>486-(sx-676)*138/366+4;if(mouth!==(kind==='mouth'))pixels.data[k+3]=0;}g.putImageData(pixels,0,0);parts[kind]=layer;
      }faceParts[state]=parts;
    }
    frames[id]={...frame,image:await createImageBitmap(canvas),bounds,opaquePixels,alpha,faceImages,faceParts,
      mouthCels:faceParts.neutral&&faceParts.talk?mouthCels(frame,faceParts):null};
  }));
  normalizeActionSizes(frames);
  return {frames};
}
export async function loadPoseSprites() {
  const root=new URL('../../../assets/capri/',import.meta.url);
  const production=await loadLibrary(new URL('v5-a1-v1/',root),/^frames\/(key|seat|walk)-[0-7]\.png$/);
  const library={frames:{},design:'A1-V5'};
  library.keyFrames=Object.fromEntries([0,1,2,3,12,13,14,15].map((slot,i)=>[slot,production.frames['key-'+i]]));
  for(const [sheet,count]of Object.entries({gestures:12,activities:8,transitions:16,seated:8,extra:8,walk:8}))for(let i=0;i<count;i++){
    const id=sheet+'-'+i,slot=sheet==='activities'?[12,13,14,1,12,13,14,1][i]:costumePose(id);
    library.frames[id]=sheet==='walk'?production.frames[id]:sheet==='seated'?production.frames['seat-'+[0,1,0,1,2,2,3,3][i]]:sheet==='extra'&&i>=6?production.frames['seat-3']:library.keyFrames[slot];
    if(!library.frames[id])throw Error('Missing production pose: '+id);
  }
  Object.assign(library.frames,(await loadLibrary(new URL('sprite-production-v2/',root),/^frames\/(greet|rest|airborne|guide|extended|idle|phase|possession|react)-[0-7]\.png$/)).frames);
  library.loadOutfit=async id=>{
    const outfit={frames:{}};
    try{
      const keys=await loadLibrary(new URL('keyposes-v1/'+id+'/',root),/^frames\/key-[0-7]\.png$/);
      for(const [i,slot]of [0,1,2,3,12,13,14,15].entries())outfit.frames['poses-'+slot]=keys.frames['key-'+i];
      const seats=await loadLibrary(new URL('seated-v1/'+id+'/',root),/^frames\/seat-[0-3]\.png$/);
      for(let i=0;i<4;i++)outfit.frames['poses-'+(i+4)]=seats.frames['seat-'+i];
      Object.assign(outfit.frames,(await loadLibrary(new URL('walk-v2/'+id+'/',root),/^frames\/walk-[0-7]\.png$/)).frames);
      return outfit;
    }catch(error){for(const frame of new Set(Object.values(outfit.frames)))frame.image.close?.();throw error;}
  };
  return library;
}
export class PoseSprites {
  constructor(root,library) {
    this.library=library;this.canvas=document.createElement('canvas');this.canvas.className='capri__poses';
    Object.assign(this.canvas.style,{position:'absolute',pointerEvents:'auto',display:'none'});root.append(this.canvas);
    this.ctx=this.canvas.getContext('2d');this.visible=false;this.clip=null;this.last=null;
    this.outfits=new Map();this.outfit='default';this.requestedOutfit='default';
    this.celCache=new Map();
  }
  async setOutfit(id,{manual=false}={}){
    if(!/^(default|netrunner|creator|stage|league|david|lucy|badlands|omi|roman|talia|king)$/.test(id))return false;
    this.requestedOutfit=id;
    this.pendingOutfit=null;
    if(id==='default'){this.pendingOutfit={id,library:null,manual};return true;}
    try{
      const library=this.outfits.get(id)||await this.library.loadOutfit(id);
      if(this.requestedOutfit!==id){if(!this.outfits.has(id))for(const frame of Object.values(library.frames))frame.image.close?.();return false;}
      this.outfits.set(id,library);this.pendingOutfit={id,library,manual};return true;
    }catch(error){if(this.requestedOutfit===id)this.pendingOutfit={id:'default',library:null,manual};console.warn('[capri] costume unavailable:',id,error.message);return false;}
  }
  frame(id){
    const slot=costumePose(id);
    if(this.costume)return this.costume.frames[id.startsWith('walk-')?id:'poses-'+slot]||this.library.frames[id];
    if(!id.startsWith('seated-')&&!id.startsWith('extra-')&&this.library.keyFrames?.[slot])return this.library.keyFrames[slot];
    return this.library.frames[id];
  }
  play(name,stance,now) {
    const sequence=(stance==='sit'?SEATED_CLIPS[name]:null)||POSE_CLIPS[name];
    if(!sequence||!sequence.every(([id])=>this.library.frames[id]))return false;
    this.clip={name,sequence,born:now,stance,limb:name==='idle-wave'?'wave':name==='idle-seated-kick'?'legs':null};return true;
  }
  fits(name,capri,facing){
    const sequence=POSE_CLIPS[name],area=capri.areaAt(capri.pos);
    if(!sequence)return false;
    return sequence.every(([id])=>{
      const frame=this.frame(id);if(!frame)return false;
      const s=frame.scale*capri.scale;
      const left=capri.pos.x-(facing===1?frame.anchor.x:frame.image.width-frame.anchor.x)*s;
      return left>=area.x+8&&left+frame.image.width*s<=area.x+area.w-8;
    });
  }
  fitSeat(capri,win,at){
    const area=capri.areaAt({x:at.x,y:win.y}),scale=capri.scale,margin=8;
    const frames=[0,1,5,7].map(i=>this.frame('seated-'+i)).filter(Boolean);if(!frames.length)return null;
    for(const facing of [capri.facing||1,-(capri.facing||1)]){
      let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
      for(const f of frames){const s=f.scale*scale;left=Math.min(left,-(facing===1?f.anchor.x:f.image.width-f.anchor.x)*s);right=Math.max(right,(facing===1?f.image.width-f.anchor.x:f.anchor.x)*s);top=Math.min(top,-f.anchor.y*s-186*scale);bottom=Math.max(bottom,(f.image.height-f.anchor.y)*s-186*scale);}
      const supportMin=win.kind==='desktop-icon'?win.x+win.w/2:win.x+40,supportMax=win.kind==='desktop-icon'?supportMin:win.x+win.w-40;
      const low=Math.max(supportMin,area.x+margin-left),high=Math.min(supportMax,area.x+area.w-margin-right);
      if(low<=high&&at.y+top>=area.y+margin&&at.y+bottom<=area.y+area.h-margin)return {x:Math.max(low,Math.min(high,at.x)),y:at.y,facing};
    }
    return null;
  }
  stride(scale){
    const xs=[];for(let i=0;i<8;i++){const f=this.frame('walk-'+i);if(f?.gait?.green)xs.push((f.gait.green.x-f.anchor.x)*f.scale);}
    const units=xs.length?Math.max(140,Math.min(260,2*(Math.max(...xs)-Math.min(...xs)))):180;
    return units*scale;
  }
  stop(){this.clip=null;}
  hide(){this.canvas.style.display='none';this.visible=false;this.last=null;}
  draw(capri,now,still=false) {
    const rate=celRate(capri),exposure=still?0:celNumber(now,rate),phaseCel=exposure%4;
    now=still?now:celTime(now,rate);
    if(this.pendingOutfit&&(!capri.act||this.pendingOutfit.manual&&capri.act.player.poseClip)
      &&(!capri.dialogueActive||this.pendingOutfit.manual)&&!capri.dragging&&!capri.resourceLocked){
      const pending=this.pendingOutfit;this.pendingOutfit=null;this.outfit=pending.id;this.costume=pending.library;this.changedAt=now;
      for(const [id,library]of this.outfits)if(id!==this.outfit){for(const frame of Object.values(library.frames))frame.image.close?.();this.outfits.delete(id);}
    }
    let sequence=this.clip?.sequence,elapsed=this.clip?now-this.clip.born:now;
    if(this.clip?.travel){const travel=this.clip.travel;capri.pos.x=travel.from+(travel.to-travel.from)*Math.min(1,elapsed/travel.duration);}
    let phase=elapsed;
    if(this.clip?.travel&&sequence){const tr=this.clip.travel,distance=Math.abs(tr.to-tr.from);if(distance)phase=distance*Math.min(1,elapsed/tr.duration)/(tr.stride||180*capri.scale)*sequence.reduce((n,f)=>n+f[1],0);}
    let id=sequence?poseAt(sequence,phase,Boolean(this.clip?.travel)&&elapsed<this.clip.travel.duration):null;
    if(this.clip?.travel&&elapsed>=this.clip.travel.duration)id=null;
    if(this.clip&&!id){this.clip=null;capri.endAct(true);}
    // Scene timelines still own satellites, beams and possession cues.
    if(!id)id=scenePose(capri.act?.player,capri.stance,now);
    if(!id&&capri.pointing)id=capri.stance==='sit'?'seated-5':'guide-4';
    if(!id)id=poseAt(POSE_CLIPS[capri.stance==='fall'?'falling':capri.mode==='sleep'?(capri.stance==='sit'?'rest-sleep-seated':'rest-sleep'):capri.stance==='sit'?'seated':'idle'],still?0:now,true);
    // Keep the original effect clock; drawn breakup cels replace only its body layer.
    if(!still&&capri.stance==='stand'&&capri.p.dissolve>.12)id=capri.p.dissolve>.3?'phase-6':'phase-5';
    let frame=this.frame(id);if(!frame){this.hide();return false;}
    if(capri.sky)capri.facing=capri.sky.dir; // illustrated guide arm points right at facing +1
    if(this.clip?.limb==='wave'){const base=this.frame(capri.stance==='sit'?'seated-0':'gestures-0');if(base)frame={...frame,anchor:{x:frame.head.x-(base.head.x-base.anchor.x)*base.scale/frame.scale,y:frame.head.y-(base.head.y-base.anchor.y)*base.scale/frame.scale}};}
    const scale=capri.scale,dpr=window.devicePixelRatio||1,s=frame.scale*scale,shift=frame.support==='hip'?186*scale:0;
    const leftExtent=(capri.facing===1?frame.anchor.x:frame.image.width-frame.anchor.x)*s;
    const rightExtent=frame.image.width*s-leftExtent;
    const pivot={x:Math.max(320*scale,leftExtent+32*scale),y:Math.max(520*scale,frame.anchor.y*s+shift+32*scale)};
    const w=Math.ceil(Math.max(640*scale,pivot.x+rightExtent+32*scale));
    const h=Math.ceil(Math.max(600*scale,pivot.y+(frame.image.height-frame.anchor.y)*s-shift+32*scale));
    if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){
      this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);
      this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';
    }
    // The original root's world anchor is (56+128, 56+418), independent of artwork.
    this.canvas.style.left=(184*scale-pivot.x)+'px';this.canvas.style.top=(474*scale-pivot.y)+'px';
    const turn=still?0:(capri.upside?180:0)+(capri.tilt||0),sx=still?1:capri.sx??1,sy=still?1:capri.sy??1;
    this.canvas.style.transformOrigin=pivot.x+'px '+(pivot.y-shift)+'px';
    this.canvas.style.transform='rotate('+turn+'deg) scale('+sx+','+sy+')';
    const left=pivot.x-frame.anchor.x*s,top=pivot.y-frame.anchor.y*s-shift;
    const glitch=capri.resourceGlitch||(!still&&(capri.p.glitch>0||now-this.changedAt<220));
    const collapse=still?0:Math.max(0,Math.min(1,capri.p.collapse||0));
    const dissolve=still?0:Math.max(0,Math.min(1,capri.p.dissolve||0));
    const echo=still?[0,0]:(capri.p.echo||[0,0]);
    const limb=this.clip?.limb,limbDuration=sequence?.reduce((n,f)=>n+f[1],0)||1;
    const rig=limb&&!still&&!frame.motionBaked&&frame.face&&this.outfit==='default'?prepareLimbs(frame,limb):null;
    const hair=!still&&!capri.resourceLocked&&!capri.resourceGlitch&&capri.hairMotion!==false&&frame.modelFamily?.startsWith('design-a')?prepareHair(frame,rig?.body||frame.image):null;
    let expression=capri.mode==='sleep'?'sleep':capri.faceExpression||(capri.resourceGlitch?'surprised':capri.busy?'curious':this.clip?.name==='idle-wave'?'wink':this.clip?.name==='dialogue-curious'?'curious':this.clip?.name==='dialogue-smug'?'smug':frame.defaultExpression||'neutral');
    let eyeExpression=expression;
    const emote=capri.mode!=='sleep'&&!!(this.clip&&this.clip.name!=='talk'||capri.act&&!capri.dialogueActive);
    if(emote)eyeExpression='neutral';
    if(capri.dialogueActive&&['smug','wink','talk','happy'].includes(eyeExpression))eyeExpression='neutral';
    if(!still&&!emote&&capri.mode!=='sleep'&&now%7100>6990)eyeExpression='sleep';
    const mouthLevel=still?0:capri.speechMouth?.()||0;
    this.lastMouthLevel=mouthLevel;
    const mouthExpression=mouthLevel>0?'talk':expression==='sleep'?'sleep':'neutral';
    const motionKey=(rig?exposure:0)+':'+(hair?exposure:0)+':'+(frame.facePatch||frame.faceRig?eyeExpression+':'+mouthExpression+':'+mouthLevel:'')+':'+(still?0:phaseCel);
    const paintKey=[motionKey,echo.join(','),capri.p.silAmount,capri.p.sil,id,this.outfit,scale,dpr,capri.facing,capri.p.alpha,!!glitch,collapse,dissolve].join(':');
    if(this.paintKey!==paintKey){
      const ctx=this.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      ctx.save();ctx.translate(pivot.x,pivot.y);ctx.scale(capri.facing*Math.max(.015,1-collapse),1);ctx.translate(-pivot.x,-pivot.y);
      // Cel-to-cel registration only; no smooth sine-wave float or image-part rig.
      if(!still){const offset=[[0,-.45],[.35,0],[0,.45],[-.35,0]][phaseCel];ctx.translate(offset[0]*scale,offset[1]*scale);}
      if(echo[0]||echo[1]){ctx.globalAlpha=.22*capri.p.alpha*(1-dissolve);for(const dir of [-1,1])ctx.drawImage(frame.image,left+dir*echo[0]*scale,top+dir*echo[1]*scale,frame.image.width*s,frame.image.height*s);}
      let body=hair?.body||rig?.body||frame.image;
      if(!still&&!hair&&!rig){
        if(!this.celCache.has(frame)){this.celCache.set(frame,boilCels(frame.image));if(this.celCache.size>6)this.celCache.delete(this.celCache.keys().next().value);}
        body=this.celCache.get(frame)[phaseCel];
      }
      ctx.globalAlpha=capri.p.alpha*(1-dissolve);ctx.drawImage(body,left,top,frame.image.width*s,frame.image.height*s);
      if(hair){const states=hairState(now);for(let i=0;i<3;i++){const part=hair.parts[i];ctx.save();ctx.translate(left+part.pivot.x*s,top+part.pivot.y*s);ctx.rotate(states[i].angle);ctx.filter='brightness('+states[i].light+') hue-rotate('+Math.sin(now/1100+i)*1.8+'deg)';ctx.drawImage(part.image,-part.pivot.x*s,-part.pivot.y*s,frame.image.width*s,frame.image.height*s);ctx.restore();}}
      if(rig){const angles=limbAngles(limb,elapsed,limbDuration);for(let i=0;i<rig.parts.length;i++){const part=rig.parts[i];ctx.save();ctx.translate(left+part.pivot.x*s,top+part.pivot.y*s);ctx.rotate(angles[i]);ctx.drawImage(part.image,-part.pivot.x*s,-part.pivot.y*s,frame.image.width*s,frame.image.height*s);ctx.restore();}}
      if(frame.faceRig){ctx.save();ctx.translate(left,top);ctx.scale(s,s);drawFace(ctx,frame.faceRig,expression,now);ctx.restore();}
      if(frame.facePatch&&frame.faceParts?.[eyeExpression]){const f=frame.facePatch;const mouth=frame.mouthCels?.[mouthLevel]||frame.faceParts[mouthExpression].mouth;for(const image of [frame.faceParts[eyeExpression].eyes,mouth])ctx.drawImage(image,left+f.x*s,top+f.y*s,f.w*s,f.h*s);}
      if(glitch){ctx.globalAlpha=.35*capri.p.alpha*(1-dissolve);ctx.drawImage(frame.image,left+3,top,frame.image.width*s,frame.image.height*s);}
      if(capri.p.silAmount&&capri.p.sil&&ctx.fillRect){ctx.globalAlpha=1;ctx.globalCompositeOperation='source-atop';ctx.fillStyle='rgba('+capri.p.sil.map(n=>Math.round(n*255)).join(',')+','+capri.p.silAmount+')';ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='source-over';}
      ctx.restore();this.paintKey=paintKey;this.paintCount=(this.paintCount||0)+1;
    }
    this.canvas.style.display='block';this.visible=true;
    this.last={frame,scale:s,shift,world:{x:capri.pos.x,y:capri.pos.y+(still?0:capri.bob||0)},facing:capri.facing,turn:turn*Math.PI/180,sx,sy};return true;
  }
  head(){
    const {frame,scale,shift,world,facing,turn,sx,sy}=this.last;
    const transform=(x,y)=>({x:world.x+x*sx*Math.cos(turn)-y*sy*Math.sin(turn),y:world.y-shift+x*sx*Math.sin(turn)+y*sy*Math.cos(turn)});
    const point=transform((frame.head.x-frame.anchor.x)*scale*facing,(frame.head.y-frame.anchor.y)*scale);
    return {...point,top:transform(0,-frame.anchor.y*scale).y};
  }
  hand(){
    if(!this.visible||!this.last?.frame.hand)return null;
    const {frame,scale,shift,world,facing,turn,sx,sy}=this.last;
    const x=(frame.hand.x-frame.anchor.x)*scale*facing,y=(frame.hand.y-frame.anchor.y)*scale;
    return {x:world.x+x*sx*Math.cos(turn)-y*sy*Math.sin(turn),y:world.y-shift+x*sx*Math.sin(turn)+y*sy*Math.cos(turn)};
  }
  points(count=64){
    if(!this.last)return [];
    const {frame,scale,shift,world,facing,turn,sx,sy}=this.last,points=[];
    for(let i=1;i<count*24&&points.length<count;i++){
      const x=Math.floor((i*.61803398875%1)*frame.image.width),y=Math.floor((i*.41421356237%1)*frame.image.height);
      if(frame.alpha[y*frame.image.width+x]>96){const dx=(x-frame.anchor.x)*scale*facing*sx,dy=(y-frame.anchor.y)*scale*sy;points.push({x:world.x+dx*Math.cos(turn)-dy*Math.sin(turn),y:world.y-shift+dx*Math.sin(turn)+dy*Math.cos(turn)});}
    }
    return points;
  }
  hit(x,y){
    if(!this.last)return false;
    const {frame,scale,shift,world,facing,turn,sx,sy}=this.last;
    if(Math.abs(sx)<.01||Math.abs(sy)<.01)return false;
    const dx=x-world.x,dy=y-world.y+shift;
    const lx=(dx*Math.cos(turn)+dy*Math.sin(turn))/sx;
    const ly=(-dx*Math.sin(turn)+dy*Math.cos(turn))/sy;
    const px=Math.floor(frame.anchor.x+lx/scale*facing),py=Math.floor(frame.anchor.y+ly/scale);
    return px>=0&&py>=0&&px<frame.image.width&&py<frame.image.height&&frame.alpha[py*frame.image.width+px]>40;
  }
}
