import { afterEach, describe, expect, it, vi } from 'vitest';
import { Transaction } from '@codemirror/state';
import { createEditor } from '../../src/editor';
import { compileKeymap, createVimController, vim } from '../../src/vim/index';
import { createVimHost } from '../support/vim-host';
import { recordingGL, rasterizer } from '../support/recording-gl';

const map = { version: 1, maps: { i: [{ lhs: 'jj', rhs: '<Esc>' }] } };
const input = (key: string) => ({ key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false });

function controllerSurface(doc: string, mapped = false) {
  const host = createVimHost(doc), v = createVimController(host);
  host.onUpdate = tr => v.noteUpdate({ state: tr.state, changes: tr.changes, docChanged: tr.docChanged,
    selectionSet: tr.selection !== undefined, userEvent: tr.annotation(Transaction.userEvent) ?? null });
  if (mapped) v.setKeymap(compileKeymap(JSON.stringify(map)).keymap);
  return {
    tap: () => v.tapMode(), key: (k: string) => v.handleKey(input(k)),
    type: (text: string) => { const pos = host.state.selection.main.head; host.dispatch({ changes: { from: pos, insert: text }, selection: { anchor: pos + text.length }, annotations: Transaction.userEvent.of('input.type') }); },
    state: () => v.snapshot, doc: () => host.state.doc.toString(), subscribe: (cb: () => void) => v.subscribe(cb), dispose: () => v.dispose(),
  };
}
function editorSurface(doc: string, mapped = false) {
  const v = vim(mapped ? { keymap: map } : {}), host = document.createElement('div'); document.body.append(host);
  host.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 500, bottom: 300, width: 500, height: 300, toJSON() {} });
  let id = 0; const frameHost = { devicePixelRatio: 1, innerHeight: 800, requestAnimationFrame(_cb: FrameRequestCallback) { return ++id; }, cancelAnimationFrame(_id: number) {} };
  const gl = recordingGL(), raster = rasterizer();
  const editor = createEditor(host, { doc, gl: gl.gl, frameHost, createCanvas: raster.createCanvas, modalKeys: v });
  const detach = v.attach(editor, host), textarea = host.querySelector('textarea')!;
  return {
    tap: () => v.tapMode(), key: (k: string) => textarea.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: k })),
    type: (text: string) => textarea.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: text })),
    state: () => v.state, doc: () => editor.state.doc.toString(), subscribe: (cb: () => void) => v.onChange(cb), dispose: () => { detach(); editor.destroy(); },
  };
}
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe.each([['controller', controllerSurface], ['editor', editorSurface]] as const)('%s tapMode', (_name, setup) => {
  it('toggles with one notification per call', () => {
    const s = setup('abc'), notify = vi.fn(); s.subscribe(notify);
    s.tap(); expect(s.state().mode).toBe('insert'); expect(notify).toHaveBeenCalledTimes(1);
    s.tap(); expect(s.state().mode).toBe('normal'); expect(notify).toHaveBeenCalledTimes(2); s.dispose();
  });
  it('flushes a pending mapped prefix before returning to normal', () => {
    const s = setup('', true); s.key('i'); s.key('j'); expect(s.state().pending).toBe('j'); s.tap();
    expect(s.doc()).toBe('j'); expect(s.state().pending).toBe(''); expect(s.state().mode).toBe('normal'); s.dispose();
  });
  it('ends an insert redo record with normal mode', () => {
    const s = setup('abc'); s.tap(); s.type('x'); s.tap(); s.key('.');
    expect(s.doc()).toBe('xxabc'); expect(s.state().mode).toBe('normal'); s.dispose();
  });
  it('groups typed insert into one undo unit', () => {
    const s = setup('abc'); s.tap(); s.type('x'); s.type('y'); s.tap(); expect(s.doc()).toBe('xyabc'); s.key('u');
    expect(s.doc()).toBe('abc'); expect(s.state().mode).toBe('normal'); s.dispose();
  });
  it('records and replays a tapMode insert', () => {
    const s = setup('abc'); s.key('q'); s.key('a'); s.tap(); s.type('y'); s.tap(); s.key('q'); s.key('@'); s.key('a');
    expect(s.doc()).toBe('yyabc'); expect(s.state().mode).toBe('normal'); s.dispose();
  });
  it('ends a recorded append through tapMode and replays its escape', () => {
    const s = setup('a'); for (const k of ['q', 'a', 'A']) s.key(k); s.type(';'); s.tap();
    for (const k of ['q', '0', '@', 'a']) s.key(k);
    expect(s.doc()).toBe('a;;'); expect(s.state().mode).toBe('normal'); s.dispose();
  });
});

it('guards the editor toggle before attachment and during a prompt', () => {
  const v = vim(), initial = v.state; expect(() => v.tapMode()).not.toThrow(); expect(v.state).toEqual(initial);
  const s = editorSurface('abc'); s.key(':'); const prompt = s.state().prompt; expect(prompt).not.toBeNull(); s.tap();
  expect(s.state().prompt).toEqual(prompt); expect(s.state().mode).toBe('normal'); s.dispose();
});
