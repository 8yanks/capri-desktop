// One acting path for generated replies, guide lines and Codex notifications.
import { reducedMotion } from './util.js';

const MOODS = {
  smug: ['dialogue-smug', 'look'], laugh: ['dialogue-smug', 'smug'],
  wide: ['dialogue-curious', 'look'], many: ['dialogue-curious', 'wide'],
  aside: ['dialogue-soft', 'calm'], calm: ['dialogue-soft', 'look'],
  look: ['talk', 'calm'], grin: ['dialogue-smug', 'look'],
};
const faceFor = current => current?.face || ({ done: 'smug', alert: 'many', error: 'aside', idle: 'calm', work: 'calm' }[current?.kind]) || 'look';
const spriteFace = face => ({smug:'smug',laugh:'happy',wide:'surprised',many:'surprised',aside:'curious',calm:'neutral',look:'curious',grin:'happy'}[face]||'neutral');

export function dialogueActing(capri, panel) {
  let timer = null, message = null, face = 'look', beat = 0;
  let decoding = false, voiceUntil = 0;
  let nextBeatAt = 0;

  function stop() {
    clearInterval(timer); timer = null;
    decoding = false; voiceUntil = 0; message = null;
    nextBeatAt = 0;
    capri.dialogueActive = false;
    capri.faceExpression = null;
    if (capri.act?.player.name.startsWith('dialogue-')) capri.endAct(false);
  }

  function tick() {
    if (capri.resourceLocked || capri.stowed || capri.dormant || !panel.visible
      || reducedMotion.matches || (!decoding && performance.now() >= voiceUntil)) { stop(); return; }
    if (capri.dragging || capri.busy || capri.stance === 'fall' || capri.act) return;
    if(performance.now()<nextBeatAt)return;
    nextBeatAt=performance.now()+3500;
    const [accent, alternate] = MOODS[face] || MOODS.look;
    panel.setFace(beat % 3 === 1 ? alternate : face);
    capri.perform(beat++ % 2 === 0 ? accent : 'talk');
  }

  return {
    talking(on, current) {
      if (!on) {
        decoding = false;
        if (performance.now() >= voiceUntil) stop();
        return;
      }
      stop();
      if (capri.act?.player.name.startsWith('idle-')) capri.endAct(false);
      message = current;
      face = faceFor(current);
      decoding = true;
      capri.dialogueActive = true;
      capri.faceExpression = spriteFace(face);
      capri.lastActivity = performance.now();
      tick();
      if (message && !timer) timer = setInterval(tick, 950);
    },
    voice(seconds) {
      if (!Number.isFinite(seconds) || seconds <= 0 || !panel.visible || reducedMotion.matches) return;
      if (!message) { message = panel.current; face = faceFor(message); }
      if (!message) return;
      voiceUntil = performance.now() + Math.min(seconds, 180) * 1000;
      capri.dialogueActive = true;
      capri.faceExpression = spriteFace(face);
      if (!timer) timer = setInterval(tick, 950);
    },
    voiceEnded(){voiceUntil=0;if(!decoding)stop();},
    stop,
  };
}
