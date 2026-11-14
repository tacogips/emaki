import { describe, expect, it } from 'vitest';
import { createVimController } from '../../src/vim/controller';
import { createVimHost } from '../support/vim-host';

const input = (key: string, metaKey = false) => ({ key, metaKey, ctrlKey: false, altKey: false, shiftKey: false });
const setup = (marked: string) => {
  const cursor = marked.indexOf('|'), host = createVimHost(marked.replace('|', ''));
  if (cursor >= 0) host.dispatch({ selection: { anchor: cursor } });
  const vim = createVimController(host);
  host.onUpdate = tr => vim.noteUpdate({ state: tr.state, changes: tr.changes, docChanged: tr.docChanged, selectionSet: tr.selection !== undefined });
  return { host, vim };
};

describe('controller prompt contract', () => {
  it('reports unknown ex commands without editing', () => {
    const host = createVimHost('one two'), vim = createVimController(host), doc = host.state.doc;
    expect(vim.handleKey(input(':'))).toBe(true);
    expect(vim.prompt).toEqual({ kind: ':', initial: '' });
    vim.submitPrompt('foo');
    expect(vim.message).toMatch(/^E492/);
    expect(host.state.doc).toBe(doc);
    expect(vim.prompt).toBeNull();
  });
  it('reports a missing search pattern', () => {
    const host = createVimHost('one two'), vim = createVimController(host);
    vim.handleKey(input('/'));
    vim.submitPrompt('zz');
    expect(vim.message).toMatch(/^E486/);
  });
  it('cancels without changing the document or selection', () => {
    const host = createVimHost('one two'), vim = createVimController(host);
    const doc = host.state.doc, selection = host.state.selection;
    vim.handleKey(input('/'));
    vim.cancelPrompt();
    expect(vim.prompt).toBeNull();
    expect(host.state.doc).toBe(doc);
    expect(host.state.selection).toBe(selection);
  });
  it('passes meta keys through even during a prompt', () => {
    const host = createVimHost('one two'), vim = createVimController(host);
    expect(vim.handleKey(input('s', true))).toBe(false);
    vim.handleKey(input(':'));
    expect(vim.handleKey(input('s', true))).toBe(false);
  });
});

describe('controller clipboard behavior', () => {
  it.each([
    [['y', 'w'], 'one '], [['y', 'y'], 'one two'], [['v', 'l', 'y'], 'on'],
    [['V', 'y'], 'one two'], [['"', 'a', 'y', 'w'], 'one '],
  ] as const)('copies ordinary and named yanks to the clipboard: %j', async (keys, expected) => {
    const host = createVimHost('one two\nthree'); let clipboard = '';
    const vim = createVimController(host, { clipboard: { read: () => clipboard, write: text => { clipboard = text; } } });
    for (const key of keys) vim.handleKey(input(key));
    await Promise.resolve(); expect(clipboard).toBe(expected); expect(host.state.doc.toString()).toBe('one two\nthree');
    vim.dispose();
  });
  it('does not copy black-hole yanks or ordinary deletes', async () => {
    const host = createVimHost('one two'); let clipboard = 'keep';
    const vim = createVimController(host, { clipboard: { read: () => clipboard, write: text => { clipboard = text; } } });
    for (const key of ['"', '_', 'y', 'w', 'd', 'w']) vim.handleKey(input(key));
    await Promise.resolve(); expect(clipboard).toBe('keep'); vim.dispose();
  });
  it('repeats a resolved asynchronous clipboard paste exactly once', async () => {
    const host = createVimHost('abc'), vim = createVimController(host, { clipboard: { read: async () => 'x', write: () => {} } });
    for (const key of ['"', '+', 'p']) vim.handleKey(input(key));
    await Promise.resolve(); await Promise.resolve(); expect(host.state.doc.toString()).toBe('axbc');
    vim.handleKey(input('.')); expect(host.state.doc.toString()).toBe('axxbc');
  });
  it('drops a clipboard paste when the document changes before resolution', async () => {
    const host = createVimHost('abc'); let resolve!: (text: string) => void;
    const vim = createVimController(host, { clipboard: { read: () => new Promise<string>(cb => { resolve = cb; }), write: () => {} } });
    host.onUpdate = tr => vim.noteUpdate({ state: tr.state, changes: tr.changes, docChanged: tr.docChanged, selectionSet: tr.selection !== undefined });
    for (const key of ['"', '+', 'p']) vim.handleKey(input(key));
    host.dispatch({ changes: { from: 0, insert: 'z' } }); resolve('X'); await Promise.resolve(); await Promise.resolve();
    expect(host.state.doc.toString()).toBe('zabc'); expect(vim.message).toContain('clipboard paste dropped');
  });
  it('writes a linewise + yank to the clipboard', async () => {
    const host = createVimHost('one\ntwo'); let value = '';
    const vim = createVimController(host, { clipboard: { read: () => value, write: text => { value = text; } } });
    for (const key of ['"', '+', 'y', 'y']) vim.handleKey(input(key));
    await Promise.resolve(); expect(value).toBe('one'); expect(host.state.doc.toString()).toBe('one\ntwo'); vim.dispose();
  });
  it('preserves an ordinary yank internally if clipboard access is denied', async () => {
    const host = createVimHost('one');
    const vim = createVimController(host, { clipboard: { read: () => '', write: () => { throw new Error('denied'); } } });
    vim.handleKey(input('y')); vim.handleKey(input('y'));
    await Promise.resolve(); await Promise.resolve();
    expect(vim.message).toContain('clipboard unavailable');
    vim.handleKey(input('p')); expect(host.state.doc.toString()).toBe('one\none'); vim.dispose();
  });
});

describe('portable controller input and search', () => {
  it('preserves operator pending across pass-through shortcuts', () => {
    const { host, vim } = setup('|abc'); vim.handleKey(input('d'));
    expect(vim.handleKey({ ...input('Enter'), ctrlKey: true })).toBe(false);
    expect(vim.pending).toBe('d'); vim.handleKey(input('w'));
    expect(host.state.doc.toString()).toBe(''); vim.dispose();
  });
  it('gates composition, prompt, text input and replace overwrite', () => {
    const { vim } = setup('abc|');
    expect(vim.allowsTextInput()).toBe(false); vim.handleKey(input('i')); expect(vim.allowsTextInput()).toBe(true);
    vim.handleKey(input('Escape')); vim.handleKey(input('R')); expect(vim.overwriteRange('x')).toEqual({ from: 2, to: 3 });
    expect(vim.allowsTextInput()).toBe(true); vim.handleKey(input('Escape')); vim.handleKey(input('/'));
    expect(vim.allowsTextInput()).toBe(false); vim.cancelPrompt(); vim.dispose();
  });
  it('restores overwritten text with replace-mode Backspace', () => {
    const { host, vim } = setup('|abc'); vim.handleKey(input('R'));
    const range = vim.overwriteRange('X')!;
    host.dispatch({ changes: { from: range.from, to: range.to, insert: 'X' }, selection: { anchor: range.from + 1 }, userEvent: 'input.type' });
    expect(host.state.doc.toString()).toBe('Xbc'); vim.handleKey(input('Backspace'));
    expect(host.state.doc.toString()).toBe('abc'); expect(host.state.selection.main.head).toBe(1); vim.dispose();
  });
  it('dispatches search targets and messages', () => {
    const { host, vim } = setup('foo bar foo|');
    vim.handleKey(input('/')); vim.submitPrompt('foo'); expect(host.state.selection.main.head).toBe(0);
    vim.handleKey(input('n')); expect(host.state.selection.main.head).toBe(8);
    vim.handleKey(input('n')); expect(vim.message).toContain('search hit BOTTOM');
  });
  it('matches interactive search anchors at each line boundary', () => {
    const { host, vim } = setup('foo\nbar\nbaz|');
    vim.handleKey(input('/')); vim.submitPrompt('^bar'); expect(host.state.selection.main.head).toBe(4);
  });
  it('Ctrl-[ without a popup exits insert mode', () => {
    const { host, vim } = setup('|abc'); vim.handleKey(input('i'));
    expect(vim.handleKey({ ...input('['), ctrlKey: true })).toBe(true);
    expect(vim.mode).toBe('normal'); expect(host.state.doc.toString()).toBe('abc');
  });
  it('consumes unmodified Tab and Q in normal mode without edits', () => {
    const { host, vim } = setup('|abc');
    expect(vim.handleKey(input('Tab'))).toBe(true); expect(vim.handleKey(input('Q'))).toBe(true);
    expect(host.state.doc.toString()).toBe('abc'); expect(host.state.selection.main.head).toBe(0);
  });
  it('searches backward with ? and N, including wrap feedback', () => {
    const { host, vim } = setup('foo bar foo|');
    vim.handleKey(input('?')); vim.submitPrompt('foo'); expect(host.state.selection.main.head).toBe(8);
    vim.handleKey(input('N')); expect(host.state.selection.main.head).toBe(0); expect(vim.message).toContain('search hit');
  });
  it('repeats word-under-cursor searches through * and #', () => {
    const { host, vim } = setup('|foo x foo');
    vim.handleKey(input('*')); expect(host.state.selection.main.head).toBe(6);
    vim.handleKey(input('#')); expect(host.state.selection.main.head).toBe(0); expect(host.state.doc.toString()).toBe('foo x foo');
  });
  it('navigates with :3 and substitutes as one undo unit', () => {
    const { host, vim } = setup('a a\nb|');
    vim.handleKey(input(':')); vim.submitPrompt('3'); expect(host.state.selection.main.head).toBe(4);
    vim.handleKey(input(':')); vim.submitPrompt('%s/a/b/g'); expect(host.state.doc.toString()).toBe('b b\nb');
    vim.handleKey(input('u')); expect(host.state.doc.toString()).toBe('a a\nb');
  });
  it('applies visual-range substitution and clears search with :noh', () => {
    const { host, vim } = setup('|a a\nb');
    vim.handleKey(input('V')); vim.handleKey(input('j')); vim.handleKey(input(':')); vim.submitPrompt("'<,'>s/a/x/g");
    expect(host.state.doc.toString()).toBe('x x\nb');
    vim.handleKey(input('/')); vim.submitPrompt('x'); vim.handleKey(input(':')); vim.submitPrompt('noh');
    expect(host.markSets.get('emaki-vim-search')).toEqual([]);
  });
  it('external nonempty selection enters visual without reentrant dispatch', () => {
    const { host, vim } = setup('|abcd'); host.dispatch({ selection: { anchor: 1, head: 3 } });
    expect(vim.mode).toBe('visual'); expect(host.state.doc.toString()).toBe('abcd'); expect(host.state.selection.main.head).toBe(3);
  });
  it('announces discarded normal-mode composition input', () => {
    const { host, vim } = setup('|abc'); vim.noteCompositionDiscarded();
    expect(vim.message).toContain('IME input ignored'); expect(host.state.doc.toString()).toBe('abc');
  });
});
