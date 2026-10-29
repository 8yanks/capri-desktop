import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { desktopLayout } = require('../src/main/desktop-layout');
const left = { id: 1, workArea: { x: -1920, y: -200, width: 1920, height: 1040 } };
const right = { id: 2, workArea: { x: 0, y: 0, width: 2560, height: 1400 } };
const free = desktopLayout([left, right], right, false);
assert.deepEqual(free.bounds, { x: -1920, y: -200, width: 4480, height: 1600 });
assert.deepEqual(free.areas[1], { id: 2, x: 1920, y: 200, w: 2560, h: 1400 });
assert.deepEqual(desktopLayout([left, right], right, true).bounds, right.workArea);
assert.equal(desktopLayout([left, right], right, true).areas.length, 1);
assert.deepEqual(desktopLayout([right], right, false).bounds, right.workArea, 'unplugging an extra screen');
const math = Object.create(Math); math.random = () => .9;
const context = vm.createContext({ Math: math, performance: { now: () => 0 },
  SPRITE: { height: 420, feet: { y: 400 }, hip: 200 },
  rand: (a, b) => (a + b) / 2, clamp: (n, a, b) => Math.max(a, Math.min(b, n)) });
const source = fs.readFileSync(new URL('../src/renderer/js/capri.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '').replace('export class Capri', 'class Capri');
vm.runInContext(source + '\nthis.Capri = Capri;', context);
const capri = Object.create(context.Capri.prototype);
Object.assign(capri, { areas: free.areas, view: { w: 4480, h: 1600 }, scale: .6,
  pos: { x: 900, y: 900 }, forceGameMode: false });
assert.equal(capri.floor, 1034, 'floor follows shorter left monitor');
const destination = capri.spot('random');
assert.ok(destination.x >= 1920 && destination.x < 4480, 'free wandering can select second monitor');
capri.pos = destination;
assert.equal(capri.floor, 1594, 'floor follows right monitor');
assert.equal(capri.areaAt({ x: 100, y: 1400 }).id, 1, 'empty gap maps to nearest real screen');
const discord = { id: 7, x: 2400, y: 600, w: 700, h: 500, kind: '' };
assert.equal(capri.canSit(discord), true, 'Discord on second screen can provide a seat');
assert.equal(capri.canSit({ ...discord, y: 220 }), false, 'no seat without headroom on that screen');
capri.windows = { wins: [discord] };
assert.equal(capri.pickSeat().win.id, 7);
console.log('Multi-monitor layout, negative origins, floors, wandering, app seats and game isolation: PASS');
