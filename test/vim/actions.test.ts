import { describe, expect, it } from 'vitest';
import { compileKeymap } from '../../src/vim/keymap-schema';
import { ACTION_MODES, isActionId, isHopAction, isHostActionId, type ActionId } from '../../src/vim/actions';

describe('action table', () => {
  it('matches the design mode registry exactly', () => expect(ACTION_MODES).toEqual({
    'emaki.evaluate': ['n', 'x', 'i'], 'emaki.evaluateAll': ['n', 'x', 'i'], 'emaki.hush': ['n', 'x', 'i'],
    'emaki.format': ['n', 'x', 'i'], 'emaki.diagnostic.next': ['n', 'x'], 'emaki.diagnostic.prev': ['n', 'x'],
    'emaki.completion': ['n', 'x', 'i'], 'hop.char1': ['n', 'x', 'o'], 'hop.char1Line': ['n', 'x', 'o'],
    'hop.word': ['n', 'x', 'o'], 'hop.line': ['n', 'x', 'o'],
  }));
  it.each(Object.entries(ACTION_MODES) as [ActionId, readonly ('n' | 'i' | 'x' | 'o')[]][])('exports modes for %s', (id, modes) => {
    expect(isActionId(id)).toBe(true);
    expect(modes.length).toBeGreaterThan(0);
    expect([...modes].every((mode) => ['n', 'i', 'x', 'o'].includes(mode))).toBe(true);
  });
  it.each(['emaki.evaluate', 'emaki.evaluateAll', 'emaki.hush', 'emaki.format', 'emaki.diagnostic.next', 'emaki.diagnostic.prev', 'emaki.completion'])('does not classify %s as hop', (id) => expect(isHopAction(id as ActionId)).toBe(false));
  it.each(['hop.char1', 'hop.char1Line', 'hop.word', 'hop.line'])('classifies %s as hop', (id) => expect(isHopAction(id as ActionId)).toBe(true));
  it('rejects unknown action ids', () => expect(isActionId('nope')).toBe(false));
});


describe('host action ids', () => {
  it.each(['app.explore', 'a.b-c_d.e'])('accepts %s', (id) => expect(isHostActionId(id)).toBe(true));
  it.each(['nodot', 'hop.x', 'emaki.hush', '1app.x', `a.${'b'.repeat(127)}`, 'app.'])('rejects %s', (id) => expect(isHostActionId(id)).toBe(false));
  it.each(['n', 'x', 'i'])('compiles host actions in %s mode', (mode) => {
    const result = compileKeymap(JSON.stringify({ version: 1, maps: { [mode]: [{ lhs: 'q', action: 'app.explore' }] } }));
    expect(result.issues).toEqual([]);
    expect(result.keymap?.maps[mode as 'n' | 'x' | 'i'][0].target).toEqual({ kind: 'action', id: 'app.explore' });
  });
  it.each([['o', 'action app.explore is not allowed in mode o'], ['c', 'actions are not supported in c mode']])('rejects host actions in %s mode', (mode, message) => {
    const result = compileKeymap(JSON.stringify({ version: 1, maps: { [mode]: [{ lhs: 'q', action: 'app.explore' }] } }));
    expect(result.issues.map((issue) => issue.message)).toContain(message);
  });
  it.each(['hop.unknown', 'nodot'])('reports unknown action id for %s', (action) => {
    const result = compileKeymap(JSON.stringify({ version: 1, maps: { n: [{ lhs: 'q', action }] } }));
    expect(result.issues[0].message).toContain('unknown action id');
  });
});
