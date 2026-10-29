import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.matchMedia = () => ({ matches: true });
globalThis.document = { documentElement: { dataset: {} } };
const source = fs.readFileSync(new URL('../src/renderer/js/util.js', import.meta.url), 'utf8');
const util = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
assert.equal(util.reducedMotion.matches, true);
util.configureMotion('full'); assert.equal(util.reducedMotion.matches, false);
util.configureMotion('system'); assert.equal(util.reducedMotion.matches, true);
util.configureMotion('reduced'); assert.equal(util.reducedMotion.matches, true);
let host;
vm.runInNewContext(fs.readFileSync(new URL('../src/preload.js', import.meta.url), 'utf8'), {
  require: () => ({ contextBridge: { exposeInMainWorld: (name, api) => { host = api; } }, ipcRenderer: { on() {}, send() {}, invoke() {} } }),
});
const guide = fs.readFileSync(new URL('../src/renderer/js/guide.js', import.meta.url), 'utf8');
for (const match of guide.matchAll(/this\.host\.([a-zA-Z]+)\(/g)) assert.equal(typeof host[match[1]], 'function', `Missing guide host API: ${match[1]}`);
console.log('Motion override and all guide/preload API names: PASS');
