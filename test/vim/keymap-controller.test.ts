import { describe, expect, it } from 'vitest';
import { createVimController } from '../../src/vim/controller';
import { createVimHost } from '../support/vim-host';
import { KEYMAP_PRESETS } from '../../src/vim/presets';

const input = (key: string) => ({ key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false });
function setup(text: string, clipboard?: { read(): string; write(text: string): void }) {
  const cursor = text.indexOf('|'), host = createVimHost(text.replace('|', ''));
  host.dispatch({ selection: { anchor: cursor } });
  let now = 0;
  const tasks: { at: number; cb: () => void; active: boolean }[] = [];
  const vim = createVimController(host, { preset: 'mise-darwin', clipboard, timer: (ms, cb) => {
    const task = { at: now + ms, cb, active: true }; tasks.push(task); return () => { task.active = false; };
  } });
  host.onUpdate = tr => vim.noteUpdate({ state: tr.state, changes: tr.changes, docChanged: tr.docChanged, selectionSet: tr.selection !== undefined });
  const advance = (ms: number) => { now += ms; for (const task of tasks) if (task.active && task.at <= now) { task.active = false; task.cb(); } };
  return { host, vim, advance };
}
const press = (vim: ReturnType<typeof createVimController>, ...keys: string[]) => { for (const key of keys) vim.handleKey(input(key)); };
const type = (host: ReturnType<typeof createVimHost>, vim: ReturnType<typeof createVimController>, ...keys: string[]) => {
  for (const key of keys) if (!vim.handleKey(input(key)) && vim.allowsTextInput() && [...key].length === 1) {
    const { from, to } = host.state.selection.main;
    host.dispatch({ changes: { from, to, insert: key }, selection: { anchor: from + key.length }, userEvent: 'input.type' });
  }
};

describe('Vim keymap controller integration', () => {
  it('routes normal prefix arguments before mappings: gg and zz are immediate', () => {
    const { host, vim } = setup('a\nb|c\nd');
    press(vim, 'g', 'g'); expect(host.state.selection.main.head).toBe(0); expect(vim.pending).toBe('');
    press(vim, 'z', 'z'); expect(vim.pending).toBe(''); vim.dispose();
  });
  it('routes mark argument plus following motion without starting hop', () => {
    const { host, vim } = setup('|a\nb\nc'); press(vim, 'm', 'g', 'j');
    expect(host.state.selection.main.head).toBe(2); expect(host.markSets.get('emaki-vim-hop')).toEqual([]); vim.dispose();
  });
  it('defers insert k for kj and exits without inserting either key', () => {
    const { host, vim } = setup('|'); type(host, vim, 'i', 'a', 'b', 'k');
    expect(host.state.doc.toString()).toBe('ab'); expect(host.state.selection.main.head).toBe(2);
    type(host, vim, 'j'); expect(host.state.selection.main.head).toBe(1); expect(vim.mode).toBe('normal'); vim.dispose();
  });
  it('types a held insert k on timeout and allows a following key after mismatch', () => {
    const { host, vim, advance } = setup('|'); type(host, vim, 'i', 'k'); advance(1000);
    expect(host.state.doc.toString()).toBe('k'); type(host, vim, 'x'); expect(host.state.doc.toString()).toBe('kx'); vim.dispose();
  });
  it('types a non-matching key immediately after an insert mapping prefix', () => {
    const { host, vim } = setup('|'); type(host, vim, 'i', 'k', 'x');
    expect(host.state.doc.toString()).toBe('kx'); expect(vim.mode).toBe('insert'); vim.dispose();
  });
  it('preserves words when insert k is followed by a non-matching key', () => {
    const { host, vim } = setup('|'); type(host, vim, 'i', 'l', 'i', 'k', 'e');
    expect(host.state.doc.toString()).toBe('like'); vim.dispose();
  });
  it('delivers Enter immediately after an insert mapping prefix', () => {
    const { host, vim } = setup('|'); type(host, vim, 'i', 'k', 'Enter');
    expect(host.state.doc.toString()).toBe('k\n'); vim.dispose();
  });
  it('delivers Backspace immediately after an insert mapping prefix', () => {
    const { host, vim } = setup('|'); type(host, vim, 'i', 'a', 'k', 'Backspace');
    expect(host.state.doc.toString()).toBe('a'); vim.dispose();
  });
  it('shows delayed leader hints and suspends timeout while visible', () => {
    const { host, vim, advance } = setup('|abc'); press(vim, ' '); advance(200);
    expect(host.markSets.get('emaki-vim-hints')?.[0]?.style.label?.text).toContain('y: Yank to clipboard');
    advance(5000); expect(vim.pending).toContain('<Space>'); press(vim, 'y');
    expect(host.markSets.get('emaki-vim-hints')).toEqual([]); vim.dispose();
  });
  it('starts char hop and moves to the selected label', () => {
    const { host, vim } = setup('|foo foo'); press(vim, 'g', 'j', 'o');
    const marks = host.markSets.get('emaki-vim-hop') ?? []; expect(marks.length).toBeGreaterThan(0);
    const label = marks[0]; press(vim, label.style.label!.text);
    expect(host.state.selection.main.head).toBe(label.from); expect(host.markSets.get('emaki-vim-hop')).toEqual([]); vim.dispose();
  });
  it('cancels hop on Escape and clears its overlay', () => {
    const { host, vim } = setup('|foo foo'); press(vim, 'g', 'j', 'Escape');
    expect(host.markSets.get('emaki-vim-hop')).toEqual([]); expect(vim.pending).toBe(''); vim.dispose();
  });
  it('extends visual selection through a hop target', () => {
    const { host, vim } = setup('|foo foo'); press(vim, 'v', 'g', 'j', 'o');
    const label = host.markSets.get('emaki-vim-hop')?.[0]; expect(label).toBeDefined(); press(vim, label!.style.label!.text);
    expect(vim.mode).toBe('visual'); expect(host.state.selection.main.head).toBe(label!.from); vim.dispose();
  });
  it('keeps mark and find arguments literal after mapper prefixes', () => {
    const { host, vim } = setup('|a\nb\nc');
    press(vim, 'm', 'k', 'j', '`', 'k');
    expect(host.state.selection.main.head).toBe(0);
    const literal = setup('|a-k'); press(literal.vim, 'f', 'k');
    expect(literal.host.state.selection.main.head).toBe(2);
    const till = setup('|a-k'); press(till.vim, 't', 'k');
    expect(till.host.state.selection.main.head).toBe(1);
    literal.vim.dispose(); till.vim.dispose(); vim.dispose();
  });
  it('yanks the inner word to the clipboard through the leader mapping', async () => {
    let value = '';
    const { vim } = setup('|word rest', { read: () => value, write: text => { value = text; } });
    press(vim, ' ', 'y', 'i', 'w'); await Promise.resolve();
    expect(value).toBe('word'); vim.dispose();
  });
  it('uses the preset mm mapping for matching brackets', () => {
    const { host, vim } = setup('|(a)'); press(vim, 'm', 'm');
    expect(host.state.selection.main.head).toBe(2); vim.dispose();
  });
  it('routes remapped rhs arguments through parser argument bypass', () => {
    const host = createVimHost('ak');
    const vim = createVimController(host, { keymap: { version: 1, maps: { n: [{ lhs: 'X', rhs: 'fk', remap: true }] } } });
    press(vim, 'X'); expect(host.state.selection.main.head).toBe(1); vim.dispose();
  });
  it('uses plus to walk the change list from newest to older', () => {
    const { host, vim } = setup('|a\nb\nc');
    type(host, vim, 'i', 'X', 'Escape', 'j', 'i', 'Y', 'Escape');
    press(vim, '+'); expect(host.state.selection.main.head).toBe(3);
    press(vim, '+'); expect(host.state.selection.main.head).toBe(0); vim.dispose();
  });
  it('clears search with double Escape and times out a single Escape', () => {
    const { host, vim, advance } = setup('|foo foo');
    press(vim, '/'); vim.submitPrompt('foo');
    expect(host.markSets.get('emaki-vim-search')?.length).toBeGreaterThan(0);
    press(vim, 'Escape', 'Escape'); expect(host.markSets.get('emaki-vim-search')).toEqual([]);
    press(vim, 'Escape'); advance(1000); expect(vim.pending).toBe(''); vim.dispose();
  });
  it('replays a recorded hop sequence through the mapper', () => {
    const { host, vim } = setup('|foo foo');
    press(vim, 'q', 'a', 'g', 'j', 'o', 'f', 'q');
    expect(host.state.selection.main.head).toBe(1);
    press(vim, '@', 'a'); expect(host.state.selection.main.head).toBe(2); vim.dispose();
  });
  it('deletes inclusively for hop used as an operator target', () => {
    const host = createVimHost('abc x');
    const vim = createVimController(host, { keymap: { version: 1, hop: { enabled: true }, maps: { o: [{ lhs: 'gj', action: 'hop.char1' }] } } });
    press(vim, 'd', 'g', 'j', 'x');
    const label = host.markSets.get('emaki-vim-hop')?.[0]?.style.label?.text;
    expect(label).toBeDefined(); press(vim, label!);
    expect(host.state.doc.toString()).toBe(''); vim.dispose();
  });
  it('makes hop mappings inert when hop is disabled', () => {
    const map = JSON.parse(KEYMAP_PRESETS.find(preset => preset.id === 'mise-darwin')!.text);
    map.hop.enabled = false;
    const host = createVimHost('a\nb'), vim = createVimController(host, { keymap: map });
    press(vim, 'g', 'j'); expect(host.markSets.get('emaki-vim-hop')).toEqual([]);
    expect(host.state.selection.main.head).toBe(2); vim.dispose();
  });
});
