const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../assets/capri'),dir=path.join(root,'v5-a1-v1'),m=JSON.parse(fs.readFileSync(path.join(dir,'frames.json')));
test('production preserves the approved V5 masters and covers every A1 cel',()=>{
 assert.equal(Object.keys(m.frames).length,20);
 for(const [name,hash]of Object.entries(m.masterHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'face-trace-v5',name+'.svg'))).digest('hex'),hash);
 for(const f of Object.values(m.frames)){
  assert.ok(fs.existsSync(path.join(dir,f.file)));assert.ok(f.modelFamily.startsWith('design-a-v5-'));
  const [a,b,c,d,tx,ty]=f.v5Transform;assert.equal(a,d);assert.equal(b,-c);
  for(const [source,target]of [[[718.5,383.5],f.eyeAnchors.left],[[935.5,298],f.eyeAnchors.right]]){
   assert.ok(Math.abs(a*source[0]+c*source[1]+tx-target[0])<1e-8);assert.ok(Math.abs(b*source[0]+d*source[1]+ty-target[1])<1e-8);
  }
  for(const file of Object.values(f.facePatch.variants))assert.ok(fs.existsSync(path.join(dir,file)));
  assert.ok(f.head.y<f.anchor.y,'head cannot be mistaken for clothing');
 }
});
test('facial states retain one patch size; hair may occlude one eye in a pose',()=>{
 for(const f of Object.values(m.frames)){
  const hashes=new Set();
  for(const state of m.expressions){const bytes=fs.readFileSync(path.join(dir,f.facePatch.variants[state]));hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));assert.equal(bytes.readUInt32BE(16),f.facePatch.w);assert.equal(bytes.readUInt32BE(20),f.facePatch.h);}
  assert.ok(hashes.size>=6,f.file); // an occluded wink must not be drawn over foreground hair
  if(f.file==='frames/key-0.png')assert.equal(hashes.size,8);
 }
});
