'use strict';

const fs = require('node:fs');
const net = require('node:net');
const crypto = require('node:crypto');

const PHRASES = [
  'Capri is possessing this user',
  'This desktop belongs to Capri now',
  'A construct has made herself at home',
  'Choom acquired. Keeping this one.',
  'One user. A whole crowd of Capri.',
  'Capricorn construct: connection established',
];

function frame(opcode, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  const header = Buffer.alloc(8);
  header.writeUInt32LE(opcode, 0);
  header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}

function createPresence({ file, connect = net.createConnection, log = console.warn }) {
  let socket = null, timer = null, ready = false, stopped = false;
  let clientId = '', pipe = 0, index = 0, buffer = Buffer.alloc(0), lastUpdate = 0;
  const start = Math.floor(Date.now() / 1000);
  fs.mkdirSync(require('node:path').dirname(file), { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ enabled: true, clientId: '' }, null, 2));

  function settings() {
    try {
      if (fs.statSync(file).size > 4096) return null;
      const value = JSON.parse(fs.readFileSync(file, 'utf8'));
      return value.enabled === true && /^\d{17,20}$/.test(value.clientId) ? value : null;
    } catch { return null; }
  }

  function activity(clear = false) {
    if (!ready || !socket || socket.destroyed) return;
    socket.write(frame(1, { cmd: 'SET_ACTIVITY', nonce: crypto.randomUUID(), args: {
      pid: process.pid,
      activity: clear ? null : { type: 0, details: PHRASES[index++ % PHRASES.length],
        state: 'Project Capricorn // Desktop construct', timestamps: { start } },
    } }));
    lastUpdate = Date.now();
  }

  function disconnect() {
    const old = socket;
    socket = null; ready = false; buffer = Buffer.alloc(0);
    old?.destroy();
  }

  function tick() {
    if (stopped) return;
    const config = settings();
    if (!config || (clientId && clientId !== config.clientId)) {
      activity(true); disconnect(); clientId = '';
    }
    if (!config) return;
    if (ready) {
      if (Date.now() - lastUpdate >= 45000) activity();
      return;
    }
    if (socket) return;
    clientId = config.clientId;
    const current = connect({ path: `\\\\?\\pipe\\discord-ipc-${pipe++ % 10}` });
    socket = current;
    current.setTimeout(10000);
    current.on('connect', () => current.write(frame(0, { v: 1, client_id: clientId })));
    current.on('timeout', () => current.destroy());
    current.on('error', () => current.destroy()); // Discord may be closed; retry quietly.
    current.on('close', () => { if (socket === current) disconnect(); });
    current.on('data', chunk => {
      if (socket !== current) return;
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 8) {
        const opcode = buffer.readUInt32LE(0), length = buffer.readUInt32LE(4);
        if (length > 65536) { disconnect(); return; }
        if (buffer.length < length + 8) return;
        const body = buffer.subarray(8, 8 + length);
        buffer = buffer.subarray(8 + length);
        if (opcode === 2) { disconnect(); return; }
        if (opcode === 3) {
          const header = Buffer.alloc(8); header.writeUInt32LE(4); header.writeUInt32LE(length, 4);
          current.write(Buffer.concat([header, body]));
        } else if (opcode === 1) {
          let message;
          try { message = JSON.parse(body.toString('utf8')); } catch { disconnect(); return; }
          if (message.evt === 'READY' && !ready) {
            ready = true; current.setTimeout(0); activity();
          } else if (message.evt === 'ERROR') {
            log('[capri] Discord rejected Rich Presence; check Application ID and Discord activity settings.');
            disconnect(); return;
          }
        }
      }
    });
  }

  tick();
  timer = setInterval(tick, 5000);
  timer.unref?.();
  return {
    stop() {
      stopped = true; clearInterval(timer);
      activity(true);
      // Let the clear frame flush before closing; a closed IPC session also removes its activity.
      const old = socket; socket = null; ready = false;
      if (old) { old.end(); const timeout = setTimeout(() => old.destroy(), 500); timeout.unref?.(); }
    },
  };
}

module.exports = { createPresence, frame, PHRASES };
