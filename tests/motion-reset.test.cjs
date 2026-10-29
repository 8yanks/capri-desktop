const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,'src/renderer/js',n),'utf8'),url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const poseSource=require('./renderer-loader.cjs').source('pose-sprites.js').replace("'./face-rig.js'",JSON.stringify(url(read('face-rig.js')))).replace("'./hair-motion.js'",JSON.stringify(url(read('hair-motion.js')))).replace("'./outfit-frames.js'",JSON.stringify(url(read('outfit-frames.js')))).replace("'./scene-poses.js'",JSON.stringify(url(read('scene-poses.js')))).replace("'./limb-motion.js'",JSON.stringify(url(read('limb-motion.js'))));
const setup=`const window={devicePixelRatio:1};const document={createElement:()=>({style:{},getContext:()=>({setTransform(){},clearRect(){},save(){},translate(){},scale(){},restore(){},drawImage(){}})})};`;
const poses=import(url(setup+poseSource));
test('walk phase follows displacement rather than wall-clock duration',async()=>{
 const {PoseSprites}=await poses,frames=Object.fromEntries(Array.from({length:8},(_,i)=>['walk-'+i,{file:'walk-'+i,scale:1,anchor:{x:20,y:80},head:{x:20,y:20},image:{width:40,height:80},alpha:new Uint8Array(3200).fill(255)}]));
 const sample=(duration,time)=>{const renderer=new PoseSprites({append(){}},{frames}),actor={scale:.6,facing:1,stance:'stand',pos:{x:0,y:700},p:{alpha:1},endAct(){}};renderer.play('walk','stand',0);renderer.clip.travel={from:0,to:160,duration,stride:120};renderer.draw(actor,time);return {id:renderer.last.frame.file,x:actor.pos.x};};
 assert.deepEqual(sample(1000,500),sample(4000,2000));assert.equal(sample(1000,500).x,80);
});
test('wave and leg swing have separate joints, neutral endpoints and opposite leg phases',async()=>{
 const {limbAngles}=await import(url(read('limb-motion.js')));
 assert.equal(limbAngles('wave',0,2400)[0],0);assert.ok(Math.abs(limbAngles('wave',2400,2400)[0])<1e-9);
 assert.equal(limbAngles('wave',220,2400).length,1);assert.ok(Math.abs(limbAngles('wave',220,2400)[0])>.1);
 const legs=limbAngles('legs',400,5000);assert.equal(legs.length,2);assert.ok(legs[0]*legs[1]<0);
});
test('lie down has slow transitions and a sustained rest',async()=>{
 const {POSE_CLIPS}=await poses,total=POSE_CLIPS['idle-lounge'].reduce((n,f)=>n+f[1],0);assert.ok(total>=25000);assert.ok(POSE_CLIPS['idle-lounge'].some(([,hold])=>hold>=10000));
});
test('seated full silhouette stays inside negative-origin and edge displays',async()=>{
 const {PoseSprites}=await poses,manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/capri/seated-v1/default/frames.json'))),frames={};
 for(const [i,j]of [0,1,0,1,2,2,3,3].entries()){const f=manifest.frames['seat-'+j];frames['seated-'+i]={...f,image:{width:f.rect.w,height:f.rect.h}};}
 const renderer=new PoseSprites({append(){}},{frames}),area={x:-1280,y:0,w:1280,h:1080},actor={scale:.8,facing:1,areaAt:()=>area};
 for(const [x,win]of [[-1278,{x:-1280,y:350,w:400}],[-2,{x:-400,y:350,w:400}]]){
  const fit=renderer.fitSeat(actor,win,{x,y:350+3+186*.8});assert.ok(fit);
  for(const frame of Object.values(frames)){const s=frame.scale*.8,left=fit.x-(fit.facing===1?frame.anchor.x:frame.image.width-frame.anchor.x)*s;assert.ok(left>=area.x+7.99);assert.ok(left+frame.image.width*s<=-.01+8.01);}
 }
});
test('six recognizable emote motifs respect mute before starting audio',async()=>{
 const source=read('voice.js').replace("'./util.js'",JSON.stringify(url('export const rand=(a,b)=>a,pick=a=>a[0];'))),{Voice,EMOTE_MELODIES}=await import(url(source));
 const voice=new Voice(),sounds=[];voice.ensure=()=>voice.ctx={currentTime:0,state:'running'};voice.osc=(...args)=>sounds.push(args);
 const signatures=[];for(const name of Object.keys(EMOTE_MELODIES)){sounds.length=0;voice.play('emote-'+name);assert.ok(sounds.length>=2);signatures.push(JSON.stringify(sounds));}
 assert.equal(new Set(signatures).size,6);voice.muted=true;voice.ensure=()=>{throw Error('muted sound created audio context');};voice.play('emote-heart');
});
