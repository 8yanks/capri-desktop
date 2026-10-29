const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../src/renderer/js/clean-upstream-eyes.js'),'utf8'),modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('clean eyes use complete native paths rather than thresholded bitmap fragments',async()=>{
 const {drawCleanPair}=await modulePromise,calls=[],ctx=new Proxy({},{get(_t,k){return (...a)=>calls.push([k,...a]);}});
 drawCleanPair(ctx,'neutral');assert.deepEqual(calls.filter(c=>c[0]==='translate'),[['translate',114,117],['translate',138,117]]);
 assert.equal(calls.filter(c=>c[0]==='ellipse').length,6);assert.ok(!calls.some(c=>['drawImage','getImageData','putImageData'].includes(c[0])));
 assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
});
test('closed lids remove the rings and pupils; wink closes only one eye',async()=>{
 const {drawCleanPair}=await modulePromise;const shapes=state=>{const calls=[],ctx=new Proxy({},{get(_t,k){return (...a)=>calls.push([k,...a]);}});drawCleanPair(ctx,state);return calls.filter(c=>c[0]==='ellipse').length;};
 assert.equal(shapes('closed'),0);assert.equal(shapes('wink'),3);assert.equal(shapes('neutral'),6);
});
