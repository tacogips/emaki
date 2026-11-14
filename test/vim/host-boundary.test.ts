import { describe, expect, it, vi } from 'vitest';
import { Transaction } from '@codemirror/state';
import { createVimController, normalizeKey } from '../../src/vim/index';
import { createVimHost } from '../support/vim-host';
import type { VimEngineOptions } from '../../src/vim/host';

const key = (key: string, modifiers: Partial<{ ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }> = {}) => ({ key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...modifiers });
const setup = (doc = 'one two', options: VimEngineOptions = {}) => {
  const host = createVimHost(doc), vim = createVimController(host, options);
  host.onUpdate = tr => vim.noteUpdate({ state: tr.state, changes: tr.changes, docChanged: tr.docChanged, selectionSet: tr.selection !== undefined, userEvent: tr.annotation(Transaction.userEvent) ?? null });
  return { host, vim };
};
const load = (host: ReturnType<typeof createVimHost>, text: string, userEvent = 'input.load.document') =>
  host.dispatch({ changes: { from: 0, to: host.state.doc.length, insert: text }, selection: { anchor: 0 }, userEvent });
const boundary = (userEvent: string | null) => userEvent === 'input.load.document' || userEvent === 'input.replace.document';

describe('isDocumentBoundary hook', () => {
  it.each(['input.load.document', 'input.replace.document'])('resets insert mode and dot repeat on %s', event => {
    const { host, vim } = setup('one two', { hooks: { isDocumentBoundary: boundary } });
    vim.handleKey(key('i')); for (const ch of 'abc') host.dispatch({ changes: { from: host.state.selection.main.head, insert: ch }, selection: { anchor: host.state.selection.main.head + 1 }, userEvent: 'input.type' });
    load(host, 'fresh doc', event);
    expect(vim.mode).toBe('normal');
    vim.handleKey(key('.'));
    expect(host.state.doc.toString()).toBe('fresh doc');
  });
  it('leaves visual mode on a document load', () => {
    const { host, vim } = setup('one two', { hooks: { isDocumentBoundary: boundary } });
    vim.handleKey(key('v')); expect(vim.mode).toBe('visual');
    load(host, 'next'); expect(vim.mode).toBe('normal');
  });
  it('repeats the insert across a load when no boundary hook is supplied', () => {
    const { host, vim } = setup();
    vim.handleKey(key('i')); for (const ch of 'abc') host.dispatch({ changes: { from: host.state.selection.main.head, insert: ch }, selection: { anchor: host.state.selection.main.head + 1 }, userEvent: 'input.type' });
    vim.handleKey(key('Escape')); load(host, 'fresh doc'); vim.handleKey(key('.'));
    expect(host.state.doc.toString()).not.toBe('fresh doc');
  });
  it('keeps state when no boundary hook is supplied', () => {
    const { host, vim } = setup();
    vim.handleKey(key('i')); load(host, 'other'); expect(vim.mode).toBe('insert');
  });
});

describe('ex handler status message', () => {
  it('shows a message returned by the ex handler', () => {
    const { vim } = setup('x', { ex: cmd => cmd.name === 'w' ? { message: 'synced live', kind: 'info' } : false });
    vim.handleKey(key(':')); vim.submitPrompt('w');
    expect(vim.snapshot.message).toBe('synced live'); expect(vim.snapshot.messageKind).toBe('info');
  });
  it('defaults kind to info and accepts error', () => {
    const { vim } = setup('x', { ex: cmd => cmd.name === 'foo' ? { message: 'bad foo', kind: 'error' } : { message: 'ok' } });
    vim.handleKey(key(':')); vim.submitPrompt('q'); expect(vim.snapshot.messageKind).toBe('info');
    vim.handleKey(key(':')); vim.submitPrompt('foo'); expect(vim.snapshot.message).toBe('bad foo'); expect(vim.snapshot.messageKind).toBe('error');
  });
  it('keeps boolean handlers working', () => {
    const ex = vi.fn(() => true), { vim } = setup('x', { ex });
    vim.handleKey(key(':')); vim.submitPrompt('w'); expect(ex).toHaveBeenCalled(); expect(vim.snapshot.messageKind).not.toBe('error');
  });
});

describe('routeMetaKeys hook', () => {
  it('returns meta keys unhandled by default', () => {
    const { vim } = setup(); expect(vim.handleKey(key('k', { metaKey: true }))).toBe(false);
  });
  it('routes meta keys through the engine when enabled', () => {
    const { vim } = setup('x', { hooks: { routeMetaKeys: true } });
    expect(vim.handleKey(key('k', { metaKey: true }))).toBe(true);
    expect(vim.handleKey(key('c', { metaKey: true }))).toBe(false);
  });
});

describe('normalizeKey export', () => {
  it('normalizes control chords and plain keys', () => {
    expect(normalizeKey(key('g', { ctrlKey: true }), true)).toBe('<C-g>');
    expect(normalizeKey(key('r', { ctrlKey: true }))).toBe('<C-r>');
    expect(normalizeKey(key('Escape'))).toBe('<Esc>');
    expect(normalizeKey(key('a'))).toBe('a');
  });
});
