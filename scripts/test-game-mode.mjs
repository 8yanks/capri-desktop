import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL('../src/renderer/js/' + name, import.meta.url), 'utf8');
const helper = await import('data:text/javascript;base64,' + Buffer.from(read('game-mode.js')).toString('base64'));
const { protectsGame, edgePosition } = helper;
const view = { w: 1920, h: 1080 };
const game = { id: 1, kind: 'game', x: 200, y: 100, w: 1280, h: 720 };
assert.equal(protectsGame({ fg: 1, wins: [game] }, view), true, 'windowed game');
assert.equal(protectsGame({ fg: 2, wins: [{ ...game, id: 2, kind: 'codex' }, game] }, view), false, 'alt-tab returns to desktop');
assert.equal(protectsGame({ fg: 3, wins: [{ ...game, id: 3, kind: '', x: 0, y: 0, w: 1920, h: 1080 }] }, view), true, 'unknown fullscreen');
assert.equal(protectsGame({ fg: 4, wins: [{ ...game, id: 4, kind: 'capri' }] }, view, true), true, 'opening chat must not disable protection');
for (const w of [800, 1920, 2560, 3840]) {
  for (const x of [0, w / 2 - 1, w / 2, w]) {
    const at = edgePosition({ x, y: 500 }, { w, h: 1080 }, .8);
    assert.ok(at.x <= w * .22 || at.x >= w * .78);
    assert.ok(at.y > 0 && at.y <= 1074);
  }
}

// Exercise the actual movement entry points without constructing WebGL or a window.
const context = vm.createContext({ ...helper, Math, performance: { now: () => 100 },
  rand: (low, high) => (low + high) / 2,
  SPRITE: { height: 420 }, reducedMotion: { matches: false } });
const source = read('capri.js').replace(/^import .*;\r?\n/gm, '').replace('export class Capri', 'class Capri');
vm.runInContext(source + '\nthis.Capri = Capri;', context);
const capri = Object.create(context.Capri.prototype);
Object.assign(capri, { forceGameMode: true, gameActive: true, scale: .8, view,
  pos: { x: 960, y: 1000 }, place() {}, fx: {} });
assert.ok(capri.spot('stage').x >= view.w * .78, 'Codex celebrations cannot target center');
await capri.teleport({ x: 960, y: 700 });
assert.ok(capri.pos.x >= view.w * .78, 'direct teleport is constrained');
assert.equal(capri.gaze({ big: true }), false, 'no satellite across the game');
assert.equal(capri.canPossess(), false, 'no window possession during game');
assert.equal(await capri.pointAt({ x: 800, y: 500, w: 200, h: 100 }), false);
capri.forceGameMode = false;
assert.equal(capri.gameProtected, false);
assert.ok(capri.spot('stage').x > view.w * .3 && capri.spot('stage').x < view.w * .7);
capri.setWindows({ fg: 1, wins: [game] });
assert.equal(capri.gameProtected, false, 'a detected game must not re-enable manual mode');
const configContext = vm.createContext({ module: { exports: {} }, console,
  require(name) {
    if (name === 'electron') return { app: { getPath: () => '/unused' } };
    if (name === 'node:fs') return { statSync: () => ({size:80}), readFileSync: () => JSON.stringify({ gameMode: true, scale: .9, lang: 'fr' }), mkdirSync() {}, writeFileSync() {} };
    if (name === 'node:path') return { join: (...parts) => parts.join('/'), dirname: () => '/unused' };
    throw Error(name);
  } });
vm.runInContext(fs.readFileSync(new URL('../src/main/config.js', import.meta.url), 'utf8'), configContext);
assert.equal(configContext.module.exports.load().gameMode, false, 'saved true is ignored on startup');
assert.equal(configContext.module.exports.load().scale, .9, 'other preferences survive');
assert.equal(configContext.module.exports.save({ gameMode: true }).gameMode, true, 'manual toggle works during session');
console.log('Manual game mode, startup reset and actual movement guards: PASS');

assert.equal(configContext.module.exports.load().lang, 'en', 'stored French cannot override English');
assert.equal(configContext.module.exports.save({ lang: 'auto' }).lang, 'en', 'system language cannot override English');
assert.equal(configContext.module.exports.save({scale:NaN,volume:-1,unknown:true}).scale,.9,'invalid numeric input preserves the current size');
assert.equal(JSON.stringify(configContext.module.exports.sanitize(null)),'{}');
assert.equal('unknown' in configContext.module.exports.load(),false);
