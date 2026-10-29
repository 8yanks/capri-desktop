const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../src/renderer/js/a1-face-motion.js'),'utf8');
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('A1 blink is brief and has fully closed and fully open samples',async()=>{
 const {blinkAt}=await modulePromise;assert.equal(blinkAt(0),0);assert.equal(blinkAt(1900),0);assert.equal(blinkAt(2300),0);assert.equal(blinkAt(2120),1);assert.equal(blinkAt(4800),0);
 for(let t=0;t<12000;t+=17)assert.ok(blinkAt(t)>=0&&blinkAt(t)<=1);
});
test('A1 speech returns to the original mouth after its preview phrase',async()=>{
 const {speechAt}=await modulePromise;for(const t of [0,2500,5100,6000])assert.equal(speechAt(t),0);assert.ok(speechAt(3300)>0);
 for(let t=0;t<12000;t+=17)assert.ok(speechAt(t)>=0&&speechAt(t)<=1);
});
test('all A1 eye and mouth rectangles retain their original source anchors',async()=>{
 const {A1_FACE}=await modulePromise;assert.equal(Object.keys(A1_FACE).length,3);
 for(const p of Object.values(A1_FACE)){assert.ok(p.x>=0&&p.y>=0&&p.x+p.w<=274&&p.y+p.h<=523);assert.ok(p.cx>=p.x&&p.cx<=p.x+p.w&&p.cy>=p.y&&p.cy<=p.y+p.h);}
});
