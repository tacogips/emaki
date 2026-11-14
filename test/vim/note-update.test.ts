import { history, redo, undo } from '@codemirror/commands';
import { EditorState, Transaction, type TransactionSpec } from '@codemirror/state';
import { createVimController, type VimController, type VimHost } from '../../src/vim/index';
import type { Mark } from '../../src/types';

class Host implements VimHost {
  state = EditorState.create({ doc: 'abc', extensions: [history()] });
  scrollTop = 0;
  viewport = { fromLine: 1, toLine: 1, top: 0, height: 400 };
  marksSeen: readonly Mark[] = [];
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
  marks(_owner: string) { return { set: (marks: readonly Mark[]) => { this.marksSeen = marks; }, clear: () => { this.marksSeen = []; } }; }
}
const key = (key: string) => ({ key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false });
const insert = (host: Host, text: string, userEvent?: string, omitted = false) => {
  const pos = host.state.selection.main.head;
  host.external({ changes: { from: pos, insert: text }, selection: { anchor: pos + text.length }, ...(userEvent ? { annotations: Transaction.userEvent.of(userEvent) } : {}) }, omitted ? 'omit' : 'forward');
};
import { describe, expect, it } from 'vitest';

describe('external update classification', () => {
  for (const [label, event, omitted, repeats] of [
    ['input.type', 'input.type', false, true], ['input.format', 'input.format', false, false],
    ['explicit null', undefined, false, false], ['omitted', undefined, true, true],
  ] as const) {
    it(label, () => {
      const host = new Host(), vim = host.controller = createVimController(host);
      vim.handleKey(key('i')); insert(host, 'Z', event, omitted); vim.handleKey(key('Escape'));
      const before = host.state.doc.toString(); vim.handleKey(key('.'));
      expect(host.state.doc.toString()).toBe(repeats ? 'ZZabc' : before); vim.dispose();
    });
  }
  it('classifies external undo and redo against internal history', () => {
    const setup = () => { const host = new Host(), vim = host.controller = createVimController(host); vim.handleKey(key('x')); return { host, vim }; };
    const a = setup(), b = setup();
    expect(a.host.externalUndo()).toBe(true); b.vim.handleKey(key('u'));
    a.vim.handleKey(key('u')); b.vim.handleKey(key('u'));
    expect(a.host.state.doc.toString()).toBe(b.host.state.doc.toString());
    expect(a.host.externalRedo()).toBe(true); b.vim.handleKey({ ...key('r'), ctrlKey: true });
    expect(a.host.state.doc.toString()).toBe(b.host.state.doc.toString());
    a.vim.handleKey(key('u')); b.vim.handleKey(key('u'));
    expect(a.host.state.doc.toString()).toBe(b.host.state.doc.toString()); a.vim.dispose(); b.vim.dispose();
  });
  it('records a mapped printable key dispatched by typeText', () => {
    const host = new Host();
    const vim = host.controller = createVimController(host, { hooks: { typeText: text => insert(host, text, 'input.type') }, keymap: { version: 1, maps: { i: [{ lhs: 'Q', rhs: 'Z' }] } } });
    vim.handleKey(key('i')); vim.handleKey(key('Q')); vim.handleKey(key('Escape'));
    expect(host.state.doc.toString()).toBe('Zabc'); vim.handleKey(key('.')); expect(host.state.doc.toString()).toBe('ZZabc'); vim.dispose();
  });
});
