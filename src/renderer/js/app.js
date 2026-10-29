import { bindSystemSpeech } from './system-speech.js';
import { configureMotion, reducedMotion } from './util.js';
import { Capri } from './capri.js';
import { dialogueActing } from './dialogue.js';
import { loadPoseSprites, PoseSprites } from './pose-sprites.js';
import { Wardrobe } from './wardrobe.js';
import { roseImage } from './sprite-style.js';
import { SpeechPlayback } from './speech-playback.js';
import { CompanionLife } from './companion-life.js';

import { FxLayer, GRAB_FRAMES } from './fx.js';

import { Chip, Mask } from './chip.js';

import { Panel } from './panel.js';

import { Voice } from './voice.js';

import { Brain } from './brain.js';

import { Guide } from './guide.js';

import { LINES } from './lines.js';

import { pick, fmt } from './util.js';



const host = window.host;
bindSystemSpeech(host);



function loadImage(src) {

  return new Promise((resolve, reject) => {

    const img = new Image();

    img.onload = () => resolve(roseImage(img));

    img.onerror = reject;

    img.src = src;

  });

}



// close-ups of her for the cut-ins, frames of the show (tools/build-cutins.py)

const CUTINS = ['grin', 'laugh', 'eyes', 'many', 'look'];



async function boot() {

  const [config, image, intro, illustratedLibrary, ...cutins] = await Promise.all([

    host.getConfig(),

    loadImage('../../assets/capri/capri-full.png'),

    Promise.all(GRAB_FRAMES.map(name => loadImage(`../../assets/capri/intro-${name}.webp`).catch(() => null)))
      .then(cels => Promise.all(cels.map(cel => cel && createImageBitmap(cel))))
      .then(cels => cels[0] ? Object.fromEntries(GRAB_FRAMES.map((name, i) => [name, cels[i]])) : null),

    loadPoseSprites().catch(error=>{console.warn('[capri] illustrated poses unavailable:',error.message);return null;}),
    ...CUTINS.map((name) => loadImage(`../../assets/capri/cutin-${name}.png`)),

    document.fonts.load('600 16px "Chakra Petch"'),

    document.fonts.load('400 11px "JetBrains Mono"'),

  ]);

  configureMotion(config.motion);
  document.documentElement.lang = config.lang;



  const fx = new FxLayer(document.getElementById('fx'), {

    cutins: Object.fromEntries(CUTINS.map((name, i) => [name, cutins[i]])),

    intro,

  });

  fx.resize(innerWidth, innerHeight);

  const chip = new Chip(document.getElementById('chip'));

  chip.place(innerWidth, innerHeight);

  const mask = new Mask(document.getElementById('mask'));



  const voice = new Voice();

  voice.configure(config);
  const speech=new SpeechPlayback({context:()=>voice.ensure(),send:message=>host.localCommand(message),muted:()=>voice.muted});

  host.listSounds().then((list) => list.length && voice.loadCustom(list));



  const panel = new Panel({

    panel: document.getElementById('panel'),

    ticker: document.getElementById('ticker'),

    labels: LINES.en,

  });



  const capri = new Capri({

    root: document.getElementById('capri'),

    canvas: document.getElementById('sprite'),

    image,

    fx,

    voice,

  });
  let assistantCursorEnabled=config.assistantCursor!==false,pointerTimer;
  let musicDance=!!config.musicDance,lastOutput=0,lastMusicMove=0;
  host.onAudioLevel?.(event=>{
    if(!event.available){lastOutput=0;return;}
    const level=Number(event.level),now=performance.now();
    if(musicDance&&!capri.gameProtected&&!capri.resourceLocked&&level>.07&&level-lastOutput>.025&&now-lastMusicMove>2200){
      if(capri.idleActivity('dance'))lastMusicMove=now;
    }
    lastOutput=Number.isFinite(level)?level:0;
  });
  const assistantPointer=document.createElement('div');assistantPointer.className='assistant-pointer';assistantPointer.textContent='◈';assistantPointer.hidden=true;document.body.append(assistantPointer);

  capri.wander = config.wander;
  // System speech exposes no PCM clock; use the existing dialogue mouth fallback.
  let charm=Math.max(0,Math.min(100,Number(config.charm)||0));
  const life=new CompanionLife({actor:capri,onPat:()=>{
    capri.showEmote('♡');charm=Math.min(100,charm+1);host.setConfig({charm});
  },onCheckin:()=>host.localCommand({command:'check-in'})});
  life.configure(config);
  if(config.dev)window.__capriSpeechDebug=()=>({active:!!speech.id,mouth:speech.mouth(),drawnMouth:capri.poses?.lastMouthLevel});
  capri.transitionFx = config.transitionFx!==false;
  let mischiefEnabled=!!config.mischief;
  capri.forceGameMode = !!config.gameMode;

  capri.possessWindows = config.possess;

  capri.setScale(config.scale);



  const brain = new Brain({ capri, panel, voice, host, lang: config.lang });
  capri.areas = config.areas || [];
  const wardrobe = new Wardrobe({apply: (outfit,manual) => capri.poses?.setOutfit(outfit,{manual})});
  wardrobe.configure(config.outfit);
  const updateWardrobe = data => wardrobe.update(data, !!(capri.busy || capri.act || capri.dragging || capri.dialogueActive || capri.resourceLocked || capri.stowed || capri.dormant));
  if(illustratedLibrary){capri.poses=new PoseSprites(capri.root,illustratedLibrary);capri.poses.setOutfit(wardrobe.current,{manual:wardrobe.mode!=='auto'});}
  if (config.dev) window.__capriDebug = () => ({ illustrated: { loaded: !!capri.poses, visible: !!capri.poses?.visible, frames: Object.keys(capri.poses?.library.frames || {}).length }, reducedMotion: reducedMotion.matches, gameProtected: !!capri.gameProtected, position: { ...capri.pos }, view: { ...capri.view }, mode: capri.mode, stance: capri.stance, busy: capri.busy, act: capri.act?.player.name || null, satellite: !!capri.sky, stars: !!capri.sky?.motes, beam: !!capri.sky?.surge, windows: capri.windows.wins.map(w => ({ id: w.id, kind: w.kind })), guide: guide?.running });



  // Click-through everywhere except on her body, the panel and her biochip.

  let interactive = false;

  let mouse = null;

  const setInteractive = (on) => {

    if (on === interactive) return;

    interactive = on;

    host.setInteractive(on);

  };

  const onChip = () => Boolean(chip.visible && mouse && chip.contains(mouse.x, mouse.y, 0));

  const refreshHit = () => {

    if (capri.dragging) return setInteractive(true);

    if (!mouse) return setInteractive(false);

    const r = panel.rect();

    const onPanel = r && mouse.x >= r.left && mouse.x <= r.right && mouse.y >= r.top && mouse.y <= r.bottom;

    document.body.style.cursor = onChip() ? 'pointer' : '';

    return setInteractive(Boolean(onPanel || capri.hit(mouse.x, mouse.y) || onChip()));

  };

  // Her biochip: her eyes on it follow the pointer over it, and she comes out when you click it

  // (only then, so the pointer passing through that corner doesn't call her back).

  // Her mask, asleep: the pointer coming over it stirs her, and a moment of that wakes her up.

  let wakeTimer = 0;

  const comeOut = () => {

    if (capri.stowed) host.setConfig({ visible: true }); // the tray and Ctrl+Alt+C follow

    capri.unstow();

  };

  const hoverChip = () => {

    chip.pointer = chip.visible && mouse && chip.contains(mouse.x, mouse.y) ? mouse : null;

    const near = mask.visible && mouse && mask.contains(mouse.x, mouse.y, 30);

    mask.pointer = near ? mouse : null;

    if (!near) {

      clearTimeout(wakeTimer);

      wakeTimer = 0;

    } else if (!wakeTimer) {

      wakeTimer = setTimeout(() => {

        wakeTimer = 0;

        if (capri.dormant) capri.wake();

      }, 400);

    }

  };

  window.addEventListener('mousemove', (e) => {

    mouse = { x: e.clientX, y: e.clientY };

    refreshHit();

    hoverChip();

  });

  document.addEventListener('mouseleave', () => {

    mouse = null;

    refreshHit();

    hoverChip();

  });

  // Windows games may swallow the forwarded mousemove while we are click-through.
  let cursorPending = false;
  const cursorTimer = setInterval(async () => {
    if (cursorPending || capri.dragging) return;
    cursorPending = true;
    try {
      const cursor = await host.cursor();
      if (!capri.dragging) {
        mouse = cursor.inside ? { x: cursor.x, y: cursor.y } : null;
        refreshHit();
        hoverChip();
        if(!reducedMotion.matches)life.tick(mouse,performance.now());
      }
    } catch { /* window may be closing */ }
    finally { cursorPending = false; }
  }, 100);
  window.addEventListener('beforeunload', () => clearInterval(cursorTimer), { once: true });

  window.addEventListener('contextmenu', (e) => {

    e.preventDefault();

    if (chip.visible && chip.contains(e.clientX, e.clientY, 0)) host.openMenu();

  });

  window.addEventListener('click', (e) => {

    if (chip.visible && chip.contains(e.clientX, e.clientY, 0)) comeOut();

  });



  // wiring

  capri.onMove = (head) => {
    document.body.classList.toggle('game-protected', !!capri.gameProtected);

    // pointing at something: the panel goes on her other side, so it doesn't cover it

    panel.setAnchor({ ...head, lean: capri.pointing ? -capri.pointing.dir : 0 }, capri.view);

    // she may have moved out from under a still pointer: never leave a dead click zone behind

    refreshHit();

  };

  capri.onTeleport = (phase) => (phase === 'start' ? panel.suspend() : panel.resume());

  capri.chipAt = () => chip.center();

  capri.onStow = () => {

    chip.setMode(capri.mode);

    chip.show();

  };

  capri.onUnstow = () => chip.hide();

  capri.onDoze = (phase, face) => {

    if (phase === 'start') {

      mask.place(face.x, face.y, capri.scale * 1.1);

      mask.show();

    } else if (phase === 'waking') {

      mask.wake();

    } else {

      mask.hide();

    }

  };

  capri.onMode = (mode, prev) => chip.setMode(mode, prev);

  // now and then she says something about the satellite: while she looks at it, or once

  // the red light has gone up (never during, nothing should cover that)

  capri.onGaze = (when) => {

    const lines = when === 'end' ? brain.t.uplink : brain.t.gaze;

    if (!panel.visible && Math.random() < (when === 'end' ? 0.6 : 0.4)) panel.say({ kind: 'info', line: pick(lines), hold: 3800 });

  };

  capri.onClick = () => host.localCommand({ command: 'open' });

  panel.onChar = null; // Japanese speech replaces per-character synthetic blips.

  const dialogue = dialogueActing(capri, panel);
  panel.onTalk = talking => dialogue.talking(talking, panel.current);
  panel.onHidden = () => dialogue.stop();
  window.addEventListener('beforeunload', () => {dialogue.stop();speech.stop();});

  capri.onMenu = () => host.openMenu();



  // Her guide (guide.js): her welcome on first launch, and "How does it work?" in her menu,

  // where she takes you to things and points at them.

  const guide = new Guide({ capri, panel, voice, host, brain });

  // the first Claude Code event that ever reaches her: so you know it worked

  brain.linked = config.linked;

  brain.onLinked = () => {

    host.setConfig({ linked: true, welcomed: true });

    voice.play('hello');

    capri.perform('hop');

    panel.say({ kind: 'done', badge: 'LINK', line: 'A Codex event reached me. We are connected.', hold: 6000 });

  };



  // The demo's second half, after its fake Claude session: everything she does on her own, one

  // after the other, a line before each.

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const until = async (done, max = 15000) => {

    for (const t0 = Date.now(); !done() && Date.now() - t0 < max;) await wait(100);

  };

  const free = () => !capri.busy && !capri.act && capri.stance !== 'fall';

  brain.onShowcase = async () => {

    const t = brain.t.showcase;

    const caption = (line) => panel.say({ kind: 'info', line, hold: 2200 });

    capri.nextMove = capri.nextGaze = performance.now() + 120000; // nothing of her own in between

    if (capri.stowed) await capri.unstow();

    if (capri.dormant) capri.wake();

    await until(free);

    panel.hide();



    caption(t.minds);

    await wait(1000);

    await capri.perform('split');

    await wait(900);



    caption(t.zap);

    await wait(1000);

    const h = capri.head();

    capri.zap(h.x + capri.towardCenter() * 280, h.y - 170);

    await wait(1800);



    panel.hide();

    if (capri.gaze({ big: true })) await until(() => !capri.sky);

    await wait(2500);



    // a little terminal opens for her to take over, and closes under her once she's done with it

    if (capri.possessWindows && (await host.demoWindow(true))) {

      const top = () => capri.windows.wins.find((w) => capri.canSit(w)); // it opens on top of everything

      await until(top, 4000);

      const win = top();

      const seat = win && { win, dx: win.w * 0.4 };

      if (seat) {

        panel.hide();

        await capri.sitOn(seat);

        await until(free);

        caption(t.possess);

        await wait(1400);

        panel.hide();

        await capri.possess();

        await wait(1800);

      }

      host.demoWindow(false);

      await wait(400);

      await until(free); // she may have fallen off it

      await wait(900);

    }



    caption(t.sleep);

    await wait(1400);

    panel.hide();

    capri.setMode('sleep');

    await wait(2500); // dozing off

    await capri.doze();

    await wait(4500);

    capri.wake();

    await until(free);

    await wait(1200);



    caption(t.chip);

    await wait(1600);

    panel.hide();

    await capri.stow();

    await wait(3500);

    await capri.unstow();

    await wait(600);

    panel.say({ kind: 'info', line: t.end, hold: 5000 });

  };



  host.onClaudeEvent((evt) => { if (!capri.resourceLocked && !capri.gameProtected) brain.handle(evt); });

  host.onWindows((data) => {

    capri.setWindows(data);
    updateWardrobe(data);
    if (capri.gameProtected) panel.hide();

    brain.onWindows(data);

  });

  // the windows as they are now: the watcher only speaks again when something changes

  host.windowsNow().then((data) => { if(data){capri.setWindows(data);updateWardrobe(data);} });



  let forcedSleep = false;
  let assistantScopeGeneration = 0;

  host.onLocalEvent((event) => {
    if(['cleared','scope-changed','fatal'].includes(event.event)){clearTimeout(pointerTimer);assistantPointer.hidden=true;}
    if(event.event==='pc-result'&&event.ok&&event.pointer&&assistantCursorEnabled&&!capri.gameProtected&&!capri.resourceLocked){
      const {x,y}=event.pointer;
      if(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&y>=0&&x<innerWidth&&y<innerHeight){
        assistantPointer.style.left=x+'px';assistantPointer.style.top=y+'px';assistantPointer.hidden=false;
        clearTimeout(pointerTimer);pointerTimer=setTimeout(()=>assistantPointer.hidden=true,1800);
      }
    }

    if(event.event==='voice-audio'){
      if(!capri.resourceLocked||event.shutdown)speech.play(event);return;
    }
    if(event.event==='voice-stop'){speech.stop(event.playback_id);dialogue.voiceEnded();return;}
    if(event.event==='voice-finished'){dialogue.voiceEnded();return;}
      if(event.event==='fatal')speech.stop();
      if (event.event === 'scope-changed' || event.event === 'cleared') {
      speech.stop();
      assistantScopeGeneration += 1;
      dialogue.stop(); capri.stopPointing(); panel.setTicker(null); panel.hide();
    } else if (event.event === 'memory') {

      const locked = event.sleeping || event.paused || !event.telemetry;
      fx.transitionsEnabled=!locked;
      if(locked)fx.cancelConstructs();
      if(locked&&!speech.shutdown)speech.stop();
      if (locked) dialogue.stop();

      capri.resourceLocked = locked;

      if (capri.resourceGlitch && !event.glitch) capri.p.glitch = 0;

      capri.resourceGlitch = event.glitch;

      if (locked && !forcedSleep) {

        capri.hurt();

        setTimeout(() => {

          if (!capri.resourceLocked) return;

          capri.setMode('sleep');

          if (!capri.busy && !capri.dormant) capri.doze();

        }, 1200);

      } else if (!locked && forcedSleep) capri.wake();

      forcedSleep = locked;

      document.body.classList.toggle('resource-glitch', event.glitch && !locked);

    } else if (event.event === 'pc-result' && event.ok && event.target && !capri.resourceLocked) {
      const target = event.target;
      const generation = assistantScopeGeneration;
      const deadline = Date.now() + 10000;
      const point = async () => {
        if (generation !== assistantScopeGeneration || capri.resourceLocked || Date.now() > deadline) return;
        if (capri.stowed) await capri.unstow();
        if (generation !== assistantScopeGeneration) return;
        capri.wake();
        if (capri.busy || capri.act) { setTimeout(point, 300); return; }
        const scene = guide.sceneId;
        if (capri.canPoint(target)) { await capri.pointAt(target, { label: 'EXPLORER' }); setTimeout(() => { if (guide.sceneId === scene) capri.stopPointing(); }, 6000); }
      };
      point();
    } else if (event.event === 'reply') {

      panel.hide();

      panel.say({ kind: 'info', badge: 'CAPRI', line: event.text,

        face: { happy: 'smug', curious: 'wide', idle: 'calm', talking: 'look' }[event.emotion], hold: 18000 });


    } else if (event.event === 'status') {

      const stage=/^Hearing/.test(event.text)?'HEARING YOU':/^Listening/.test(event.text)?'LISTENING':/^Opening microphone/.test(event.text)?'MIC START':/^Transcribing/.test(event.text)?'DECODING':/^Thinking|^Codex ·/.test(event.text)?'THINKING':/^Preparing/.test(event.text)?'VOICE':null;
      if (stage) {
        dialogue.stop();
        if (capri.act?.player.name.startsWith('idle-')) capri.endAct(false);

        panel.hide(); panel.setTicker({ verb: 'CAPRI', target: stage });

      }

    } else if (event.event === 'speaking' && !capri.resourceLocked) {

      dialogue.voice(event.duration);
      panel.syncVoice(event.duration);

      panel.hideTimer && clearTimeout(panel.hideTimer);

      panel.hideTimer = setTimeout(() => panel.hide(), event.duration * 1000 + 6000);

    } else if (event.event === 'fatal') {

      panel.say({ kind: 'error', line: event.text, hold: null });

    }

  });



  host.onResize(({ width, height, areas, offset }) => {

    fx.resize(width, height);

    chip.place(width, height);

    if (areas) capri.areas = areas;
    if (offset) { capri.pos.x += offset.x; capri.pos.y += offset.y; }
    capri.setView(width, height);

  });

  window.addEventListener('resize', () => {

    fx.resize(innerWidth, innerHeight);

    chip.place(innerWidth, innerHeight);

    capri.setView(innerWidth, innerHeight);

  });



  host.onConfig((cfg) => {
    musicDance=!!cfg.musicDance;
    assistantCursorEnabled=cfg.assistantCursor!==false;if(!assistantCursorEnabled||cfg.gameMode)assistantPointer.hidden=true;
    wardrobe.configure(cfg.outfit);
    configureMotion(cfg.motion);

    voice.configure(cfg);
    if(cfg.muted)speech.stop();
    life.configure(cfg);
    charm=Math.max(0,Math.min(100,Number(cfg.charm)||0));

    capri.wander = cfg.wander;
    capri.transitionFx=cfg.transitionFx!==false;
    mischiefEnabled=!!cfg.mischief;
    capri.forceGameMode = !!cfg.gameMode;
    capri.place();

    capri.possessWindows = cfg.possess;

    if (cfg.scale !== capri.scale) capri.setScale(cfg.scale);

    if (cfg.lang !== brain.lang) {

      brain.lang = cfg.lang;

      panel.labels = LINES.en;

      document.documentElement.lang = cfg.lang;

    }

  });



  host.onCommand(async (cmd) => {

    const t = brain.t;

    if (capri.resourceLocked && !['stow', 'config', 'freeze'].includes(cmd.name)) return;

    switch (cmd.name) {
      case 'visual-prank': {
        if(!mischiefEnabled||capri.gameProtected||capri.busy||capri.dragging)break;
        const head=capri.head();
        if(!reducedMotion.matches){fx.slices(head.x-50,head.y-35,100,140,{count:6,life:200});fx.glyph(head.x,head.y-50);}
        capri.showEmote('?!');
        panel.say({kind:'info',badge:'SIMULATION',line:'Your pixels asked for a little drama. There. Satisfied?',face:'smug',hold:6500});
        break;
      }
      case 'idle-activity':
        capri.idleActivity(cmd.activity);
        break;

      case 'teleport':

        capri.teleport(capri.spot('random'));

        break;

      case 'status':

        brain.status();

        break;

      case 'welcome': // "How does it work?" in her menu

        guide.menu();

        break;

      case 'fakeClaude': { // --dev: the topmost window (the test window) is where a prompt was typed, and you're elsewhere

        const win = capri.windows.wins[0];

        if (win) {

          brain.sessions.set('dev', { id: 'dev', project: 'dev', taskStart: Date.now(), count: 0, files: new Set(), log: [], working: true, waiting: false, window: win.id, seen: Date.now() });

          capri.windows = { ...capri.windows, fg: -1 };

        }

        break;

      }

      case 'guide': // --dev: one topic of her guide (welcome, menu, connect, icon, claude, folder)

        if (cmd.topic === 'welcome') guide.welcome();

        else if (cmd.topic === 'menu') guide.menu();

        else if (typeof guide[cmd.topic] === 'function') guide.scene(() => guide[cmd.topic]());

        break;

      case 'stow': // Ctrl+Alt+C: into her biochip, or back out

        if (cmd.on) capri.stow();

        else capri.unstow();

        break;

      case 'possess-now': {
        if (reducedMotion.matches) { panel.say({ kind: 'info', line: 'Choose Full Capri animations to enable window possession.', hold: 6000 }); break; }
        const seat = capri.pickSeat();
        if (!seat) { panel.say({ kind: 'info', line: 'Open a restored window with some space above it first.', hold: 6000 }); break; }
        if (!capri.canPossess()) await capri.sitOn(seat);
        const deadline = Date.now() + 10000;
        while (capri.busy && Date.now() < deadline) await new Promise(r => setTimeout(r, 100));
        await capri.possess();
        break;
      }
      case 'satellite': // the whole sequence, on demand (tray)

        if (capri.stowed) {

          host.setConfig({ visible: true });

          await capri.unstow();

        }

        capri.wake();

        if (capri.stance === 'peek') await capri.unpeek();

        if (!capri.gaze({ big: true })) setTimeout(() => capri.gaze({ big: true }), 1500);

        break;

      case 'hooks':

        if (cmd.ok) panel.say({ kind: 'info', line: cmd.action === 'install' ? 'Codex hooks configured. Review and trust Capri in Codex /hooks.' : 'Capri hooks removed from Codex.', hold: 9000 });

        else panel.say({ kind: 'error', line: fmt(t.hooksFail, { error: cmd.error }), hold: 9000 });

        break;

      // --dev helpers

      case 'intro': // her intro again, as when she starts (still: as with Windows' animations off)

        panel.hide();

        await capri.intro(capri.spot('post'), cmd.still ? { still: true } : {});

        break;

      case 'pose':

        capri.debug = cmd.params || null;

        if (cmd.still) capri.nextMove = capri.nextGaze = Infinity; // no wandering off mid-test

        if (cmd.hush) {

          panel.setTicker(null);

          panel.hide();

        }

        if (cmd.scale) capri.setScale(cmd.scale);

        if (cmd.stance) capri.setStance(cmd.stance, cmd);

        if (cmd.at) capri.pos = cmd.at;

        if (cmd.facing) capri.facing = cmd.facing;

        capri.drawFrame();

        break;

      case 'config': // a setting, as if changed from her menu

        host.setConfig(cmd.patch || {});

        break;

      case 'focus': // as if window `fg` had come to the front

        capri.windows = { ...capri.windows, fg: cmd.fg };

        brain.onWindows(capri.windows);

        break;

      case 'freeze':

        capri.hidden = Boolean(cmd.on);

        break;

      case 'act':

        // behaviours by method name (gaze, celebrate, hurt, shed, peek, fall, wanderStep...) or acts by name

        if (cmd.act === 'sit') {

          // pile: n-th window she could sit on from the top of the pile (0: the --dev test window

          // opened last), instead of the usual choice

          const top = cmd.pile !== undefined && capri.windows.wins.filter((w) => capri.canSit(w))[cmd.pile];

          const seat = top ? { win: top, dx: top.w * 0.4 } : capri.pickSeat();

          if (seat) capri.sitOn(seat);

        } else if (typeof capri[cmd.act] === 'function') capri[cmd.act](...(cmd.args || []));

        else capri.perform(cmd.act, cmd.dir || 0);

        break;

      default:

        break;

    }

  });



  // entrance: her face big in the corner says hi, then she dives down to her spot

  // (put away last time: she starts in her biochip)

  if (config.visible === false) capri.stowNow();

  else if (intro) await capri.intro(capri.spot('post'));

  else await capri.materialize(capri.spot('post'));

  host.localCommand({ command: 'hello' });

}



boot().catch((err) => {

  console.error('[capri] boot failed', err);

});

