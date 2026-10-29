'use strict';

// Feeds the overlay with the position of the other windows (Windows only), so Capri can
// sit on them. A small PowerShell helper does the Win32 calls; we turn its physical pixels
// into the overlay's coordinates.

const path = require('node:path');
const readline = require('node:readline');
const { spawn } = require('node:child_process');
const { screen, BrowserWindow } = require('electron');

// in the installed app it sits next to the app archive (asarUnpack), where PowerShell can read it
const SCRIPT = path.join(__dirname, 'windows.ps1').replace(`app.asar${path.sep}`, `app.asar.unpacked${path.sep}`);

function keepOverlayAbove(overlay, data) {
  if (overlay.isDestroyed() || !overlay.isVisible() || overlay.capriInteractive) return false;
  const foreground = data?.wins.find(w => w.id === data.fg);
  if (!foreground || foreground.kind === 'capri') return false;
  for (const win of BrowserWindow.getAllWindows()) {
    if (win === overlay || win.isDestroyed() || !win.isVisible() || win.isMinimized()) continue;
    win.setAlwaysOnTop(true, 'screen-saver');
    win.moveTop();
  }
  // Other applications can raise their own topmost windows after initial setup.
  overlay.setAlwaysOnTop(true, 'screen-saver');
  overlay.moveTop(); // z-order only: never focus the overlay or activate it
  return true;
}

function startWindowWatch({ overlay, onUpdate }) {
  if (process.platform !== 'win32') return { stop() {} };

  let child = null;
  let stopped = false;
  let restarts = 0;
  let latest = null;
  const layerTimer = setInterval(() => keepOverlayAbove(overlay, latest), 1000);

  const handle = overlay.getNativeWindowHandle();
  const self = handle.length >= 8 ? handle.readBigUInt64LE(0) : BigInt(handle.readUInt32LE(0));

  const toOverlay = (win, bounds) => {
    const dip = screen.screenToDipRect(null, { x: win.x, y: win.y, width: win.w, height: win.h });
    return { id: win.id, kind: win.kind || '', context: ['cyberpunk','creator','music','league'].includes(win.context)?win.context:'', x: dip.x - bounds.x, y: dip.y - bounds.y, w: dip.width, h: dip.height, max: win.max };
  };

  const start = () => {
    child = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-File', SCRIPT, String(self), String(process.pid),
    ], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });

    readline.createInterface({ input: child.stdout }).on('line', (line) => {
      let snap;
      try {
        snap = JSON.parse(line);
      } catch {
        return;
      }
      if (overlay.isDestroyed()) return;
      const bounds = overlay.getBounds();
      const wins = snap.wins
        .map((w) => toOverlay(w, bounds))
        // only what overlaps Capri's screen
        .filter((w) => w.x < bounds.width && w.x + w.w > 0 && w.y < bounds.height && w.y + w.h > 0);
      const changedForeground = latest?.fg !== snap.fg;
      const icons = (snap.icons || []).map(w => toOverlay(w, bounds))
        .filter(w => w.x < bounds.width && w.x + w.w > 0 && w.y < bounds.height && w.y + w.h > 0);
      latest = { fg: snap.fg, wins, icons };
      if (changedForeground) keepOverlayAbove(overlay, latest);
      onUpdate(latest);
    });
    child.stderr.on('data', (d) => console.error('[capri] window watch:', String(d).trim()));
    child.on('exit', () => {
      child = null;
      if (!stopped && restarts++ < 3) setTimeout(start, 3000);
    });
  };

  start();
  return {
    stop() {
      stopped = true;
      clearInterval(layerTimer);
      child?.kill();
    },
  };
}

module.exports = { startWindowWatch, keepOverlayAbove };
