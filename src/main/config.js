'use strict';



const fs = require('node:fs');

const path = require('node:path');

const { app } = require('electron');



const DEFAULTS = {

  motion: 'full',
  gameMode: false, // manual, session-only: always off at startup
  outfit: 'default',
  scale: 0.6,        // sprite scale, 0.6 ≈ 250px tall

  muted: false,

  volume: 0.7,

  lang: 'en',      // 'auto' follows the system language, or 'fr' / 'en'

  displayId: null,   // null = primary display

  wander: true,      // random teleports when idle

  possess: true,     // now and then she dives into the window she sits on and takes it over

  visible: true,

  welcomed: true,   // she has introduced herself (her welcome panel)

  linked: false,     // a Claude Code event has reached her at least once

};



let cache = null;

function sanitize(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return {};
  const clean = {};
  for (const key of ['gameMode','muted','wander','possess','visible','welcomed','linked']) if (typeof patch[key] === 'boolean') clean[key] = patch[key];
  if (Number.isFinite(patch.scale) && patch.scale >= .3 && patch.scale <= 1.2) clean.scale = patch.scale;
  if (Number.isFinite(patch.volume) && patch.volume >= 0 && patch.volume <= 1) clean.volume = patch.volume;
  if (patch.displayId === null || Number.isSafeInteger(patch.displayId)) clean.displayId = patch.displayId;
  if (['full','system','reduced'].includes(patch.motion)) clean.motion = patch.motion;
  if ('lang' in patch) clean.lang = 'en';
  if (['auto','default','netrunner','creator','stage','league','david','lucy','badlands','omi','roman','talia','king'].includes(patch.outfit)) clean.outfit = patch.outfit;
  return clean;
}



function file() {

  return path.join(app.getPath('userData'), 'config.json');

}



function load() {

  if (cache) return cache;

  try {

    if (fs.statSync(file()).size > 16384) throw Error('Configuration too large');
    cache = { ...DEFAULTS, ...sanitize(JSON.parse(fs.readFileSync(file(), 'utf8'))), gameMode: false, lang: 'en', outfit:'default' };

  } catch {

    cache = { ...DEFAULTS };

  }

  return cache;

}



function save(patch) {

  cache = { ...load(), ...sanitize(patch), lang: 'en' };

  try {

    fs.mkdirSync(path.dirname(file()), { recursive: true });

    fs.writeFileSync(file(), JSON.stringify(cache, null, 2));

  } catch (err) {

    console.error('[capri] could not save config:', err.message);

  }

  return cache;

}



module.exports = { load, save, DEFAULTS, sanitize };
