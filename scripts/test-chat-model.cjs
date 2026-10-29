const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const elements = new Map(), commands = [];
const node = () => ({ dataset: {}, children: [], append(...items) { this.children.push(...items); },
  prepend(item) { this.children.unshift(item); }, remove() {} });
const element = id => {
  if (!elements.has(id)) elements.set(id, { ...node(), value: '', textContent: '', disabled: true, handlers: {},
    addEventListener(name, callback) { this.handlers[name] = callback; }, focus() {} });
  return elements.get(id);
};
const context = vm.createContext({ document: { createElement: node, getElementById: element, querySelector: element, body: { dataset: {} } },
  window: { host: { onLocalEvent() {}, localHistory: () => Promise.resolve([]), localCommand: value => commands.push(value) } },
  clearTimeout, setTimeout });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/renderer/js/chat.js'), 'utf8'), context);
context.receive({ event: 'brain', provider: 'claude' });
assert.equal(element('model-select').value, 'claude');
assert.equal(element('model-select').disabled, false);
element('model-select').value = 'codex';
element('model-select').handlers.change();
assert.equal(commands[0].command, 'brain');
assert.equal(commands[0].provider, 'codex');
context.receive({ event: 'brain', provider: 'codex' });
assert.equal(element('brain-label').textContent, 'CODEX');
element('model-select').value = 'invalid';
element('model-select').handlers.change();
assert.equal(commands.length, 1);
context.receive({ event: 'reply', text: 'Oh, there it is.', emotion: 'curious' });
assert.match(element('.portrait img').src, /face-wide\.png$/);
const message = element('history').children.at(-1);
assert.match(message.children[0].children[0].src, /face-wide\.png$/);
assert.equal(message.children[1].textContent, 'Oh, there it is.', 'acting never adds stage directions');
console.log('Chat model selection, backend synchronization and invalid choice guard: PASS');
