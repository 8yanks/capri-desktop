const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/renderer/js/faithful-mimics.js'),'utf8'),modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('context changes eye and mouth states independently and preserves speech pauses',async()=>{
 const {sampleMimic}=await modulePromise;
 assert.deepEqual(sampleMimic('idle',0),{context:'idle',eyes:'normal',mouth:'neutral'});
 assert.equal(sampleMimic('smug',0).eyes,'wink');assert.equal(sampleMimic('smug',900).eyes,'normal');
 assert.equal(sampleMimic('laugh',0).eyes,'happy');assert.equal(sampleMimic('sleep',5000).eyes,'closed');
 assert.equal(sampleMimic('talk',220).mouth,'neutral');assert.equal(sampleMimic('talk',0).mouth,'small');assert.equal(sampleMimic('talk',400).mouth,'open');
 assert.equal(sampleMimic('idle',400,{speaking:false}).mouth,'neutral');assert.equal(sampleMimic('idle',400,{speaking:true}).mouth,'open');
});
test('blink swaps a held cel briefly; reduced motion stops mouth cycling',async()=>{
 const {sampleMimic}=await modulePromise;assert.equal(sampleMimic('idle',3599).eyes,'normal');assert.equal(sampleMimic('idle',3670).eyes,'closed');assert.equal(sampleMimic('idle',3760).eyes,'normal');
 assert.equal(sampleMimic('idle',3670,{reducedMotion:true}).eyes,'normal');assert.equal(sampleMimic('talk',400,{reducedMotion:true}).mouth,'neutral');
});
test('all context samples resolve new transparent art and calibrated anchors',async()=>{
 const {sampleMimic,MIMIC_CONTEXTS,A1_MIMIC_ANCHORS}=await modulePromise,base=path.join(root,'assets/capri/faithful-mimics-v2'),m=JSON.parse(fs.readFileSync(path.join(base,'frames.json')));
 assert.equal(Object.keys(m.frames).length,18);
 for(const context of MIMIC_CONTEXTS)for(let t=0;t<11000;t+=73){const s=sampleMimic(context,t);for(const id of ['leftEye-'+s.eyes,'rightEye-'+s.eyes,'mouth-'+s.mouth])assert.ok(m.frames[id],id);}
 for(const f of Object.values(m.frames)){assert.ok(fs.existsSync(path.join(base,f.file)));assert.ok(f.anchor.x>=0&&f.anchor.x<=f.sourceRect.w&&f.anchor.y>=0&&f.anchor.y<=f.sourceRect.h);}
 for(const a of Object.values(A1_MIMIC_ANCHORS)){assert.ok(a.x>=0&&a.x<=274&&a.y>=0&&a.y<=523);assert.ok(a.width>0);}
});
test('A1 eyes share a smaller optical diameter and a horizontal baseline',async()=>{
 const {A1_MIMIC_ANCHORS:a,MOUTH_LEVEL_ANGLES}=await modulePromise;
 assert.equal(a.leftEye.y,a.rightEye.y);assert.equal(a.leftEye.width,a.rightEye.width);assert.equal(a.leftEye.width,14);
 assert.equal(a.leftEye.angle,a.rightEye.angle);assert.equal(a.mouth.angle,0);assert.equal(a.mouth.x,(a.leftEye.x+a.rightEye.x)/2);
 assert.ok(MOUTH_LEVEL_ANGLES.neutral>0&&MOUTH_LEVEL_ANGLES.smirk>0,'compensate painted-in mouth slope');
 const m=JSON.parse(fs.readFileSync(path.join(root,'assets/capri/faithful-mimics-v2/frames.json')));
 for(const state of ['normal','curious','focused'])for(const side of ['leftEye','rightEye'])assert.ok(m.frames[side+'-'+state].anchor.diameter>0);
});
