const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/renderer/js/upstream-mimics.js'),'utf8').replace("'./clean-upstream-eyes.js'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'src/renderer/js/clean-upstream-eyes.js'),'utf8')).toString('base64'))),modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('original paired eye basis maps both eyes onto one shared facial plane',async()=>{
 const {faceTransform,UPSTREAM_SOURCES}=await modulePromise;
 for(const s of Object.values(UPSTREAM_SOURCES)){const f=faceTransform(s),points=s.eyes.map(([x,y])=>{const dx=x-f.origin.x,dy=y-f.origin.y;return {x:f.target.x+f.scale*(dx*Math.cos(f.angle)-dy*Math.sin(f.angle)),y:f.target.y+f.scale*(dx*Math.sin(f.angle)+dy*Math.cos(f.angle))};});
 assert.ok(Math.abs(points[0].x-114)<1e-8);assert.ok(Math.abs(points[1].x-138)<1e-8);assert.ok(Math.abs(points[0].y-117)<1e-8);assert.ok(Math.abs(points[1].y-117)<1e-8);}
});
test('all original source textures and independently extracted layers ship together',async()=>{
 const {UPSTREAM_SOURCES}=await modulePromise,base=path.join(root,'assets/capri/upstream-mimics-v3');
 for(const s of Object.values(UPSTREAM_SOURCES))assert.ok(fs.existsSync(path.join(base,s.file)));
 const layers=JSON.parse(fs.readFileSync(path.join(base,'layers/coordinates.json')));assert.equal(Object.keys(layers).length,18);
 for(const [id,p]of Object.entries(layers)){assert.ok(fs.existsSync(path.join(base,'layers',id+'.png')));assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}
});
test('speech uses the original matched mouth cels and then returns to neutral',async()=>{
 const {upstreamState}=await modulePromise;assert.equal(upstreamState('talk',0),'neutral');assert.equal(upstreamState('talk',220),'mouth1');assert.equal(upstreamState('talk',440),'mouth2');assert.equal(upstreamState('talk',1000),'mouth3');assert.equal(upstreamState('talk',1200),'neutral');assert.equal(upstreamState('sleep',5000),'closed');assert.equal(upstreamState('smug',100),'wink');
});
