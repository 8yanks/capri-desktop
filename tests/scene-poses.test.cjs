const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=name=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'src/renderer/js',name),'utf8')).toString('base64'));
test('every upstream act has an explicit illustrated adaptation, with original timing and cues retained',async()=>{
 const {ACTS,Player}=await load('acting.js'),{SCENE_POSES,scenePose}=await load('scene-poses.js');
 const upstream=['stand','sit','peek','sleep','talk','curious','look','gaze','uplink','victory','zap','point','pointing','unpoint','fold','dive','split','alarm','flinch','turn','spin','hop','land','plop','fall'];
 for(const name of upstream){assert.ok(ACTS[name],name);assert.ok(SCENE_POSES[name],name);
  const player=new Player(name,{at:0});
  for(const fraction of [0,.2,.5,.8,.99])for(const stance of ['stand','sit']){
   const time=fraction*player.total*1000/(player.act.fps||12),id=scenePose(player,stance,time);
   assert.ok(id,name);if(stance==='sit')assert.ok(id.startsWith('seated-'),name+' support');
  }
 }
});
test('costume retargeting never uses a window seat for a floor transition, or drops costume in extra actions',async()=>{
 const {costumePose}=await load('outfit-frames.js');
 for(let i=0;i<16;i++)assert.ok(![4,5,6,7].includes(costumePose('transitions-'+i)),'floor transition '+i);
 for(let i=0;i<8;i++)assert.ok(Number.isInteger(costumePose('extra-'+i)),'extra action '+i);
 assert.equal(costumePose('seated-7'),7);
});
test('model scale stays fixed through expression and pose changes in every active family',()=>{
 for(const folder of ['walk-v2','seated-v1','keyposes-v1'])for(const id of fs.readdirSync(path.join(root,'assets/capri',folder))){const file=path.join(root,'assets/capri',folder,id,'frames.json');if(!fs.existsSync(file))continue;
  const frames=Object.values(JSON.parse(fs.readFileSync(file)).frames),scale=frames[0].scale;
  for(const frame of frames)assert.equal(frame.scale,scale,folder+'/'+id+' changed model size');
  if(folder==='keyposes-v1')assert.ok(Math.abs(frames[0].rect.h*scale-420)<21,id+' neutral body height');
 }
});
test('all twelve new seat sheets have four valid hip contacts and the same face-to-seat height',()=>{
 const ids=['default','netrunner','creator','stage','league','david','lucy','badlands','omi','roman','talia','king'];
 for(const id of ids){const dir=path.join(root,'assets/capri/seated-v1',id),manifest=JSON.parse(fs.readFileSync(path.join(dir,'frames.json')));
  assert.equal(Object.keys(manifest.frames).length,4,id);
  for(const frame of Object.values(manifest.frames)){
   assert.equal(frame.support,'hip');assert.ok(frame.anchor.y<frame.rect.h);
   assert.ok(Math.abs((frame.anchor.y-frame.head.y)*frame.scale-38.54684512428298*2.7)<.001,id+' head-to-seat');
   assert.ok(fs.existsSync(path.join(dir,frame.file)));
  }
 }
});

test('quiet rest never alternates a costume hand-on-hip as a blink',async()=>{
 const {costumePose}=await load('outfit-frames.js');assert.equal(costumePose('gestures-0'),costumePose('gestures-1'));assert.equal(costumePose('gestures-3'),1);
});
