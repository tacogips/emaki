import { afterEach, describe, expect, it, vi } from 'vitest';
import { isolateHistory, undoDepth } from '@codemirror/commands';
import { Transaction } from '@codemirror/state';
import { createVimController } from '../../src/vim/index';
import * as keys from '../../src/vim/keys';
import { createVimHost } from '../support/vim-host';
import type { VimEngineOptions } from '../../src/vim/host';

const key = (key: string, modifiers: Partial<{ ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }> = {}) => ({ key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...modifiers });
const setup = (doc = 'one two three four', options: VimEngineOptions = {}) => {
  const host = createVimHost(doc), vim = createVimController(host, options);
  host.onUpdate = tr => vim.noteUpdate({ state: tr.state, changes: tr.changes, docChanged: tr.docChanged, selectionSet: tr.selection !== undefined });
  return { host, vim };
};
const hop = { version: 1, hop: { enabled: true, keys: 'ab' }, maps: { n: [{ lhs: 'Q', action: 'hop.word' }] } };
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('announce', () => {
  it('reports modes, errors and hop prompts', () => {
    const announce = vi.fn(), { vim } = setup(undefined, { hooks: { announce }, keymap: hop });
    vim.handleKey(key('i')); expect(announce).toHaveBeenCalledWith('INSERT', false);
    vim.handleKey(key('Escape')); vim.handleKey(key(':')); vim.submitPrompt('foo');
    expect(announce).toHaveBeenCalledWith(expect.stringMatching(/^E492/), true);
    vim.handleKey(key('Q')); expect(announce).toHaveBeenCalledWith(expect.stringMatching(/hop/i), false);
    const other = setup('abc', { hooks: { announce } }); other.vim.noteCompositionDiscarded(); expect(announce).toHaveBeenCalledWith(expect.stringContaining('IME input ignored'), expect.any(Boolean));
  });
  it('defaults to a no-op', () => { const { vim } = setup(); expect(() => { vim.handleKey(key('i')); vim.handleKey(key('Escape')); vim.handleKey(key(':')); vim.submitPrompt('foo'); }).not.toThrow(); });
});
describe('closePopupWithEscape', () => {
  it.each([true, false])('consumes popup escape when provided: %s', provided => {
    const close = vi.fn(() => true), { vim } = setup(undefined, { hooks: provided ? { closePopupWithEscape: close } : {} });
    vim.handleKey(key('i')); expect(vim.handleKey(key('[', { ctrlKey: true }))).toBe(true);
    expect(vim.mode).toBe(provided ? 'insert' : 'normal'); if (provided) expect(close).toHaveBeenCalled();
  });
});
describe('platform', () => {
  it('passes the supplied platform into the shortcut check', () => {
    const spy = vi.spyOn(keys, 'isPassThrough'), { vim } = setup(undefined, { hooks: { platform: 'apple' } });
    vim.handleKey(key('x')); expect(spy).toHaveBeenCalledWith(expect.anything(), 'apple', expect.any(Function));
  });
  it('defaults to other without navigator', () => {
    vi.stubGlobal('navigator', undefined); const spy = vi.spyOn(keys, 'isPassThrough'), { vim } = setup();
    vim.handleKey(key('x')); expect(spy).toHaveBeenCalledWith(expect.anything(), 'other', expect.any(Function));
  });
  it.each((['apple', 'other'] as const).flatMap(platform => (['normal', 'visual', 'visual-line', 'operator-pending', 'insert', 'replace'] as const).map(mode => ({ platform, mode }))))('passes reference shortcuts on $platform in $mode', ({ platform, mode }) => {
    for (const [name, modifiers] of [['Enter', { ctrlKey: true }], ['Enter', { metaKey: true }], ['Enter', { ctrlKey: true, shiftKey: true }], ['Enter', { ctrlKey: true, altKey: true }], ['.', { ctrlKey: true }], ['.', { metaKey: true }], ['a', { ctrlKey: true }], ['z', { metaKey: true }], ['v', { ctrlKey: true }], ['c', { metaKey: true }], ['a', { metaKey: true }], ['z', { ctrlKey: true }], ['y', { ctrlKey: true }], ['c', { ctrlKey: true }], ['x', { metaKey: true }], ['v', { metaKey: true }], ['\\', { ctrlKey: true }]] as const) {
      const { vim } = setup(undefined, { hooks: { platform } });
      const enter = { normal: [], visual: ['v'], 'visual-line': ['V'], 'operator-pending': ['d'], insert: ['i'], replace: ['R'] }[mode];
      for (const k of enter) vim.handleKey(key(k)); expect(vim.handleKey(key(name, modifiers))).toBe(false); vim.dispose();
    }
  });
});
describe('matchesDefaultKeymap', () => {
  it('passes matched keys through and preserves pending operator', () => {
    const { host, vim } = setup('abc', { hooks: { matchesDefaultKeymap: input => input.key === 'x' } });
    vim.handleKey(key('d')); expect(vim.handleKey(key('x'))).toBe(false); expect(vim.pending).toBe('d'); expect(host.state.doc.toString()).toBe('abc');
  });
  it('defaults to handling x', () => { const { host, vim } = setup('abc'); expect(vim.handleKey(key('x'))).toBe(true); expect(host.state.doc.toString()).toBe('bc'); });
});
describe('compositionActive', () => {
  it('passes input through when provided', () => { const { vim } = setup(undefined, { hooks: { compositionActive: () => true } }); expect(vim.handleKey(key('x'))).toBe(false); });
  it('defaults to inactive', () => { const { vim } = setup(); expect(vim.handleKey(key('x'))).toBe(true); });
});
describe('isVisible', () => {
  it.each([true, false])('filters hop targets when provided: %s', provided => {
    const { vim } = setup('one two three four', { keymap: hop, hooks: provided ? { isVisible: pos => pos <= 5 } : {} });
    vim.handleKey(key('Q')); const positions = vim.snapshot.hop!.labels.map(label => label.pos);
    expect(positions.length).toBeGreaterThan(0); expect(positions.some(pos => pos > 5)).toBe(!provided);
  });
});
describe('historyReduced', () => {
  const edit = (run: ReturnType<typeof setup>) => {
    const entryDepth = undoDepth(run.host.state);
    run.vim.handleKey(key('i'));
    for (const ch of ['x', 'y']) {
      const pos = run.host.state.selection.main.head;
      run.host.dispatch({ changes: { from: pos, insert: ch }, selection: { anchor: pos + 1 }, annotations: [isolateHistory.of('full'), Transaction.userEvent.of('input.type')] });
    }
    run.vim.handleKey(key('Escape'));
    expect(undoDepth(run.host.state) - entryDepth).toBe(2);
    expect(run.host.state.doc.toString()).toBe('xyabc');
  };
  it('rising and fresh undo yield xabc while the retained ledger yields abc', () => {
    let reduced = false;
    const rising = setup('abc', { hooks: { historyReduced: () => reduced } });
    const fresh = setup('abc');
    const control = setup('abc', { hooks: { historyReduced: () => false } });
    for (const run of [rising, fresh, control]) edit(run);
    fresh.vim.dispose();
    const freshController = createVimController(fresh.host);
    fresh.host.onUpdate = tr => freshController.noteUpdate({ state: tr.state, changes: tr.changes, docChanged: tr.docChanged, selectionSet: tr.selection !== undefined });
    reduced = true;
    for (const host of [rising.host, fresh.host, control.host]) host.dispatch({ selection: { anchor: 0 } });
    rising.vim.handleKey(key('u')); freshController.handleKey(key('u')); control.vim.handleKey(key('u'));
    const result = [rising.host, fresh.host, control.host].map(host => host.state.doc.toString());
    expect(result).toEqual(['xabc', 'xabc', 'abc']);
    expect(result[0]).toBe(result[1]); expect(result[0]).not.toBe(result[2]);
  });
  it('defaults to preserving undo history', () => {
    const run = setup('abc'); edit(run); run.vim.handleKey(key('u')); expect(run.host.state.doc.toString()).toBe('abc');
  });
});
describe('scrollCaret and scrollLines', () => {
  it('calls supplied hooks for search and scrolling', () => {
    const scrollCaret = vi.fn(), scrollLines = vi.fn(), { host, vim } = setup('one\ntwo\none\nfour', { preset: 'mise-darwin', hooks: { scrollCaret, scrollLines } });
    host.viewport = { fromLine: 1, toLine: 2, top: 0, height: 40 };
    vim.handleKey(key('/')); vim.submitPrompt('one'); vim.handleKey(key('n')); vim.handleKey(key('z')); vim.handleKey(key('z')); vim.handleKey(key('e', { ctrlKey: true }));
    expect(scrollCaret).toHaveBeenCalled(); expect(scrollLines).toHaveBeenCalled();
  });
  it('defaults to host scrolling', () => {
    const { host, vim } = setup('one\ntwo\none\nfour', { preset: 'mise-darwin' });
    host.viewport = { fromLine: 1, toLine: 2, top: 0, height: 40 };
    vim.handleKey(key('/')); vim.submitPrompt('two'); expect(host.scrollTop).toBe(20);
    host.scrollTop = 0; vim.handleKey(key('e', { ctrlKey: true })); expect(host.scrollTop).toBe(20);
  });
});
describe('typeText and defaultKey', () => {
  const keymap = { version: 1, maps: { i: [{ lhs: 'jk', rhs: 'x<BS>' }] } };
  it('calls provided replay hooks', () => {
    const typeText = vi.fn(), defaultKey = vi.fn(() => true), { vim } = setup('abc', { keymap, hooks: { typeText, defaultKey } });
    for (const k of ['i', 'j', 'k']) vim.handleKey(key(k)); expect(typeText).toHaveBeenCalledWith('x'); expect(defaultKey).toHaveBeenCalledWith('<BS>');
  });
  it('defaults to editing the document', () => {
    const { host, vim } = setup('abc', { keymap: { version: 1, maps: { i: [{ lhs: 'jk', rhs: 'xy<BS>' }] } } });
    for (const k of ['i', 'j', 'k']) vim.handleKey(key(k)); expect(host.state.doc.toString()).toBe('xabc');
  });
});
