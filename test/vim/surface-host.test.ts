import { history, redo, undo } from '@codemirror/commands';
import { EditorState, Transaction, type TransactionSpec } from '@codemirror/state';
import { createVimController, type VimController, type VimHost } from '../../src/vim/index';
import type { Mark } from '../../src/types';

class Host implements VimHost {
  state = EditorState.create({ doc: 'abc', extensions: [history()] });
  scrollTop = 0;
  viewport = { fromLine: 1, toLine: 1, top: 0, height: 400 };
  markSets = new Map<string, readonly Mark[]>();
  controller!: VimController;
  dispatch(spec: TransactionSpec) { this.state = this.state.update(spec).state; }
  external(spec: TransactionSpec, event: 'forward' | 'omit' = 'forward') {
    const tr = this.state.update(spec); this.apply(tr, event);
  }
  apply(tr: Transaction, event: 'forward' | 'omit' = 'forward') {
    this.state = tr.state;
    const update = { state: tr.state, changes: tr.changes, docChanged: tr.docChanged, selectionSet: tr.selection !== undefined };
    this.controller.noteUpdate(event === 'omit' ? update : { ...update, userEvent: tr.annotation(Transaction.userEvent) ?? null });
  }
  undo() { return undo({ state: this.state, dispatch: tr => { this.state = tr.state; } }); }
  redo() { return redo({ state: this.state, dispatch: tr => { this.state = tr.state; } }); }
  externalUndo() { return undo({ state: this.state, dispatch: tr => this.apply(tr) }); }
  externalRedo() { return redo({ state: this.state, dispatch: tr => this.apply(tr) }); }
  scrollTo(_target: { top: number } | { pos: number }) {}
  lineTop(line: number) { return (line - 1) * 20; }
  lineAtHeight(y: number) { return Math.max(1, Math.floor(y / 20) + 1); }
  coordsAtPos(pos: number) { return { left: pos * 8, right: pos * 8 + 8, top: 0, bottom: 20 }; }
  marks(owner: string) { return { set: (marks: readonly Mark[]) => { this.markSets.set(owner, marks); }, clear: () => { this.markSets.delete(owner); } }; }
}
const key = (key: string) => ({ key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false });
const insert = (host: Host, text: string, userEvent?: string, omitted = false) => {
  const pos = host.state.selection.main.head;
  host.external({ changes: { from: pos, insert: text }, selection: { anchor: pos + text.length }, ...(userEvent ? { annotations: Transaction.userEvent.of(userEvent) } : {}) }, omitted ? 'omit' : 'forward');
};
import { describe, expect, it, vi } from 'vitest';

describe('exported controller with a custom surface', () => {
  it('drives keys, host prompts, external edits and subscriptions', () => {
    const host = new Host();
    const vim = host.controller = createVimController(host, { render: { search: false, hints: false, hop: false }, actions: {}, hooks: { announce: () => {}, closePopupWithEscape: () => false, platform: 'other', matchesDefaultKeymap: () => false, compositionActive: () => false, isVisible: () => true, historyReduced: () => false, scrollCaret: () => {}, scrollLines: () => {}, typeText: text => insert(host, text, 'input.type'), defaultKey: () => false } });
    const snapshots: typeof vim.snapshot[] = [];
    vim.subscribe(snapshot => { snapshots.push(snapshot); expect(snapshot).toEqual(vim.snapshot); });
    vim.handleKey(key('i')); insert(host, 'Z', 'input.type'); vim.handleKey(key('Escape'));
    expect(host.state.doc.toString()).toBe('Zabc'); expect(vim.snapshot.mode).toBe('normal');
    vim.handleKey(key(':')); expect(vim.snapshot.prompt).toEqual({ kind: ':', text: '' });
    vim.submitPrompt('s/a/b/'); expect(host.state.doc.toString()).toBe('Zbbc'); expect(vim.snapshot.prompt).toBeNull();
    vim.handleKey(key('/')); vim.cancelPrompt(); expect(vim.snapshot.prompt).toBeNull();
    host.external({ changes: { from: 0, insert: 'X' }, selection: { anchor: 2 } });
    expect(vim.snapshot.displayCursor).toBe(2); expect(snapshots.length).toBeGreaterThan(0);
    vim.dispose();
  });
  it('updates rendered search marks after external changes', () => {
    const host = new Host(), vim = host.controller = createVimController(host);
    vim.handleKey(key('/')); vim.submitPrompt('b');
    expect(host.markSets.get('emaki-vim-search')?.map(mark => [mark.from, mark.to])).toEqual([[1, 2]]);
    host.external({ changes: { from: 0, insert: 'X' } });
    expect(host.markSets.get('emaki-vim-search')?.map(mark => [mark.from, mark.to])).toEqual([[2, 3]]);
    vim.dispose();
  });
  it('uses and disposes its default timer', () => {
    vi.useFakeTimers();
    try {
      const host = new Host();
      const vim = host.controller = createVimController(host, { render: { search: false, hints: false, hop: false }, keymap: { version: 1, timeoutlen: 50, maps: { i: [{ lhs: 'jj', rhs: '<Esc>' }] } } });
      vim.handleKey(key('i')); if (!vim.handleKey(key('j'))) insert(host, 'j', 'input.type');
      expect(vim.snapshot.pending).not.toBe(''); vi.advanceTimersByTime(50); expect(vim.snapshot.pending).toBe('');
      vim.dispose(); expect(vi.getTimerCount()).toBe(0); expect(() => vim.dispose()).not.toThrow();
    } finally { vi.useRealTimers(); }
  });
});
