import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context = vm.createContext({ Math, performance: { now: () => 0 },
  SPRITE: { feet: { y: 400 }, hip: 200 }, clamp: (n, a, b) => Math.max(a, Math.min(b, n)) });
const source = fs.readFileSync(new URL('../src/renderer/js/capri.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '').replace('export class Capri', 'class Capri');
vm.runInContext(source + '\nthis.Capri = Capri;', context);
const icon = { id: 'icon:1', kind: 'desktop-icon', x: 200, y: 300, w: 80, h: 70 };
const capri = Object.create(context.Capri.prototype);
let fell = false;
Object.assign(capri, { scale: .5, forceGameMode: false, view: { w: 1920, h: 1080 },
  windows: { wins: [], icons: [icon] }, pos: { x: 220, y: 400 },
  setStance(stance, { perch } = {}) { this.stance = stance; this.perch = perch; },
  perform() {}, place() {}, voice: { play() {} }, fall() { fell = true; } });
assert.equal(capri.canSit(icon), true, 'small icon is a valid support');
capri.drop();
assert.equal(capri.stance, 'sit');
assert.equal(capri.pos.x, 240, 'drop snaps to icon center');
assert.equal(capri.perch.id, icon.id);
capri.setWindows({ wins: [], icons: [{ ...icon, x: 300 }] });
assert.equal(capri.pos.x, 340, 'rides an icon moved by the user');
capri.setWindows({ wins: [], icons: [] });
assert.equal(fell, true, 'falls if icon disappears');
capri.windows = { wins: [{ id: 5, x: 100, y: 200, w: 400, h: 400 }], icons: [icon] };
assert.equal(capri.covered(icon, 240), true, 'window covering icon prevents sitting');
capri.forceGameMode = true;
assert.equal(capri.canSit(icon), false, 'game mode still prevents desktop seating');
console.log('Desktop icon drop, narrow support, movement, removal, occlusion and game guard: PASS');
