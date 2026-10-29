const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/renderer/js/wardrobe.js'),'utf8');
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const context=name=>({fg:5,wins:[{id:5,context:name}]});
test('context selects only recognized app themes and ignores Capri chat',async()=>{
  const {outfitForContext}=await modulePromise;
  for(const [app,look]of Object.entries({cyberpunk:'netrunner',creator:'creator',music:'stage',league:'league'}))assert.equal(outfitForContext(context(app)),look);
  assert.equal(outfitForContext(context('unknown')),'default');
  assert.equal(outfitForContext({fg:5,wins:[{id:5,kind:'capri'}]}),null);
  assert.equal(outfitForContext(null),null);
});
test('auto outfits wait for stable context, cooldown and safe interaction; manual wins',async()=>{
  const {Wardrobe}=await modulePromise;let now=0;const changes=[];
  const wardrobe=new Wardrobe({enabled:true,apply:id=>changes.push(id),now:()=>now});
  wardrobe.update(context('cyberpunk'));now=3499;wardrobe.update(context('cyberpunk'));assert.equal(changes.length,0);
  now=3500;wardrobe.update(context('cyberpunk'));assert.equal(changes.at(-1),'netrunner');
  now=4000;wardrobe.update(context('creator'));now=15000;wardrobe.update(context('creator'));assert.equal(changes.length,1,'cooldown');
  now=16000;wardrobe.update(context('creator'),true);assert.equal(changes.length,1,'interaction guard');
  wardrobe.update(context('creator'));assert.equal(changes.at(-1),'creator');
  wardrobe.configure('lucy');now=60000;wardrobe.update(context('league'));assert.equal(changes.at(-1),'lucy');
  wardrobe.configure('auto');wardrobe.update(context('league'));now+=3500;wardrobe.update(context('league'));assert.equal(changes.at(-1),'league');
});
test('all requested outfits ship the shared-model action, seat and directional walk assets',async()=>{
  const {OUTFITS}=await modulePromise;
  for(const id of OUTFITS.filter(id=>id!=='default'))for(const [kind,count]of [['keyposes-v1',8],['seated-v1',4],['walk-v2',8]]){
    const folder=path.join(root,'assets/capri',kind,id),manifest=JSON.parse(fs.readFileSync(path.join(folder,'frames.json'),'utf8'));
    assert.equal(Object.keys(manifest.frames).length,count,id+'/'+kind);
    for(const frame of Object.values(manifest.frames)){
      assert.ok(fs.existsSync(path.join(folder,frame.file)));assert.ok(frame.face,id+' mask');
      const sheet=manifest.sheets[frame.sheet];assert.ok(frame.rect.x>0&&frame.rect.y>0&&frame.rect.x+frame.rect.w<sheet.width&&frame.rect.y+frame.rect.h<sheet.height,id+' clipped source cel');
    }
  }
});

test('costumes remain paused for both automatic and manual selection by default',async()=>{const {Wardrobe}=await modulePromise;let last;const wardrobe=new Wardrobe({apply:id=>{last=id;}});wardrobe.configure('david');wardrobe.update(context('cyberpunk'));assert.equal(wardrobe.current,'default');assert.equal(wardrobe.mode,'default');assert.equal(last,'default');});
