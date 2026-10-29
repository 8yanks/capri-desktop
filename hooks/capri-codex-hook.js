#!/usr/bin/env node
'use strict';
const http = require('node:http');
const { normalize } = require('./codex-events');
let finished = false;
function finish() {
  if (finished) return;
  finished = true;
  // Empty JSON cannot approve, deny, block, continue or modify a Codex operation.
  process.stdout.write('{}\n', () => process.exit(0));
}
const timer = setTimeout(finish, 1400);
process.stdin.setEncoding('utf8');
let raw = '';
process.stdin.on('data', (chunk) => {
  raw += chunk;
  if (Buffer.byteLength(raw) > 2 * 1024 * 1024) finish();
});
process.stdin.on('error', finish);
process.stdin.on('end', () => {
  let event;
  try { event = normalize(JSON.parse(raw)); } catch { return finish(); }
  if (!event) return finish();
  const body = JSON.stringify(event);
  const request = http.request({ host: '127.0.0.1', port: Number(process.env.CAPRI_PORT) || 47824,
    path: '/event', method: 'POST', timeout: 600,
    headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) },
  }, (response) => { response.resume(); response.on('end', finish); });
  request.on('error', finish);
  request.on('timeout', () => { request.destroy(); finish(); });
  request.end(body);
});
