"use strict";
const history = document.getElementById('history');
const entry = document.getElementById('entry');
const status = document.getElementById('status');
const modelSelect = document.getElementById('model-select');
modelSelect.addEventListener('change', () => {
  if (!['codex', 'claude'].includes(modelSelect.value)) return;
  window.host.localCommand({ command: 'brain', provider: modelSelect.value });
});
let count = 0, speakingTimer, approvalId, sendingText = null;
function state(name, label) { document.body.dataset.state = name; document.getElementById('connection').textContent = label; }
function receive(event) {
  if (event.event === 'partial') {
    document.getElementById('empty')?.remove();
    let live = document.getElementById('live-reply');
    if (!live) { live = document.createElement('div'); live.id = 'live-reply'; live.className = 'message__text'; history.append(live); }
    live.textContent = event.text; history.scrollTop = history.scrollHeight; state('thinking','REPLYING');
  }
  if (event.event === 'reply' || event.event === 'cleared' || event.event === 'fatal' || event.event === 'partial-clear' || event.event === 'accepted'
    || (event.event === 'memory' && (event.sleeping || event.paused))
    || (event.event === 'status' && /cancelled|failed|selected/i.test(event.text || ''))) document.getElementById('live-reply')?.remove();
  if (event.event === 'brain') {
    modelSelect.value = event.provider;
    modelSelect.disabled = false;
    status.textContent = event.provider === 'claude' ? 'Claude selected · Claude account' : 'Codex selected · ChatGPT account';
    document.getElementById('brain-label').textContent = event.provider === 'claude' ? 'CLAUDE' : 'CODEX';
  }
  if (event.event === 'approval') {
    approvalId = event.request_id;
    document.getElementById('approval-detail').textContent = JSON.stringify(event.action, null, 2);
    document.getElementById('approval').hidden = false;
    state('paused', 'REVIEW');
  }
  if (event.event === 'approval-cleared') { approvalId = null; document.getElementById('approval').hidden = true; }

  if (event.event === 'draft') { entry.value = event.text; entry.focus(); updateCount(); }
  if (event.event === 'cleared') { history.replaceChildren(); count = 0; document.getElementById('message-count').textContent = '000 MESSAGES'; }
  if (event.event === 'accepted' && event.text === sendingText) {
    if (event.accepted && entry.value.trim() === sendingText) { entry.value = ''; updateCount(); }
    sendingText = null;
  }
  if (event.event === 'reply' || (event.event === 'accepted' && event.accepted)) {
    document.getElementById('empty')?.remove();
    const isReply = event.event === 'reply';
    const expression = ({ happy: 'smug', curious: 'wide', idle: 'calm', talking: 'look' })[event.emotion] || 'look';
    const block = document.createElement('div'); block.className = 'message' + (isReply ? '' : ' message--user');
    const who = document.createElement('div'); who.className = 'who'; who.textContent = isReply ? 'CAPRI / CONSTRUCT' : 'YOU / OPERATOR'; who.dataset.index = String(++count).padStart(3, '0');
    if (isReply) {
      const face = document.createElement('img'); face.className = 'message__face';
      face.src = `../../assets/capri/face-${expression}.png`; face.alt = 'Capri';
      who.prepend(face);
      document.querySelector('.portrait img').src = face.src;
    }
    const text = document.createElement('div'); text.className = 'message__text'; text.textContent = event.text;
    block.append(who, text); history.append(block); history.scrollTop = history.scrollHeight;
    document.getElementById('message-count').textContent = String(count).padStart(3, '0') + ' MESSAGES';
  }
  if (event.event === 'status' || event.event === 'fatal') {
    status.textContent = event.text;
    if (event.event === 'fatal') state('error', 'SIGNAL LOST');
    else if (event.text.startsWith('Thinking')) state('thinking', 'THINKING');
    else if (event.text.startsWith('Codex ·')) state('thinking', 'CODEX');
    else if (event.text.startsWith('Preparing')) state('thinking', 'VOICE');
    else if (event.text.startsWith('PC tool')) state('thinking', 'PC ACCESS');
    else state('idle', 'ONLINE');
  }
  if (event.event === 'speaking') { clearTimeout(speakingTimer); state('speaking', 'SPEAKING'); speakingTimer = setTimeout(() => state('idle', 'ONLINE'), event.duration * 1000); }
  if (event.event === 'memory') {
    document.getElementById('vram').textContent = event.gib === null ? 'GPU —' : `VRAM ${event.gib.toFixed(2)} / 8 GiB`;
    if (approvalId) { state('paused', 'REVIEW'); return; }
    if (event.paused || event.sleeping || !event.telemetry) { clearTimeout(speakingTimer); state(event.sleeping ? 'dormant' : 'paused', event.sleeping ? 'DORMANT' : 'PAUSED'); }
    else if (!['thinking', 'speaking', 'error'].includes(document.body.dataset.state)) state('idle', 'ONLINE');
  }
}
window.host.onLocalEvent(receive);
window.host.onLocalEvent(event => { if (event.event === 'focus-entry') entry.focus(); });
window.host.localHistory().then(events => events.forEach(receive));
function updateCount() { document.getElementById('characters').textContent = `${entry.value.length} / 2000`; }
entry.addEventListener('input', updateCount);
document.querySelector('form').addEventListener('submit', event => { event.preventDefault(); const text = entry.value.trim(); if (text && sendingText === null) { sendingText = text; window.host.localCommand({ command: 'send', text }); } });
entry.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); document.querySelector('form').requestSubmit(); } });
document.getElementById('cancel').onclick = () => window.host.localCommand({ command: 'cancel' });
document.getElementById('settings').onclick = () => window.host.localCommand({ command: 'settings' });
for (const action of ['minimize', 'maximize', 'close']) document.getElementById(action).onclick = () => window.host.chatWindow(action);

for (const [id, approved] of [['approve-action', true], ['deny-action', false]]) document.getElementById(id).onclick = () => {
  if (approvalId) window.host.localCommand({ command: 'approve', request_id: approvalId, approved });
};

document.getElementById('vault').onclick = () => window.host.localCommand({ command: 'vault' });
