'use strict';

const path = require('node:path');

const fs = require('node:fs');

const { pathToFileURL } = require('node:url');

const {

  app, BrowserWindow, Tray, Menu, ipcMain, screen, protocol, net, shell, globalShortcut, nativeImage,

} = require('electron');

const config = require('./config');

const { TRAY, LANGS } = require('./labels');

const { createBridge } = require('./bridge');

const { startWindowWatch } = require('./windows');

const { createCloudAI: createLocalAI } = require('./cloud-ai');
const { createPresence } = require('./discord-presence');
const { desktopLayout } = require('./desktop-layout');
let discordPresence = null;

let localAI = null;

let localState = {};

const hooks = require('../../scripts/install-codex-hooks');

const demoSteps = require('../../scripts/demo-sequence');

const ROOT = path.resolve(__dirname, '..', '..');

const DEV = process.argv.includes('--dev');

const PORT = Number(process.env.CAPRI_PORT) || 47824;
const DATA = () => app.getPath('userData');

const SOUND_EXT = /\.(mp3|wav|ogg|m4a)$/i;

const CLAUDE_CODE_HELP = 'https://learn.chatgpt.com/docs/hooks';

protocol.registerSchemesAsPrivileged([

  { scheme: 'capri', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },

]);

let overlay = null;

let tray = null;

let trayMenu = null; // also what she opens when you right-click her

let demoTimer = null;

let windowWatch = null;

// the watcher only speaks when something changes: the overlay asks for this when it (re)loads

let lastWindows = null;

const userSoundsDir = () => path.join(app.getPath('userData'), 'sounds');

// capri://app/...        -> files of this repo

// capri://usersounds/... -> the user's own sound overrides

function serveProtocol() {

  protocol.handle('capri', (request) => {

    const url = new URL(request.url);

    const base = url.host === 'usersounds' ? userSoundsDir() : ROOT;

    const target = path.resolve(base, '.' + decodeURIComponent(url.pathname));

    if (target !== base && !target.startsWith(base + path.sep)) {

      return new Response('forbidden', { status: 403 });

    }

    return net.fetch(pathToFileURL(target).toString());

  });

}

function targetDisplay() {

  const { displayId } = config.load();

  return screen.getAllDisplays().find((d) => d.id === displayId) || screen.getPrimaryDisplay();

}

function fitOverlay() {

  if (!overlay || overlay.isDestroyed()) return;

  const { bounds, areas } = desktopLayout(screen.getAllDisplays(), targetDisplay(), config.load().gameMode);
  const previous = overlay.getBounds();

  overlay.setBounds(bounds);

  overlay.webContents.send('overlay:resize', { width: bounds.width, height: bounds.height, areas,
    offset: { x: previous.x - bounds.x, y: previous.y - bounds.y } });

}

function createOverlay() {

  const { bounds: workArea } = desktopLayout(screen.getAllDisplays(), targetDisplay(), config.load().gameMode);

  overlay = new BrowserWindow({

    ...workArea,

    transparent: true,

    backgroundColor: '#00000000',

    frame: false,

    resizable: false,

    movable: false,

    minimizable: false,

    maximizable: false,

    fullscreenable: false,

    skipTaskbar: true,

    focusable: false,

    hasShadow: false,

    alwaysOnTop: true,

    type: process.platform === 'win32' ? 'toolbar' : undefined,

    show: false,

    webPreferences: {

      preload: path.join(__dirname, '..', 'preload.js'),

      contextIsolation: true,

      nodeIntegration: false,

      sandbox: true,

      backgroundThrottling: false,

      autoplayPolicy: 'no-user-gesture-required',

    },

  });

  // Windows clamps the initial BrowserWindow size to one monitor; restore the full desktop before loading.
  overlay.setBounds(workArea);
  overlay.setAlwaysOnTop(true, 'screen-saver');

  overlay.setIgnoreMouseEvents(true, { forward: true });

  overlay.loadURL('capri://app/src/renderer/index.html');
  overlay.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  overlay.webContents.on('will-navigate', event => event.preventDefault());

  // always shown: put away, she's still there as her biochip in the corner

  overlay.once('ready-to-show', () => overlay.showInactive());
  overlay.on('closed', () => { overlay = null; app.quit(); });

  overlay.webContents.on('render-process-gone', (_e, details) => {

    console.error('[capri] renderer gone:', details.reason);

  });

  if (DEV) {

    overlay.webContents.on('console-message', (e) => {

      const { level, message, lineNumber, sourceId } = e;

      console.log(`[renderer:${level}] ${message} (${String(sourceId).split('/').pop()}:${lineNumber})`);

    });

    if (process.env.CAPRI_DEVTOOLS) overlay.webContents.openDevTools({ mode: 'detach' });

  }

}

function sendCommand(name, payload = {}) {

  if (!overlay || overlay.isDestroyed() || overlay.webContents.isDestroyed()) return;
  overlay.webContents.send('capri:command', { name, ...payload });

}

// Ctrl+Alt+C: she folds herself away into her biochip in the corner, or comes back out of it.

function toggleVisible(force) {

  const visible = typeof force === 'boolean' ? force : !config.load().visible;

  config.save({ visible });

  sendCommand('stow', { on: !visible });

  rebuildTray();

}

function playDemo() {

  clearTimeout(demoTimer);

  let i = 0;

  const next = () => {

    if (i >= demoSteps.length) return;

    const [delay, evt] = demoSteps[i++];

    demoTimer = setTimeout(() => {

      overlay?.webContents.send('claude:event', evt);

      next();

    }, delay);

  };

  next();

}

// During the demo, a little fake terminal for her to sit on and take over (window tracking is

// Windows only, so only there). Opened without stealing focus; closing it drops her off it.

let demoWin = null;

const DEMO_TERMINAL = `<body style="margin:0;background:#14101c;color:#8f8aa3;font:13px/1.7 Consolas,monospace;padding:14px 18px">

<div style="color:#36ff7a">PS C:\\night-city-api&gt; npm test -- gigs</div>

<div>&nbsp;&nbsp;GET /gigs</div><div style="color:#36ff7a">&nbsp;&nbsp;&nbsp;&nbsp;✓ returns 20 items per page</div>

<div style="color:#36ff7a">&nbsp;&nbsp;&nbsp;&nbsp;✓ paginates with a cursor</div><div style="color:#36ff7a">&nbsp;&nbsp;&nbsp;&nbsp;✓ rejects a bad cursor</div>

<div>&nbsp;&nbsp;6 passing (212ms)</div><div style="color:#36ff7a">PS C:\\night-city-api&gt; _</div></body>`;

function demoWindow(open) {

  demoWin?.destroy();

  demoWin = null;

  if (!open || process.platform !== 'win32') return false;

  const b = overlay.getBounds();

  demoWin = new BrowserWindow({

    x: Math.round(b.x + b.width * 0.5 - 310), y: Math.round(b.y + b.height * 0.42), width: 620, height: 300,

    show: false, alwaysOnTop: true, title: 'night-city-api — npm test', backgroundColor: '#14101c', autoHideMenuBar: true,

  });

  demoWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(DEMO_TERMINAL)}`);

  demoWin.once('ready-to-show', () => demoWin?.showInactive());

  demoWin.on('closed', () => { demoWin = null; });

  return true;

}

// 'auto' -> the first system language Capri speaks, English otherwise.

function resolveLang(setting) {

  if (LANGS.includes(setting)) return setting;

  const preferred = [...app.getPreferredSystemLanguages(), app.getSystemLocale(), app.getLocale()];

  for (const tag of preferred) {

    const base = String(tag || '').toLowerCase().split(/[-_]/)[0];

    if (LANGS.includes(base)) return base;

  }

  return 'en';

}

// What the overlay gets: `lang` is the resolved one, `langSetting` what the user picked.

function rendererConfig() {

  const cfg = config.load();

  const { areas } = desktopLayout(screen.getAllDisplays(), targetDisplay(), cfg.gameMode);
  return { ...cfg, areas, dev: DEV, lang: resolveLang(cfg.lang), langSetting: cfg.lang };

}

function updateConfig(patch) {
  patch = config.sanitize(patch);

  config.save(patch);
  if ('gameMode' in patch || 'displayId' in patch) fitOverlay();

  const cfg = rendererConfig();

  if (overlay && !overlay.isDestroyed() && !overlay.webContents.isDestroyed()) overlay.webContents.send('capri:config', cfg);

  if (typeof patch.muted === 'boolean') localAI?.send({ command: 'mute', muted: patch.muted });

  rebuildTray();

  return cfg;

}

function openVault() {
  const note = path.join(DATA(), 'vault', 'Home.md');
  localAI?.releaseChat();
  return shell.openExternal('obsidian://open?path=' + encodeURIComponent(note))
    .catch(() => shell.openPath(path.dirname(note)));
}

function rebuildTray() {

  if (!tray) return;

  const cfg = config.load();

  const hookState = hooks.status();

  const t = TRAY[resolveLang(cfg.lang)];

  const displays = screen.getAllDisplays();

  const current = targetDisplay().id;

  const menu = Menu.buildFromTemplate([

    { label: 'Talk to Capri…', accelerator: 'Ctrl+Alt+Enter', click: () => localAI?.openChat() },
    { label: 'Hide conversation', accelerator: 'Ctrl+Alt+Backspace', click: () => localAI?.hideChat() },

    { label: 'Japanese voice settings…', click: () => localAI?.send({ command: 'settings' }) },
    { label: 'AI engine', submenu: [
      { label: 'Codex · ChatGPT account', type: 'radio', checked: localState.provider !== 'claude', click: () => localAI?.send({ command: 'brain', provider: 'codex' }) },
      { label: 'Claude · Claude account', type: 'radio', checked: localState.provider === 'claude', click: () => localAI?.send({ command: 'brain', provider: 'claude' }) },
    ] },

    { label: 'Stop reply / voice', click: () => localAI?.send({ command: 'cancel' }) },

    { label: localState.paused ? 'Resume Capri' : 'Pause Capri', click: () => localAI?.send({ command: 'pause' }) },

    { label: 'Forget conversation', click: () => localAI?.send({ command: 'forget' }) },

    { label: 'Open memory vault', click: openVault },
    { label: 'Discord Rich Presence settings', click: () => shell.openPath(path.join(DATA(), 'discord-presence.json')) },

    { label: 'Cloud conversation · optional system Japanese voice', enabled: false },

    { type: 'separator' },

    { label: t.teleport, click: () => sendCommand('teleport') },

    { label: t.satellite, click: () => sendCommand('satellite') },
    { label: 'Manual actions & emotes', submenu: [
      ['Finger guns', 'finger-guns'], ['Holographic terminal', 'hacking'], ['Listen to music', 'listening'], ['Doze (seated)', 'doze'],
      ['Stretch', 'stretch'], ['Exercise', 'exercise'], ['Dance', 'dance'], ['Lie down', 'lounge'],
      ['Wave', 'wave'], ['Shrug', 'shrug'], ['Swing legs (seated)', 'seated-kick'], ['Walk around', 'walk'],
      ['Heart ♡', 'heart'], ['Confused ?!', 'confused'], ['Content ^_^', 'content'],
      ['Music ♪', 'music'], ['Effort >_<', 'effort'], ['Sleepy zzz', 'sleepy'],
    ].map(([label, activity]) => ({ label, click: () => sendCommand('idle-activity', { activity }) })) },
    { label: 'Costumes · paused for base design review', enabled:false, submenu: [
      ['Automatic · active app','auto'], ['Original Capri','default'], ['Netrunner','netrunner'], ['Creator','creator'],
      ['Music / stage','stage'], ['League · Hextech','league'], ['David Martinez','david'], ['Lucy','lucy'],
      ['Badlands · D','badlands'], ['Omi','omi'], ['Roman','roman'], ['Talia','talia'], ['King','king'],
    ].map(([label,outfit])=>({label,type:'radio',checked:(cfg.outfit||'auto')===outfit,click:()=>updateConfig({outfit})})) },
    { label: 'Possess a window now', click: () => sendCommand('possess-now') },

    { label: t.demo, click: playDemo },

    { label: t.help, click: () => sendCommand('welcome') },

    { label: cfg.visible ? t.hide : t.show, accelerator: 'Ctrl+Alt+C', click: () => toggleVisible() },

    { type: 'separator' },

    {

      label: t.size,

      submenu: [[t.small, 0.45], [t.medium, 0.6], [t.large, 0.8]].map(([label, scale]) => ({

        label, type: 'radio', checked: Math.abs(cfg.scale - scale) < 0.01, click: () => updateConfig({ scale }),

      })),

    },

    {

      label: t.sound,

      submenu: [

        { label: t.mute, type: 'checkbox', checked: cfg.muted, click: (item) => updateConfig({ muted: item.checked }) },

        { type: 'separator' },

        {

          label: t.soundsDir,

          click: () => {

            fs.mkdirSync(userSoundsDir(), { recursive: true });

            shell.openPath(userSoundsDir());

          },

        },

      ],

    },

    {

      label: 'Game mode screen · free mode uses all screens',

      enabled: displays.length > 1,

      submenu: displays.map((d, i) => ({

        label: `${i + 1} — ${d.size.width}×${d.size.height}`,

        type: 'radio',

        checked: d.id === current,

        click: () => { config.save({ displayId: d.id }); fitOverlay(); rebuildTray(); },

      })),

    },

    { label: 'Animations', submenu: [['Full Capri animations', 'full'], ['Follow Windows', 'system'], ['Reduced motion', 'reduced']].map(([label, motion]) => ({ label, type: 'radio', checked: cfg.motion === motion, click: () => updateConfig({ motion }) })) },
    { label: t.wander, type: 'checkbox', checked: cfg.wander, click: (item) => updateConfig({ wander: item.checked }) },
    { label: 'Game mode: stay at the edges', type: 'checkbox', checked: cfg.gameMode, click: (item) => updateConfig({ gameMode: item.checked }) },

    { label: t.possess, type: 'checkbox', checked: cfg.possess, click: (item) => updateConfig({ possess: item.checked }) },

    {

      label: t.lang,

      submenu: [['English', 'en']].map(([label, lang]) => ({

        label, type: 'radio', checked: cfg.lang === lang, click: () => updateConfig({ lang }),

      })),

    },

    {

      label: t.startup,

      type: 'checkbox',

      checked: startupEnabled(),

      click: (item) => setStartup(item.checked),

    },

    { type: 'separator' },

    hookState.installed

      ? { label: t.hooksOn, enabled: false }

      : { label: t.hooksOff, click: () => runHooks('install') },

    ...(hookState.installed ? [{ label: t.hooksRemove, click: () => runHooks('uninstall') }] : []),

    { type: 'separator' },

    { label: t.quit, click: () => app.quit() },

  ]);

  tray.setContextMenu(menu);

  trayMenu = menu;

}

// Run from a clone (`npm start`), electron.exe alone would open the default Electron app at login:

// it needs the project folder as argument.

function startupEnabled() {
  return app.getLoginItemSettings(loginItemOptions()).openAtLogin;
}

function setStartup(enabled) {
  app.setLoginItemSettings({ ...loginItemOptions(), openAtLogin: Boolean(enabled) });
  rebuildTray();

}

function loginItemOptions() {

  return app.isPackaged ? {} : { path: process.execPath, args: [ROOT] };

}

// From the tray, she says how it went; from her welcome panel (quiet), the panel does.

function runHooks(action, { quiet = false } = {}) {

  let outcome;

  try {

    const result = action === 'install' ? hooks.install() : hooks.uninstall();

    outcome = { action, ok: true, file: result.file };

  } catch (err) {

    outcome = { action, ok: false, error: err.message };

  }

  if (!quiet) sendCommand('hooks', outcome);

  rebuildTray();

  return outcome;

}

function createTray() {

  const icon = nativeImage.createFromPath(path.join(ROOT, 'assets', 'icons', 'tray.png'));

  tray = new Tray(icon);

  tray.setToolTip('Capri');

  tray.on('click', () => sendCommand('status'));

  rebuildTray();

}

function registerIpc() {

  ipcMain.on('overlay:interactive', (_e, on) => {

    if (overlay) overlay.capriInteractive = !!on;
    overlay?.setIgnoreMouseEvents(!on, { forward: true });

  });

  ipcMain.handle('overlay:cursor', () => {

    const p = screen.getCursorScreenPoint();

    const b = overlay.getBounds();

    return { x: p.x - b.x, y: p.y - b.y, inside: p.x >= b.x && p.y >= b.y && p.x < b.x + b.width && p.y < b.y + b.height };

  });

  ipcMain.handle('config:get', () => rendererConfig());

  ipcMain.handle('hooks:status', () => hooks.status());

  ipcMain.handle('config:set', (_e, patch) => updateConfig(patch));

  ipcMain.handle('demo:window', (_e, open) => demoWindow(open));

  // right-clicking her: the same menu as the tray icon (which Windows often hides behind the ^ by the clock)

  ipcMain.on('menu:open', () => trayMenu?.popup({ window: overlay }));

  // her welcome panel's buttons

  ipcMain.handle('hooks:install', () => runHooks('install', { quiet: true }));

  ipcMain.handle('claude:found', () => fs.existsSync(path.dirname(hooks.status().file))); // Codex keeps its settings there

  ipcMain.on('claude:help', () => shell.openExternal(CLAUDE_CODE_HELP));

  ipcMain.handle('windows:get', () => lastWindows);

  // her guide: where her tray icon is (it lives in the taskbar, off the overlay, hence overlay

  // coordinates past its edge), and the corner by the clock in case Windows hid it behind the ^

  ipcMain.handle('guide:tray', () => {

    const o = overlay.getBounds();

    const d = targetDisplay().bounds;

    const b = tray?.getBounds();

    const icon = b && b.width > 0 ? { x: b.x - o.x, y: b.y - o.y, w: b.width, h: b.height } : null;

    const corner = { x: d.x + d.width - 150 - o.x, y: d.y + d.height - 44 - o.y, w: 140, h: 40 };

    return { icon, corner };

  });

  // her guide: Codex's folder (~/.claude) in Explorer, its settings file selected

  ipcMain.handle('guide:claudeFolder', async () => {
    const file = hooks.status().file;
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) return { found: false, dir };
    localAI?.releaseChat();
    const error = await shell.openPath(dir);
    if (error) return { found: false, dir, error };
    const { execFile } = require('node:child_process');
    const target = await new Promise((resolve) => {
      execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(ROOT, 'scripts', 'find-folder.ps1'), '-Mode', 'find-folder', '-TargetPath', dir],
        { windowsHide: true, timeout: 10000, encoding: 'utf8' }, (err, out) => {
          try { resolve(err ? null : JSON.parse(out.replace(/^\uFEFF/, ''))); } catch { resolve(null); }
        });
    });
    return { found: true, dir, file: fs.existsSync(file), windowId: target?.hwnd || null };
  });

  ipcMain.handle('sounds:list', () => {

    try {

      return fs.readdirSync(userSoundsDir())

        .filter((f) => SOUND_EXT.test(f))

        .map((f) => ({ name: f.replace(SOUND_EXT, '').toLowerCase(), url: `capri://usersounds/${encodeURIComponent(f)}` }));

    } catch {

      return [];

    }

  });

}

// Only in --dev: lets scripts drive the overlay and grab frames of it (no desktop content, just our window).

const testWins = new Map(); // name -> test window

async function debugHandler(route, body) {

  if (!DEV) throw new Error('debug routes need --dev');

  if (route === 'local') {

    if (body.command === 'snapshot') return localAI?.snapshot();
    if (body.command === 'chat-info') return localAI?.chatInfo();

    if (body.command === 'open') { localAI?.openChat(); return { ok: true }; }

    if (body.command === 'quit') { setTimeout(() => app.quit(), 50); return { ok: true }; }

    if (['send', 'cancel', 'hello', 'pause'].includes(body.command) && (!body.text || (typeof body.text === 'string' && body.text.length <= 2000))) localAI?.send(body);

    return { ok: true };

  }

  if (route === 'command') {

    sendCommand(body.name, body);

    return { ok: true };

  }

  if (route === 'reload') {

    overlay.webContents.reloadIgnoringCache();

    return { ok: true };

  }

  if (route === 'testwin') {

    // plain windows to sit on, opened without stealing focus, by name (`id`, default "main");

    // each one opened goes in front of the others. { open: false } without an id closes them all.

    const id = body.id ?? 'main';

    if (!body.open && body.id === undefined) {

      for (const win of testWins.values()) win.destroy();

      testWins.clear();

      return { ok: true };

    }

    testWins.get(id)?.destroy();

    testWins.delete(id);

    if (body.open) {

      const b = overlay.getBounds();

      const win = new BrowserWindow({

        x: b.x + (body.x ?? 300), y: b.y + (body.y ?? 380), width: body.w ?? 720, height: body.h ?? 380,

        show: false, alwaysOnTop: true, title: `Capri test window ${id}`, backgroundColor: '#1b1726',

      });

      win.loadURL('data:text/html,<body style="background:%231b1726"></body>');

      win.showInactive();

      testWins.set(id, win);

    }

    return { ok: true };

  }

  if (route === 'movewin' && testWins.has(body.id ?? 'main')) {

    const win = testWins.get(body.id ?? 'main');

    const [x, y] = win.getPosition();

    win.setPosition(x + (body.dx || 0), y + (body.dy || 0));

    return { ok: true };

  }

  if (route === 'mouse') {

    // the pointer moving over the overlay (css px), and clicking if asked, without touching the real one

    const at = { x: Math.round(body.x), y: Math.round(body.y) };

    overlay.webContents.sendInputEvent({ type: 'mouseMove', ...at });

    if (body.click) {

      overlay.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, ...at });

      overlay.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...at });

    }

    return { ok: true };

  }

  if (route === 'animation-state') return overlay.webContents.executeJavaScript('window.__capriDebug?.()');
  if (route === 'capturechat') {
    const image = await localAI?.captureChat();
    if (!image) throw new Error('Open the chat first');
    const dir = path.join(ROOT, 'captures'); fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'chat-redesign.png'); fs.writeFileSync(file, image.toPNG());
    return { ok: true, file };
  }
  if (route === 'capture') {

    const image = await overlay.webContents.capturePage();

    // installed, the app's own folder is read-only: its data folder instead

    const dir = path.join(app.isPackaged ? app.getPath('userData') : ROOT, 'captures');

    fs.mkdirSync(dir, { recursive: true });

    const file = path.join(dir, `${(body.name || 'frame').replace(/[^\w-]/g, '')}.png`);

    fs.writeFileSync(file, image.toPNG());

    return { ok: true, file };

  }

  throw new Error('unknown debug route');

}

function main() {

  if (!app.requestSingleInstanceLock()) {

    app.quit();

    return;

  }

  app.on('second-instance', () => sendCommand('status'));

  if (process.platform === 'win32') app.setAppUserModelId('capri.desktop');

  app.whenReady().then(() => {

    serveProtocol();

    registerIpc();

    createOverlay();

    createTray();
    discordPresence = createPresence({ file: path.join(DATA(), 'discord-presence.json') });

    localAI = createLocalAI({ root: ROOT, data: DATA(), overlay, onVault: openVault, onState: (state) => {

      const changed = localState.paused !== state.paused || localState.provider !== state.provider; localState = state;

      if (changed) rebuildTray();

    } });

    if (process.argv.includes('--chat')) setTimeout(() => localAI?.openChat(), 800);
    windowWatch = startWindowWatch({

      overlay,

      onUpdate: (data) => {

        lastWindows = data;

        overlay?.webContents.send('windows:update', data);

      },

    });

    createBridge({

      port: PORT,

      onEvent: (evt) => overlay?.webContents.send('claude:event', evt),

      onDebug: DEV ? debugHandler : null,

    });

    globalShortcut.register('Control+Alt+C', () => toggleVisible());
    if (!globalShortcut.register('Control+Alt+Enter', () => localAI?.openChat())) console.warn('[capri] Ctrl+Alt+Enter unavailable');
    if (!globalShortcut.register('Control+Alt+Backspace', () => localAI?.hideChat())) console.warn('[capri] Ctrl+Alt+Backspace unavailable');

    screen.on('display-metrics-changed', fitOverlay);

    screen.on('display-added', () => { fitOverlay(); rebuildTray(); });

    screen.on('display-removed', () => { fitOverlay(); rebuildTray(); });

  });

  let quitting = false;

  app.on('before-quit', (event) => {
    discordPresence?.stop(); discordPresence = null;

    if (!localAI || quitting) return;

    event.preventDefault(); quitting = true;

    localAI.stop().finally(() => app.quit());

  });

  app.on('will-quit', () => {

    globalShortcut.unregisterAll();

    windowWatch?.stop();

  });

  app.on('window-all-closed', (e) => e.preventDefault());

}

main();
