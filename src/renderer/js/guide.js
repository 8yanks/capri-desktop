// Showing you around: short tutorials where she goes places, points at things with her finger
// and pulls faces. Each topic is a little scene: what she says (and with which face), what she
// points at, and the buttons that move it on. Anything else coming up (Codex doing something,
// you closing the panel) ends it.

import { fmt } from './util.js';

const IDLE_FOR = 10 * 60 * 1000; // no wandering off while she's showing you something

export class Guide {
  constructor({ capri, panel, voice, host, brain }) {
    this.capri = capri;
    this.panel = panel;
    this.voice = voice;
    this.host = host;
    this.brain = brain;
    this.waiting = null; // { token, resolve } of the panel on screen
    this.running = false;
    this.sceneId = 0;
    panel.onAction = (id) => this.answer(id);
    panel.onDismiss = (msg) => {
      if (this.waiting && msg.token === this.waiting.token) this.answer(null);
    };
  }

  get t() {
    return this.brain.t.guide;
  }

  // One panel of the guide; resolves with the id of the button you click, or null if it went away.
  ask({ kind = 'info', face, line, quote, badge, actions }) {
    this.answer(null);
    const token = Symbol('guide');
    return new Promise((resolve) => {
      this.waiting = { token, resolve };
      // something more important on screen (a permission prompt, Codex's answer): no guide now
      if (!this.panel.say({ kind, face, line, quote, badge, actions, guide: true, hold: null, token })) this.answer(null);
    });
  }

  answer(id) {
    const waiting = this.waiting;
    this.waiting = null;
    waiting?.resolve(id);
  }

  ok(primary = true) {
    return [{ id: 'ok', label: this.t.ok, primary }];
  }

  // Run a scene: she stays put meanwhile, and stops pointing at the end whatever happened.
  // A new scene ends the one that was on (its panel goes, it returns); only the last one cleans up.
  async scene(play) {
    const { capri } = this;
    const id = ++this.sceneId;
    this.answer(null);
    capri.stopPointing(); // whatever the last scene was showing
    if (capri.stowed) {
      this.host.setConfig({ visible: true });
      await capri.unstow();
    }
    capri.wake();
    this.running = true;
    capri.nextMove = capri.nextGaze = performance.now() + IDLE_FOR;
    try {
      await play();
    } finally {
      if (id === this.sceneId) {
        this.running = false;
        capri.stopPointing();
        capri.nextMove = performance.now() + 30000;
        capri.nextGaze = performance.now() + 60000;
        if (this.panel.current?.token) this.panel.hide();
      }
    }
  }

  // ---------- topics ----------

  // First launch, or nothing hooked up yet: who she is, and plugging her into Codex.
  welcome() {
    return this.scene(() => this.ask({ face: 'look', line: 'I can follow Codex on this computer.',
      quote: 'Open my menu to configure the connection. Codex requires you to review and trust its hooks in /hooks. This does not connect to chatgpt.com.',
      actions: this.ok() }));
  }

  // "How does it work?" in her menu: what she can show you.
  menu() {
    return this.scene(() => this.menuNow());
  }

  async menuNow() {
    const t = this.t;
    const hooks = await this.host.hooksStatus();
    const actions = [];
    if (!hooks.installed) actions.push({ id: 'connect', label: t.topics.connect, primary: true });
    actions.push({ id: 'icon', label: t.topics.icon, primary: hooks.installed });
    actions.push({ id: 'claude', label: t.topics.claude });
    actions.push({ id: 'folder', label: t.topics.folder });
    actions.push({ id: 'close', label: t.topics.close });
    this.capri.perform('curious', this.capri.towardCenter());
    const id = await this.ask({ face: 'smug', line: t.menu.line, quote: t.menu.quote, actions });
    if (id === 'connect') await this.connect();
    else if (id === 'icon') await this.icon();
    else if (id === 'claude') await this.claude();
    else if (id === 'folder') await this.folder();
  }

  // Plugging her into Codex: one click, then a fresh Codex session.
  async connect() {
    const result = await this.host.installHooks();
    await this.ask({ kind: result.ok ? 'info' : 'error', face: result.ok ? 'look' : 'wide',
      line: result.ok ? 'The Codex connection is configured.' : 'The connection could not be configured.',
      quote: result.ok ? 'In Codex, open /hooks, review the Capri definitions and trust them. Restart Codex if it has not picked up the new configuration. I will react once real events arrive.' : String(result.error || ''),
      actions: this.ok() });
  }

  // Where her tray icon is: she goes down to the clock and points at it.
  async icon() {
    const t = this.t.icon;
    const place = await this.host.trayPlace();
    const scene = this.sceneId;
    await this.capri.pointAt(place.icon || place.corner, { label: this.t.labels.icon });
    if (scene !== this.sceneId) return; // another scene took over meanwhile
    await this.ask({ face: 'look', line: t.line, quote: place.icon ? t.quote : t.hidden, actions: this.ok() });
  }

  // Where Codex is: the window you typed your last prompt in.
  async claude() {
    const t = this.t.claude;
    const win = this.claudeWindow();
    if (!win) {
      await this.ask({ face: 'aside', line: t.unknown, quote: t.unknownHow, actions: this.ok() });
    } else if (!this.capri.canPoint(win)) {
      await this.ask({ face: 'calm', line: t.behind, quote: t.behindHow, actions: this.ok() });
    } else {
      const scene = this.sceneId;
      await this.capri.pointAt(win, { label: this.t.labels.claude });
      if (scene !== this.sceneId) return; // another scene took over meanwhile
      await this.ask({ face: 'look', line: t.there, quote: t.thereHow, actions: this.ok() });
    }
  }

  // Codex's folder: she opens it, waits for the window to come up, and points at it.
  async folder() {
    const t = this.t.folder;
    const { capri } = this;
    const before = capri.windows.fg;
    const opened = await this.host.openCodexFolder();
    if (!opened.found) {
      await this.ask({ face: 'wide', line: t.missing, quote: t.missingHow, actions: this.ok() });
      return;
    }
    // Explorer comes up in front: a new window, or the one already showing that folder, brought back
    const front = () => capri.windows.wins.find((w) => w.id === capri.windows.fg) || null;
    const findTarget = () => opened.windowId ? capri.windows.wins.find(w => w.id === opened.windowId) : null;
    const win = await this.until(findTarget, 4000);
    const scene = this.sceneId;
    if (win && capri.canPoint(win)) await capri.pointAt(win, { label: '.codex' });
    if (scene !== this.sceneId) return; // another scene took over meanwhile
    const id = await this.ask({
      face: 'smug',
      line: win ? fmt(t.line, { dir: opened.dir }) : 'The Codex folder was requested, but I could not locate its window.',
      quote: opened.file ? t.what : t.empty,
      actions: [{ id: 'next', label: this.t.next, primary: true }, { id: 'close', label: this.t.ok }],
    });
    if (id !== 'next') return;
    await this.ask({ face: 'calm', line: t.hook, quote: t.hookHow, actions: this.ok() });
  }

  // ---------- helpers ----------

  // Codex's window: the one you typed your last prompt in, if it's still around.
  claudeWindow() {
    const { wins } = this.capri.windows;
    const detected = wins.find(w => w.kind === 'codex');
    if (detected) return detected;
    const sessions = [...this.brain.sessions.values()].filter((s) => s.window).sort((a, b) => b.seen - a.seen);
    for (const s of sessions) {
      const win = wins.find((w) => w.id === s.window);
      if (win) return win;
    }
    return null;
  }

  until(find, max) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      const look = () => {
        const found = find();
        if (found || performance.now() - t0 > max) resolve(found || null);
        else setTimeout(look, 100);
      };
      look();
    });
  }
}
