import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read = file => fs.readFileSync(new URL('../src/renderer/js/' + file, import.meta.url), 'utf8');
const { SPRITE } = await import('data:text/javascript;base64,' + Buffer.from(read('sprite.js')).toString('base64'));
const { ACTS, Player } = await import('data:text/javascript;base64,' + Buffer.from(read('acting.js')).toString('base64'));
const reducedMotion = { matches: false }, performed = [], emotes = [];
let clock=0;
const context = vm.createContext({ Math, SPRITE, ACTS, Player, reducedMotion, performance: { now: () => clock },
  rand:(low)=>low, clamp: (n, a, b) => Math.max(a, Math.min(b, n)), pick: list => list[0] });
vm.runInContext(read('capri.js').replace(/^import .*;\r?\n/gm, '').replace('export class Capri', 'class Capri') + '\nthis.Capri = Capri;', context);
const capri = Object.create(context.Capri.prototype);
Object.assign(capri, { scale: .6, pos: { x: 700, y: 1074 }, view: { w: 1920, h: 1080 },
  stance: 'stand', mode: 'idle', facing: 1, tilt: 0, bob: 0, p: { alpha: 1, sit: 0 },poses:{},
  perform(name, dir) { performed.push({ name, dir }); }, fx: { emote: (...args) => emotes.push(args) } });
assert.equal(capri.idleActivity('lounge'), true);
assert.equal(performed.at(-1).name, 'idle-lounge');
assert.equal(capri.idleActivity('exercise'), true);
capri.stance = 'sit';
assert.equal(capri.idleActivity('lounge'), false, 'never reclines through a window ledge');
assert.equal(capri.idleActivity('exercise'), false);
assert.equal(capri.idleActivity('seated-kick'), true);
capri.stance = 'stand'; capri.forceGameMode = true;
assert.equal(capri.idleActivity('lounge'), false);
assert.equal(capri.idleActivity('exercise'), false);
assert.equal(capri.idleActivity('wave'), true);
capri.forceGameMode = false;
for (const flag of ['resourceLocked','busy','dragging','dialogueActive','stowed','dormant','hidden']) {
  capri[flag] = true; assert.equal(capri.idleActivity('wave'), false, flag); capri[flag] = false;
}
reducedMotion.matches = true; assert.equal(capri.idleActivity('wave'), false); reducedMotion.matches = false;
capri.idleActivity(); const first = performed.at(-1).name;
const calls=performed.length;assert.equal(capri.idleActivity(),false,'automatic gestures share a quiet period');assert.equal(performed.length,calls);
clock=90000;
capri.idleActivity(); assert.notEqual(performed.at(-1).name, first, 'no immediate repeated random activity');
assert.ok(performed.every(a=>a.name.startsWith('idle-')),'no procedural flourish fallback');
assert.equal(capri.idleActivity('dance'),true,'explicit actions bypass the ambient quiet period');
assert.equal(capri.idleActivity('heart'), true); assert.equal(emotes.at(-1)[2], '♡');
assert.equal(capri.idleActivity('unknown'), false);
for (const name of ['stretch','exercise','dance','wave','shrug','lounge','seated-kick']) {
  const player = new Player('idle-' + name, { dir: 1, at: 0 });
  assert.ok(player.total > 0 && player.total <= 120, 'bounded activity duration');
  for (let t = 0; t < player.total * 1000 / 12; t += 60) {
    const drawing = player.sample(t); if (!drawing) continue;
    const pose = player.resolve(drawing.pose, 1);
    for (const value of Object.values(pose)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
  }
}
capri.alphaMap = new Uint8Array(SPRITE.width * SPRITE.height * 4).fill(255);
capri.tilt = 88; capri.bob = -100;
const head = capri.head();
assert.equal(capri.hit(head.x, head.y), true, 'reclining sprite remains draggable at its rotated head');
// A simulated six minutes produces four small gestures, without competing legacy timers.
Object.assign(capri,{tilt:0,bob:0,nextAmbientAt:90000,nextMove:Infinity,nextShed:Infinity,nextGaze:Infinity,lastActivity:0});
performed.length=0;
for(clock=0;clock<=360000;clock+=1000){capri.lastActivity=clock;capri.behave(clock);}
assert.equal(performed.length,4,'one ambient gesture every90 seconds at the minimum delay');
assert.ok(performed.every(a=>['idle-stretch','idle-shrug'].includes(a.name)));
const count=performed.length;capri.flourish();assert.equal(performed.length,count,'flourish shares ambient cooldown');
// Actual travel selection, not just canvas mirroring, supports both directions.
capri.poses={play(name){assert.equal(name,'walk');this.clip={};return true;},stop(){}};
capri.act=null;capri.pos={x:100,y:1074};assert.equal(capri.walkAround(),true);assert.equal(capri.facing,1);assert.ok(capri.poses.clip.travel.to>100);
capri.endAct(false);capri.pos={x:1800,y:1074};assert.equal(capri.walkAround(),true);assert.equal(capri.facing,-1);assert.ok(capri.poses.clip.travel.to<1800);
capri.endAct(false);
// Sleep fade and normal rest must keep the illustrated DA rather than old procedural idle.
capri.poses.draw=()=>true;capri.canvas={style:{}};capri.place=()=>{};capri.sprite={draw(){throw Error('legacy idle rendered');}};
capri.mode='sleep';capri.p.alpha=.55;
for(const stance of ['stand','sit','fall']){capri.stance=stance;capri.drawFrame(clock);assert.equal(capri.canvas.style.visibility,'hidden');}
console.log('Idle activities, support/game/interaction guards, no-repeat, valid poses and reclining hit test: PASS');

capri.stance='stand';capri.act={player:{poseClip:true},done(){}};capri.landing=()=>({y:1080,stance:'stand'});capri.setStance=value=>{capri.stance=value;};capri.fall();assert.equal(capri.stance,'fall');assert.equal(capri.act,null,'drop interrupts previous illustrated action');

// Busy scene timelines keep firing cues while their body remains illustrated.
let sceneTicks=0,sceneDraws=0;
capri.animate=()=>{sceneTicks++;};capri.poses.draw=()=>{sceneDraws++;return true;};
capri.busy=true;capri.stance='stand';capri.mode='idle';
for(const name of ['gaze','uplink','dive']){
 capri.act={player:{name,poseClip:false}};capri.p.alpha=1;capri.drawFrame(clock);
}
capri.act=null;capri.p.alpha=0;capri.drawFrame(clock);
assert.equal(sceneTicks,3,'legacy scene cues still advance');
assert.equal(sceneDraws,4,'satellite, possession and invisible teleport keep illustrated renderer');

capri.act=null;capri.hidden=false;capri.p.alpha=1;
for(const stance of ['stand','sit','fall','peek']){
 capri.stance=stance;capri.resourceLocked=true;capri.drawFrame(clock);
 assert.equal(capri.canvas.style.visibility,'hidden','all stances use current DA even under resource pressure');
}
capri.resourceLocked=false;capri.poses.hide=()=>{};
for(const flag of ['stowed','dormant','hidden']){capri[flag]=true;capri.drawFrame(clock);capri[flag]=false;}
capri.poses.draw=()=>false;capri.drawFrame(clock);
assert.equal(capri.canvas.style.visibility,'hidden','missing current cel never reveals retired body');

capri.stance='sit';capri.act=null;capri.busy=false;capri.poses={};capri.mode='idle';capri.lastActivity=0;clock=180000;
assert.equal(capri.idleActivity('seated-kick'),true);assert.equal(performed.at(-1).dir,0,'leg swing keeps facing');
assert.equal(capri.idleActivity('wave'),true);assert.equal(performed.at(-1).dir,0,'wave keeps facing');
capri.stance='stand';capri.pos={x:700,y:1074};capri.nextAmbientAt=0;capri.nextMove=Infinity;capri.nextGaze=Infinity;capri.nextShed=Infinity;
capri.behave(clock);assert.equal(performed.at(-1).name,'idle-lounge','long idle can lie down');
const lounges=performed.filter(x=>x.name==='idle-lounge').length;clock+=1000;capri.behave(clock);assert.equal(performed.filter(x=>x.name==='idle-lounge').length,lounges,'no repeated lie-down spam');
