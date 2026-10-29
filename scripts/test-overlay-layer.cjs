const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ownWindows = [];
const context = { module: { exports: {} }, __dirname: path.resolve(__dirname, '../src/main'),
  require: name => name === 'electron' ? { screen: {}, BrowserWindow: { getAllWindows: () => ownWindows } } : require(name) };
vm.runInNewContext(fs.readFileSync(path.join(context.__dirname, 'windows.js'), 'utf8'), context);
const { keepOverlayAbove } = context.module.exports;
const calls = [];
const overlay = { isDestroyed: () => false, isVisible: () => true,
  getBounds: () => ({ width: 1920, height: 1040 }),
  setAlwaysOnTop: (...args) => calls.push(args), moveTop: () => calls.push('raise'),
  focus: () => { throw Error('Must not steal game focus'); } };
const game = { fg: 1, wins: [{ id: 1, kind: 'game' }] };
assert.equal(keepOverlayAbove(overlay, game), true);
assert.equal(calls[0][0], true);
assert.equal(calls[0][1], 'screen-saver');
assert.equal(calls[1], 'raise');
const chatCalls = [];
ownWindows.push({ isDestroyed: () => false, isVisible: () => true, isMinimized: () => false,
  setAlwaysOnTop: (...args) => chatCalls.push(args), moveTop: () => chatCalls.push('raise') });
keepOverlayAbove(overlay, game);
assert.equal(chatCalls[0][1], 'screen-saver');
assert.equal(chatCalls[1], 'raise', 'chat is also raised above external applications');
assert.equal(keepOverlayAbove(overlay, { fg: 2, wins: [{ id: 2, kind: 'capri' }] }), false);
assert.equal(keepOverlayAbove(overlay, null), false);
assert.equal(keepOverlayAbove(overlay, { fg: 9, wins: [{ id: 9, kind: 'explorer' }] }), true, 'all other applications, not only games');
assert.equal(keepOverlayAbove({ ...overlay, isVisible: () => false }, game), false);
assert.equal(keepOverlayAbove({ ...overlay, capriInteractive: true }, game), false, 'never change z-order during mouse interaction');
assert.equal(keepOverlayAbove({ ...overlay, isDestroyed: () => true }, game), false);
assert.equal(keepOverlayAbove(overlay, { fg: 3, wins: [{ id: 3, kind: '', x: 0, y: 0, w: 1920, h: 1080 }] }), true);
console.log('Overlay raised above game without focus; hidden/destroyed/chat guards: PASS');
