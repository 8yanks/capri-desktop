'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { createPresence, frame, PHRASES } = require('../src/main/discord-presence');
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'capri-presence-'));
const file = path.join(folder, 'settings.json');
let sockets = [], interval, now = 100000;
const realInterval = global.setInterval, realNow = Date.now;
global.setInterval = fn => { interval = fn; return { unref() {} }; };
Date.now = () => now;
function connect(options) {
  assert.match(options.path, /^\\\\\?\\pipe\\discord-ipc-\d$/);
  const socket = new EventEmitter(); socket.frames = [];
  socket.setTimeout = () => {};
  socket.write = bytes => socket.frames.push(bytes);
  socket.destroy = () => { socket.destroyed = true; socket.emit('close'); };
  socket.end = () => socket.destroy();
  sockets.push(socket); return socket;
}
function payload(bytes) { return JSON.parse(bytes.subarray(8).toString()); }
let presence;
try {
  presence = createPresence({ file, connect });
  assert.equal(sockets.length, 0, 'no connection without public application ID');
  fs.writeFileSync(file, JSON.stringify({ enabled: true, clientId: '123456789012345678' }));
  interval(); const first = sockets[0]; first.emit('connect');
  assert.equal(payload(first.frames[0]).client_id, '123456789012345678');
  const ready = frame(1, { evt: 'READY' });
  first.emit('data', ready.subarray(0, 5));
  assert.equal(first.frames.length, 1, 'fragmented messages wait for completion');
  first.emit('data', ready.subarray(5));
  const activity = payload(first.frames[1]);
  assert.equal(activity.cmd, 'SET_ACTIVITY');
  assert.equal(activity.args.activity.details, PHRASES[0]);
  now += 44000; interval(); assert.equal(first.frames.length, 2);
  now += 1000; interval(); assert.equal(payload(first.frames[2]).args.activity.details, PHRASES[1]);
  first.emit('data', frame(3, { ping: true }));
  assert.equal(first.frames.at(-1).readUInt32LE(0), 4, 'responds to Discord heartbeat');
  first.destroy(); interval(); const second = sockets[1];
  second.emit('connect'); second.emit('data', ready);
  fs.writeFileSync(file, JSON.stringify({ enabled: false, clientId: '123456789012345678' }));
  interval();
  assert.equal(payload(second.frames.at(-1)).args.activity, null, 'disable clears activity');
  assert.equal(second.destroyed, true);
  fs.writeFileSync(file, JSON.stringify({ enabled: true, clientId: 'invalid' }));
  interval(); assert.equal(sockets.length, 2, 'invalid ID rejected');
  presence.stop();
  console.log('Discord IPC handshake, framing, rotation, heartbeat, reconnect and disable: PASS');
} finally {
  presence?.stop(); global.setInterval = realInterval; Date.now = realNow;
  fs.rmSync(folder, { recursive: true, force: true });
}
