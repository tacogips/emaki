import { afterEach, describe, expect, it } from 'vitest';
import { EditorCore } from '../../src/core/editor-core';
import { InputController } from '../../src/input/input';

const cleanups: (() => void)[] = [];
afterEach(() => { for (const cleanup of cleanups.splice(0)) cleanup(); document.body.replaceChildren(); });
function setup(hookResult: boolean, highestResult: boolean, defaultResult: boolean) {
  const core = new EditorCore({ doc: 'ab' }), node = document.createElement('div');
  document.body.append(node);
  const input = new InputController(core, node), calls: string[] = [];
  core.addKeymap([{ key: 'x', run: () => { calls.push('highest'); return highestResult; } }], 'highest');
  core.addKeymap([{ key: 'x', run: () => { calls.push('default'); return defaultResult; } }], 'default');
  input.setModalHook({ handleKey: () => { calls.push('hook'); return hookResult; }, allowsTextInput: () => true, overwriteRange: () => null, noteCompositionDiscarded() {} });
  const key = (value: string) => input.accessibility.textarea.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
  cleanups.push(() => { input.dispose(); core.dispose(); });
  return { core, calls, key };
}

describe('modal keymap precedence', () => {
  it('runs highest keymaps before the hook', () => {
    const { calls, key } = setup(true, true, true); key('x'); expect(calls).toEqual(['highest']);
  });
  it('runs the hook before default keymaps', () => {
    const { calls, key } = setup(true, false, true); key('x'); expect(calls).toEqual(['highest', 'hook']);
  });
  it('runs default keymaps when the hook declines', () => {
    const { calls, key } = setup(false, false, true); key('x'); expect(calls).toEqual(['highest', 'hook', 'default']);
  });
  it('runs the built-in keyboard handler when mappings and hook decline', () => {
    const { core, key } = setup(false, false, false); core.dispatch({ selection: { anchor: 1 } });
    key('Backspace'); expect(core.state.doc.toString()).toBe('b');
  });
});
