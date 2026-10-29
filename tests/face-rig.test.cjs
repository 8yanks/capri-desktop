const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/renderer/js/face-rig.js'),'utf8');
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const {rig}=JSON.parse(fs.readFileSync(path.join(root,'assets/capri/face-prototype-a2/landmarks.json'),'utf8'));
function context(){const calls=[],ctx=new Proxy({calls},{get(target,key){return key in target?target[key]:(...args)=>calls.push([key,...args]);}});return ctx;}
test('all facial expressions reuse fixed source landmarks without drawing a body image',async()=>{
 const {drawFace,FACE_EXPRESSIONS}=await modulePromise,original=JSON.stringify(rig),signatures=[];
 for(const expression of FACE_EXPRESSIONS){const ctx=context();drawFace(ctx,rig,expression,400);assert.equal(ctx.calls.filter(c=>c[0]==='translate').length,3);assert.ok(!ctx.calls.some(c=>c[0]==='drawImage'));assert.equal(JSON.stringify(rig),original);signatures.push(JSON.stringify(ctx.calls));}
 assert.equal(new Set(signatures).size,6);
});
test('independent eye and mouth layers each use their own anchor',async()=>{
 const {drawFacePart}=await modulePromise;
 for(const part of ['leftEye','rightEye','mouth']){const ctx=context();drawFacePart(ctx,rig,part);assert.deepEqual(ctx.calls.filter(c=>c[0]==='translate'),[['translate',rig[part].x,rig[part].y]]);}
 assert.throws(()=>drawFacePart(context(),rig,'body'),/Unknown face part/);
});
test('face rig rejects invalid coordinates and off-image landmarks',async()=>{
 const {validateFaceRig}=await modulePromise;assert.equal(validateFaceRig(rig,1024,1536),rig);
 for(const bad of [NaN,-20,1100])assert.throws(()=>validateFaceRig({...rig,leftEye:{...rig.leftEye,x:bad}},1024,1536));
 assert.throws(()=>validateFaceRig({...rig,mouth:{...rig.mouth,ry:0}},1024,1536));
});
