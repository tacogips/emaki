import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEditor } from '../../src/editor';
import { compileKeymap, createVimController, vim } from '../../src/vim/index';
import { createVimHost } from '../support/vim-host';
import { recordingGL, rasterizer } from '../support/recording-gl';

const key = (key: string) => ({ key, ctrlKey: false, altKey: false, metaKey: false, shiftKey: false });
const mapping = (id: string) => ({ version: 1, maps: { n: [{ lhs: ']d', action: id }], x: [{ lhs: ']d', action: id }] } });
function controller(id: string, handler?: () => number | null | void, lhs = ']d') {
  const host = createVimHost('0123456789');
  const v = createVimController(host, { keymap: lhs === ']d' ? mapping(id) : { version: 1, maps: { n: [{ lhs, action: id }] } }, actions: handler ? { [id]: handler } : {} });
  const press = (...keys: string[]) => keys.forEach(k => v.handleKey(key(k)));
  return { host, v, press };
}
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('host actions', () => {
  it('dispatches a leader binding with its context from the attached editor', () => {
    const action = vi.fn(), v = vim({ keymap: { version: 1, leader: '<Space>', maps: { n: [{ lhs: '<leader>e', action: 'app.explore' }] } }, actions: { 'app.explore': action } });
    const host = document.createElement('div'); document.body.append(host);
    const gl = recordingGL(), raster = rasterizer(); let id = 0;
    const editor = createEditor(host, { doc: 'abc', gl: gl.gl, createCanvas: raster.createCanvas, frameHost: { devicePixelRatio: 1, innerHeight: 800, requestAnimationFrame() { return ++id; }, cancelAnimationFrame() {} }, modalKeys: v });
    const detach = v.attach(editor, host), input = host.querySelector('textarea')!;
    for (const k of [' ', 'e']) input.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    expect(action).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledWith({ id: 'app.explore', mode: 'normal', cursor: 0, state: editor.state });
    detach(); editor.destroy();
  });
  it.each([[5, 5], [999, 9]])('moves and clamps diagnostic target %i', (target, expected) => {
    const x = controller('emaki.diagnostic.next', () => target); x.press(']', 'd'); expect(x.host.state.selection.main.head).toBe(expected); x.v.dispose();
  });
  it('moves to next and previous diagnostic positions', () => {
    const host = createVimHost('0123456789'), v = createVimController(host, { keymap: { version: 1, maps: { n: [{ lhs: 'n', action: 'emaki.diagnostic.next' }, { lhs: 'p', action: 'emaki.diagnostic.prev' }] } }, actions: { 'emaki.diagnostic.next': () => 6, 'emaki.diagnostic.prev': () => 2 } });
    v.handleKey(key('n')); expect(host.state.selection.main.head).toBe(6); v.handleKey(key('p')); expect(host.state.selection.main.head).toBe(2); v.dispose();
  });
  it('extends the visual selection to a diagnostic', () => {
    const x = controller('emaki.diagnostic.next', () => 5); x.press('v', ']', 'd');
    expect(x.host.state.selection.main.from).toBe(0); expect(x.host.state.selection.main.head).toBe(5); x.v.dispose();
  });
  it.each(['emaki.diagnostic.next', 'emaki.diagnostic.prev'])('reports no diagnostics for null from %s', id => {
    const x = controller(id, () => null); x.press(']', 'd'); expect(x.v.snapshot.message).toBe('no diagnostics'); expect(x.v.snapshot.messageKind).toBe('info'); x.v.dispose();
  });
  it.each(['emaki.diagnostic.next', 'app.x'])('leaves state unchanged for unregistered %s', id => {
    const x = controller(id, undefined, 'Q'), change = vi.fn(); x.v.subscribe(change); const before = x.v.snapshot, selection = x.host.state.selection.main;
    x.press('Q'); expect(x.host.state.doc.toString()).toBe('0123456789'); expect(x.host.state.selection.main).toEqual(selection); expect(x.v.snapshot.message).toBe(before.message); expect(change).not.toHaveBeenCalled(); x.v.dispose();
  });
  it.each([undefined, null])('leaves cursor and message unchanged for a custom action returning %s', result => {
    const action = vi.fn(() => result), x = controller('app.x', action, 'Q'); x.press('Q'); expect(action).toHaveBeenCalledOnce(); expect(x.host.state.selection.main.head).toBe(0); expect(x.v.snapshot.message).toBeNull(); x.v.dispose();
  });
  it.each([['eval', 'emaki.evaluate'], ['evalall', 'emaki.evaluateAll'], ['run', 'emaki.evaluateAll'], ['hush', 'emaki.hush'], ['format', 'emaki.format']])('dispatches :%s to %s', (command, id) => {
    const action = vi.fn(), host = createVimHost('abc'), v = createVimController(host, { actions: { [id]: action } });
    v.handleKey(key(':')); v.submitPrompt(command); expect(action).toHaveBeenCalledOnce(); expect(action).toHaveBeenCalledWith(expect.objectContaining({ id })); expect(host.state.doc.toString()).toBe('abc'); v.dispose();
  });
  it('leaves an unregistered ex alias without an error', () => {
    const v = createVimController(createVimHost('abc')); v.handleKey(key(':')); v.submitPrompt('eval'); expect(v.snapshot.message).toBeNull(); v.dispose();
  });
  it('swallows a keymap-bound handler exception like the reference mapper', () => {
    const action = vi.fn(() => { throw new Error('host failure'); });
    const host = createVimHost('abc'), v = createVimController(host, { keymap: { version: 1, maps: { n: [{ lhs: 'Q', action: 'app.x' }] } }, actions: { 'app.x': action } });
    expect(() => v.handleKey(key('Q'))).not.toThrow();
    expect(action).toHaveBeenCalledOnce();
    expect(host.state.doc.toString()).toBe('abc');
    expect(v.snapshot.pending).toBe('');
    v.handleKey(key('l')); expect(host.state.selection.main.head).toBe(1); v.dispose();
  });
  it('propagates a handler exception from an ex alias', () => {
    const v = createVimController(createVimHost('abc'), { actions: { 'emaki.evaluate': () => { throw new Error('host failure'); } } });
    v.handleKey(key(':')); expect(() => v.submitPrompt('eval')).toThrow('host failure');
    expect(() => v.snapshot).not.toThrow(); v.dispose();
  });
  it.each(['n', 'x', 'i'])('accepts host ids in %s', mode => {
    expect(compileKeymap(JSON.stringify({ version: 1, maps: { [mode]: [{ lhs: 'q', action: 'app.x' }] } })).issues).toEqual([]);
  });
  it.each(['o', 'c'])('rejects host ids in %s', mode => {
    const issues = compileKeymap(JSON.stringify({ version: 1, maps: { [mode]: [{ lhs: 'q', action: 'app.x' }] } })).issues;
    expect(issues.length).toBeGreaterThan(0); if (mode === 'o') expect(issues[0].message).toContain('not allowed');
  });
  it.each(['hop.nope', 'nodot'])('rejects unknown id %s', action => {
    expect(compileKeymap(JSON.stringify({ version: 1, maps: { n: [{ lhs: 'q', action }] } })).issues[0].message).toContain('unknown action id');
  });
});
