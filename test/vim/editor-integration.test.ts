import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEditor } from '../../src/editor';
import { recordingGL, rasterizer } from '../support/recording-gl';
import { vim } from '../../src/vim/index';
import { createScheduler } from '../../src/vim/adapter';

const keymap = { version: 1, timeoutlen: 50, maps: { i: [{ lhs: 'jj', rhs: '<Esc>' }] } };
function setup(doc = 'a\nb', options: Parameters<typeof vim>[0] = {}, attach = true) {
  const v = vim(options); let id = 0;
  const frameHost = { devicePixelRatio: 1, innerHeight: 800, requestAnimationFrame(_cb: FrameRequestCallback) { return ++id; }, cancelAnimationFrame(_id: number) {} };
  const host = document.createElement('div'); document.body.append(host);
  host.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 500, bottom: 300, width: 500, height: 300, toJSON() {} });
  const gl = recordingGL(), raster = rasterizer();
  const editor = createEditor(host, { doc, gl: gl.gl, frameHost, createCanvas: raster.createCanvas, modalKeys: v });
  const detach = attach ? v.attach(editor, host) : () => {};
  const input = host.querySelector('textarea')!;
  const key = (k: string, init: KeyboardEventInit = {}) => input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: k, ...init }));
  const text = (s: string) => input.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: s }));
  const clipboard = (type: 'paste' | 'cut', value = '') => { const event = new Event(type, { bubbles: true, cancelable: true }); const setData = vi.fn(); Object.defineProperty(event, 'clipboardData', { value: { getData: () => value, setData } }); input.dispatchEvent(event); return { event, setData }; };
  return { v, editor, host, key, text, clipboard, detach, doc: () => editor.state.doc.toString() };
}
afterEach(() => { vi.useRealTimers(); document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('vim editor integration', () => {
  it('edits, deletes and undoes with mode and cursor shape transitions', () => {
    const x = setup(); expect(x.v.state.mode).toBe('normal'); expect(x.v.cursorShape).toBe('block');
    x.key('i'); expect(x.v.state.mode).toBe('insert'); expect(x.v.cursorShape).toBe('bar'); x.text('x'); expect(x.doc()).toBe('xa\nb');
    x.key('Escape'); expect(x.v.state.mode).toBe('normal'); expect(x.v.cursorShape).toBe('block'); x.key('d'); x.key('d'); expect(x.doc()).toBe('b'); x.key('u'); expect(x.doc()).toBe('xa\nb'); x.detach(); x.editor.destroy();
  });
  it('submits ex commands and reports unknown commands', () => {
    const ex = vi.fn((command: { name: string }) => command.name === 'w' || command.name === 'q'), x = setup('a', { ex });
    for (const k of ':s/a/b/') x.key(k); x.key('Enter'); expect(x.doc()).toBe('b'); expect(x.v.state.prompt).toBeNull();
    for (const k of ':foo') x.key(k); x.key('Enter'); expect(x.v.state.message).toMatch(/^E492/); expect(x.doc()).toBe('b');
    for (const k of ':w') x.key(k); x.key('Enter'); expect(ex).toHaveBeenCalledWith(expect.objectContaining({ name: 'w', bang: false }));
    for (const k of ':q!') x.key(k); x.key('Enter'); expect(ex).toHaveBeenCalledWith(expect.objectContaining({ name: 'q', bang: true }));
  });
  it('searches forward, backward, repeats and cancels without document changes', () => {
    const x = setup('pat one pat two pat');
    for (const k of '/pat') x.key(k); x.key('Enter'); expect(x.editor.state.selection.main.head).toBe(8);
    x.key('n'); expect(x.editor.state.selection.main.head).toBe(16);
    for (const k of '?pat') x.key(k); x.key('Enter'); expect(x.editor.state.selection.main.head).toBe(8);
    const before = x.editor.state.selection.main; for (const k of '/pat') x.key(k); x.key('Escape'); expect(x.editor.state.selection.main).toEqual(before); expect(x.doc()).toBe('pat one pat two pat'); expect(x.v.state.prompt).toBeNull();
    x.key(':'); x.key('Backspace'); expect(x.v.state.prompt).toBeNull();
  });
  it('isolates prompt input, paste and cut from the document', () => {
    const x = setup('abc'); x.key('/'); x.text('bad'); expect(x.doc()).toBe('abc');
    const paste = x.clipboard('paste', 'ZZ\nyy'); expect(paste.event.defaultPrevented).toBe(true); expect(x.v.state.prompt?.text).toBe('ZZ'); x.key('Enter'); expect(x.v.state.message).toMatch(/^E486/); expect(x.doc()).toBe('abc');
    x.key('v'); x.key('l'); x.key(':'); const selection = x.editor.state.selection.main; const prompt = x.v.state.prompt?.text; const cut = x.clipboard('cut'); expect(cut.event.defaultPrevented).toBe(true); expect(x.doc()).toBe('abc'); expect(x.editor.state.selection.main).toEqual(selection); expect(x.v.state.prompt?.text).toBe(prompt); x.key('Escape'); expect(x.v.state.prompt).toBeNull();
  });
  it('leaves ordinary clipboard operations to the editor and removes listeners on detach', () => {
    const x = setup('abc'); x.key('i'); x.clipboard('paste', 'QQ'); expect(x.doc()).toBe('QQabc');
    x.editor.dispatch({ selection: { anchor: 0, head: 2 } }); const cut = x.clipboard('cut'); expect(cut.setData).toHaveBeenCalled(); expect(x.doc()).toBe('abc');
    x.detach(); x.clipboard('paste', 'Z'); expect(x.doc()).toBe('Zabc');
  });
  it('passes Meta keys through, supports input before attach, and rejects double attach', () => {
    const x = setup('', {}, false); x.text('a'); expect(x.doc()).toBe('a'); const detach = x.v.attach(x.editor, x.host);
    expect(() => x.v.attach(x.editor, x.host)).toThrow(); expect(x.v.handleKey({ key: 's', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false })).toBe(false);
    x.key(':'); expect(x.v.handleKey({ key: 's', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false })).toBe(false); detach(); detach();
  });
  it('marks the normal-mode cursor under the vim owner', () => {
    const x = setup('abc', {}, false), set = vi.fn();
    const add = x.editor.addPlugin.bind(x.editor);
    vi.spyOn(x.editor, 'addPlugin').mockImplementation(plugin => add({ ...plugin, attach(host) {
      return plugin.attach({ ...host, marks(owner) { const marks = host.marks(owner); return { ...marks, set(values) { set(owner, values); marks.set(values); } }; } });
    } }));
    const detach = x.v.attach(x.editor, x.host);
    expect(set).toHaveBeenCalledWith('emaki-vim', [expect.objectContaining({ from: 0, to: 1 })]); detach();
  });
  it('installs a map at runtime after ordinary insert input', () => {
    const x = setup('abc'), editor = x.editor; x.key('i'); x.key('j'); x.text('j'); x.key('j'); x.text('j'); expect(x.doc()).toBe('jjabc'); x.key('Escape');
    expect(x.v.setKeymap(keymap).applied).toBe(true); x.key('i'); x.key('j'); x.key('j'); expect(x.v.state.mode).toBe('normal'); expect(x.editor).toBe(editor); expect(x.doc()).toBe('jjabc');
  });
  it('applies, replaces and resets keymaps without remounting', () => {
    const x = setup('abc', { keymap }); expect(x.v.keymapIssues).toEqual([]); x.key('i'); x.key('j'); x.key('j'); expect(x.v.state.mode).toBe('normal'); expect(x.doc()).toBe('abc');
    expect(x.v.setKeymap('not json')).toEqual(expect.objectContaining({ applied: false, issues: expect.arrayContaining([expect.objectContaining({ message: 'invalid JSON' })]) }));
    x.key('i'); x.key('j'); x.key('j'); expect(x.v.state.mode).toBe('normal');
    expect(x.v.setKeymap(42 as never)).toEqual(expect.objectContaining({ applied: false, issues: expect.arrayContaining([expect.objectContaining({ path: '$' })]) }));
    expect(x.v.setKeymap(null).applied).toBe(true); x.key('i'); x.key('j'); x.text('j'); x.key('j'); x.text('j'); expect(x.doc()).toBe('jjabc'); x.key('Escape');
    expect(x.v.setKeymap(JSON.stringify(keymap)).applied).toBe(true); x.key('i'); x.key('j'); x.key('j'); expect(x.v.state.mode).toBe('normal');
  });
  it('handles invalid initial maps, presets, leader and command-line maps', () => {
    const bad = setup('a\nb', { keymap: '{"version":2}' }); expect(bad.v.keymapIssues).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'version', severity: 'error' })])); bad.key('d'); bad.key('d'); expect(bad.doc()).toBe('b');
    expect(vim({ preset: 'nope' as never }).keymapIssues).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'preset' })])); expect(vim({ preset: 'default' }).keymapIssues.filter(i => i.severity === 'error')).toEqual([]);
    const x = setup('a\nb', { keymap: { version: 1, leader: '<Space>', maps: { n: [{ lhs: '<leader>d', rhs: 'dd' }], c: [{ lhs: '<C-g>', rhs: '<Esc>' }] } } }); x.key(' '); x.key('d'); expect(x.doc()).toBe('b'); for (const k of ':abc') x.key(k); x.key('g', { ctrlKey: true }); expect(x.v.state.prompt).toBeNull(); expect(x.doc()).toBe('b');
  });
});

describe('adapter keymap timing', () => {
  it('flushes a pending key at timeout', () => { vi.useFakeTimers(); const x = setup('', { keymap }); x.key('i'); x.key('j'); vi.advanceTimersByTime(49); expect(x.doc()).toBe(''); expect(x.v.state.pending).toBe('j'); vi.advanceTimersByTime(1); expect(x.doc()).toBe('j'); expect(x.v.state.pending).toBe(''); expect(x.v.state.mode).toBe('insert'); });
  it('cancels a matched prefix timer', () => { vi.useFakeTimers(); const x = setup('', { keymap }); x.key('i'); x.key('j'); vi.advanceTimersByTime(20); x.key('j'); vi.advanceTimersByTime(1000); expect(x.v.state.mode).toBe('normal'); expect(x.doc()).toBe(''); expect(vi.getTimerCount()).toBe(0); });
  it('flushes two expired prefixes', () => { vi.useFakeTimers(); const x = setup('', { keymap }); x.key('i'); x.key('j'); vi.advanceTimersByTime(60); x.key('j'); vi.advanceTimersByTime(60); expect(x.doc()).toBe('jj'); expect(x.v.state.mode).toBe('insert'); });
  it('flushes once on reset and cancels timers on detach', () => { vi.useFakeTimers(); const x = setup('', { keymap }); x.key('i'); x.key('j'); expect(x.v.setKeymap(null).applied).toBe(true); expect(x.doc()).toBe('j'); expect(x.v.state.pending).toBe(''); vi.advanceTimersByTime(1000); expect(x.doc()).toBe('j'); expect(vi.getTimerCount()).toBe(0);
    x.v.setKeymap(keymap); x.key('j'); const change = vi.fn(); x.v.onChange(change); x.detach(); const count = change.mock.calls.length, detachedDoc = x.doc(); vi.advanceTimersByTime(1000); expect(x.doc()).toBe(detachedDoc); expect(change).toHaveBeenCalledTimes(count); expect(vi.getTimerCount()).toBe(0); });
  it('schedules microtasks and cancels pending and future callbacks', async () => { const s = createScheduler(), cb = vi.fn(); s.timer(0, cb); await Promise.resolve(); expect(cb).toHaveBeenCalledTimes(1); const cancel = s.timer(0, cb); cancel(); s.timer(0, cb); s.cancelAll(); s.timer(0, cb); await Promise.resolve(); expect(cb).toHaveBeenCalledTimes(1); });
});
