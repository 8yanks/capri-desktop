'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EVENTS } = require('../hooks/codex-events');
const MARK = 'capri-codex-hook.js';
const settingsPath = () => path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'hooks.json');
function read(file) {
  if (!fs.existsSync(file)) return {};
  const data = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  if (!data || typeof data !== 'object' || Array.isArray(data) || (data.hooks && (typeof data.hooks !== 'object' || Array.isArray(data.hooks)))) throw new Error('Invalid hooks.json; nothing changed.');
  return data;
}
const ours = (handler) => handler.type === 'command' && String(handler.command || '').includes(MARK);
function strip(data) {
  for (const [event, groups] of Object.entries(data.hooks || {})) {
    if (!Array.isArray(groups)) throw new Error('Invalid hook groups; nothing changed.');
    data.hooks[event] = groups.map((group) => ({ ...group, hooks: (group.hooks || []).filter((handler) => !ours(handler)) }))
      .filter((group) => group.hooks.length > 0);
    if (!data.hooks[event].length) delete data.hooks[event];
  }
  return data;
}
function write(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.capri-backup-${Date.now()}`);
  const temp = file + '.capri-tmp';
  fs.writeFileSync(temp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(temp, file);
}
function install() {
  const file = settingsPath();
  const data = read(file);
  const before = JSON.stringify(data);
  const oldCommand = Object.values(data.hooks || {}).flatMap((groups) => Array.isArray(groups) ? groups : [])
    .flatMap((group) => group.hooks || []).find(ours)?.command;
  const oldNode = oldCommand?.match(/^"([^"]+)" /)?.[1];
  strip(data);
  data.hooks ||= {};
  const node = process.versions.electron ? (oldNode && fs.existsSync(oldNode) ? oldNode : 'node') : process.execPath;
  const script = path.resolve(__dirname, '../hooks', MARK);
  const command = `"${node}" "${script}"`;
  for (const event of EVENTS) {
    data.hooks[event] ||= [];
    data.hooks[event].push({ hooks: [{ type: 'command', command, async: event !== 'SessionEnd', timeout: 2 }] });
  }
  if (JSON.stringify(data) !== before) write(file, data);
  return { file, events: EVENTS.length, needsReview: true };
}
function uninstall() {
  const file = settingsPath();
  const data = read(file); const before = JSON.stringify(data);
  strip(data);
  const removed = JSON.stringify(data) !== before;
  if (removed) write(file, data);
  return { file, removed };
}
function status() {
  const file = settingsPath();
  try {
    const data = read(file);
    const events = Object.entries(data.hooks || {}).filter(([, groups]) => Array.isArray(groups) && groups.some((g) => g.hooks?.some(ours))).map(([name]) => name);
    return { file, installed: EVENTS.every((name) => events.includes(name)), events, needsReview: true };
  } catch (error) { return { file, installed: false, error: error.message, events: [] }; }
}
module.exports = { install, uninstall, status };
if (require.main === module) {
  try { console.log(JSON.stringify(process.argv.includes('--uninstall') ? uninstall() : process.argv.includes('--status') ? status() : install())); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
