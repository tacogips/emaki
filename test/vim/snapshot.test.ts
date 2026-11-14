import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEditor } from '../../src/editor';
import { createVimController, vim } from '../../src/vim/index';
import { createVimHost } from '../support/vim-host';
import { recordingGL, rasterizer } from '../support/recording-gl';

const keymap = { version: 1, hints: { enabled: true, delayMs: 100, triggers: { n: ['g'] } }, hop: { enabled: true, keys: 'ab' }, maps: { n: [{ lhs: 'gx', rhs: 'l', desc: 'custom' }, { lhs: 'Q', action: 'hop.word' }], x: [{ lhs: 'Q', action: 'hop.word' }] } };
const input = (key: string) => ({ key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false });
afterEach(() => { vi.useRealTimers(); document.body.replaceChildren(); });

describe('snapshot data', () => {
  it('exposes mode, pending, recording, search, prompt, message and cursor fields', () => {
    const host = createVimHost('abc foo foo'), c = createVimController(host);
    expect(c.snapshot).toEqual(expect.objectContaining({ mode: 'normal', label: 'NORMAL', pending: '', recording: null, search: null, message: null, messageKind: null, prompt: null, cursorShape: 'block', displayCursor: 0, displayCursorEnd: 1, hints: null, hop: null }));
    c.handleKey(input('q')); c.handleKey(input('a')); expect(c.snapshot.recording).toBe('a'); c.handleKey(input('q')); expect(c.snapshot.recording).toBeNull();
    c.handleKey(input('/')); expect(c.snapshot.prompt).toEqual(expect.objectContaining({ kind: '/' })); c.submitPrompt('foo'); expect(c.snapshot.search).toBe('/foo');
    c.handleKey(input('/')); c.submitPrompt('zzz'); expect(c.snapshot.messageKind).toBe('error'); expect(c.snapshot.message).toBeTruthy();
    c.handleKey(input('i')); expect(c.snapshot).toEqual(expect.objectContaining({ mode: 'insert', label: 'INSERT', cursorShape: 'bar' })); expect(c.snapshot.displayCursorEnd).toBe(c.snapshot.displayCursor);
    c.handleKey(input('Escape')); c.handleKey(input('v')); expect(c.snapshot.label).toBe('VISUAL'); c.handleKey(input('Escape')); c.handleKey(input('d')); expect(c.snapshot.cursorShape).toBe('underline'); expect(c.snapshot.pending).toBe('d'); c.dispose();
  });
  it('delivers one changed snapshot per call, none on subscription or a no-op', () => {
    const host = createVimHost('abc'), c = createVimController(host), seen = vi.fn(); c.subscribe(seen); expect(seen).not.toHaveBeenCalled();
    c.handleKey(input('l')); expect(seen).toHaveBeenCalledTimes(1); expect(seen).toHaveBeenLastCalledWith(c.snapshot); expect(c.snapshot.displayCursor).toBe(1);
    c.handleKey(input('i')); expect(seen).toHaveBeenCalledTimes(2); c.handleKey(input('Shift')); expect(seen).toHaveBeenCalledTimes(2); c.dispose();
  });
  it('delivers delayed hints, holds the prefix and closes on Escape', () => {
    vi.useFakeTimers(); const host = createVimHost('one two three'), c = createVimController(host, { keymap }), seen = vi.fn(); c.subscribe(seen);
    c.handleKey(input('g')); expect(c.snapshot.hints).toBeNull(); const before = seen.mock.calls.length; vi.advanceTimersByTime(100);
    expect(seen).toHaveBeenCalledTimes(before + 1); expect(seen).toHaveBeenLastCalledWith(c.snapshot); expect(c.snapshot.hints?.prefix).toBe('g'); expect(c.snapshot.hints?.entries).toContainEqual(expect.objectContaining({ key: 'x', desc: 'custom' }));
    vi.advanceTimersByTime(5000); expect(c.snapshot.pending).toContain('g'); c.handleKey(input('Escape')); expect(c.snapshot.hints).toBeNull(); c.dispose();
  });
  it('clears visible hints on input flush while retaining the parser prefix', () => {
    vi.useFakeTimers(); const host = createVimHost('one two'), c = createVimController(host, { keymap });
    c.handleKey(input('g')); vi.advanceTimersByTime(100); expect(c.snapshot.hints).not.toBeNull();
    c.flushPendingInput(); expect(c.snapshot.hints).toBeNull(); expect(c.snapshot.pending).toBe('g'); c.dispose();
  });
  it('exposes hop labels, jumps to the chosen position and cancels', () => {
    const host = createVimHost('one two three'), c = createVimController(host, { keymap }); c.handleKey(input('Q'));
    const label = c.snapshot.hop?.labels[0]; expect(label).toBeDefined(); expect(label?.text).toMatch(/^[ab]+$/); c.handleKey(input(label!.text)); expect(host.state.selection.main.head).toBe(label!.pos); expect(c.snapshot.hop).toBeNull();
    c.handleKey(input('Q')); expect(c.snapshot.hop).not.toBeNull(); c.handleKey(input('Escape')); expect(c.snapshot.hop).toBeNull(); c.dispose();
  });
  it('clears hop and pending with one delivery on blur', () => {
    const host = createVimHost('one two three'), c = createVimController(host, { keymap }), seen = vi.fn();
    c.subscribe(seen); c.handleKey(input('Q')); expect(c.snapshot.hop).not.toBeNull();
    seen.mockClear(); c.blur();
    expect(c.snapshot.hop).toBeNull(); expect(c.snapshot.pending).toBe('');
    expect(seen).toHaveBeenCalledTimes(1); expect(seen).toHaveBeenLastCalledWith(c.snapshot); c.dispose();
  });
  it('clears operator pending on blur without changing the document', () => {
    const host = createVimHost('one two three'), c = createVimController(host), before = host.state.doc.toString();
    c.handleKey(input('d')); expect(c.snapshot.pending).toBe('d'); expect(c.snapshot.mode).toBe('operator-pending');
    c.blur(); expect(c.snapshot.mode).toBe('normal'); expect(c.snapshot.pending).toBe('');
    expect(host.state.doc.toString()).toBe(before); c.dispose();
  });
  it('exposes char-hop targets and clears the view after the selected jump', () => {
    const host = createVimHost('foo foo'), c = createVimController(host, { keymap: { version: 1, hop: { enabled: true, keys: 'ab' }, maps: { n: [{ lhs: 'Q', action: 'hop.char1' }] } } });
    c.handleKey(input('Q')); expect(c.snapshot.hop).toBeNull(); c.handleKey(input('o'));
    const label = c.snapshot.hop?.labels[0]; expect(label).toBeDefined(); for (const key of label!.text) c.handleKey(input(key));
    expect(host.state.selection.main.head).toBe(label!.pos); expect(c.snapshot.hop).toBeNull(); c.dispose();
  });
  it('clears the hop view after an inclusive operator target', () => {
    const host = createVimHost('abc x'), c = createVimController(host, { keymap: { version: 1, hop: { enabled: true }, maps: { o: [{ lhs: 'gj', action: 'hop.char1' }] } } });
    for (const key of ['d', 'g', 'j', 'x']) c.handleKey(input(key)); const label = c.snapshot.hop?.labels[0]; expect(label).toBeDefined();
    for (const key of label!.text) c.handleKey(input(key)); expect(host.state.doc.toString()).toBe(''); expect(c.snapshot.hop).toBeNull(); c.dispose();
  });
  it('does not expose hop for a mark argument or a disabled mapping', () => {
    const host = createVimHost('a\nb\nc'), c = createVimController(host, { preset: 'mise-darwin' });
    for (const key of ['m', 'g', 'j']) c.handleKey(input(key)); expect(host.state.selection.main.head).toBe(2); expect(c.snapshot.hop).toBeNull(); c.dispose();
    const other = createVimHost('a\nb'), disabled = createVimController(other, { keymap: { version: 1, hop: { enabled: false }, maps: { n: [{ lhs: 'gj', action: 'hop.char1' }] } } });
    for (const key of ['g', 'j']) disabled.handleKey(input(key)); expect(disabled.snapshot.hop).toBeNull(); expect(other.state.selection.main.head).toBe(2); disabled.dispose();
  });
  it('clears hints when a mapping completes and extends visual selection through hop', () => {
    vi.useFakeTimers(); const host = createVimHost('one two three'), c = createVimController(host, { keymap });
    c.handleKey(input('g')); vi.advanceTimersByTime(100); expect(c.snapshot.hints).not.toBeNull(); c.handleKey(input('x')); expect(c.snapshot.hints).toBeNull();
    c.handleKey(input('v')); c.handleKey(input('Q')); const label = c.snapshot.hop?.labels.find(item => item.pos > 1); expect(label).toBeDefined(); for (const key of label!.text) c.handleKey(input(key));
    expect(c.snapshot.mode).toBe('visual'); expect(host.state.selection.main.head).toBe(label!.pos); expect(c.snapshot.hop).toBeNull(); c.dispose();
  });
  it.each(['search', 'hints', 'hop'] as const)('disables only the %s renderer', (disabled) => {
    vi.useFakeTimers(); const host = createVimHost('foo two three foo'), c = createVimController(host, { keymap, render: { [disabled]: false } });
    c.handleKey(input('/')); c.submitPrompt('foo'); c.handleKey(input('Q')); c.handleKey(input('Escape')); c.handleKey(input('g')); vi.advanceTimersByTime(100);
    for (const name of ['search', 'hints', 'hop'] as const) expect(host.markSets.has(`emaki-vim-${name}`)).toBe(name !== disabled);
    expect(c.snapshot.search).toBe('/foo'); expect(c.snapshot.hints).not.toBeNull(); c.dispose();
  });
  it.each([true, false])('keeps snapshot data with render switches set to %s', (enabled) => {
    vi.useFakeTimers(); const host = createVimHost('foo two three foo'), c = createVimController(host, { keymap, ...(enabled ? {} : { render: { search: false, hints: false, hop: false } }) });
    c.handleKey(input('/')); c.submitPrompt('foo'); expect(c.snapshot.search).toBe('/foo'); expect(host.markSets.has('emaki-vim-search')).toBe(enabled);
    c.handleKey(input('Q')); expect(c.snapshot.hop?.labels.length).toBeGreaterThan(0); expect(host.markSets.has('emaki-vim-hop')).toBe(enabled); c.handleKey(input('Escape'));
    c.handleKey(input('g')); vi.advanceTimersByTime(100); expect(c.snapshot.hints?.prefix).toBe('g'); expect(host.markSets.has('emaki-vim-hints')).toBe(enabled); c.dispose();
  });
  it('exposes the full public payload and preserves the public cursor getter', () => {
    const v = vim(), host = document.createElement('div'); document.body.append(host); let id = 0;
    host.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 500, bottom: 300, width: 500, height: 300, toJSON() {} });
    const gl = recordingGL(), raster = rasterizer(), editor = createEditor(host, { doc: 'abc', gl: gl.gl, frameHost: { devicePixelRatio: 1, innerHeight: 800, requestAnimationFrame() { return ++id; }, cancelAnimationFrame() {} }, createCanvas: raster.createCanvas, modalKeys: v });
    const detach = v.attach(editor, host), seen = vi.fn(); v.onChange(seen); expect(seen).not.toHaveBeenCalled(); v.handleKey(input('l')); expect(seen).toHaveBeenCalledTimes(1); expect(seen).toHaveBeenLastCalledWith(v.state); expect(v.state.displayCursor).toBe(1);
    v.handleKey(input('d')); expect(v.state.cursorShape).toBe('underline'); expect(v.cursorShape).toBe('block'); expect(seen).toHaveBeenLastCalledWith(v.state); detach(); editor.destroy();
  });
});
