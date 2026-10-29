const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ids=['default','netrunner','creator','stage','league','david','lucy','badlands','omi','roman','talia','king'];
test('all twelve walks contain opposite contacts and under-body passing poses',()=>{
  for(const id of ids){
    const folder=path.join(root,'assets/capri/walk-v2',id),m=JSON.parse(fs.readFileSync(path.join(folder,'frames.json'),'utf8'));
    assert.equal(Object.keys(m.frames).length,8,id);
    const delta=index=>{const f=m.frames['walk-'+index],g=f.gait;assert.ok(g?.green&&g?.pink,id+' phase '+index+' must retain both leg colors');return g.green.x-g.pink.x;};
    const first=delta(0),opposite=delta(4),stride=Math.max(Math.abs(first),Math.abs(opposite));
    assert.ok(first>0&&opposite<0,id+' must exchange the forward green and pink legs');
    for(const index of [2,6])assert.ok(Math.abs(delta(index))<stride*.65,id+' needs a narrower passing pose');
    for(const [name,f] of Object.entries(m.frames)){
      assert.match(name,/^walk-[0-7]$/);assert.ok(fs.existsSync(path.join(folder,f.file)));
      assert.equal(f.support,'floor');assert.equal(f.anchor.x,f.head.x,'torso pivot avoids alternating-toe lateral jumps');
      const s=m.sheets[f.sheet],r=f.rect;assert.ok(r.x>0&&r.y>0&&r.x+r.w<s.width&&r.y+r.h<s.height,id+' has clipped artwork');
    }
  }
});
test('runtime selects dedicated eight-frame outfit walks instead of old lunge cels',async()=>{
  const mapping='data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'src/renderer/js/outfit-frames.js'),'utf8')).toString('base64');
  const limb='data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'src/renderer/js/limb-motion.js'),'utf8')).toString('base64');
const source=require('./renderer-loader.cjs').source('pose-sprites.js').replace("'./face-rig.js'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'src/renderer/js/face-rig.js'),'utf8')).toString('base64'))).replace("'./hair-motion.js'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'src/renderer/js/hair-motion.js'),'utf8')).toString('base64'))).replace("'./limb-motion.js'",JSON.stringify(limb)).replace("'./outfit-frames.js'",JSON.stringify(mapping)).replace("'./scene-poses.js'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'src/renderer/js/scene-poses.js'),'utf8')).toString('base64')));
  const {PoseSprites,POSE_CLIPS,poseAt}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  assert.deepEqual(POSE_CLIPS.walk.map(([id])=>id),Array.from({length:8},(_,i)=>'walk-'+i));
  const chosen={correct:true},wrong={oldLunge:true},actor={costume:{frames:{'walk-4':chosen,'poses-8':wrong}},library:{frames:{}}};
  assert.equal(PoseSprites.prototype.frame.call(actor,'walk-4'),chosen);
  assert.equal(poseAt(POSE_CLIPS.walk,480,true),'walk-4');assert.equal(poseAt(POSE_CLIPS.walk,960,true),'walk-0');
});
