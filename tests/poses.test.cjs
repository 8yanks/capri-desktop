const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const production=JSON.parse(fs.readFileSync(path.join(root,'assets/capri/sprite-production-v2/frames.json'),'utf8')).frames;
for(const frame of Object.values(production)){const png=fs.readFileSync(path.join(root,'assets/capri/sprite-production-v2',frame.file));frame.rect={x:0,y:0,w:png.readUInt32BE(16),h:png.readUInt32BE(20)};}

const mapping='data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'src/renderer/js/outfit-frames.js'),'utf8')).toString('base64');
const limb='data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'src/renderer/js/limb-motion.js'),'utf8')).toString('base64');
const source=require('./renderer-loader.cjs').source('pose-sprites.js').replace("'./face-rig.js'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'src/renderer/js/face-rig.js'),'utf8')).toString('base64'))).replace("'./hair-motion.js'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'src/renderer/js/hair-motion.js'),'utf8')).toString('base64'))).replace("'./limb-motion.js'",JSON.stringify(limb)).replace("'./outfit-frames.js'",JSON.stringify(mapping)).replace("'./scene-poses.js'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'src/renderer/js/scene-poses.js'),'utf8')).toString('base64')));
const library=JSON.parse(fs.readFileSync(path.join(root,'assets/capri/poses-v3/frames.json'),'utf8'));
Object.assign(library.frames,JSON.parse(fs.readFileSync(path.join(root,'assets/capri/actions-v2/frames.json'),'utf8')).frames);
Object.assign(library.frames,JSON.parse(fs.readFileSync(path.join(root,'assets/capri/walk-v2/default/frames.json'),'utf8')).frames);
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('all illustrated animation cels exist and remain inside their source sheets',async()=>{
  const {POSE_CLIPS}=await modulePromise;assert.equal(Object.keys(library.frames).length,60);
  for(const sequence of Object.values(POSE_CLIPS))for(const [id,ms]of sequence){const frame=production[id]||library.frames[id];assert.ok(frame,id);assert.ok(ms>0);
    assert.ok(fs.existsSync(path.join(root,'assets/capri',production[id]?'sprite-production-v2':frame.sheet==='walk'?'walk-v2/default':frame.sheet==='extra'?'actions-v2':'poses-v3',frame.file)));assert.ok(frame.anchor.x>=0&&frame.anchor.x<=frame.rect.w);assert.ok(frame.anchor.y<=frame.rect.h);}
});
test('clip timing ends precisely and loops walking without blank frames',async()=>{
  const {poseAt,POSE_CLIPS}=await modulePromise;const clip=POSE_CLIPS.walk,total=clip.reduce((n,f)=>n+f[1],0);
  assert.equal(poseAt(clip,0),clip[0][0]);assert.equal(poseAt(clip,total),null);assert.equal(poseAt(clip,total,true),clip[0][0]);
  assert.equal(poseAt(clip,-10),clip[0][0]);
});
test('every pose fits its canvas at all menu scales and both directions',async()=>{
  const setup=`const window={devicePixelRatio:1};const document={createElement:()=>({style:{},getContext:()=>({setTransform(){},clearRect(){},save(){},translate(){},scale(){},restore(){},drawImage(...args){this.last=args;this.draws=(this.draws||0)+1;}})})};`;
  const {PoseSprites}=await import('data:text/javascript;base64,'+Buffer.from(setup+source).toString('base64'));
  const allFrames={...library.frames,...production};
  const outfits=path.join(root,'assets/capri/wardrobe-v2');
  for(const name of fs.readdirSync(outfits)){const file=path.join(outfits,name,'frames.json');if(!fs.existsSync(file))continue;
    const manifest=JSON.parse(fs.readFileSync(file,'utf8'));for(const [id,frame]of Object.entries(manifest.frames))allFrames['test-'+name+'-'+id]=frame;}
  for(const folder of ['keyposes-v1','seated-v1'])for(const name of fs.readdirSync(path.join(root,'assets/capri',folder))){const file=path.join(root,'assets/capri',folder,name,'frames.json');if(!fs.existsSync(file))continue;for(const [id,frame]of Object.entries(JSON.parse(fs.readFileSync(file)).frames))allFrames['audit-'+folder+'-'+name+'-'+id]=frame;}
  for(const entry of fs.readdirSync(path.join(root,'assets/capri/walk-v2'),{withFileTypes:true}).filter(entry=>entry.isDirectory())){const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/capri/walk-v2',entry.name,'frames.json'),'utf8'));for(const [id,frame]of Object.entries(manifest.frames))allFrames['testwalk-'+entry.name+'-'+id]=frame;}
  const frames=Object.fromEntries(Object.entries(allFrames).map(([id,f])=>[id,{...f,image:{width:f.rect.w,height:f.rect.h},alpha:new Uint8Array(f.rect.w*f.rect.h).fill(255)}]));
  const poses=new PoseSprites({append(){}},{frames});
  for(const id of Object.keys(frames))for(const scale of [.45,.6,.8])for(const facing of [-1,1]){
    poses.clip={sequence:[[id,100]],born:0};
    const capri={scale,facing,stance:frames[id].support==='hip'?'sit':'stand',pos:{x:500,y:700},p:{alpha:1},endAct(){}};
    assert.equal(poses.draw(capri,0),true);
    const [,left,top,w,h]=poses.ctx.last,pivot=184*scale-parseFloat(poses.canvas.style.left);
    const drawLeft=facing===1?left:2*pivot-left-w;
    assert.ok(drawLeft>=0&&drawLeft+w<=poses.canvas.width+.001,id+' horizontal clipping');
    assert.ok(top>=0&&top+h<=poses.canvas.height+.001,id+' vertical clipping');
    const frame=frames[id],s=frame.scale*scale,shift=frame.support==='hip'?186*scale:0;
    assert.ok(poses.hit(500+(frame.rect.w/2-frame.anchor.x)*s*facing,700+(frame.rect.h/2-frame.anchor.y)*s-shift),id+' hit target');
    assert.equal(poses.hit(500+(frame.rect.w+10-frame.anchor.x)*s*facing,700-frame.anchor.y*s-shift),false);
    const paints=poses.ctx.draws;capri.pos.x+=10;poses.draw(capri,0);
    assert.equal(poses.ctx.draws,paints,'unchanged cel should not repaint while moving');
  }
  const capri={scale:.6,pos:{x:-1280,y:1200},areaAt:()=>({x:-2560,y:-200,w:2560,h:1440})};
  assert.ok(poses.fits('idle-lounge',capri,1));capri.pos.x=-2560;
  assert.equal(poses.fits('idle-lounge',capri,1),false,'reclining must respect negative-origin display boundaries');
  let closed=0;poses.library.loadOutfit=async()=>({frames:Object.fromEntries(Array.from({length:16},(_,i)=>['poses-'+i,{...frames['gestures-0'],image:{...frames['gestures-0'].image,close(){closed++;}}}]))});
  poses.clip=null;
  const actor={scale:.6,facing:1,stance:'stand',pos:{x:500,y:700},p:{alpha:1},dialogueActive:true};
  await poses.setOutfit('david');poses.draw(actor,0);assert.equal(poses.outfit,'default','automatic change waits through dialogue');
  await poses.setOutfit('david',{manual:true});poses.draw(actor,1);assert.equal(poses.outfit,'david','manual choice is intentional');
  await poses.setOutfit('lucy',{manual:true});actor.dragging=true;poses.draw(actor,2);assert.equal(poses.outfit,'david');
  actor.dragging=false;poses.draw(actor,3);assert.equal(poses.outfit,'lucy');assert.equal(poses.outfits.size,1);assert.equal(closed,16,'old bitmaps released');
  assert.equal(await poses.setOutfit('../../private'),false);
  poses.draw(actor,500,true);const paints=poses.ctx.draws;poses.draw(actor,5000,true);assert.equal(poses.ctx.draws,paints,'reduced motion freezes idle cels');
});
